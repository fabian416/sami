import { useEffect, useState } from "react";
import { RainbowKitCustomConnectButton } from "../scaffold-eth";
import { ModalWaitingForPlayers } from "./ModalWaitingForPlayers";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "wagmi";
import { useSocket } from "~~/app/socketContext";

interface Player {
  id: string;
  index: string;
  totalChars: number;
  isAI: boolean;
  isEliminated: boolean;
}

export const ChooseGame = ({ showGame }: any) => {
  const [loading, setLoading] = useState(false);
  const { socket, isConnected, playerId, setPlayerId, setPlayerIndex, setRoomId } = useSocket();

  const { address: connectedAddress } = useAccount();

  useEffect(() => {
    if (!socket) return;
    if (!playerId) return;

    const handleGameStarted = (data: {
      roomId: string;
      players: Player[];
      timeBeforeEnds: number;
      serverTime: number;
    }) => {
      setRoomId(data.roomId); // Almacena el roomId en el contexto
      showGame({ timeBeforeEnds: data.timeBeforeEnds, serverTime: data.serverTime });
    };

    socket.on("gameStarted", handleGameStarted);

    return () => {
      socket.off("gameStarted", handleGameStarted);
    };
  }, [socket, showGame, setRoomId, playerId, setPlayerIndex]);

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
          setRoomId(response.roomId); // Almacena el roomId en el contexto tras unirse
        } else {
          console.error("Failed to join game:", response.message);
          alert("Error joining the game. Please try again.");
        }
      },
    );
  };

  return (
    <>
      {loading && <ModalWaitingForPlayers />}
      <div className="flex md:flex-row flex-col justify-evenly items-center w-full gap-10 md:gap-8">
        <div className="card bg-[#1CA297] text-white glow-cyan max-w-sm md:w-96 shadow-xl mx-4">
          <div className="card-body">
            <h2 className="text-3xl sami-title">Free!</h2>
            <p className="text-xl">Play a game of SAMI for free!</p>
            <div className="card-actions justify-end">
              <button
                className="btn btn-primary text-4xl bg-white text-[#1CA297] hover:text-[#1CA297] hover:bg-white  border-0"
                onClick={handleEnterGame}
                disabled={loading}
              >
                {loading ? "Looking for a game..." : "Enter"}
              </button>
            </div>
          </div>
        </div>
        <div className="card bg-[#2c2171] text-white glow-purple max-w-sm md:w-96 shadow-xl mx-4">
          <div className="card-body">
            <h2 className="text-3xl sami-title">Bet some coins!</h2>
            <p className="text-xl">Bet and try to win a game of SAMI!</p>
            <div className="card-actions justify-end">
              {connectedAddress ? (
                <button className="btn btn-primary bg-[#1CA297] hover:bg-[#1B9086] dark:bg-[#249C8E] dark:hover:bg-[#1B9086] text-white border-0">
                  Approve 2 USDC
                </button>
              ) : (
                <RainbowKitCustomConnectButton />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
