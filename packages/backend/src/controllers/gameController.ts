import { Request, Response } from "express";
import {
  getGameById,
  recordVote,
  createOrJoin,
  rooms,
  calculateNumberOfPlayers,
  getSamiPlayer,
  Message,
  cachedRoomsMessages,
  roomsMessages,
} from "../services/gameService";
import { Server, Socket } from "socket.io";
import { io, players } from "../server";
import gameServiceEmitter from "@services/gameService";
import supabase from "@config/supabaseClient";


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

gameServiceEmitter.on("newMessage", (data) => {
  io.to(data.roomId).emit("newMessage", data);
})

gameServiceEmitter.on("startVoting", (data: {roomId: string, timeBeforeEnds: number, serverTime: number}) => {
  const game = rooms[data.roomId];
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

gameServiceEmitter.on("gameOver", ({ roomId, isBetGame, results }) => {
  console.log(`[${roomId}] Game over`);
  io.to(roomId).emit("gameOver", {
    message: "The game is over! Here are the results:",
    isBetGame,
    results, // Array con los resultados de todos los jugadores
  });
});

export const getNumberOfPlayers = (data: any, socket: Socket, io: Server) => {
  const { roomId, isBetGame } = data;

  if (!roomId || isBetGame === undefined) {
    console.error(`[getNumberOfPlayers] Invalid data:`, data);
    return socket.emit("error", { message: "Incomplete data for retrieving number of players" });
  }

  // Get info of the room
  const game = rooms[roomId];
  if (!game) {
    console.error(`[getNumberOfPlayers] Room not found:`, roomId);
    return socket.emit("error", { message: "Room not found" });
  }

  // Validar the type of the game match
  if (game.isBetGame !== isBetGame) {
    console.error(`[getNumberOfPlayers] Game type mismatch for room ${roomId}. Expected isBetGame: ${game.isBetGame}`);
    return socket.emit("error", { message: "Game type mismatch" });
  }

  // Calculate number of players
  const [amountOfPlayers, neededPlayers] = calculateNumberOfPlayers({ roomId });
  io.to(roomId).emit("numberOfPlayers", { roomId, amountOfPlayers, neededPlayers, isBetGame });
};

// Create or join a new match
export const createOrJoinGame = (data: any, socket: Socket, io: Server) => {
  const { playerId, isBetGame } = data; // Extract `isBetGame`

  console.log(`Creating or joining game. Player: ${playerId}, isBetGame: ${isBetGame}`);
  // Delegate to the service, passing and `isBetGame`
  const { roomId, success } = createOrJoin(playerId, isBetGame);

  if (!success) {
    console.error(` Error joining the player ${playerId} into the room ${roomId}`);
    return socket.emit("error", { message: "There was an error creating or joining the match" });
  }
  // Store playerId inside `players`
  if (players[socket.id]) {
    players[socket.id].playerId = playerId;
    players[playerId] = { ...players[socket.id] };  // Store playerId separately
    console.log(`Mapped playerId: ${playerId} to wallet: ${players[socket.id].walletAddress}`);
  } else {
    console.warn(`No socket entry found for player ${playerId}`);
  }

  // Notify the client that the player joined successfully
  socket.join(roomId);
  io.to(roomId).emit("playerJoined", { playerId, roomId });

  // Send response to the specific player who joined
  socket.emit("gameJoined", { roomId, success, isBetGame });

  console.log(` Player ${playerId} joined room ${roomId} (isBetGame: ${isBetGame})`);
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


export const handleMessage = async (data: Message, socket: Socket, io: Server) => {
  const { roomId } = data;
  data.isPlayerAI = false;
  
  const game = rooms[roomId];
  if (!game) {
    return socket.emit("error", { message: "Room doesn't exist" });
  }

  if (game.status !== "active") {
    return socket.emit("error", { message: "La partida no ha comenzado" });
  }

  if (!cachedRoomsMessages[roomId]) cachedRoomsMessages[roomId] = [];
  if (!roomsMessages[roomId]) roomsMessages[roomId] = [];
  cachedRoomsMessages[roomId].push(data);
  roomsMessages[roomId].push(data);

  gameServiceEmitter.emit("newMessage", data);
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