import type { Server } from "socket.io";
import playerServiceEmitter from "@services/player.service";

let wired = false;

export function wirePlayerRelays(io: Server) {
  if (wired) return;
  wired = true;

  for (const evt of ["playerIndex", "playerRoomId"]) {
    playerServiceEmitter.removeAllListeners(evt);
  }

  playerServiceEmitter.on("playerIndex", (data: { roomId: string; playerId: string; playerIndex: number }) => {
    io.to(data.roomId).emit("playerIndex", data);
  });

  playerServiceEmitter.on("playerRoomId", (data: { roomId: string; playerId: string }) => {
    io.to(data.roomId).emit("playerRoomId", data);
  });
}
