import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

  const handleApprove = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const contractResponse = await MODEwriteContractAsync({
        functionName: "approve",
        args: [simpleSamiContractData?.address, BigInt(100 * 1e18)],
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
      <div className="flex flex-col items-center w-full">
        <div className="mb-8">
          <h1 className="sami-title text-7xl mb-8 text-center">
            Who is <span className="text-[#1CA297]">SAMI</span>?!1
          </h1>
        </div>
        <div className="flex md:flex-row flex-col justify-center items-center w-full gap-10 md:gap-8">
          <div className="card bg-[#1CA297] opacity-80 text-white glow-cyan max-w-sm md:w-96 shadow-xl mx-4">
            <div className="card-body text-center">
              <h2 className="text-3xl sami-title">Play for free</h2>
              <p className="text-xl">Find SAMI among 5 anons</p>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary text-2xl px-32 bg-white text-[#1CA297] hover:text-[#1CA297] hover:bg-white border-0"
                  onClick={handleEnterGame}
                  disabled={loading}
                >
                  {loading ? "Enter" : "Enter"}
                </button>
              </div>
            </div>
          </div>
          <div className="card bg-[#2c2171] opacity-80 text-white glow-purple max-w-sm md:w-96 shadow-xl mx-4">
            <div className="card-body text-center">
              <h2 className="text-3xl sami-title">
                Bet{" "}
                <span className="text-[#1CA297]">
                  100{" "}
                  <Image
                    src="/mode.png"
                    alt="MODE Network Logo"
                    width="40"
                    height="40"
                    className="inline-block align-middle" // Add this to align the image with the text
                  />{" "}
                </span>
              </h2>
              <p className="text-xl">
                Guess and{" "}
                <span className="text-[#1CA297]">
                  win 500{" "}
                  <Image
                    src="/mode.png"
                    alt="MODE Network Logo"
                    width="25"
                    height="25"
                    className="inline-block align-middle" // Add this to align the image with the text
                  />{" "}
                </span>
              </p>
              <div className="card-actions justify-center">
                {connectedAddress ? (
                  allowance && allowance >= BigInt(2 * 1e18) ? (
                    <button
                      onClick={handleBetAndPlay}
                      className="btn btn-primary text-2xl px-32 glow-cyan bg-[#1CA297] hover:bg-[#1B9086] dark:bg-[#249C8E] dark:hover:bg-[#1B9086] text-white border-0"
                    >
                      {loading ? "Looking for a game..." : "Enter"}
                    </button>
                  ) : (
                    <button
                      onClick={handleApprove}
                      className="btn btn-primary text-2xl px-16 glow-cyan bg-[#1CA297] hover:bg-[#1B9086] dark:bg-[#249C8E] dark:hover:bg-[#1B9086] text-white border-0"
                    >
                      Approve 100{" "}
                      <Image
                        src="/mode.png"
                        alt="MODE Network Logo"
                        width="25"
                        height="25"
                        className="inline-block align-middle" // Add this to align the image with the text
                      />{" "}
                    </button>
                  )
                ) : (
                  <RainbowKitCustomConnectButton />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="sami-title text-4xl mt-8 text-center">
            Powered by{" "}
            <Link href="https://mode.network/" passHref target="_blank">
              <Image
                src="/mode.png"
                alt="MODE Network Logo"
                width="50"
                height="50"
                className="inline-block align-middle" // Add this to align the image with the text
              />{" "}
              <span className="underline">MODE Network</span>
            </Link>
          </h2>
        </div>
      </div>
    </>
  );
};
