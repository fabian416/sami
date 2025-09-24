import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { corsOptions } from "@config/cors";
import { attachSocketServer } from "@sockets/index";
import { env } from "@config/env";
import logger from "@core/logger";
import { wireGameRelays } from "@sockets/game.relay";
import { wirePlayerRelays } from "@sockets/player.relay";

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingInterval: 30000,
  pingTimeout: 5000,
});

// Attach feature handlers
attachSocketServer(io);
wireGameRelays(io);
wirePlayerRelays(io);

// Start
server.listen(env.PORT, env.HOST, () => {
  logger.info(`HTTP+Socket server on http://${env.HOST}:${env.PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  logger.info("Shutting down...");
  io.close();
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);