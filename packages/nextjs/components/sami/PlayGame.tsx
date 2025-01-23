import { useEffect, useRef, useState } from "react";
import { ModalEliminated } from "./ModalEliminated";
import { ModalFinished } from "./ModalFinished";
import { ModalForVoting } from "./ModalForVoting";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useSocket } from "~~/app/socketContext";

interface Message {
  playerId?: string;
  playerIndex?: string;
  message: string;
}

export interface Player {
  id: string;
  index: number;
}

export const PlayGame = () => {
  const { socket, isConnected, playerIndex, playerId, roomId, isPlayerEliminated } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPhase, setCurrentPhase] = useState<"conversation" | "voting" | "finished">("conversation");
  const [winner, setWinner] = useState<string | null>(null);
  const [isEliminatedModalOpen, setIsEliminatedModalOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (data: Message) => {
      console.log(data);
      setMessages(prev => [...prev, data]);
    });

    socket.on("startConversationPhase", (data: { message: string }) => {
      setCurrentPhase("conversation");
      console.log(data.message);
    });

    socket.on("startVotePhase", (data: { players: Player[]; message: string }) => {
      setCurrentPhase("voting");
      setPlayers(data.players);
      console.log(data.message);
    });

    socket.on("gameOver", (data: { winner: string; message: string }) => {
      setCurrentPhase("finished");
      setWinner(data.winner);
      console.log(data.message);
    });

    return () => {
      socket.off("newMessage");
      socket.off("startConversationPhase");
      socket.off("startVotePhase");
      socket.off("gameOver");
    };
  }, [socket]);

  const sendMessage = (message: string) => {
    if (!socket || !roomId || !playerId) {
      console.error("Missing socket, roomId, or playerId.");
      return;
    }

    socket.emit("message", { roomId, playerId, playerIndex, message });
  };

  const handleCloseEliminatedModal = () => {
    setIsEliminatedModalOpen(false);
  };

  return (
    <>
      {currentPhase === "voting" && (
        <ModalForVoting
          players={players}
          setIsEliminatedModalOpen={setIsEliminatedModalOpen}
          setMessages={setMessages}
        />
      )}
      {currentPhase === "finished" && <ModalFinished winner={winner} />}
      {isEliminatedModalOpen && isPlayerEliminated && <ModalEliminated closeModal={handleCloseEliminatedModal} />}
      <div className="grid grid-cols-2 w-full h-[calc(100vh-8rem)] rounded-2xl backdrop-brightness-95">
        <div className="flex items-center justify-center overflow-hidden rounded-2xl">
          <img src="sami-team.webp" className="object-cover" alt="Game Banner" />
        </div>
        <div
          className={
            isPlayerEliminated
              ? "flex flex-col items-center justify-between p-4 bg-gray-300 rounded-2xl shadow-lg"
              : "flex flex-col items-center justify-between p-4 bg-white rounded-2xl shadow-lg"
          }
        >
          <div className="flex-1 w-full overflow-y-auto p-2">
            {isPlayerEliminated ? (
              <div className="text-gray-500">Eliminated!</div>
            ) : (
              <div className="text-gray-500">Welcome! Feel free to chat! Ask questions!</div>
            )}

            <div className="mt-4 text-black">
              {messages.map((msg, index) => (
                <div key={index} className="text-left">
                  <span>
                    {msg.playerId ? (
                      <>
                        <strong>Player {msg.playerIndex}:</strong> {msg.message}
                      </>
                    ) : (
                      <>
                        <strong> {msg.message}</strong>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full mt-4">
            <input
              ref={inputRef}
              type="text"
              disabled={isPlayerEliminated}
              className={
                isPlayerEliminated
                  ? "flex-1 p-2 border bg-gray-500 border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  : "flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              }
              placeholder={isPlayerEliminated ? "" : "Type your message..."}
              onKeyDown={e => {
                if (e.key === "Enter" && inputRef.current?.value.trim()) {
                  sendMessage(inputRef.current.value.trim());
                  inputRef.current.value = "";
                }
              }}
            />
            <button
              disabled={isPlayerEliminated}
              className={
                isPlayerEliminated
                  ? "p-2 bg-gray-600 text-white rounded-r-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  : "p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              }
              onClick={() => {
                if (inputRef.current?.value.trim()) {
                  sendMessage(inputRef.current.value.trim());
                  inputRef.current.value = "";
                }
              }}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
