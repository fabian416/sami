import { useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useSocket } from "~~/app/socketContext";

// Define los tipos de datos para evitar errores de tipo
interface Message {
  playerId: string;
  message: string;
}

interface Player {
  id: string;
  index: number;
}

export const PlayGame = () => {
  const { socket, isConnected, playerId } = useSocket();

  // Define los estados explícitos
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<"conversation" | "voting" | "finished">("conversation");
  const [winner, setWinner] = useState<string | null>(null);

  // Define la referencia para el input
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("gameStarted", (data: { game: { roomId: string; players: Player[] } }) => {
      console.log("Game started:", data);
      setRoomId(data.game.roomId); // Acceder a data.game.roomId
      setPlayers(data.game.players); // Acceder a data.game.players
    });

    // Escuchar mensajes nuevos
    socket.on("newMessage", (data: Message) => {
      setMessages(prev => [...prev, data]);
    });

    // Escuchar inicio de conversación
    socket.on("startConversationPhase", (data: { message: string }) => {
      setCurrentPhase("conversation");
      console.log(data.message);
    });

    // Escuchar inicio de votación
    socket.on("startVotePhase", (data: { players: Player[]; roomId: string; message: string }) => {
      setCurrentPhase("voting");
      setPlayers(data.players);
      setRoomId(data.roomId);
      console.log(data.message);
    });

    // Escuchar fin del juego
    socket.on("gameOver", (data: { winner: string; message: string }) => {
      setCurrentPhase("finished");
      setWinner(data.winner);
      console.log(data.message);
    });

    return () => {
      // Limpiar los listeners
      socket.off("gameStarted");
      socket.off("newMessage");
      socket.off("startConversationPhase");
      socket.off("startVotePhase");
      socket.off("gameOver");
    };
  }, [socket]);

  const sendMessage = (message: string) => {
    console.log("roomId:", roomId, "playerId:", playerId);
    if (!socket) {
      console.error("Socket is not defined.");
      return;
    }
    if (!roomId) {
      console.error("Room ID is not defined.");
      return;
    }
    if (!playerId) {
      console.error("Player ID is not defined.");
      return;
    }

    console.log(`Emitting message: ${message}, Player ID: ${playerId}, Room ID: ${roomId}`);
    socket.emit("message", { roomId, playerId, message });
  };
  return (
    <div className="grid grid-cols-2 w-full h-[calc(100vh-8rem)] rounded-2xl backdrop-brightness-95">
      <div className="flex items-center justify-center overflow-hidden rounded-2xl">
        <img src="sami-team.webp" className="object-cover" alt="Game Banner" />
      </div>
      <div className="flex flex-col items-center justify-between p-4 bg-white rounded-2xl shadow-lg">
        <div className="flex-1 w-full overflow-y-auto p-2">
          <div className="text-gray-500">Welcome! Feel free to chat! Ask questions!</div>
          <div className="mt-4 text-black">
            {messages.map((msg, index) => (
              <div key={index} className="text-left">
                <span>
                  <strong>{msg.playerId}:</strong> {msg.message}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex w-full mt-4">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            onKeyDown={e => {
              if (e.key === "Enter" && inputRef.current?.value.trim()) {
                sendMessage(inputRef.current.value.trim());
                inputRef.current.value = ""; // Limpiar input
              }
            }}
          />
          <button
            className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              if (inputRef.current?.value.trim()) {
                sendMessage(inputRef.current.value.trim());
                inputRef.current.value = ""; // Limpiar input
              }
            }}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
