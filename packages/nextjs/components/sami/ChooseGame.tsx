import { useEffect, useState } from "react";
import { RainbowKitCustomConnectButton } from "../scaffold-eth";
import { ModalWaitingForPlayers } from "./ModalWaitingForPlayers";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "wagmi";
import { useSocket } from "~~/app/socketContext";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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

  const { writeContractAsync: MODEwriteContractAsync } = useScaffoldWriteContract("MockMODE");
  const { writeContractAsync: simpleSamiwriteContractAsync } = useScaffoldWriteContract("SimpleSAMI");
  const { data: simpleSamiContractData } = useDeployedContractInfo("SimpleSAMI");

  const { data: allowance } = useScaffoldReadContract({
    contractName: "MockMODE",
    functionName: "allowance",
    args: [connectedAddress, simpleSamiContractData?.address],
    watch: true,
  });

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

  const handleAllowanceChange = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const contractResponse = await MODEwriteContractAsync({
        functionName: "approve",
        args: [simpleSamiContractData?.address, BigInt(2 * 1e18)],
      });

      if (contractResponse) {
        notification.success("Allowance increased successfully!");
      }
    } catch (error) {
      console.error("Error increasing allowance:", error);
      notification.error("Increasing allowance failed, please try again.");
    }
  };

  const handleBetAndPlay = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const contractResponse = await simpleSamiwriteContractAsync({
        functionName: "buyTicket",
        args: undefined,
      });

      if (contractResponse) {
        notification.success("Ticket for a game bought successfully!");
      }
    } catch (error) {
      console.error("Error increasing buying ticket:", error);
      notification.error("Buying ticket failed, please try again.");
    }
  };

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
            <h2 className="text-3xl sami-title">Play for free!</h2>
            <p className="text-xl">Find SAMI among the players!</p>
            <div className="card-actions justify-end">
              <button
                className="btn btn-primary text-lg bg-white text-[#1CA297] hover:text-[#1CA297] hover:bg-white  border-0"
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
            <h2 className="text-3xl sami-title">
              Bet <span className="text-[#1CA297]">100 $MODE</span>!
            </h2>
            <p className="text-xl">Double or nothing! Do you dare?</p>
            <div className="card-actions justify-end">
              {connectedAddress ? (
                allowance && allowance >= BigInt(2 * 1e18) ? (
                  <button
                    onClick={handleBetAndPlay}
                    className="btn btn-primary text-lg glow-cyan bg-[#1CA297] hover:bg-[#1B9086] dark:bg-[#249C8E] dark:hover:bg-[#1B9086] text-white border-0"
                  >
                    Bet 100 $MODE
                  </button>
                ) : (
                  <button
                    onClick={handleAllowanceChange}
                    className="btn btn-primary text-lg glow-cyan bg-[#1CA297] hover:bg-[#1B9086] dark:bg-[#249C8E] dark:hover:bg-[#1B9086] text-white border-0"
                  >
                    Approve 100 $MODE
                  </button>
                )
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
