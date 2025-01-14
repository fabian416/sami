import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { recordVote, createNewGame, joinGame, startGame, games } from './services/gameService';

const PORT = process.env.PORT || 5000;

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
    console.log("Jugador conectado", socket.id);
    
    // 1. Crear Partida
    socket.on('createGame', (data) => {
        const { roomId } = data;
        const game = createNewGame(roomId);
        // Podrías unir al socket a la sala
        socket.join(roomId);
        // Avisar a ese socket (o a la sala) que la partida se creó
        io.to(roomId).emit('gameCreated', { message: 'Game created', game });
    });

      // 2. Unir jugador a partida
    socket.on('joinGame', (data) => {
        const { roomId, playerId } = data;
        const success = joinGame(roomId, playerId);
        if (!success) {
        socket.emit('error', { message: 'No se pudo unir a la partida' });
        return;
        }
        // Si se une con éxito, unimos el socket a la sala
        socket.join(roomId);
        io.to(roomId).emit('playerJoined', { playerId, roomId });
    });

    // 3. Iniciar el juego (startGame)
    socket.on('startGame', (data) => {
        const { roomId } = data;
        const game = startGame(roomId);
        if (!game) {
        socket.emit('error', { message: 'No se pudo iniciar la partida' });
        return;
        }
        io.to(roomId).emit('gameStarted', { game });
    });
        
    // 4. Recibir Votos
    socket.on('castVote', (data) => {
        const { roomId, voterId, votedId } = data;
        const success = recordVote(roomId, voterId, votedId);
        if (!success) {
          socket.emit('error', { message: 'No se pudo registrar el voto' });
          return;
        }
      
        // Contar cuántos votos tiene 'votedId' ahora
        const game = games[roomId];
        let votesForTarget = 0;
        for (const vId in game.votes) {
          if (game.votes[vId] === votedId) {
            votesForTarget++;
          }
        }
      
        // Emitir un evento "anonymous" a todos
        io.to(roomId).emit('voteUpdate', {
          votedId,
          totalVotes: votesForTarget,
        });
      });

    socket.on('message', (data) => {
        console.log("message", data.roomId, data.message);
        io.to(data.roomId).emit('newMessage', data);
    })

    socket.on('disconnect', () => {
        console.log("Jugador Desconectado", socket.id)
    });

});

server.listen(PORT, () => {
    console.log("Servidor corriendo en http://localhost:", PORT);
})

