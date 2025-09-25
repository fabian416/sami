import { Player } from "@domain/player.types";

export type GameStatus = "waiting" | "active" | "voting" | "finished";

export type Game = {
  roomId: string;
  players: Player[];
  status: GameStatus;
  votes: Record<string, string>;
  isBetGame: boolean;
};

export type MessageCache = {
  roomId: string;
  playerId: string;
  playerIndex: number;
  isPlayerAI: boolean;
  message: string;
};

export type PersistedRoom = {
  id: string;
};
