import { Request, Response } from "express";
import {
  getGameById,
  recordVote,
  createOrJoin,
  games,
  calculateNumberOfPlayers,
  getSamiPlayer,
} from "../services/gameService";
import { Server, Socket } from "socket.io";
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

gameServiceEmitter.on("conversationEnded", (data: any) => {});

gameServiceEmitter.on("voteSubmitted", (data: {roomId: string, voterId: string, votedId: string}) => {
  io.to(data.roomId).emit("voteSubmitted", { voterId: data.voterId, votedId: data.votedId });
});

gameServiceEmitter.on("playerEliminated", (data: { roomId: string, playerId: string }) => {
  console.log(`[${data.roomId}] Player ${data.playerId} was eliminated.`);
  io.to(data.roomId).emit("playerEliminated", { playerId: data.playerId });
});

gameServiceEmitter.on("startVoting", (data: {roomId: string, timeBeforeEnds: number, serverTime: number}) => {
  const game = games[data.roomId];
  if (!game) return;

  // Get list of active players
  const activePlayers = game.players
    .filter((player) => !player.isEliminated)
    .map((player) => ({ id: player.id, index: player.index }));

  console.log(`[${data.roomId}] Starting voting phase.`);
  io.to(data.roomId).emit("startVotePhase", {
    message: "Voting phase has started",
    roomId: data.roomId,
    players: activePlayers, // Send list of active players
    timeBeforeEnds: data.timeBeforeEnds,
    serverTime: data.serverTime,
  });
});

gameServiceEmitter.on("gameStarted", ({ roomId, game, timeBeforeEnds, serverTime }) => {
  console.log(`[${roomId}] Game started.`);
  io.to(roomId).emit("gameStarted", {
    roomId: game.roomId,
    players: game.players,
    timeBeforeEnds,
    serverTime,
  });
});

gameServiceEmitter.on('gameOver', ({ roomId, winner }) => {
    console.log(`[${roomId}] Game finished and the winner is/are ${winner}.`);
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
    console.error(`Error joining the player ${playerId} into the room ${roomId}`);
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
    console.error(
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
};

export const handleMessage = async (data: any, socket: Socket, io: Server) => {
  const { roomId, message, playerId, playerIndex } = data;
  const startTime = Date.now();

  // Validar si la sala existe
  const game = games[roomId];
  if (!game) {
    return socket.emit("error", { message: "La sala no existe" });
  }

  // Verificar si la partida está activa
  if (game.status !== "active") {
    return socket.emit("error", { message: "La partida no ha comenzado" });
  }

  // Obtener el jugador AI
  const samiPlayer: any = getSamiPlayer(game);
  const body = JSON.stringify({
    text: `You are Player ${samiPlayer.index + 1} and Player ${playerIndex + 1} sent this to the group chat: ${message}`,
    userId: playerId,
    userName: playerIndex + 1,
  });

  console.log(`[${roomId}] Input to Sami: ${body}`);

  // Iniciar solicitud a la IA sin esperar la respuesta (se manejará con timeout)
  const aiResponsePromise = fetch(`http://localhost:3000/SAMI-AGENT/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  // Registrar el mensaje en Supabase sin bloquear la respuesta de la IA
  const supabasePromise = supabase
    .from("SAMI")
    .insert([{ messages: message, room_id: roomId, player_id: playerId }])
    .then(({ error }) => {
      if (error) {
        console.error("[Backend] Error al insertar en Supabase:", error);
      }
    });

  // Emitir mensaje a todos los jugadores de la sala inmediatamente
  io.to(roomId).emit("newMessage", data);

  try {
    // ⏳ Timeout de 8 segundos para la respuesta de la IA
    const response = await Promise.race([
      aiResponsePromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: AI response took too long")), 8000)
      ),
    ]);

    if (!(response instanceof Response)) {
      return console.error("[Backend] AI did not return a valid response");
    }

    const responseText = await response.text();
    console.log(`[${roomId}] Output of Sami: ${responseText}`);
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (jsonError) {
      return console.error("[Backend] Error parsing JSON from Eliza:", jsonError);
    }

    if (responseData && responseData.length > 0) {
      const agentMessage = responseData[0].text;
      if (game.status === "active" && responseData[0].action !== "IGNORE") {
        const endTime = Date.now();
        const elapsedTimeSeconds = (endTime - startTime) / 1000;
        console.log(`[${roomId}] Time taken for AI response: ${elapsedTimeSeconds} seconds.`);

        io.to(roomId).emit("newMessage", {
          playerId: samiPlayer.id,
          playerIndex: samiPlayer.index,
          message: agentMessage,
        });
      }
    }
  } catch (error) {
    console.error("[Backend] AI Response Timeout or Error:", error);
  }

  // Esperar que Supabase termine, pero sin bloquear el proceso
  await supabasePromise;
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
