/**
 * Player service: player-related logic with a small EventEmitter bus.
 * Avoids importing socket server or io. Reads wallet from sessionStore if needed.
 */

import { EventEmitter } from "events";
import { rooms } from "@services/game.service"; // <-- import Game type
import { sessions } from "@src/sockets/session-store";
import _ from "lodash";
import logger from "@core/logger";
import { DrizzleLefterRepository } from "@repositories/impl/drizzle-lefter-repository";
import { Game } from "@domain/game.types";
import { Player } from "@domain/player.types";

class PlayerServiceEmitter extends EventEmitter {}
const playerServiceEmitter = new PlayerServiceEmitter();
export default playerServiceEmitter;

const leftersRepo = new DrizzleLefterRepository();


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
  try {
    await leftersRepo.insert(player.id, player.walletAddress);
    logger.info("[Backend] Lefter saved successfully.");
  } catch (error) {
    logger.error({ error }, "[Backend] Error saving lefter");
  }
}
