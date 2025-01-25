import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import CountdownClock from "../CountdownClock";
import { ModalEliminated } from "./ModalEliminated";
import { ModalFinished } from "./ModalFinished";
import { ModalForVoting } from "./ModalForVoting";
import { useTheme } from "next-themes";
import { isMobile } from "react-device-detect";
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

export interface Clock {
  timeBeforeEnds: number;
  serverTime: number;
}

export const COLORS = [
  "text-red-600",
  "text-green-600",
  "text-blue-600",
  "text-pink-600",
  "text-yellow-600",
  "text-cyan-600",
];

export const PlayGame = ({ timeForFirstRound }: { timeForFirstRound: any }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPhase, setCurrentPhase] = useState<"conversation" | "voting" | "finished">("conversation");
  const [clockTimer, setClockTimer] = useState<Clock | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [isEliminatedModalOpen, setIsEliminatedModalOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { socket, playerIndex, playerId, setPlayerIndex, roomId, isPlayerEliminated } = useSocket();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  useEffect(() => {
    if (timeForFirstRound) {
      setClockTimer(timeForFirstRound);
    }
  }, []);

  useEffect(() => {
    console.log("1");
    if (!socket) return;
    console.log("2");
    if (!playerIndex && playerId && roomId) {
      console.log("3");
      socket.emit("getPlayerIndex", { roomId, playerId });
    }
    socket.on("playerIndex", (data: { playerId: string; playerIndex: number }) => {
      console.log("el socket paso por aca");
      console.log(data);
      playerId === data.playerId && setPlayerIndex(data.playerIndex);
    });
  }, [playerIndex, socket]);

  useEffect(() => {
    // Cuando los mensajes cambian, desplazamos al fondo
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (data: Message) => {
      console.log(data);
      setMessages(prev => [...prev, data]);
    });

    socket.on("startConversationPhase", (data: { message: string; timeBeforeEnds: number; serverTime: number }) => {
      setCurrentPhase("conversation");
      setClockTimer({ timeBeforeEnds: data.timeBeforeEnds, serverTime: data.serverTime });
      console.log(data.message);
    });

    socket.on(
      "startVotePhase",
      (data: { players: Player[]; message: string; timeBeforeEnds: number; serverTime: number }) => {
        setCurrentPhase("voting");
        setPlayers(data.players);
        setClockTimer({ timeBeforeEnds: data.timeBeforeEnds, serverTime: data.serverTime });
        console.log(data.message);
      },
    );

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
      <CountdownClock setClockTimer={setClockTimer} clockTimer={clockTimer} />

      <div className="flex-grow grid grid-cols-2 gap-3 rounded-2xl backdrop-brightness-95 flex-col md:h-[calc(100vh-8rem)]">
        {!isMobile && (
          <div className="flex items-center justify-center overflow-hidden rounded-2xl">
            <Image src="/sami-team.webp" className="object-cover" alt="Game Banner" width={500} height={500} />
          </div>
        )}
        <div
          className={`col-span-2 md:col-span-1 flex flex-col items-center justify-between p-4 rounded-2xl shadow-lg overflow-y-scroll
          ${!isPlayerEliminated && isDarkMode ? "bg-base-300" : !isPlayerEliminated ? "bg-white" : ""}`}
        >
          <div className="flex-1 w-full p-2 overflow-y-scroll">
            {isPlayerEliminated ? (
              <div className="text-gray-500">Eliminated</div>
            ) : (
              <div className="text-gray-500">Welcome! Ask questions to figure out who SAMI is.</div>
            )}
            <div className={`mt-4 ${isDarkMode ? "text-white" : "text-black"}`}>
              {messages.map((msg, index) => {
                const color = COLORS[Number(msg.playerIndex)];
                return (
                  <div key={index} className={`text-left mb-1 ${color}`}>
                    <span>
                      {msg.playerId ? (
                        <>
                          <strong>Player {msg.playerIndex}:</strong> {msg.message}
                        </>
                      ) : (
                        <strong>{msg.message}</strong>
                      )}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>
          <div className="flex w-full mt-4">
            <input
              ref={inputRef}
              type="text"
              disabled={isPlayerEliminated}
              className={`flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isPlayerEliminated ? "bg-gray-500 border-gray-300" : "border-gray-300"}`}
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
              className={`p-2 text-white focus:outline-none focus:ring-2 rounded-r-lg ${isPlayerEliminated ? "bg-gray-600 hover:bg-gray-800  focus:ring-gray-500" : "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"}`}
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
