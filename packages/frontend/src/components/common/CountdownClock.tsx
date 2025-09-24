"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "~~/providers/SocketContext";

/** Payload sent by the server to start/update a countdown */
type CountdownInit = { timeBeforeEnds: number; serverTime: number };

/** Shorthand for number state setters */
type Setter = React.Dispatch<React.SetStateAction<number>>;

/**
 * Computes the target end time using the server clock to correct client drift,
 * and initializes `maxTime` and `timeLeft` (in seconds).
 */
export const startCountdown = ({
  data,
  setMaxTime,
  setTimeLeft,
  setEndTime,
}: {
  data: CountdownInit;
  setMaxTime: Setter;
  setTimeLeft: Setter;
  setEndTime: Setter;
}) => {
  const { timeBeforeEnds, serverTime } = data;

  // Estimate server-client clock drift and compensate the countdown
  const clientNow = Date.now();
  const timeOffset = serverTime - clientNow;
  const endAt = clientNow + timeOffset + timeBeforeEnds;

  // Persist the absolute end time (ms since epoch) and derived seconds values
  setEndTime(endAt);
  setMaxTime(Math.floor(timeBeforeEnds / 1000));
  setTimeLeft(Math.max(0, Math.floor((endAt - clientNow) / 1000)));
};

const CountdownClock = ({
  initialTimeLeft,
  initialMaxTime,
  initialEndTime,
}: {
  initialMaxTime?: number;
  initialTimeLeft?: number;
  initialEndTime?: number;
}) => {
  // Local state for the ticking countdown
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLeft ?? 0);
  const [maxTime, setMaxTime] = useState<number>(initialMaxTime ?? 0);
  const [endTime, setEndTime] = useState<number>(initialEndTime ?? 0);

  // Ref keeps the latest endTime without retriggering the interval
  const endTimeRef = useRef<number | null>(null);

  // Socket handle (already connected upstream)
  const { socket } = useSocket();

  /** Keep endTime in a stable ref so the interval can read it safely */
  useEffect(() => {
    endTimeRef.current = endTime || null;
  }, [endTime]);

  /**
   * Register socket listeners once.
   * Server emits a synced start for conversation or voting phases.
   */
  useEffect(() => {
    if (!socket) return;

    const handleStart = (data: CountdownInit) => {
      startCountdown({ data, setMaxTime, setTimeLeft, setEndTime });
    };

    const events = ["startConversationPhase", "startVotePhase"] as const;
    events.forEach(evt => socket.on(evt, handleStart));

    // Clean up listeners on unmount/socket change
    return () => {
      events.forEach(evt => socket.off(evt, handleStart));
    };
  }, [socket]);

  /**
   * Single interval ticking every 500ms.
   * Important: this effect has an empty dep array so we don't spawn multiple intervals.
   */
  useEffect(() => {
    const id = setInterval(() => {
      if (!endTimeRef.current) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTimeRef.current - now) / 1000));
      setTimeLeft(remaining);
    }, 500);

    return () => clearInterval(id);
  }, []);

  /** Helper to format seconds as mm:ss */
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  };

  /**
   * Compute % left for styling.
   * If you prefer a filling progress bar instead of an emptying one,
   * switch `value={timeLeft}` to `value={maxTime - timeLeft}` below.
   */
  const pct = maxTime > 0 ? (timeLeft / maxTime) * 100 : 100;

  // DaisyUI-style classes for color thresholds
  let progressClass = "progress-success";
  if (pct <= 66) progressClass = "progress-warning";
  if (pct <= 33) progressClass = "progress-error";

  let textColor = "text-success";
  if (pct <= 66) textColor = "text-warning";
  if (pct <= 33) textColor = "text-error";

  return (
    <div className="flex flex-row items-center justify-center gap-2 mt-2">
      <span className={`text-lg font-mono ${textColor}`}>{formatTime(timeLeft)}</span>

      <progress className={`progress ${progressClass} w-56`} value={timeLeft} max={maxTime} />
    </div>
  );
};

export default CountdownClock;
