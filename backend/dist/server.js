"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const gameService_1 = require("./services/gameService");
const playerService_1 = require("./services/playerService");
const PORT = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
// Socket configuration.IO for the server
const io = new socket_io_1.Server(server, {
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
        const game = (0, gameService_1.createNewGame)(roomId);
        // Podrías unir al socket a la sala
        socket.join(roomId);
        // Avisar a ese socket (o a la sala) que la partida se creó
        io.to(roomId).emit('gameCreated', { message: 'Game created', game });
    });
    // 2. Unir jugador a partida
    socket.on('joinGame', (data) => {
        const { roomId, playerId } = data;
        const success = (0, gameService_1.joinGame)(roomId, playerId);
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
        const game = (0, gameService_1.startGame)(roomId);
        if (!game) {
            socket.emit('error', { message: 'No se pudo iniciar la partida' });
            return;
        }
        io.to(roomId).emit('gameStarted', { game });
    });
    // 4. Recibir Votos
    socket.on('castVote', (data) => {
        const { roomId, voterId, votedId } = data;
        const success = (0, gameService_1.recordVote)(roomId, voterId, votedId);
        if (!success) {
            socket.emit('error', { message: 'No se pudo registrar el voto' });
            return;
        }
        // Contar cuántos votos tiene 'votedId' ahora
        const game = gameService_1.games[roomId];
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
        const { roomId, message, playerId } = data;
        // 1. Registrar los caracteres escritos por este jugador
        //    asumiendo que addCharsToPlayer necesita (roomId, playerId, charCount)
        (0, playerService_1.addCharsToPlayer)(roomId, playerId, message.length);
        // 2. Loguear o mostrar el mensaje
        console.log("message", roomId, message);
        // 3. Reenviar el mensaje a todos en la sala
        io.to(roomId).emit('newMessage', data);
    });
    socket.on('disconnect', () => {
        console.log("Jugador Desconectado", socket.id);
    });
});
server.listen(PORT, () => {
    console.log("Servidor corriendo en http://localhost:", PORT);
});
