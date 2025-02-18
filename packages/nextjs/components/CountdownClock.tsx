import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useSocket } from "~~/app/socketContext";

const CountdownClock = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(0); // Store the max countdown time
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const endTimeRef = useRef<number | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const startCountdown = (data: { timeBeforeEnds: number; serverTime: number }) => {
      const { timeBeforeEnds, serverTime } = data;

      const clientTime = Date.now();
      const timeOffset = serverTime - clientTime;
      const endTime = clientTime + timeOffset + timeBeforeEnds;
      endTimeRef.current = endTime;

      setMaxTime(Math.floor(timeBeforeEnds / 1000)); // Set max time in seconds
      setTimeLeft(Math.max(0, Math.floor((endTime - clientTime) / 1000)));
    };

    socket.on("startConversationPhase", startCountdown);
    socket.on("startVotePhase", startCountdown);

    return () => {
      socket.off("startConversationPhase", startCountdown);
      socket.off("startVotePhase", startCountdown);
    };
  }, [socket]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (endTimeRef.current) {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((endTimeRef.current - now) / 1000));
        setTimeLeft(diff);

        if (diff <= 0) {
          clearInterval(timer);
        }
      }
    }, 500);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (timeLeft === 0) return null;

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      <span
        className={`text-lg font-mono ${isDarkMode ? "text-green-500" : "text-green-700"}`}
        style={{ textShadow: "0 0 5px #00FF00" }}
      >
        {formatTime(timeLeft)}
      </span>
      <progress className="progress progress-success w-56" value={timeLeft} max={maxTime}></progress>
    </div>
  );
};

export default CountdownClock;
