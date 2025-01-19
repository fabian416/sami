import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import * as gameController from '../src/controllers/gameController';
const PORT = process.env.PORT || 5001;

const server = http.createServer(app);
// Socket configuration.IO for the server
const io = new Server(server, {
    cors: {
        origin: '*', // Allowing connections from any origin
        methods: ['GET', 'POST'],
    }
});

// Manage WebSocket event
io.on('connection', (socket) => {
    console.log("Player connected :)", socket.id);

    socket.on('createOrJoinGame', (data) => {
      console.log(`createOrJoinGame: Received data:`, data)
      gameController.createOrJoinGame(data, socket, io);
    });

    socket.on('startVotePhase', (data) => {
      console.log(`[startVotePhase] Received data:`, JSON.stringify(data));
      try {
          gameController.startVotePhase(data, io);
          console.log(`[startVotePhase] Voting phase started successfully for room: ${data.roomId}`);
      } catch (error) {
          console.error(`[startVotePhase] Error starting voting phase for room: ${data.roomId}`, error);
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
      gameController.handleMessage(data, socket, io);
    });

    socket.on('disconnect', () => {
        console.log("Player disconnected", socket.id)
    });

});

server.listen(PORT, () => {
    console.log("Server running at http://localhost:", PORT);
})

