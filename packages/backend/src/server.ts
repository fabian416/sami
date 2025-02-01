import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import * as gameController from '@controllers/gameController';
import * as playerController from '@controllers/playerController';
const HOST = process.env.HOST || 'localhost';
const PORT = parseInt(process.env.PORT || '5001', 10);

const server = http.createServer(app);
// Socket configuration.IO for the server
export const io = new Server(server, {
    cors: {
        origin: '*', // Allowing connections from any origin
        methods: ['GET', 'POST'],
    },
  transports: ["polling"]
});

const players: any = {};

// Manage WebSocket event
io.on('connection', (socket) => {
    console.log("Player connected :)", socket.id);

    // Initialize
    socket.on('createOrJoinGame', (data) => {
        console.log(`createOrJoinGame: Received data:`, data);
    
        try {
            gameController.createOrJoinGame(data, socket, io);
        } catch (error) {
            console.error(`createOrJoinGame: An error occurred`, error);
    
            // Emitir un error al cliente para informarle del problema
            socket.emit('error', { message: 'An unexpected error occurred while processing your request.' });
        }
    });


    socket.on('getNumberOfPlayers', (data) => {
        try {
            gameController.getNumberOfPlayers(data, socket, io);
        } catch (error) {
            console.error(`createOrJoinGame: An error occurred`, error);
            // Emitir un error al cliente para informarle del problema
            socket.emit('error', { message: 'An unexpected error occurred while processing your request.' });
        }
    });
  
    socket.on('castVote', (data) => {
      try {
          gameController.castVote(data, socket, io);
      } catch (error) {
          console.error(`[castVote] Error processing vote for room: ${data.roomId}`, error);
      }
    });

    socket.on("message", (data) => {
    try {
        gameController.handleMessage(data, socket, io);
    } catch (error) {
        console.error(`message: An error occurred`, error);

        // Emitir un error al cliente, si es necesario
        socket.emit("error", { message: "An error occurred while processing the message." });
    }
    });

    socket.on("getPlayerIndex", (data) => {
        try {
            playerController.getPlayerIndex(data);
        } catch (error) {
            console.error(`message: An error occurred`, error);
            // Emitir un error al cliente, si es necesario
            socket.emit("error", { message: "An error occurred while processing the message." });
        }
    });

    socket.on("getPlayerRoomId", (data) => {
        try {
            const roomId = playerController.getPlayerRoomId(data);
            players[socket.id] = { 
                roomId,
                playerId: data.playerId 
              };
        } catch (error) {
            console.error(`message: An error occurred`, error);
            // Emitir un error al cliente, si es necesario
            socket.emit("error", { message: "An error occurred while processing the message." });
        }
    });

    socket.on('disconnect', () => {
        const player = players[socket.id];
        playerController.disconnectPlayer({roomId: player?.roomId, playerId: player?.playerId});
        console.log("Player disconnected", socket.id)
    });

});

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});