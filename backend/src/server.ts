import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { CONNREFUSED } from 'dns';

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
    
    socket.on('createRoom', (data) => {
        console.log("Creando la sala", data.roomId);
        socket.join(data.roomId);
        io.to(data.roomId).emit('roomCreated', { roomId: data.roomId});
    });

    socket.on('joinRoom', (data) => {
        console.log("Jugador uniendose a la sala: ", data.roomId);
        socket.join(data.roomId);
        io.to(data.roomId).emit('playerJoined', {playerId: socket.id});
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

