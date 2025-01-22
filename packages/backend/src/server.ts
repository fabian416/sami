import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import * as gameController from '../src/controllers/gameController';
const PORT = process.env.PORT || 5001;

const server = http.createServer(app);
// Socket configuration.IO for the server
export const io = new Server(server, {
    cors: {
        origin: '*', // Allowing connections from any origin
        methods: ['GET', 'POST'],
    }
});

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
  
    socket.on('castVote', (data) => {
      console.log(`[castVote] Received data:`, JSON.stringify(data));
      try {
          gameController.castVote(data, socket, io);
          console.log(`[castVote] Vote processed successfully for room: ${data.roomId}`);
      } catch (error) {
          console.error(`[castVote] Error processing vote for room: ${data.roomId}`, error);
      }
    });

    socket.on("message", (data) => {
    console.log(`message: Received data:`, data);
    try {
        gameController.handleMessage(data, socket, io);
    } catch (error) {
        console.error(`message: An error occurred`, error);

        // Emitir un error al cliente, si es necesario
        socket.emit("error", { message: "An error occurred while processing the message." });
    }
    });

    socket.on('disconnect', () => {
        console.log("Player disconnected", socket.id)
    });

});

server.listen(PORT, () => {
    console.log("Server running at http://localhost:", PORT);
})

