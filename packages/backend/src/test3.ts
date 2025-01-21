import { io } from "socket.io-client";
import readline from "readline";

// Crear una interfaz de readline para entrada de consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Conectar al servicio de WebSocket
const socket = io("http://localhost:5001");

// Simular conexión
socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Crear o unirse a un juego
  const playerId = `Player3`;
  socket.emit("createOrJoinGame", { playerId });

  console.log(`You are logged in as ${playerId}. Waiting for the game to start...`);

  // Escuchar eventos
  socket.on("playerJoined", (data: any) => {
    console.log("Player joined:", data);
  });

  socket.on("gameStarted", (data: any) => {
    console.log("Game just started:", data);
    console.log("You can now send messages during the conversation phase.");
    startMessageInput(playerId, data.game.roomId); // Iniciar la fase de mensajes
  });

  socket.on("newMessage", (data: any) => {
    console.log(`[${data.playerId}]: ${data.message}`);
  });

  socket.on('playerEliminated', (data) => {
    console.log(`Player ${data.playerId} was eliminated.`);
    if (data.playerId === playerId) {
        console.log("You have been eliminated from the game!");
    }
    });

  socket.on("startVotePhase", (data: any) => {
    console.log("Voting phase started:", data);
    console.log("Enter the index of the player you want to vote for:");
    startVoteInput(playerId, data.roomId); // Iniciar la fase de votación
  });

  socket.on("voteUpdate", (data: any) => {
    console.log(`Player ${data.votedPlayer} now has ${data.totalVotes} votes.`);
  });

  socket.on("gameOver", (data: any) => {
    console.log("Game Over:", data);
    rl.close(); // Cerrar la interfaz de entrada
  });
});

// Manejar desconexión
socket.on("disconnect", () => {
  console.log("Disconnected");
  rl.close();
});

// Función para gestionar la entrada de mensajes
function startMessageInput(playerId: string, roomId: string) {
  console.log("Type your message and press Enter to send:");
  rl.on("line", (input) => {
    // Enviar el mensaje al servidor
    socket.emit("message", { roomId, playerId, message: input });
  });
}

// Función para gestionar la votación
function startVoteInput(playerId: string, roomId: string) {
  rl.on("line", (input) => {
    const votedIndex = parseInt(input.trim());
    if (isNaN(votedIndex)) {
      console.log("Please enter a valid number for voting.");
    } else {
      console.log(`You voted for player at index ${votedIndex}.`);
      // Emitir el voto al servidor
      socket.emit("castVote", { roomId, voterId: playerId, votedId: votedIndex });
      rl.pause(); // Pausar la entrada hasta que sea necesario nuevamente
    }
  });
}