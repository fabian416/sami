// src/sockets/player.handlers.ts
import type { Server, Socket } from "socket.io";
import { withLogger } from "@core/logger";
import playerServiceEmitter, {
  disconnectPlayer,
  getPlayerIndex,
  getPlayerRoomId,
} from "@services/player.service";
import { z } from "zod";

const DisconnectSchema = z.object({
  roomId: z.string().min(1),
  playerId: z.string().min(1),
});
const IndexSchema = DisconnectSchema;
const RoomIdSchema = z.object({ playerId: z.string().min(1) });

export function register(io: Server, socket: Socket) {
  const log = withLogger({ ns: "sockets:player", socketId: socket.id });

  // Socket → service
  socket.on("player:disconnect", (raw) => {
    try {
      const data = DisconnectSchema.parse(raw);
      disconnectPlayer(data);
    } catch (e) {
      log.warn({ e }, "player:disconnect invalid payload");
    }
  });

  socket.on("player:getIndex", (raw) => {
    try {
      const data = IndexSchema.parse(raw);
      getPlayerIndex(data);
    } catch (e) {
      log.warn({ e }, "player:getIndex invalid payload");
    }
  });

  socket.on("player:getRoom", (raw) => {
    try {
      const data = RoomIdSchema.parse(raw);
      getPlayerRoomId(data);
    } catch (e) {
      log.warn({ e }, "player:getRoom invalid payload");
    }
  });
}
