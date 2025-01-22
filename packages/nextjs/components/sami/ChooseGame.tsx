import { useState } from "react";
import { useSocket } from "~~/app/socketContext";

// Use the custom hook

export const ChooseGame = ({ showGame }: any) => {
  const [loading, setLoading] = useState(false); // Spinner show
  const { socket, isConnected } = useSocket(); // Get socket and connection state from context

  const handleEnterGame = () => {
    if (!isConnected || !socket) {
      alert("Unable to connect to the game server. Please try again.");
      return;
    }

    setLoading(true); // Show spinner while trying to connect to the server
    socket.emit(
      "createOrJoinGame",
      { playerId: `Player${Math.floor(Math.random() * 1000)}` }, // Generate random player
      (response: any) => {
        setLoading(false); // Hide spinner
        if (response.success) {
          console.log("Joined game:", response.roomId);
          showGame(); // Change view to the game screen
        } else {
          console.error("Failed to join game:", response.message);
          alert("Error joining the game. Please try again.");
        }
      },
    );
  };

  return (
    <>
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
    </>
  );
};
