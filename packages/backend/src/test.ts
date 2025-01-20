import { io } from "socket.io-client";

// Conectar al servidor WebSocket
const socket = io("http://localhost:5001");

// Simular conexión
socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Crear o unirse a un juego
  socket.emit("createOrJoinGame", { playerId: "Player5" });

  // Escuchar eventos
  socket.on("playerJoined", (data: any) => {
    console.log("Player joined:", data);
  });

  socket.on("gameStarted", (data: any) => {
    console.log("Game started:", data);

    // Simular envío de mensaje después de que el juego comience
    setTimeout(() => {
        socket.emit("message", { roomId: data.game.roomId, playerId: "Player5", message: "Hello!" });
    }, 1000);
  });

  socket.on("newMessage", (data: any) => {
    console.log(`[${data.playerId}]: ${data.message}`);
  });

  socket.on("startVotePhase", (data: any) => {
    console.log("Voting phase started:", data);
  });

  socket.on("voteUpdate", (data: any) => {
    console.log("Vote updated:", data);
  });

  socket.on("gameOver", (data: any) => {
    console.log("Game Over:", data);
  });

});

// Manage log off
socket.on("disconnect", () => {
  console.log("Disconnected");
});