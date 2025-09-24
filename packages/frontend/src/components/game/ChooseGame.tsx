"use client";

import { useEffect, useState } from "react";
import { RainbowKitCustomConnectButton } from "../common/ConnectButton";
import { ModalWaitingForPlayers } from "./ModalWaitingForPlayers";
import { ModalWaitingForTransaction } from "./ModalWaitingForTransaction";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "~~/providers/SocketContext";
import { BET_AMOUNT, APPROVE_AMOUNT } from "~~/utils/constants";
import { notification } from "~~/utils/scaffold-eth";
import { useEmbedded } from "~~/providers/EmbeddedContext";
import { useUserOnchain } from "~~/providers/UserOnChainContext";

interface Player {
  id: string;
  index: string;
  totalChars: number;
  isAI: boolean;
  isEliminated: boolean;
}

export const ChooseGame = ({ showGame }: { showGame: (p: { timeBeforeEnds: number; serverTime: number }) => void }) => {
  const [loading, setLoading] = useState(false);
  const [loadingBet, setLoadingBet] = useState(false);
  const [isBetGame, setIsBetGame] = useState<boolean>(false);

  const { socket, isConnected, playerId, setPlayerId, setPlayerIndex, setRoomId, roomId, walletRegistered } = useSocket();
  const { isEmbedded } = useEmbedded();

  const {address, balance, allowance, approve, isBootstrapping} = useUserOnchain();

  // --- Socket: handle successful game start
  useEffect(() => {
    if (!socket || !playerId) return;

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
  }, [socket, playerId, setRoomId, setPlayerIndex, showGame]);

  // --- Socket: handle failures (startFailed / betApprovalFailed) scoped to current room & wallet
  useEffect(() => {
    if (!socket) return;

    const onStartFailed = (p: { roomId: string; reason: string }) => {
      if (roomId && p.roomId !== roomId) return;
      setLoading(false);
      setLoadingBet(false);
      notification.error(
        p.reason?.includes("ONLY_OWNER")
          ? "Only the contract owner can start bet games. Please try again later."
          : `Could not start the on-chain game: ${p.reason || "Unknown error"}`
      );
    };

    const onBetApprovalFailed = (p: { roomId: string; failedWallets: string[] }) => {
      if (roomId && p.roomId !== roomId) return;
      if (!address) return;

      const mine = address.toLowerCase();
      const failedSet = new Set(p.failedWallets.map(w => w.toLowerCase()));
      const iAmFailed = failedSet.has(mine);
      if (!iAmFailed) return;

      setLoading(false);
      setLoadingBet(false);
      notification.error("USDC approval/transfer failed for your wallet");
    };

    socket.on("game:startFailed", onStartFailed);
    socket.on("betApprovalFailed", onBetApprovalFailed);
    return () => {
      socket.off("game:startFailed", onStartFailed);
      socket.off("betApprovalFailed", onBetApprovalFailed);
    };
  }, [socket, roomId, address]);

  // --- Enter bet game: ensure balance/allowance, approve if needed, then join
  const handleBetAndPlay = async () => {
    if (!socket) {
      notification.error("You are not connected to the socket");
      return;
    }
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }

    if (isBootstrapping) {
      notification.info("Please wait, syncing wallet state…");
      return;
    }
    if (!balance || balance < BET_AMOUNT) {
      notification.error("USDC Balance not enough");
      return;
    }

    setLoadingBet(true);
    try {
      // Approve if necessary (spender is set in the provider; default is SAMI)
      if (!allowance || allowance < APPROVE_AMOUNT) {
        const tx = await approve(APPROVE_AMOUNT);
        // approve() already waits and refreshes allowance inside the provider
      }

      // After approval, proceed to create/join the game
      const randomPlayerId = uuidv4();
      setPlayerId(randomPlayerId);
      setIsBetGame(true);
      setLoading(true);

      socket.emit("createOrJoinGame", { playerId: randomPlayerId, isBetGame: true }, (response: any) => {
        if (response.success && response.roomId) {
          setRoomId(response.roomId);
          setLoadingBet(false);
        } else {
          setLoading(false);
          setLoadingBet(false);
          console.error("Failed to join game:", response);
          notification.error("Error joining the game. Please try again.");
        }
      });
    } catch (err) {
      console.error("Error approving or entering game:", err);
      setLoadingBet(false);
      setLoading(false);
      notification.error("Approval or entering game failed, please try again.");
    }
  };

  // --- Enter free game (no on-chain ops)
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
      (response: { success: boolean; roomId: string; message?: string }) => {
        if (response.success && response.roomId) {
          setRoomId(response.roomId);
        } else {
          setLoading(false);
          console.error("Failed to join game:", response?.message);
          notification.error("Error joining the game. Please try again.");
        }
      },
    );
  };

  const canPlayBet = Boolean(address || isEmbedded);

  return (
    <>
      {loading && <ModalWaitingForPlayers isBetGame={isBetGame} />}
      {!loading && loadingBet && <ModalWaitingForTransaction />}

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

              <p className="text-xl flex flex-col justify-center items-center">
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
                      onChange={() => setIsBetGame(prev => !prev)}
                    />
                    <span className="ml-2 text-xl label-text text-white">Bet 1 $USDC</span>
                  </label>
                </div>

                <div className="w-full flex flex-col items-center">
                  {isBetGame ? (
                    canPlayBet ? (
                      <button
                        onClick={handleBetAndPlay}
                        className="cool-button !flex !flex-row !justify-center !items-center mb-2"
                        disabled={loading || loadingBet || isBootstrapping}
                      >
                        <div className="text-[#2c2171]">Bet</div>&nbsp;<>1</>&nbsp;$USDC&nbsp;
                      </button>
                    ) : (
                      !isEmbedded && <RainbowKitCustomConnectButton />
                    )
                  ) : (
                    <button
                      className="btn btn-primary rounded-lg text-2xl bg-white text-[#1CA297] hover:text-[#1CA297] hover:bg-white border-0 mt-1"
                      onClick={handleEnterGame}
                      disabled={loading || !isConnected || !walletRegistered || loadingBet}
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
