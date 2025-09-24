// src/sockets/player.handlers.ts
import type { Server, Socket } from "socket.io";
import { withLogger } from "@core/logger";
import {
  disconnectPlayer,
  getPlayerIndex,
  getPlayerRoomId,
} from "@services/player.service";
import { sessions } from "@src/sockets/session-store";
import { z } from "zod";
import { Events } from "../events";

// --- Schemas ---
const DisconnectSchema = z.object({
  roomId: z.string().min(1),
  playerId: z.string().min(1),
});
const IndexSchema = DisconnectSchema;
const RoomIdSchema = z.object({ playerId: z.string().min(1) });

// Minimal schema for wallet registration
const RegisterWalletSchema = z.object({
  walletAddress: z.string().min(1),
});

export function register(io: Server, socket: Socket) {
  const log = withLogger({ ns: "sockets:player", socketId: socket.id });

  // Player disconnect → service
  socket.on("player:disconnect", raw => {
    try {
      const data = DisconnectSchema.parse(raw);
      disconnectPlayer(data);
    } catch (e) {
      log.warn({ e }, "player:disconnect invalid payload");
    }
  });

  // Get player index → service
  socket.on(Events.PLAYER_GET_INDEX, raw => {
    try {
      const data = IndexSchema.parse(raw);
      getPlayerIndex(data);
    } catch (e) {
      log.warn({ e }, "player:getIndex invalid payload");
    }
  });

  // Get player room → service
  socket.on(Events.PLAYER_GET_ROOM, raw => {
    try {
      const data = RoomIdSchema.parse(raw);
      getPlayerRoomId(data);
    } catch (e) {
      log.warn({ e }, "player:getRoom invalid payload");
    }
  });

  // --- Register wallet (minimal) ---
  // Stores the wallet in the in-memory session for this socket.
  // createPlayer() will read it from `sessions[socket.id]?.walletAddress`.
  socket.on(Events.PLAYER_REGISTER_WALLET, raw => {
    try {
      const { walletAddress } = RegisterWalletSchema.parse(raw);

      // upsert in session store for this socket
      sessions[socket.id] = {
        ...(sessions[socket.id] || {}),
        walletAddress,
      };

      log.info(`Wallet ${walletAddress} linked to socket ${socket.id}`);
      socket.emit("player:walletRegistered", { walletAddress });
    } catch (e) {
      log.warn({ e }, "registerWallet invalid payload");
      socket.emit("player:walletRejected", { reason: "Invalid payload" });
    }
  });
}
