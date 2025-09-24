"use client";

import { useEffect, useRef, useState } from "react";
import CountdownClock, { startCountdown } from "../common/CountdownClock";
import { ModalFinished } from "./ModalFinished";
import { ModalForVoting } from "./ModalForVoting";
import _ from "lodash";
import { useTheme } from "next-themes";
import { isMobile } from "react-device-detect";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useSocket } from "~~/providers/SocketContext";
import { AVATARS, COLORS, NAMES } from "~~/utils/constants";

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

export const PlayGame = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPhase, setCurrentPhase] = useState<"conversation" | "voting" | "finished">("conversation");
  const [winner, setWinner] = useState<string | null>(null);
  const [amountOfWinners, setAmountOfWinners] = useState<number | null>(null);
  const [isBetGame, setIsBetGame] = useState<boolean | null>(false);
  const [chatDisabled, setChatDisabled] = useState<boolean>(false);
  const [focusInput, setFocusInput] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { socket, playerIndex, playerId, setPlayerIndex, roomId } = useSocket();
  const { resolvedTheme } = useTheme();

  const isDarkMode = resolvedTheme === "dark";

  useEffect(() => {
    if (!socket) return;

    const handleStartCountdown = (data: { timeBeforeEnds: number; serverTime: number }) => {
      startCountdown({ data, setMaxTime, setTimeLeft, setEndTime });
    };
    socket.on("startConversationPhase", handleStartCountdown);
    socket.on("startVotePhase", handleStartCountdown);

    return () => {
      socket.off("startConversationPhase", handleStartCountdown);
      socket.off("startVotePhase", handleStartCountdown);
    };
  }, [socket]);

  useEffect(() => {
    if (focusInput) {
      inputRef.current?.focus();
      setFocusInput(false);
    }
  }, [focusInput]);

  useEffect(() => {
    if (!socket) return;
    if (!playerIndex && playerId && roomId) {
      socket.emit("player:getIndex", { roomId, playerId });
    }
    socket.on("playerIndex", (data: { playerId: string; playerIndex: number }) => {
      playerId === data.playerId && setPlayerIndex(data.playerIndex);
    });
  }, [playerIndex, socket, playerId, roomId, setPlayerIndex]);

  useEffect(() => {
    // Cuando los mensajes cambian, desplazamos al fondo
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (data: Message) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on("startConversationPhase", () => {
      setCurrentPhase("conversation");
      audioRef.current?.play(); // Play the sound when the conversation phase starts
    });

    socket.on(
      "startVotePhase",
      (data: { players: Player[]; message: string; timeBeforeEnds: number; serverTime: number }) => {
        setCurrentPhase("voting");
        setPlayers(data.players);
      },
    );

    socket.on(
      "gameOver",
      (data: { message: string; isBetGame: boolean; results: { playerId: string; won: boolean }[] }) => {
        const { results, isBetGame } = data;
        setIsBetGame(isBetGame);

        // Obtener el resultado del jugador actual
        const playerResult = results.find(r => r.playerId === playerId);
        if (playerResult) {
          const amountOfWinners = _.filter(results, { won: true }).length;
          setAmountOfWinners(amountOfWinners);
          setWinner(playerResult.won ? "You win" : "sami");
        }

        setCurrentPhase("finished");
      },
    );

    return () => {
      socket.off("newMessage");
      socket.off("startConversationPhase");
      socket.off("startVotePhase");
      socket.off("gameOver");
    };
  }, [socket, playerId]);

  const sendMessage = (message: string) => {
    if (!socket || !roomId || !playerId) {
      return console.error("Missing socket, roomId, or playerId.");
    }

    setChatDisabled(true);
    socket.emit("message", { roomId, playerId, playerIndex, message });
    setTimeout(() => {
      setChatDisabled(false);
      setFocusInput(true);
    }, 600);
  };

  return (
    <>
      {/* Voting modal */}
      {currentPhase === "voting" && (
        <ModalForVoting
          players={players}
          setMessages={undefined}
          timeLeft={timeLeft}
          maxTime={maxTime}
          endTime={endTime}
        />
      )}

      {/* Modal Finished  */}
      {currentPhase === "finished" && (
        <ModalFinished winner={winner} isBetGame={isBetGame} amountOfWinners={amountOfWinners} />
      )}

      <div className="flex-grow grid grid-cols-2 gap-9 m-4 rounded-2xl backdrop-brightness-95 flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-9rem)]">
        <div
          className={`col-span-2 md:col-span-1 flex flex-col items-center justify-between p-4 rounded-2xl shadow-lg overflow-y-scroll max-w-screen-sm
          ${isDarkMode ? "bg-[#2c2171] opacity-80 glow-purple" : "bg-white glow-purple"}`}
        >
          <span className="w-full text-center">Chat and find out who is SAMI, the impostor AI</span>
          {/* Chat messages */}
          <div className="flex-1 w-full overflow-y-scroll">
            <div className={`mt-2 ${isDarkMode ? "text-white" : "text-black"}`}>
              {messages.map((msg, index) => {
                const color = COLORS[Number(msg.playerIndex)];
                const name = NAMES[Number(msg.playerIndex)];
                return (
                  <div key={index} className={`text-left ${color}`}>
                    <div
                      className={`flex flex-row items-end ${playerIndex === Number(msg.playerIndex) ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`chat ${playerIndex === Number(msg.playerIndex) ? "chat-end" : "chat-start"}`}>
                        <div className="chat-image avatar flex flex-col">
                          <strong className={`text-xs ${color}`}>{name}</strong>{" "}
                          <div className="w-8 rounded-full">
                            <img alt="Player avatar" src={AVATARS[Number(msg.playerIndex)]} width={50} height={50} />
                          </div>
                        </div>
                        <div className="chat-bubble max-w-fit w-auto bg-gray-700 dark:bg-gray-200 border-0">
                          {msg.playerId ? (
                            <>
                              <span className={`${color} px-1`}>{msg.message}</span>
                            </>
                          ) : (
                            <strong>{msg.message}</strong>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input messages */}
          <div className={`flex w-full mt-4 ${isDarkMode ? "text-white" : "text-black"}`}>
            <input
              ref={inputRef}
              type="text"
              disabled={currentPhase === "voting" || chatDisabled}
              className={`flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300`}
              placeholder="Type your message..."
              onKeyDown={e => {
                if (e.key === "Enter" && inputRef.current?.value.trim()) {
                  sendMessage(inputRef.current.value.trim());
                  inputRef.current.value = "";
                }
              }}
            />
            <button
              disabled={currentPhase === "voting" || chatDisabled}
              className="ml-2 p-2 text-white glow-cyan focus:outline-none focus:ring-2 rounded-lg bg-[#1CA297] hover:bg-[#33B3A8] focus:ring-[#1CA297]"
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

          {/* Clock */}
          {currentPhase === "conversation" && <CountdownClock />}
        </div>

        {!isMobile && (
          <div className="hidden md:flex items-center justify-center glow-cyan overflow-hidden rounded-2xl">
            <img
              src="/sami-team.webp"
              className="object-cover h-auto w-auto"
              alt="Game Banner"
              width={500}
              height={500}
            />
          </div>
        )}
      </div>

      {/* Audio element */}
      <audio ref={audioRef} src="/start-conversation.mp3" preload="auto" />
    </>
  );
};
