import { useEffect, useState } from "react";
import { Player } from "./PlayGame";
import { useSocket } from "~~/app/socketContext";

export const ModalForVoting = ({
  players,
  setIsEliminatedModalOpen,
  setMessages,
  shuffledColors,
  shuffledNames,
}: {
  players: Player[];
  setIsEliminatedModalOpen: any;
  setMessages: any;
  shuffledColors: string[];
  shuffledNames: string[];
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
        const eliminatedMessage = { message: `Player ${eliminatedPlayer.index + 1} was eliminated` };
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
  }, [socket, playerId, players, setIsEliminatedModalOpen, setIsPlayerEliminated, setMessages]);

  useEffect(() => {
    if (!socket) return;
    if (!playerId) return;

    const handlePlayerVoted = (data: { roomId: string; voterId: string; votedId: string }) => {
      const voterPlayer: any = players.find(player => player.id === data.voterId);
      const votedPlayer: any = players.find(player => player.id === data.votedId);

      const votedMessage = { message: `Player ${voterPlayer.index + 1} voted for Player ${votedPlayer.index + 1}` };
      setMessages((prev: any) => [...prev, votedMessage]);
    };

    socket.on("voteSubmitted", handlePlayerVoted);
    return () => {
      socket.off("voteSubmitted", handlePlayerVoted);
    };
  }, [socket, playerId, players, setIsEliminatedModalOpen, setIsPlayerEliminated, setMessages]);

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
      {!isPlayerEliminated && !castedVote && (
        <VoteModal
          players={playersToVote}
          handleVote={handleVote}
          shuffledColors={shuffledColors}
          shuffledNames={shuffledNames}
        />
      )}
      {!isPlayerEliminated && castedVote && <WaitingOtherToVote />}
    </>
  );
};

const WaitingOtherToVote = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#1CA297] rounded-2xl items-center justify-center p-8 opacity-80">
        <div className="flex items-center justify-center text-center flex-col gap-4">
          <span>
            <strong>Waiting for other players to vote</strong>
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
      <div className="bg-[#1CA297] opacity-80 text-white rounded-2xl items-center justify-center py-8 px-16">
        <div className="flex justify-between items-center my-8">
          <div className="flex-grow text-center">
            <span className="block text-4xl font-bold">Who is SAMI?</span>
          </div>
        </div>
        <div className="flex justify-center items-center gap-12 flex-col sm:flex-row pb-16">
          {players.map(player => (
            <button
              key={player.index}
              className={`btn btn-secondary text-xl glow-purple bg-[#2c2171] hover:bg-[#4a3bb1] border-0 px-4 py-2 rounded-md transition duration-200 ease-in-out ${shuffledColors[player.index]}`}
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
