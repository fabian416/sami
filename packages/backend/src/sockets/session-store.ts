/**
 * In-memory session store for socket-level data.
 * Keeps a map of socketId -> { socketId, walletAddress?, roomId?, playerId? }.
 * Services can read from here without importing server/io (avoid cycles).
 */

export type PlayerSession = {
  socketId: string;
  walletAddress?: string;
  roomId?: string;
  playerId?: string;
};

export const sessions: Record<string, PlayerSession> = {};