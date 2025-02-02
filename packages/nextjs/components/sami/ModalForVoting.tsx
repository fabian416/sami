import { useState } from "react";
import { Player } from "./PlayGame";
import { useSocket } from "~~/app/socketContext";

export const ModalForVoting = ({
  players,
  shuffledColors,
  shuffledNames,
}: {
  players: Player[];
  setMessages: any;
  shuffledColors: string[];
  shuffledNames: string[];
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
          shuffledColors={shuffledColors}
          shuffledNames={shuffledNames}
        />
      )}
      {castedVote && <WaitingOtherToVote />}
    </>
  );
};

const WaitingOtherToVote = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#1CA297] rounded-2xl items-center justify-center p-8">
        <div className="flex items-center justify-center text-center flex-col gap-4">
          <span>
            <strong>Waiting for other players to vote</strong>
          </span>
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-[#2c2171] border-solid"></div>
        </div>
      </div>
    </div>
  );
};

const VoteModal = ({
  players,
  handleVote,
  shuffledColors,
  shuffledNames,
}: {
  players: Player[];
  handleVote: any;
  shuffledColors: string[];
  shuffledNames: string[];
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#1CA297] glow-cyan  text-white rounded-2xl items-center justify-center py-8 px-16">
        <div className="flex justify-between items-center my-8">
          <div className="flex-grow text-center">
            <span className="block text-2xl font-bold">Who is SAMI?</span>
          </div>
        </div>
        <div className="flex justify-center items-center gap-12 flex-col sm:flex-row pb-16">
          {players.map(player => (
            <button
              key={player.index}
              className={`btn btn-secondary bg-[#2c2171] hover:bg-[#4a3bb1] border-0 px-4 py-2 rounded-md transition duration-200 ease-in-out ${shuffledColors[player.index]}`}
              onClick={() => handleVote(player.index, player.id)}
            >
              {shuffledNames[player.index]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
