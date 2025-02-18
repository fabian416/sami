import http from "http";
import { Server } from "socket.io";
import app from "./app";
import * as gameController from "@controllers/gameController";
import * as playerController from "@controllers/playerController";
import "@services/eventListener";
const HOST = process.env.HOST || "localhost";
const PORT = parseInt(process.env.PORT || "5001", 10);

const server = http.createServer(app);

// Socket configuration.IO for the server
export const io = new Server(server, {
    cors: {
        origin: '*', // Allowing connections from any origin
        methods: ['GET', 'POST', 'OPTIONS'],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingInterval: 30000,
    pingTimeout: 5000,
});

export const players: {
  [key: string]: {
    socketId: string;
    walletAddress?: string; // To the winner of the game
    roomId?: string;
    playerId?: string;
  };
} = {};

// Manage WebSocket event
io.on("connection", (socket) => {
  console.log("Player connected :)", socket.id);
  players[socket.id] = { socketId: socket.id };
  io.emit("connectedPlayers", { amount: Object.keys(players).length });

  socket.on("registerWallet", (data) => {
    const { walletAddress } = data;

    if (!walletAddress) {
      console.warn(`⚠️ No wallet address provided for socket ${socket.id}`);
      return;
    }

    players[socket.id] = {
      socketId: socket.id,
      walletAddress,
    };

    console.log(`Wallet ${walletAddress} linked to socket ${socket.id}`);
    console.log(` Players mapping now:`, players); // Log stored player data
  });

  socket.on("createOrJoinGame", (data) => {
    console.log(`createOrJoinGame: Received data:`, data);

    try {
      const { playerId, isBetGame } = data;

      const result = gameController.createOrJoinGame(
        { playerId, isBetGame },
        socket,
        io
      );

      // Enviar confirmación al cliente
      socket.emit("gameJoined", result);
    } catch (error) {
      console.error(`createOrJoinGame: An error occurred`, error);
      socket.emit("error", {
        message: "An unexpected error occurred while processing your request.",
      });
    }
  });
  socket.on("getNumberOfPlayers", (data) => {
    try {
      gameController.getNumberOfPlayers(data, socket, io);
    } catch (error) {
      console.error(`createOrJoinGame: An error occurred`, error);
      // Emitir un error al cliente para informarle del problema
      socket.emit("error", {
        message: "An unexpected error occurred while processing your request.",
      });
    }
  });

  socket.on("castVote", (data) => {
    try {
      gameController.castVote(data, socket, io);
    } catch (error) {
      console.error(
        `[castVote] Error processing vote for room: ${data.roomId}`,
        error
      );
    }
  });

  socket.on("message", (data) => {
    try {
      gameController.handleMessage(data, socket, io);
    } catch (error) {
      console.error(`message: An error occurred`, error);

      // Emitir un error al cliente, si es necesario
      socket.emit("error", {
        message: "An error occurred while processing the message.",
      });
    }
  });

  socket.on("getPlayerIndex", (data) => {
    try {
      playerController.getPlayerIndex(data);
    } catch (error) {
      console.error(`message: An error occurred`, error);
      // Emitir un error al cliente, si es necesario
      socket.emit("error", {
        message: "An error occurred while processing the message.",
      });
    }
  });

  socket.on("getPlayerRoomId", (data) => {
    try {
      const roomId = playerController.getPlayerRoomId(data);
      if (players[socket.id]) {
        players[socket.id].roomId = roomId;
        players[socket.id].playerId = data.playerId;
      } else {
        players[socket.id] = {
          socketId: socket.id,
          roomId,
          playerId: data.playerId,
        };
      }
    } catch (error) {
      console.error(`message: An error occurred`, error);
      socket.emit("error", {
        message: "An error occurred while processing the message.",
      });
    }
  });

  socket.on("disconnect", () => {
    const player = players[socket.id];

    if (player) {
      console.log(`Player disconnected: ${socket.id}`);

      // Si el jugador estaba en una partida, llamar a disconnectPlayer
      if (player.roomId && player.playerId) {
        playerController.disconnectPlayer({
          roomId: player.roomId,
          playerId: player.playerId,
        });
        console.log(
          `Removed player ${player.playerId} from room ${player.roomId}`
        );
      }

      // Eliminar al jugador del mapa de players
      delete players[socket.id];
      io.emit("connectedPlayers", { amount: Object.keys(players).length });
    } else {
      console.log(
        ` No tracked player found for socket ${socket.id}, ignoring.`
      );
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
