import { useEffect, useState } from "react";
import { useSocket } from "~~/app/socketContext";

export const ChooseGame = ({ showGame }: any) => {
  const [loading, setLoading] = useState(false);
  const { socket, isConnected, setPlayerId } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (data: any) => {
      console.log("Game started:", data);
      showGame(); // Transition to the game screen
    };

    const handleGameState = (data: any) => {
      console.log("Game state received:", data);
      if (data.players.length === 6 && data.status === "active") {
        showGame(); // Transition to the game screen if the game is already started
      }
    };

    socket.on("gameStarted", handleGameStarted);
    socket.on("gameState", handleGameState);

    return () => {
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameState", handleGameState);
    };
  }, [socket, showGame]);

  const handleEnterGame = () => {
    if (!isConnected || !socket) {
      alert("Unable to connect to the game server. Please try again.");
      return;
    }

    const randomPlayerId = `Player${Math.floor(Math.random() * 1000)}`;
    setPlayerId(randomPlayerId);

    setLoading(true);
    socket.emit("createOrJoinGame", { playerId: randomPlayerId }, (response: any) => {
      setLoading(false);
      if (response.success) {
        console.log("Joined game:", response.roomId);
      } else {
        console.error("Failed to join game:", response.message);
        alert("Error joining the game. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-direction-row justify-evenly w-full">
      <div className="card bg-base-100 w-96 shadow-xl mt-4 mx-2">
        <div className="card-body">
          <h2 className="card-title">Enter game!</h2>
          <p>Pay a 2 USDC fee to participate in the next round of SAMI!</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary">Pay 2 USDC</button>
          </div>
        </div>
      </div>
      <div className="card dark:bg-cyan-700 light:bg-white-100 w-96 shadow-xl mt-4 mx-2">
        <div className="card-body">
          <h2 className="card-title">Enter free game!</h2>
          <p>Participate free in the next round of SAMI!</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary" onClick={handleEnterGame} disabled={loading}>
              {loading ? "Looking for a game..." : "Enter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
