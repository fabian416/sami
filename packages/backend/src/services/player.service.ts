/**
 * Player service: player-related logic with a small EventEmitter bus.
 * Avoids importing socket server or io. Reads wallet from sessionStore if needed.
 */

import { EventEmitter } from "events";
import supabase from "@src/config/supabase-client";
import { rooms, type Game } from "@services/game.service"; // <-- import Game type
import { sessions } from "@src/sockets/session-store";
import _ from "lodash";
import logger from "@core/logger";

class PlayerServiceEmitter extends EventEmitter {}
const playerServiceEmitter = new PlayerServiceEmitter();
export default playerServiceEmitter;

// Player interface (kept compatible with your logic)
export interface Player {
  id: string;
  socketId?: string;
  walletAddress?: string;
  index?: number;
  isAI: boolean;
  left: boolean;
  winner: boolean;
}

/**
 * Creates a new player. If socketId is provided, tries to resolve wallet
 * from the session store; otherwise marks the player as AI.
 */
export const createPlayer = (playerId: string, socketId?: string): Player => {
  const walletAddress = socketId ? sessions[socketId]?.walletAddress : undefined;
  return {
    id: playerId,
    socketId,
    walletAddress,
    isAI: socketId ? false : true,
    winner: false,
    left: false,
  };
};

export const assignIARole = (player: Player) => {
  player.isAI = true;
};

/** Emits "playerIndex" to sockets layer. */
export function getPlayerIndex(data: { roomId: string; playerId: string }) {
  const { roomId, playerId } = data;
  const game = rooms[roomId];
  if (!game) return -1;

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return -1;

  playerServiceEmitter.emit("playerIndex", {
    roomId,
    playerId,
    playerIndex: player.index,
  });
  return player.index;
}

/** Emits "playerRoomId" to sockets layer. */
export function getPlayerRoomId(data: { playerId: string }) {
  const { playerId } = data;

  // Strongly-typed entries
  const entries = Object.entries(rooms) as Array<[string, Game]>;

  // Scan from newest to oldest
  for (let i = entries.length - 1; i >= 0; i--) {
    const [roomId, game] = entries[i];
    if (game.players.some((p) => p.id === playerId)) {
      playerServiceEmitter.emit("playerRoomId", { roomId, playerId });
      return roomId;
    }
  }

  return undefined;
}

export function disconnectPlayer(data: { roomId: string; playerId: string }) {
  const { roomId, playerId } = data;
  const game = rooms[roomId];
  if (!game) return;

  const lefterPlayer = game.players.find((p) => p.id === playerId);
  if (game.status === "waiting") {
    if (game.isBetGame && lefterPlayer) void saveLefterPlayer(lefterPlayer);
    _.remove(game.players, (p) => p.id === playerId);
  } else {
    if (lefterPlayer) lefterPlayer.left = true;
  }
}

async function saveLefterPlayer(player: Player) {
  const { error } = await supabase.from("lefters_before_game_starts").insert({
    id: player.id,
    wallet_address: player.walletAddress,
  });

  if (error) {
    logger.error({ error }, "[Backend] Error saving players");
  } else {
    logger.info("[Backend] Players saved successfully.");
  }
}
