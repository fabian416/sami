"use client";

import { useEffect, useState } from "react";
import { useContracts } from "../../providers/ContractsContext";
import { useEmbedded } from "../../providers/EmbeddedContext";
import { RainbowKitCustomConnectButton } from "../common/ConnectButton";
import { ModalWaitingForPlayers } from "./ModalWaitingForPlayers";
import { ModalWaitingForTransaction } from "./ModalWaitingForTransaction";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "wagmi";
import { useSocket } from "~~/providers/SocketContext";
import { DECIMALS } from "~~/utils/constants";
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
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingBet, setLoadingBet] = useState(false);
  const [localAllowance, setLocalAllowance] = useState<bigint | null>(null);
  const [isBetGame, setIsBetGame] = useState<boolean>(false);
  const { socket, isConnected, playerId, setPlayerId, setPlayerIndex, setRoomId } = useSocket();
  const { address: connectedAddress } = useAccount();
  const { contracts } = useContracts();
  const { isEmbedded } = useEmbedded();

  useEffect(() => {
    const fetchAllowance = async () => {
      const { usdc, samiAddress, connectedAddress: address } = await contracts();
      const result = await usdc.allowance(address, samiAddress);
      setLocalAllowance(result);
    };

    if (connectedAddress) {
      fetchAllowance();
    }
  }, [contracts, connectedAddress]);

  useEffect(() => {
    if (!socket) return;
    if (!playerId) return;

    const handleGameStarted = (data: {
      roomId: string;
      players: Player[];
      timeBeforeEnds: number;
      serverTime: number;
    }) => {
      setRoomId(data.roomId);
      showGame({ timeBeforeEnds: data.timeBeforeEnds, serverTime: data.serverTime });
    };

    socket.on("gameStarted", handleGameStarted);

    return () => {
      socket.off("gameStarted", handleGameStarted);
    };
  }, [socket, showGame, setRoomId, playerId, setPlayerIndex]);

  const handleApprove = async () => {
    setLoadingApprove(true);
    try {
      const { usdc, samiAddress } = await contracts();
      const tx = await usdc.approve(samiAddress, BigInt(1 * DECIMALS));
      await tx.wait();
      setLocalAllowance(BigInt(1 * DECIMALS));
    } catch (err) {
      console.error("Error approving USDC:", err);
      throw new Error("Approval failed.");
    }
    setLoadingApprove(false);
  };

  const handleBetAndPlay = async () => {
    if (!socket) {
      notification.error("You are not connected to the socket");
      return;
    }

    setLoadingBet(true);
    try {
      const { sami, connectedAddress } = await contracts();
      if (!connectedAddress) {
        notification.error("Please connect your wallet");
        return;
      }

      const tx = await sami.enterGame();
      await tx.wait();

      const randomPlayerId = uuidv4();
      setPlayerId(randomPlayerId);
      setIsBetGame(true);
      setLoading(true);

      socket!.emit("createOrJoinGame", { playerId: randomPlayerId, isBetGame: true }, (response: any) => {
        setLoading(false);
        if (response.success && response.roomId) {
          setRoomId(response.roomId);
        } else {
          console.error("Failed to join game:", response);
          notification.error("Error joining the game. Please try again.");
        }
      });
    } catch (error) {
      console.error("Error entering game:", error);
      notification.error("Entering game failed, please try again.");
    }
    setLoadingBet(false);
  };

  const handleEnterGame = () => {
    if (!socket) {
      notification.error("Unable to connect to the game server. Please try again.");
      return;
    }

    const randomPlayerId = uuidv4();
    setPlayerId(randomPlayerId);
    setIsBetGame(false);

    setLoading(true);
    socket.emit(
      "createOrJoinGame",
      { playerId: randomPlayerId, isBetGame: false },
      (response: { message(arg0: string, message: any): unknown; success: boolean; roomId: string }) => {
        if (response.success && response.roomId) {
          setRoomId(response.roomId);
        } else {
        setLoading(false);
          console.error("Failed to join game:", response.message);
          notification.error("Error joining the game. Please try again.");
        }
      },
    );
  };

  return (
    <>
      {loading && <ModalWaitingForPlayers isBetGame={isBetGame} />}
      {!loading && (loadingApprove || loadingBet) && <ModalWaitingForTransaction />}
      <div className="flex flex-col items-center justify-center w-full">
        <div className="flex md:flex-row flex-col justify-center items-center w-full md:w-1/2 gap-10 md:gap-20">
          <div className="card gradient-bg opacity-80 text-white glow-cyan w-full shadow-xl mx-4 ">
            <div className="card-body text-center">
              <p className="text-xl flex flex-col justify-center items-center">
                Jump into a chat with 3 mystery people.
                <br />
                One is SAMI, an AI pretending to be human.
                <br />
                You have just 1 minute to spot the fake.
                <br />
                <span>
                  Vote at the end—<strong>who is SAMI?</strong>
                </span>
              </p>
              <p className="text-xl  flex flex-col justify-center items-center">
                <span>
                  <strong>Betting mode: </strong>Win and split the pot. <br />
                  If everyone loses, SAMI wins!
                </span>
              </p>
              <div className="card-actions justify-center items-center">
                <div className="form-control">
                  <label className="cursor-pointer label">
                    <span className="mr-2 text-xl label-text text-white">Free</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={isBetGame}
                      onChange={() => setIsBetGame(!isBetGame)}
                    />
                    <span className="ml-2 text-xl label-text text-white">Bet 1 $USDC</span>
                  </label>
                </div>
                <div className="w-full flex flex-col items-center">
                  {isBetGame ? (
                    connectedAddress || isEmbedded ? (
                      localAllowance && localAllowance >= BigInt(1 * DECIMALS) ? (
                        <button
                          onClick={handleBetAndPlay}
                          className="cool-button !flex !flex-row !justify-center !items-center mb-2"
                        >
                          <div className="text-[#2c2171]">Bet</div>&nbsp;<>1</>&nbsp;$USDC&nbsp;
                        </button>
                      ) : (
                        <button
                          onClick={handleApprove}
                          className="cool-button !flex !flex-row !justify-center !items-center mb-2"
                        >
                          <div className="">Approve</div>&nbsp;<>1</>&nbsp;$USDC&nbsp;
                        </button>
                      )
                    ) : (
                      !isEmbedded && <RainbowKitCustomConnectButton />
                    )
                  ) : (
                    <button
                      className="btn btn-primary rounded-lg text-2xl bg-white text-[#1CA297] hover:text-[#1CA297] hover:bg-white border-0 mt-1"
                      onClick={handleEnterGame}
                      disabled={loading || !isConnected}
                    >
                      {loading ? "Enter" : "Enter"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
