"use client";

import { useState } from "react";
import CountdownClock from "../common/CountdownClock";
import { Player } from "./PlayGame";
import { useSocket } from "~~/providers/SocketContext";
import { AVATARS, COLORS, NAMES } from "~~/utils/constants";

export const ModalForVoting = ({
  players,
  timeLeft,
  maxTime,
  endTime,
}: {
  players: Player[];
  setMessages: any;
  timeLeft: any;
  maxTime: any;
  endTime: any;
}) => {
  const [castedVote, setCastedVote] = useState(false);
  const { socket, isConnected, playerId, roomId } = useSocket();
  const playersToVote = players.filter(player => player.id !== playerId);

  const handleVote = (votedPlayerIndex: number, votedPlayerId: string) => {
    if (!isConnected || !socket) {
      alert("Unable to connect to the game server. Please try again.");
      return;
    }

    socket.emit("castVote", { roomId, voterId: playerId, voteIndex: votedPlayerIndex, votedId: votedPlayerId });
    setCastedVote(true);
  };

  return (
    <>
      {!castedVote && (
        <VoteModal
          players={playersToVote}
          handleVote={handleVote}
          timeLeft={timeLeft}
          maxTime={maxTime}
          endTime={endTime}
        />
      )}
      {castedVote && <WaitingOtherToVote />}
    </>
  );
};

const WaitingOtherToVote = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#1CA297] text-white rounded-2xl items-center justify-center p-8">
        <div className="flex items-center justify-center text-center flex-col gap-4">
          <span>
            <strong className="text-xl">Waiting for other players to vote</strong>
          </span>
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-[#2c2171] border-solid"></div>
        </div>
      </div>
    </div>
  );
};

const VoteModal = ({
  players,
  handleVote,
  timeLeft,
  maxTime,
  endTime,
}: {
  players: Player[];
  handleVote: any;
  timeLeft: any;
  maxTime: any;
  endTime: any;
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#2c2171] glow-purple text-white rounded-2xl items-center justify-center py-8 px-16">
        <div className="flex justify-between items-center my-8">
          <div className="flex-grow text-center">
            <span className="block text-4xl font-bold">Who is SAMI?</span>
          </div>
        </div>
        <div className="flex justify-center items-center gap-12 flex-col sm:flex-row pb-16">
          {players.map(player => (
            <div className="flex flex-col items-center justify-center gap-2" key={player.index}>
              <div className="avatar">
                <div className="w-10 rounded-full">
                  <img alt="SAMI player avatar" src={AVATARS[Number(player.index)]} width={50} height={50} />
                </div>
              </div>
              <button
                key={player.index}
                className={`cool-button after:bg-gray-200 !bg-[#1CA297] ${COLORS[player.index]}`}
                onClick={() => handleVote(player.index, player.id)}
              >
                {NAMES[player.index]}
              </button>
            </div>
          ))}
        </div>
        <CountdownClock maybeTimeLeft={timeLeft} maybeMaxTime={maxTime} maybeEndTime={endTime} />
      </div>
    </div>
  );
};
