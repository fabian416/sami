import { useEffect, useState } from "react";
import Image from "next/image";
import { TokenLogo } from "../Header";
import { RainbowKitCustomConnectButton } from "../scaffold-eth";
import { ModalWaitingForPlayers } from "./ModalWaitingForPlayers";
import { ModalWaitingForTransaction } from "./ModalWaitingForTransaction";
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

export const DECIMALS = 1e6;

export const ChooseGame = ({ showGame }: any) => {
  const [loading, setLoading] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingBet, setLoadingBet] = useState(false);
  const { socket, isConnected, playerId, setPlayerId, setPlayerIndex, setRoomId } = useSocket();
  const { address: connectedAddress } = useAccount();
  const { writeContractAsync: MANTLEwriteContractAsync } = useScaffoldWriteContract("MockMANTLE");
  const { writeContractAsync: ticketSystemwriteContractAsync } = useScaffoldWriteContract("TicketSystem");
  const { data: ticketSystemContractData } = useDeployedContractInfo("TicketSystem");

  const { data: samiBalance } = useScaffoldReadContract({
    contractName: "MockMANTLE",
    functionName: "balanceOf",
    args: [ticketSystemContractData?.address],
    watch: true,
  });

  const { data: allowance } = useScaffoldReadContract({
    contractName: "MockMANTLE",
    functionName: "allowance",
    args: [connectedAddress, ticketSystemContractData?.address],
    watch: true,
  });
  const [isBetGame, setIsBetGame] = useState<boolean>(false);

  useEffect(() => {
    allowance && allowance >= BigInt(1 * DECIMALS) && setLoadingApprove(false);
  }, [allowance]);

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

    setLoadingApprove(true);
    try {
      const contractResponse = await MANTLEwriteContractAsync({
        functionName: "approve",
        args: [ticketSystemContractData?.address, BigInt(1 * DECIMALS)],
      });

      if (contractResponse) {
        notification.success("Allowance increased successfully!");
      }
    } catch (error) {
      console.error("Error increasing allowance:", error);
      notification.error("Increasing allowance failed, please try again.");
    }
    setLoadingApprove(false);
  };

  const handleBetAndPlay = async () => {
    if (!connectedAddress || !socket) {
      notification.error("Please connect your wallet");
      return;
    }

    setLoadingBet(true);
    try {
      const contractResponse = await ticketSystemwriteContractAsync({
        functionName: "buyTicket",
        args: undefined,
      });

      if (contractResponse) {
        notification.success("Ticket for a game bought successfully!");

        // 🔹 Generar un ID único para el jugador
        const randomPlayerId = uuidv4();
        setPlayerId(randomPlayerId);
        setIsBetGame(true);

        setLoading(true);

        // 🔥 **Emitir evento al backend para unirse a la partida**
        socket.emit(
          "createOrJoinGame",
          { playerId: randomPlayerId, isBetGame: true }, // ✅ Se marca como partida de apuestas
          (response: { success: boolean; roomId: string }) => {
            setLoading(false);

            if (response.success && response.roomId) {
              setRoomId(response.roomId); // ✅ Almacena `roomId` en el contexto
            } else {
              console.error("Failed to join game:", response);
              alert("Error joining the game. Please try again.");
            }
          },
        );
      }
    } catch (error) {
      console.error("Error buying ticket:", error);
      notification.error("Buying ticket failed, please try again.");
    }
    setLoadingBet(false);
  };

  const handleEnterGame = () => {
    if (!isConnected || !socket) {
      alert("Unable to connect to the game server. Please try again.");
      return;
    }

    const randomPlayerId = uuidv4();
    setPlayerId(randomPlayerId);
    setIsBetGame(false);

    setLoading(true);
    socket.emit(
      "createOrJoinGame",
      { playerId: randomPlayerId, isBet: false },
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
      {loading && <ModalWaitingForPlayers isBetGame={isBetGame} />}
      {!loading && (loadingApprove || loadingBet) && <ModalWaitingForTransaction />}
      <div className="flex flex-col items-center w-full">
        <h1 className="sami-title text-2xl md:text-7xl text-center mb-4 md:mb-12">
          Who is&nbsp;
          <span className="text-[#3DCCE1]">
            SAMI&nbsp;
            <Image
              src="/logo.png"
              alt="SAMI Logo"
              width="90"
              height="90"
              className="inline-block align-middle" // Add this to align the image with the text
            />
            &nbsp;
          </span>
          ?!1
        </h1>

        <div className="flex md:flex-row flex-col justify-center items-center w-full gap-10 md:gap-20">
          <div className="card bg-[#1CA297] opacity-80 text-white glow-cyan w-full md:w-96 shadow-xl mx-4">
            <div className="card-body text-center">
              <h2 className="text-3xl sami-title">Play for free</h2>
              <p className="text-xl">Find SAMI, the impostor AI, among 3 anons</p>
              <div className="card-actions justify-center">
                <button
                  className="btn btn-primary rounded-lg text-2xl w-full bg-white text-[#1CA297] hover:text-[#1CA297] hover:bg-white border-0"
                  onClick={handleEnterGame}
                  disabled={loading || !isConnected}
                >
                  {loading ? "Enter" : "Enter"}
                </button>
              </div>
            </div>
          </div>
          <div className="card bg-[#2c2171] opacity-80 text-white glow-purple w-full md:w-96 shadow-xl mx-4">
            <div className="card-body text-center">
              <h2 className="text-3xl sami-title flex flex-row justify-center items-center">
                <>Betting&nbsp;</>
                <span className="text-[#3DCCE1]">$USDC&nbsp;</span>
              </h2>
              <p className="text-xl flex flex-row justify-center items-center">
                <></>
                <span>
                  Bet&nbsp;
                  <span className="text-[#3DCCE1]">1&nbsp;</span>
                  <TokenLogo />, guess correctly and earn&nbsp;
                  <span className="text-[#3DCCE1]">3&nbsp;</span>
                  <TokenLogo />
                </span>
              </p>
              <div className="card-actions justify-center">
                {connectedAddress ? (
                  allowance && allowance >= BigInt(1 * DECIMALS) ? (
                    <>
                      <button
                        onClick={handleBetAndPlay}
                        className="cool-button !flex !flex-row !justify-center !items-center"
                      >
                        <div className="text-[#2c2171]">Bet</div>&nbsp;<>1</>&nbsp;$USDC&nbsp;
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleApprove}
                      className="cool-button !flex !flex-row !justify-center !items-center"
                    >
                      <div className="">Approve</div>&nbsp;<>1</>&nbsp;$USDC&nbsp;
                    </button>
                  )
                ) : (
                  <RainbowKitCustomConnectButton />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row sami-title text-center mt-12 text-lg bg-[#2672BE] glow-blue text-white p-2 rounded-lg">
          SAMI Reserves:&nbsp;
          {samiBalance ? (
            <>
              <>{(Number(samiBalance) / DECIMALS).toFixed(0)}</>&nbsp;
              <>
                <TokenLogo className="" />
              </>
            </>
          ) : (
            <>&nbsp;...&nbsp;&nbsp;</>
          )}
        </div>
      </div>
    </>
  );
};
