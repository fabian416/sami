import type { Server, Socket } from "socket.io";
import { Events } from "./events";
import * as gameHandlers from "./handlers/game.handlers";
import * as playerHandlers from "./handlers/player.handlers";
import logger from "@core/logger";
import { sessions } from "./session-store";

export function attachSocketServer(io: Server) {
  io.on(Events.CONNECTION, (socket: Socket) => {
    logger.info(`Player connected ${socket.id}`);

    sessions[socket.id] = { socketId: socket.id };

    io.emit(Events.CONNECTED_PLAYERS, { amount: Object.keys(sessions).length });

    playerHandlers.register(io, socket);
    gameHandlers.register(io, socket);

    socket.on(Events.DISCONNECT, () => {
      delete sessions[socket.id];
      io.emit(Events.CONNECTED_PLAYERS, { amount: Object.keys(sessions).length });
      logger.info(`Player disconnected ${socket.id}`);
    });
  });
}
