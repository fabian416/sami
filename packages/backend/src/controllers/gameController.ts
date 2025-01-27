import { Request, Response } from "express";
import {
  getGameById,
  recordVote,
  createOrJoin,
  games,
} from "../services/gameService";
import { Server, Socket } from "socket.io";
import { addCharsToPlayer } from "../services/playerService";
import { io } from "../server";
import gameServiceEmitter from "../services/gameService";
import supabase from "../config/supabaseClient";
import { getAgentForRoom } from "../services/agentManager";
import { Memory } from "@elizaos/core";

gameServiceEmitter.on("startConversation", ({ roomId }) => {
  const message = { message: "Conversation phase has started" };
  io.to(roomId).emit("startConversationPhase", message);
});

gameServiceEmitter.on("conversationEnded", (data: any) => {
  console.log(`Conversation phase ended for room: ${data.roomId}`);
});

gameServiceEmitter.on("playerEliminated", ({ roomId, playerId }) => {
  console.log(
    `Notifying clients: Player ${playerId} was eliminated from room ${roomId}`
  );
  io.to(roomId).emit("playerEliminated", { playerId });
});

gameServiceEmitter.on("startVoting", (roomId: string) => {
  const game = games[roomId];
  if (!game) return;

  // Get list of active players
  const activePlayers = game.players
    .filter((player) => !player.isEliminated)
    .map((player, index) => ({ id: player.id, index }));

  console.log(`Starting voting phase for room: ${roomId}`);
  io.to(roomId).emit("startVotePhase", {
    message: "Voting phase has started",
    roomId: roomId,
    players: activePlayers, // Send list of active players
  });
});

gameServiceEmitter.on("gameStarted", ({ roomId, game }) => {
  console.log(`Game started for room: ${roomId}`);
  io.to(roomId).emit("gameStarted", {
    roomId: game.roomId,
    players: game.players,
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
  console.log({ playerIndex });

  // Validate if the instance exists
  const game = games[roomId];
  if (!game) {
    socket.emit("error", { message: "La sala no existe" });
    return;
  }

  // Verify if the game has started
  if (game.status !== "active") {
    socket.emit("error", { message: "La partida no ha comenzado" });
    return;
  }

  // Update the count of the chars a player did
  addCharsToPlayer(roomId, playerId, message.length);

  // Register the message in the server (test purposes only)
  console.log(`Mensaje de ${playerId} en sala ${roomId}: ${message}`);

  // Insert the message into the Supabase database
  const { data: dataSupabase, error } = await supabase
    .from("SAMI")
    .insert([{ messages: message, room_id: roomId, player_id: playerId }]);

  if (error) {
    console.log("Error inserting data: ", error);
  } else if (dataSupabase) {
    console.log("Message inserted into Supabase:", dataSupabase);
  }

  // Resend the message to all the other players
  io.to(roomId).emit("newMessage", data);

  // **Integration with SAMI**
  const agent = getAgentForRoom(roomId); // Get the agent associate to the room
  if (agent) {
    try {
      // Create the initial state to process the message
      const memory: Memory = {
        userId: playerId, // El userId del jugador
        agentId: agent.agentId || "SAMI", // Usar un ID válido si no hay agentId
        roomId: roomId,
        content: {
          text: message,
        },
      };

      const state = await agent.composeState(memory);

      // Processs the message with SAMI
      await agent.processActions(
        memory,
        [],
        state,
        async (newMessages) => {
          // Crear un array de Memory[] a partir de las respuestas
          const responses: Memory[] = Array.isArray(newMessages)
            ? newMessages.map((msg) => ({
                userId: uuidv4(), // Generar un UUID válido para el userId de SAMI
                agentId: agent.agentId,
                roomId,
                content: msg.content, // Copy the content of the message 
              }))
            : [];

          // Emit the response generated for SAMI
          if (responses.length > 0) {
            io.to(roomId).emit("newMessage", {
              playerId: "SAMI",
              message: responses[0]?.content?.text || "SAMI could not generate an answer",
            });
          } else {
            console.warn("No se generaron respuestas de SAMI.");
          }

          return responses; // return the array of responses
        }
      );
    } catch (err) {
      console.error(`Error processing message with SAMI for room ${roomId}:`, err);
    }
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
function uuidv4(): any {
  throw new Error("Function not implemented.");
}

