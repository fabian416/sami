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

  // Start countdown on phase changes
  useEffect(() => {
    if (!socket) return;
    const handleStartCountdown = (data: { timeBeforeEnds: number; serverTime: number }) =>
      startCountdown({ data, setMaxTime, setTimeLeft, setEndTime });

    socket.on("startConversationPhase", handleStartCountdown);
    socket.on("startVotePhase", handleStartCountdown);
    return () => {
      socket.off("startConversationPhase", handleStartCountdown);
      socket.off("startVotePhase", handleStartCountdown);
    };
  }, [socket]);

  // Autofocus input on mount / after send
  useEffect(() => {
    if (focusInput) {
      inputRef.current?.focus();
      setFocusInput(false);
    }
  }, [focusInput]);

  // Get player index once connected
  useEffect(() => {
    if (!socket) return;
    if (!playerIndex && playerId && roomId) socket.emit("player:getIndex", { roomId, playerId });

    const onPlayerIndex = (data: { playerId: string; playerIndex: number }) => {
      if (playerId === data.playerId) setPlayerIndex(data.playerIndex);
    };

    socket.on("playerIndex", onPlayerIndex);
    return () => { socket.off("playerIndex", onPlayerIndex); };
  }, [playerIndex, socket, playerId, roomId, setPlayerIndex]);

  // Always scroll to last message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Core socket listeners
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (data: Message) => setMessages(prev => [...prev, data]);
    const onStartConversation = () => {
      setCurrentPhase("conversation");
      audioRef.current?.play();
    };
    const onStartVotePhase = (data: { players: Player[] }) => {
      setCurrentPhase("voting");
      setPlayers(data.players);
    };
    const onGameOver = (data: { isBetGame: boolean; results: { playerId: string; won: boolean }[] }) => {
      setIsBetGame(data.isBetGame);
      const me = data.results.find(r => r.playerId === playerId);
      if (me) {
        setAmountOfWinners(_.filter(data.results, { won: true }).length);
        setWinner(me.won ? "You win" : "sami");
      }
      setCurrentPhase("finished");
    };

    socket.on("newMessage", onNewMessage);
    socket.on("startConversationPhase", onStartConversation);
    socket.on("startVotePhase", onStartVotePhase);
    socket.on("gameOver", onGameOver);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("startConversationPhase", onStartConversation);
      socket.off("startVotePhase", onStartVotePhase);
      socket.off("gameOver", onGameOver);
    };
  }, [socket, playerId]);

  // Send message with a tiny cooldown to avoid spam
  const sendMessage = (message: string) => {
    if (!socket || !roomId || !playerId) return console.error("Missing socket, roomId, or playerId.");
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
        <ModalForVoting players={players} setMessages={undefined} timeLeft={timeLeft} maxTime={maxTime} endTime={endTime} />
      )}

      {/* Finished modal */}
      {currentPhase === "finished" && (
        <ModalFinished winner={winner} isBetGame={isBetGame} amountOfWinners={amountOfWinners} />
      )}

      {/* Full-bleed on mobile, tighter gaps/margins */}
      <div
        className="
          flex-grow grid grid-cols-1 md:grid-cols-2
          gap-2 sm:gap-3 md:gap-6
          m-0 md:m-4 px-2 md:px-0
          rounded-none md:rounded-2xl backdrop-brightness-95
          h-[calc(100vh-6.5rem)] md:h-[calc(100vh-9rem)]
        "
      >
        {/* Chat card (compact on mobile) */}
        <div
          className={`
            col-span-1 flex flex-col items-stretch
            p-1.5 sm:p-2 md:p-4
            rounded-none sm:rounded-xl md:rounded-2xl
            shadow-sm md:shadow-lg overflow-hidden
            w-full max-w-full md:max-w-screen-sm
            ${isDarkMode ? "bg-[#2c2171] opacity-80 glow-purple" : "bg-white glow-purple"}
          `}
        >
          {/* Title hidden on very small screens to save space */}
          <span className="w-full text-center text-xs md:text-sm text-white/80 hidden sm:block">
            Chat and find out who is SAMI, the impostor AI
          </span>

          {/* Messages list */}
          <div className="flex-1 w-full overflow-y-auto mt-1 md:mt-2">
            <div className={`${isDarkMode ? "text-white" : "text-black"}`}>
              {messages.map((msg, index) => {
                const color = COLORS[Number(msg.playerIndex)];
                const name = NAMES[Number(msg.playerIndex)];
                const isSelf = playerIndex === Number(msg.playerIndex);
                return (
                  <div key={index} className={`text-left ${color}`}>
                    <div className={`flex flex-row items-end ${isSelf ? "justify-end" : "justify-start"}`}>
                      <div className={`chat ${isSelf ? "chat-end" : "chat-start"}`}>
                        <div className="chat-image avatar flex flex-col">
                          <strong className={`text-[10px] ${color}`}>{name}</strong>
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden">
                            <img alt="Player avatar" src={AVATARS[Number(msg.playerIndex)]} width={32} height={32} />
                          </div>
                        </div>
                        <div className="chat-bubble max-w-[80%] w-auto px-2 py-1 text-sm md:text-base leading-snug bg-gray-700 dark:bg-gray-200 border-0">
                          {msg.playerId ? <span className={`${color}`}>{msg.message}</span> : <strong>{msg.message}</strong>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Sticky input bar (edge-to-edge on mobile) */}
          <div className={`sticky bottom-0 left-0 right-0 pt-1 ${isDarkMode ? "text-white" : "text-black"}`}>
            <div className="flex w-full">
              <input
                ref={inputRef}
                type="text"
                disabled={currentPhase === "voting" || chatDisabled}
                className="flex-1 h-9 md:h-10 text-sm p-2 border rounded-none sm:rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
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
                className="ml-1 md:ml-2 h-9 w-9 md:h-10 md:w-10 flex items-center justify-center text-white glow-cyan focus:outline-none focus:ring-2 rounded-md md:rounded-lg bg-[#1CA297] hover:bg-[#33B3A8] focus:ring-[#1CA297]"
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
            {/* iOS safe-area padding */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>

          {/* Clock during conversation only */}
          {currentPhase === "conversation" && <CountdownClock />}
        </div>

        {/* Right panel: only on md+ */}
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

      {/* Audio cue */}
      <audio ref={audioRef} src="/start-conversation.mp3" preload="auto" />
    </>
  );
};
