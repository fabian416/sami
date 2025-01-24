import { useEffect, useState } from "react";
import { Player } from "./PlayGame";
import { BugAntIcon, ClockIcon, CurrencyDollarIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useSocket } from "~~/app/socketContext";

export const ModalForVoting = ({
  players,
  setIsEliminatedModalOpen,
  setMessages,
}: {
  players: Player[];
  setIsEliminatedModalOpen: any;
  setMessages: any;
}) => {
  const [castedVote, setCastedVote] = useState(false);
  const { socket, isConnected, playerId, roomId, isPlayerEliminated, setIsPlayerEliminated } = useSocket();
  const playersToVote = players.filter(player => player.id !== playerId);

  useEffect(() => {
    if (!socket) return;
    if (!playerId) return;

    const handlePlayerElimited = (data: { roomId: string; playerId: string }) => {
      const eliminatedPlayer = players.find(player => player.id === data.playerId);
      if (eliminatedPlayer) {
        const eliminatedMessage = { message: `Player ${eliminatedPlayer.index} was eliminated` };
        setMessages((prev: any) => [...prev, eliminatedMessage]);
      }

      if (data.playerId === playerId) {
        setIsPlayerEliminated(true);
        setIsEliminatedModalOpen(true);
      }
    };

    socket.on("playerEliminated", handlePlayerElimited);
    return () => {
      socket.off("playerEliminated", handlePlayerElimited);
    };
  }, [socket, playerId]);

  const handleVote = (votedPlayerIndex: number, votedPlayerId: string) => {
    if (!isConnected || !socket) {
      alert("Unable to connect to the game server. Please try again.");
      return;
    }

    console.log("Votando...");
    socket.emit("castVote", { roomId, voterId: playerId, voteIndex: votedPlayerIndex, votedId: votedPlayerId });
    setCastedVote(true);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      {!isPlayerEliminated && !castedVote && <VoteModal players={playersToVote} handleVote={handleVote} />}
      {!isPlayerEliminated && castedVote && <WaitingOtherToVote />}
    </div>
  );
};

const WaitingOtherToVote = () => {
  return (
    <div className="bg-base-100 rounded-2xl items-center justify-center p-8">
      <div className="flex items-center justify-center text-center flex-col gap-4">
        <span>Waiting for other players to vote</span>
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 border-solid"></div>
      </div>
    </div>
  );
};

const VoteModal = ({ players, handleVote }: { players: Player[]; handleVote: any }) => {
  return (
    <div className="bg-base-100 rounded-2xl items-center justify-center py-8 px-16">
      <div className="flex justify-between items-center my-8">
        <div className="flex-grow text-center">
          <span className="block text-2xl font-bold">Who is the IA?</span>
        </div>
      </div>
      <div className="flex justify-center items-center gap-12 flex-col sm:flex-row pb-16">
        {players.map(player => (
          <button
            key={player.index}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 ease-in-out"
            onClick={() => handleVote(player.index, player.id)}
          >
            Player {player.index}
          </button>
        ))}
      </div>
    </div>
  );
};
