import type { Server, Socket } from "socket.io";
import { Events } from "../events";
import { withLogger } from "@core/logger";
import gameServiceEmitter, {
  createOrJoin,
  getGameById,
  calculateNumberOfPlayers,
  recordVote,
  rooms,
  cachedRoomsMessages,
  roomsMessages,
  type Message,
} from "@services/game.service";
import { z } from "zod";

const CreateOrJoinSchema = z.object({
  playerId: z.string().min(1),
  isBetGame: z.boolean(),
});

const CastVoteSchema = z.object({
  roomId: z.string().min(1),
  voterId: z.string().min(1),
  voteIndex: z.number().int().nonnegative(),
  votedId: z.string().optional(),
});

const NumberOfPlayersSchema = z.object({
  roomId: z.string().min(1),
  isBetGame: z.boolean(),
});

/** Payload that comes from the socket for chat messages (player-originated). */
const MessageInSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  message: z.string().min(1),
  playerIndex: z.number().int().nonnegative().optional(),
});

export function register(io: Server, socket: Socket) {
  const log = withLogger({ ns: "sockets:game", socketId: socket.id });

  // ===== socket -> service handlers =====

  socket.on(Events.GAME_JOIN, (raw, ack?: (resp: any) => void) => {
  try {
    const { playerId, isBetGame } = CreateOrJoinSchema.parse(raw);
    log.info({ playerId, isBetGame }, "createOrJoin");
    const { roomId, success } = createOrJoin(playerId, isBetGame, socket.id);

    if (!success) {
      const err = { success: false, message: "Failed to create/join game" };
      return ack ? ack(err) : socket.emit("error", err);
    }

    socket.join(roomId);
    io.to(roomId).emit("playerJoined", { playerId, roomId });

    const [amountOfPlayers, neededPlayers] = calculateNumberOfPlayers({ roomId });
    io.to(roomId).emit("numberOfPlayers", { roomId, amountOfPlayers, neededPlayers, isBetGame });

    const resp = { success: true, roomId, isBetGame, status: "waiting" as const };
    return ack ? ack(resp) : socket.emit(Events.GAME_JOINED, resp);
  } catch (e) {
    log.warn({ e }, "GAME_JOIN invalid payload");
    const err = { success: false, message: "Invalid payload" };
    return ack ? ack(err) : socket.emit("error", err);
  }
});

  socket.on(Events.GAME_PLAYERS_COUNT, (raw) => {
    try {
      const { roomId, isBetGame } = NumberOfPlayersSchema.parse(raw);
      const game = rooms[roomId];
      if (!game) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      if (game.isBetGame !== isBetGame) {
        socket.emit("error", { message: "Game type mismatch" });
        return;
      }
      const [amountOfPlayers, neededPlayers] = calculateNumberOfPlayers({ roomId });
      io.to(roomId).emit("numberOfPlayers", { roomId, amountOfPlayers, neededPlayers, isBetGame });
    } catch {
      socket.emit("error", { message: "Invalid payload" });
    }
  });

  socket.on(Events.GAME_CAST_VOTE, (raw) => {
    try {
      const { roomId, voterId, voteIndex } = CastVoteSchema.parse(raw);
      const game = getGameById(roomId);
      if (!game || game.status !== "voting") {
        socket.emit("error", { message: "Voting phase is not active" });
        return;
      }
      if (voteIndex < 0 || voteIndex >= game.players.length) {
        socket.emit("error", { message: "Invalid vote index" });
        return;
      }
      const votedPlayer = game.players[voteIndex]?.id;
      if (!votedPlayer) {
        socket.emit("error", { message: "Voted player does not exist" });
        return;
      }
      if (votedPlayer === voterId) {
        socket.emit("error", { message: "You cannot vote for yourself" });
        return;
      }
      const ok = recordVote(roomId, voterId, votedPlayer);
      if (!ok) socket.emit("error", { message: "Failed to register the vote" });
    } catch {
      socket.emit("error", { message: "Invalid payload" });
    }
  });

  socket.on(Events.GAME_MESSAGE, (raw) => {
    try {
      const data = MessageInSchema.parse(raw);

      const game = rooms[data.roomId];
      if (!game) {
        socket.emit("error", { message: "Room doesn't exist" });
        return;
      }
      if (game.status !== "active") {
        socket.emit("error", { message: "The match has not started" });
        return;
      }

      const resolvedIndex =
        data.playerIndex ??
        game.players.find(p => p.id === data.playerId)?.index;

      if (resolvedIndex == null) {
        socket.emit("error", { message: "Unknown player" });
        return;
      }

      const fullMsg: Message = {
        roomId: data.roomId,
        playerId: data.playerId,
        playerIndex: resolvedIndex,
        isPlayerAI: false,
        message: data.message,
      };

      if (!cachedRoomsMessages[data.roomId]) cachedRoomsMessages[data.roomId] = [];
      if (!roomsMessages[data.roomId]) roomsMessages[data.roomId] = [];
      cachedRoomsMessages[data.roomId].push(fullMsg);
      roomsMessages[data.roomId].push(fullMsg);

      gameServiceEmitter.emit("newMessage", fullMsg);
    } catch {
      socket.emit("error", { message: "Invalid payload" });
    }
  });


  socket.on(Events.DISCONNECT, () => {
    for (const [roomId, game] of Object.entries(rooms)) {
      const idx = game.players.findIndex(p => p.socketId === socket.id && !p.isAI);
      if (idx !== -1) {
        const player = game.players[idx];

        if (game.status === "waiting") {
          game.players.splice(idx, 1);

          io.to(roomId).emit("playerLeft", { playerId: player.id, roomId });
          const [amountOfPlayers, neededPlayers] = calculateNumberOfPlayers({ roomId });
          io.to(roomId).emit("numberOfPlayers", {
            roomId,
            amountOfPlayers,
            neededPlayers,
            isBetGame: game.isBetGame,
          });

          if (game.players.length === 0) {
            delete rooms[roomId];
          }
        } else {
          game.players[idx].left = true;
          io.to(roomId).emit("playerLeft", { playerId: player.id, roomId });
        }
        break;
      }
    }
  });

}

