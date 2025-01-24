import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "~~/app/socketContext";

interface Player {
  id: string;
  totalChars: number;
  isIA: boolean;
  isEliminated: boolean;
}

export const ChooseGame = ({ showGame }: any) => {
  const [loading, setLoading] = useState(false);
  const { socket, isConnected, playerId, setPlayerId, setPlayerIndex, setRoomId } = useSocket();

  useEffect(() => {
    if (!socket) return;
    if (!playerId) return;

    const handleGameStarted = (data: { roomId: string; players: Player[] }) => {
      const index: any = data.players.findIndex(player => player.id === playerId);
      setPlayerIndex(index);
      setRoomId(data.roomId); // Almacena el roomId en el contexto
      console.log("Game started:", data);
      showGame(); // Cambiar a la pantalla del juego
    };

    socket.on("gameStarted", handleGameStarted);

    return () => {
      socket.off("gameStarted", handleGameStarted);
    };
  }, [socket, showGame, setRoomId, playerId]);

  const handleEnterGame = () => {
    if (!isConnected || !socket) {
      alert("Unable to connect to the game server. Please try again.");
      return;
    }

    const randomPlayerId = uuidv4();
    setPlayerId(randomPlayerId);

    setLoading(true);
    socket.emit(
      "createOrJoinGame",
      { playerId: randomPlayerId },
      (response: { message(arg0: string, message: any): unknown; success: boolean; roomId: string }) => {
        setLoading(false);
        if (response.success && response.roomId) {
          console.log("Joined game:", response.roomId);
          setRoomId(response.roomId); // Almacena el roomId en el contexto tras unirse
        } else {
          console.error("Failed to join game:", response.message);
          alert("Error joining the game. Please try again.");
        }
      },
    );
  };

  return (
    <div className="flex md:flex-row flex-col justify-evenly items-center w-full gap-10 md:gap-8">
      <div className="card bg-gray-500 text-white max-w-sm md:w-96 shadow-xl mx-4">
        <div className="card-body">
          <h2 className="card-title">Enter game!</h2>
          <p>Pay a 2 USDC fee to participate in the next round of SAMI!</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary bg-gray-700 text-white border-0">Pay 2 USDC</button>
          </div>
        </div>
      </div>
      <div className="card bg-cyan-700 text-white max-w-sm md:w-96 shadow-xl mx-4">
        <div className="card-body">
          <h2 className="card-title">Enter free game!</h2>
          <p>Participate free in the next round of SAMI!</p>
          <div className="card-actions justify-end">
            <button
              className="btn btn-primary bg-red-600 hover:bg-red-700 text-white border-0"
              onClick={handleEnterGame}
              disabled={loading}
            >
              {loading ? "Looking for a game..." : "Enter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
