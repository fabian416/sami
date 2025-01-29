import { Request, Response } from "express";
import {
  getGameById,
  recordVote,
  createOrJoin,
  games,
  calculateNumberOfPlayers,
} from "../services/gameService";
import { Server, Socket } from "socket.io";
import { addCharsToPlayer } from "../services/playerService";
import { io } from "../server";
import gameServiceEmitter from "../services/gameService";
import supabase from "../config/supabaseClient";

gameServiceEmitter.on("startConversation", (data: { roomId: string, timeBeforeEnds: number, serverTime: number }) => {
  const message = { message: "Conversation phase has started" };
  io.to(data.roomId).emit("startConversationPhase", {
    message,
    timeBeforeEnds: data.timeBeforeEnds,
    serverTime: data.serverTime
  });
});

gameServiceEmitter.on("conversationEnded", (data: any) => {
  console.log(`Conversation phase ended for room: ${data.roomId}`);
});

gameServiceEmitter.on("voteSubmitted", (data: {roomId: string, voterId: string, votedId: string}) => {
  console.log(`Conversation phase ended for room: ${data.roomId}`);
  io.to(data.roomId).emit("voteSubmitted", { voterId: data.voterId, votedId: data.votedId });
});

gameServiceEmitter.on("playerEliminated", (data: { roomId: string, playerId: string }) => {
  console.log(
    `Notifying clients: Player ${data.playerId} was eliminated from room ${data.roomId}`
  );
  io.to(data.roomId).emit("playerEliminated", { playerId: data.playerId });
});

gameServiceEmitter.on("startVoting", (data: {roomId: string, timeBeforeEnds: number, serverTime: number}) => {
  const game = games[data.roomId];
  if (!game) return;

  // Get list of active players
  const activePlayers = game.players
    .filter((player) => !player.isEliminated)
    .map((player) => ({ id: player.id, index: player.index }));

  console.log(`Starting voting phase for room: ${data.roomId}`);
  io.to(data.roomId).emit("startVotePhase", {
    message: "Voting phase has started",
    roomId: data.roomId,
    players: activePlayers, // Send list of active players
    timeBeforeEnds: data.timeBeforeEnds,
    serverTime: data.serverTime,
  });
});

gameServiceEmitter.on("gameStarted", ({ roomId, game, timeBeforeEnds, serverTime }) => {
  console.log(`Game started for room: ${roomId}`);
  io.to(roomId).emit("gameStarted", {
    roomId: game.roomId,
    players: game.players,
    timeBeforeEnds,
    serverTime,
  });
});

gameServiceEmitter.on('gameOver', ({ roomId, winner }) => {
    console.log(`Game over for room: ${roomId}, winner: ${winner}`);
    io.to(roomId).emit('gameOver', {
        winner,
        message: `Game over. Winner: ${winner === 'ia' ? 'IA' : 'Humans'}`,
    });
});


// Create or join a new match
export const getNumberOfPlayers = (data: any, socket: Socket, io: Server) => {
  const { roomId } = data;
  if (!roomId) {
    console.error(`[getNumberOfPlayers] Invalid data:`, data);
    return socket.emit("error", { message: "Incomplete data for voting" });
  }
  
  const [amountOfPlayers, neededPlayers] = calculateNumberOfPlayers({roomId});
  io.to(roomId).emit("numberOfPlayers", { roomId, amountOfPlayers, neededPlayers });
};

