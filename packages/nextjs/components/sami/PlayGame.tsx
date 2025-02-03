import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import CountdownClock from "../CountdownClock";
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
  "text-pink-400",
  "text-red-400",
  "text-green-400",
  "text-blue-400",
  "text-orange-400",
  "text-yellow-400",
  "text-cyan-400",
];

const getPermutations = (str: string) => {
  if (str.length <= 1) return [str];
  const permutations: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remainingChars = str.slice(0, i) + str.slice(i + 1);
    for (const perm of getPermutations(remainingChars)) {
      permutations.push(char + perm);
    }
  }
  return permutations;
};

export const NAMES = getPermutations("SAMI").filter(name => name !== "SAMI");

const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const PlayGame = ({ timeForFirstRound }: { timeForFirstRound: any }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPhase, setCurrentPhase] = useState<"conversation" | "voting" | "finished">("conversation");
  const [clockTimer, setClockTimer] = useState<Clock | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [shuffledColors, setShuffledColors] = useState<string[]>([]);
  const [shuffledNames, setShuffledNames] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { socket, playerIndex, playerId, setPlayerIndex, roomId, isPlayerEliminated } = useSocket();
  const { resolvedTheme } = useTheme();

  const isDarkMode = resolvedTheme === "dark";
  const disabledChat = currentPhase === "voting";

  useEffect(() => {
    setShuffledColors(COLORS);
    setShuffledNames(NAMES);
  }, []);

  useEffect(() => {
    if (timeForFirstRound) {
      setClockTimer(timeForFirstRound);
    }
  }, [timeForFirstRound]);

  useEffect(() => {
    if (!socket) return;
    if (!playerIndex && playerId && roomId) {
      socket.emit("getPlayerIndex", { roomId, playerId });
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

    socket.on("startConversationPhase", (data: { message: string; timeBeforeEnds: number; serverTime: number }) => {
      setCurrentPhase("conversation");
      setClockTimer({ timeBeforeEnds: data.timeBeforeEnds, serverTime: data.serverTime });
    });

    socket.on(
      "startVotePhase",
      (data: { players: Player[]; message: string; timeBeforeEnds: number; serverTime: number }) => {
        setCurrentPhase("voting");
        setPlayers(data.players);
        setClockTimer({ timeBeforeEnds: data.timeBeforeEnds, serverTime: data.serverTime });
      },
    );

    socket.on("gameOver", (data: { message: string; results: { playerId: string; won: boolean }[] }) => {
      const { results } = data;

      // Obtener el resultado del jugador actual
      const playerResult = results.find(r => r.playerId === playerId);
      if (playerResult) {
        setWinner(playerResult.won ? "You win" : "sami");
      }

      setCurrentPhase("finished");
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
      return console.error("Missing socket, roomId, or playerId.");
    }

    socket.emit("message", { roomId, playerId, playerIndex, message });
  };

  return (
    <>
      {/* Voting modal */}
      {currentPhase === "voting" && (
        <ModalForVoting
          players={players}
          shuffledColors={shuffledColors}
          shuffledNames={shuffledNames}
          setMessages={undefined}
        />
      )}

      {/* Modal Finished  */}
      {currentPhase === "finished" && <ModalFinished winner={winner} />}

      {/* Clock */}
      <CountdownClock setClockTimer={setClockTimer} clockTimer={clockTimer} />

      <div className="flex-grow grid grid-cols-2 gap-9 rounded-2xl backdrop-brightness-95 flex-col md:h-[calc(100vh-8rem)]">
        <div
          className={`col-span-2 md:col-span-1 flex flex-col items-center justify-between p-4 rounded-2xl shadow-lg overflow-y-scroll max-w-screen-sm
          ${isDarkMode ? "bg-[#2c2171] opacity-80 glow-purple" : "bg-white glow-purple"}`}
        >
          {/* Chat messages */}
          <div className="flex-1 w-full p-2 overflow-y-scroll">
            <div className={`mt-4 ${isDarkMode ? "text-white" : "text-black"}`}>
              {messages.map((msg, index) => {
                const color = shuffledColors[Number(msg.playerIndex)];
                const name = shuffledNames[Number(msg.playerIndex)];
                return (
                  <div key={index} className={`text-left mb-1 ${color}`}>
                    <span>
                      {msg.playerId ? (
                        <>
                          <strong>{name}:</strong> {msg.message}
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

          {/* Input messages */}
          <div className="flex w-full mt-4">
            <input
              ref={inputRef}
              type="text"
              disabled={currentPhase === "voting"}
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
              disabled={currentPhase === "voting"}
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
        </div>
        {!isMobile && (
          <div className="flex items-center justify-center glow-cyan overflow-hidden rounded-2xl">
            <Image
              src="/sami-team.webp"
              className="object-cover h-auto w-auto"
              alt="Game Banner"
              width={500}
              height={500}
            />
          </div>
        )}
      </div>
    </>
  );
};