// Create or join a new match
export const createOrJoinGame = (data: any, socket: Socket, io: Server) => {
  const { playerId } = data;

  // Delegate to the service, passing `socket` and `io`
  const { roomId, success } = createOrJoin(playerId, socket, io);

  if (!success) {
    socket.emit("error", {
      message: "There was an error creating or joining the match",
    });
    console.log(`Error joining the player ${playerId} into the room ${roomId}`);
    return;
  }

  // Notify the client a player joined
  socket.join(roomId);
  io.to(roomId).emit("playerJoined", { playerId, roomId });
};
export const castVote = (data: any, socket: Socket, io: Server) => {
    const { roomId, voterId, voteIndex, votedId } = data;

  if (!roomId || !voterId || voteIndex === undefined) {
    console.error(`[castVote] Invalid data:`, data);
    socket.emit("error", { message: "Incomplete data for voting" });
    return;
  }

  const game = getGameById(roomId);
  if (!game || game.status !== "voting") {
    console.error(`[castVote] Voting phase is not active for room: ${roomId}`);
    socket.emit("error", { message: "Voting phase is not active" });
    return;
  }

  // Validate voteIndex
  if (voteIndex < 0 || voteIndex >= game.players.length) {
    console.error(
      `[castVote] Invalid voteIndex: ${voteIndex} for room: ${roomId}`
    );
    socket.emit("error", { message: "Invalid vote index" });
    return;
  }

  const votedPlayer = game.players[voteIndex]?.id;
  if (!votedPlayer) {
    console.error(
      `[castVote] Voted player not found for index: ${voteIndex} in room: ${roomId}`
    );
    socket.emit("error", { message: "Voted player does not exist" });
    return;
  }

  // Prevent self-voting
  if (votedPlayer === voterId) {
    console.warn(
      `[castVote] Player ${voterId} attempted to vote for themselves in room: ${roomId}`
    );
    socket.emit("error", { message: "You cannot vote for yourself" });
    return;
  }

  // Register the vote
  const success = recordVote(roomId, voterId, votedPlayer);
  if (!success) {
    console.error(
      `[castVote] Failed to register vote from ${voterId} to ${votedPlayer} in room: ${roomId}`
    );
    socket.emit("error", { message: "Failed to register the vote" });
    return;
  }

  // Count votes for the voted player
  const votesForTarget = Object.values(game.votes).filter(
    (vote) => vote === votedPlayer
  ).length;

  console.log(
    `[castVote] Player ${voterId} voted for ${votedPlayer} in room: ${roomId}`
  );
  console.log(`[castVote] Current votes:`, game.votes);

  // Emit the vote update to all players
  io.to(roomId).emit("voteUpdate", {
    votedPlayer,
    totalVotes: votesForTarget,
  });

  // Emit all votes (optional, for debugging or client visualization)
  io.to(roomId).emit("allVotes", {
    votes: game.votes,
  });
};


export const handleMessage = async (data: any, socket: Socket, io: Server) => {
  const { roomId, message, playerId, playerIndex } = data;

  // Validate if the instance of the game exists
  const game = games[roomId];
  if (!game) {
      socket.emit("error", { message: "La sala no existe" });
      return;
  }

  // Verify if the game has began
  if (game.status !== "active") {
      socket.emit("error", { message: "La partida no ha comenzado" });
      return;
  }

  // Register the message in supabase
  const { data: dataSupabase, error } = await supabase
      .from("SAMI")
      .insert([{ messages: message, room_id: roomId, player_id: playerId }]);

  if (error) {
      console.error("[Backend] Error al insertar en Supabase:", error);
  } else {
      console.log("[Backend] Mensaje guardado en Supabase:", dataSupabase);
  }

  // Reesend to all the players in the room
  io.to(roomId).emit("newMessage", data);

  // Send message to ELIZA by API REST
  console.log("[Backend] Sendind message to Eliza", { roomId, message, playerId });

  try {
    const response = await fetch(`http://localhost:3000/SAMI-AGENT/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            text: message,
            userId: playerId,
            userName: "User",
        }),
    });

    //  Get the response as text vefor sending
    const responseText = await response.text();
    console.log("[Backend] Response of Eliza (Before JSON parsing):", responseText);

    // Convert into json
    let responseData;
    try {
        responseData = JSON.parse(responseText);
    } catch (jsonError) {
        console.error("[Backend] Error parsin JSON Eliza:", jsonError);
        return; // Detect if it's a valid json
    }

    // 📌 If ther eis a vald answer is sending by web sockets
    if (responseData && responseData.length > 0) {
        const agentMessage = responseData[0].text;
        console.log(`[Backend] Response of Eliza: ${agentMessage}`);

        io.to(roomId).emit("newMessage", {
            playerId: "SAMI-AGENT",
            message: agentMessage,
        });
    }
} catch (error) {
    console.error("[Backend] Error Comunicating with Eliza:", error);
}
};

export const handleGameOver = (
  roomId: string,
  winner: "humans" | "ia",
  io: Server
) => {
  // Notify clients about the game result
  io.to(roomId).emit("gameOver", {
    message: winner === "humans" ? "Humans win!" : "SAMI wins!",
    winner,
  });
};

// Get info of the match
export const getGame = (req: Request, res: Response) => {
  const { id } = req.params;
  const game = getGameById(id);

  if (!game) {
    res.status(404).json({ message: "Match not founf" });
    return;
  }

  res.status(200).json(game);
  return;
};
