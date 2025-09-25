/**
 * Game service: game lifecycle, in-memory state and event emission.
 * This file keeps your original logic; we just removed direct socket imports
 * and centralized env/constants usage.
 */

import { createPlayer } from "@services/player.service";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import { preflightUSDC, sendPrizesToWinners, startGameOnChain } from "@src/config/contract-config";
import axios from "axios";
import {
  MIN_PLAYERS,
  CONVERTATION_PHASE_TIME,
  VOTING_PHASE_TIME,
  TELEGRAM_BOT_TOKEN,
  CHAT_ID,
  SAMI_URI,
} from "@utils/constants";
import { getAddress, isAddress } from "ethers";
import { Game, MessageCache } from "@domain/game.types";
import { Player } from "@domain/player.types";
import { GamePersistenceService } from "./game-persistence-service";

class GameServiceEmitter extends EventEmitter {}
const gameServiceEmitter = new GameServiceEmitter();
export default gameServiceEmitter;

export const rooms: { [key: string]: Game } = {};
export const roomsMessages: { [key: string]: MessageCache[] } = {};
export const cachedRoomsMessages: { [key: string]: MessageCache[] } = {};

const persistence = new GamePersistenceService(
  undefined, undefined, undefined, undefined,
  (tempRoomId) => roomsMessages[tempRoomId]
);

/** Finds a waiting bet game with available slots. */
export const findBetGame = (): Game | null =>
  _.find(
    _.reverse(Object.values(rooms)),
    (game) => game.status === "waiting" && game.players.length < MIN_PLAYERS && game.isBetGame === true
  ) || null;

/** Finds a waiting free game with available slots. */
export const findFreeGame = (): Game | null =>
  _.find(
    _.reverse(Object.values(rooms)),
    (game) => game.status === "waiting" && game.players.length < MIN_PLAYERS && game.isBetGame === false
  ) || null;

/** Creates or joins a room of the requested type. */
export const createOrJoin = (
  playerId: string,
  isBetGame = false,
  socketId: string,
): { roomId: string; success: boolean } => {

  const nextRoomId = () => `room-${Object.keys(rooms).length + 1}`;

  const getWaitingRoom = (isBetGame: boolean) =>
    (isBetGame ? findBetGame() : findFreeGame());

  // 1) First attempt: prefer an existing waiting room; otherwise create one
  const first = getWaitingRoom(isBetGame) ?? createNewGame(nextRoomId(), isBetGame);
  if (!first) return { roomId: "", success: false };

  if (joinGame(first.roomId, playerId, isBetGame, socketId)) {
    console.log(`Player ${playerId} joined ${first.roomId} (bet=${isBetGame})`);
    return { roomId: first.roomId, success: true };
  }

  // 2) Likely race (room filled between selection and join) → create a fresh room and try once
  const fresh = createNewGame(nextRoomId(), isBetGame);
  if (fresh && joinGame(fresh.roomId, playerId, isBetGame, socketId)) {
    console.log(`Player ${playerId} joined ${fresh.roomId} (bet=${isBetGame})`);
    return { roomId: fresh.roomId, success: true };
  }

  console.warn(`Player ${playerId} could not join (bet=${isBetGame})`);
  return { roomId: "", success: false };
};


/** Creates a new waiting game. */
export const createNewGame = (roomId: string, isBetGame: boolean) => {
  const newGame: Game = {
    roomId,
    players: [] as Player[],
    status: "waiting",
    votes: {},
    isBetGame,
  };

  rooms[roomId] = newGame;
  console.log(`New match created ${roomId} | Bet: ${isBetGame}`);
  return newGame;
};

/** Joins a player into a waiting room.
 *  For bet games:
 *   - once MIN_PLAYERS is reached, add SAMI (AI) locally,
 *   - call the smart contract startGame(address[]) with HUMAN wallet addresses,
 *   - if some wallets fail, remove those players from the room,
 *   - if remaining humans < MIN_PLAYERS -> revert to waiting; else start the local game.
 */
export const joinGame = (
  roomId: string,
  playerId: string,
  isBetGame: boolean,
  socketId: string,
): boolean => {
  const game = rooms[roomId];
  if (!game) return false;
  if (game.status !== "waiting") return false;
  const humansNow = game.players.filter(p => !p.isAI).length;
  if (humansNow >= MIN_PLAYERS) { return false; }

  if (game.isBetGame !== isBetGame) {
    console.warn(`Player ${playerId} tried to join a mismatched game type (expected: ${game.isBetGame}, received: ${isBetGame})`);
    return false;
  }

  // Disallow duplicate player IDs
  if (_.find(game.players, { id: playerId })) return false;

  // Create human (wallet comes from session if socketId provided)
  const newPlayer = createPlayer(playerId, socketId);

  // For bet games, require a registered wallet before joining
  if (isBetGame && (!newPlayer.walletAddress || !newPlayer.walletAddress.trim())) {
    console.warn(`[${roomId}] player ${playerId} has no wallet registered; cannot join bet game`);
    return false;
  }

  game.players.push(newPlayer);

  // Helper: count humans (exclude SAMI/AI)
  const countHumans = () => game.players.filter(p => !p.isAI).length;

  // ====== TG CASE #1: joined but still below quorum ======
  if (countHumans() < MIN_PLAYERS) {
    gameServiceEmitter.emit("waitingForPlayers", {
      roomId,
      players: countHumans(),
      isBetGame,
    });
    // Notify TG only while waiting (below quorum)
    if (TELEGRAM_BOT_TOKEN) void sendTelegramMessage(isBetGame, countHumans());
    return true;
  }

  // Prepare SAMI (will be added only right before starting)
  const samiID = uuidv4();
  const samiPlayer = createPlayer(samiID); // AI

  if (!isBetGame) {
    // FREE GAME: add SAMI and start immediately
    game.players.push(samiPlayer);
    void startGame(roomId);
    return true;
  }

  // BET GAME: on-chain gate before starting locally
  (async () => {
    try {
      const humanWallets = game.players
        .filter(p => !p.isAI && typeof p.walletAddress === "string" && p.walletAddress.trim().length > 0)
        .map(p => p.walletAddress!.trim());

      const invalid = humanWallets.filter(a => !isAddress(a));
      if (invalid.length) console.warn(`[${roomId}] Invalid wallets: ${invalid.join(", ")}`);

      const checksummed = humanWallets.map(a => { try { return getAddress(a); } catch { return a; } });

      const { ok: pfOk, bad, need, spender } = await preflightUSDC(checksummed);
      if (!pfOk) {
        const failSet = new Set(bad.map(b => b.owner.toLowerCase()));
        game.players = game.players.filter(p => {
          if (p.isAI) return false;
          const w = (p.walletAddress || "").toLowerCase();
          return !failSet.has(w);
        });

        const humansLeft = game.players.filter(p => !p.isAI).length;
        game.status = "waiting";

        gameServiceEmitter.emit("betApprovalFailed", { roomId, failedWallets: [...failSet] });
        gameServiceEmitter.emit("waitingForPlayers", { roomId, players: humansLeft, isBetGame: true });
        if (TELEGRAM_BOT_TOKEN && humansLeft > 0) void sendTelegramMessage(true, humansLeft);

        console.warn(`[${roomId}] preflight failed`, { need: need.toString(), spender, failed: [...failSet] });
        return;
      }

      const [ok, failed] = await startGameOnChain(checksummed);

      if (!ok && failed.length) {
        // Remove failed humans
        const failedSet = new Set(failed.map(a => a.toLowerCase()));
        game.players = game.players.filter(p => {
          if (p.isAI) return false; // ensure no AI lingers here
          const w = (p.walletAddress || "").toLowerCase();
          return !failedSet.has(w);
        });

        const humansLeft = countHumans();

        // Back to waiting; no SAMI while waiting
        game.status = "waiting";

        gameServiceEmitter.emit("betApprovalFailed", { roomId, failedWallets: failed });
        gameServiceEmitter.emit("waitingForPlayers", {
          roomId,
          players: humansLeft,
          isBetGame: true,
        });

        // ====== TG CASE #2: after cleanup, still below quorum ======
        if (TELEGRAM_BOT_TOKEN) void sendTelegramMessage(true, humansLeft);
        return;
      }

      const humansLeft = countHumans();
      if (humansLeft < MIN_PLAYERS) {
        // Lost quorum meanwhile -> back to waiting
        game.status = "waiting";
        game.players = game.players.filter(p => !p.isAI);
        gameServiceEmitter.emit("waitingForPlayers", {
          roomId,
          players: humansLeft,
          isBetGame: true,
        });
        if (TELEGRAM_BOT_TOKEN) void sendTelegramMessage(true, humansLeft);
        return;
      }

      // On-chain OK and quorum intact -> add SAMI and start
      game.players.push(samiPlayer);
      void startGame(roomId);
    } catch (e: any) {
      console.error(`[${roomId}] on-chain startGame failed`, e);
      const reason = String(e?.message || "on-chain start failed");
      gameServiceEmitter.emit("game:startFailed", { roomId, reason });

      game.status = "waiting";
      game.players = game.players.filter(p => !p.isAI);
      const humansLeft = countHumans();
      gameServiceEmitter.emit("waitingForPlayers", {
        roomId,
        players: humansLeft,
        isBetGame: true,
      });
      if (TELEGRAM_BOT_TOKEN) void sendTelegramMessage(true, humansLeft);
    }
  })();

  return true;
};



export const startGame = async (roomId: string) => {
  const game = rooms[roomId];
  if (!game) return null;

  game.players = _.shuffle(game.players);
  game.status = "active";

  console.log(`[${roomId}] Starting game...`);
  console.log(`[${roomId}] Players in the game:`);
  game.players.forEach((player, index) => {
    game.players[index].index = index;
    console.log(`Index: ${index}, ID: ${player.id}, Role: ${player.isAI ? "AI" : "Human"}`);
  });

  // Broadcast start
  await new Promise((resolve) => setTimeout(resolve, 500));
  const timeBeforeEnds = CONVERTATION_PHASE_TIME;
  const serverTime = Date.now();
  gameServiceEmitter.emit("gameStarted", { roomId, game, timeBeforeEnds, serverTime });

  await new Promise((resolve) => setTimeout(resolve, 100));
  gameServiceEmitter.emit("startConversation", { roomId, timeBeforeEnds, serverTime });

  if (Math.random() < 0.5) {
    void sendAIFirstMessage(roomId);
  }

  setTimeout(() => endConversationPhase(roomId), timeBeforeEnds);
  return game;
};

const sendAIFirstMessage = async (roomId: string) => {
  const game = rooms[roomId];
  const samiPlayer: any = getSamiPlayer(game);
  let message;
  if (Math.random() < 0.5) {
    message = "YOU ARE IN A NEW GAME AND YOU NEED TO START VERY BRIEFLY THE CONVERSATION";
  } else {
    message = "ESTAR POR EMPEZAR UN NUEVO JUEGO Y TENES QUE EMPEZAR LA CONVERSACIÓN MUY BREVEMENTE";
  }

  if (!cachedRoomsMessages[roomId]) cachedRoomsMessages[roomId] = [];
  cachedRoomsMessages[roomId].push({
    roomId,
    playerId: samiPlayer.id,
    playerIndex: samiPlayer.index,
    isPlayerAI: true,
    message,
  });

  const delay = Math.floor(Math.random() * (2000 - 10 + 1));
  await new Promise((resolve) => setTimeout(resolve, delay));
  void sendMessageToAI(roomId);
};

type GameWithLocks = Game & {
  __votingClosing?: boolean;
  __votingClosed?: boolean;
};

export const recordVote = (roomId: string, voterId: string, votedPlayerId: string): boolean => {
  const game = rooms[roomId] as GameWithLocks;
  if (!game) {
    console.error(`[recordVote] Game not found for room: ${roomId}`);
    return false;
  }
  if (game.status !== "voting") return false;

  const voter = _.find(game.players, { id: voterId });
  const votedPlayer = _.find(game.players, { id: votedPlayerId });
  if (!voter || !votedPlayer) {
    console.warn(`[recordVote] Invalid vote in room: ${roomId}`);
    return false;
  }

  if (game.votes[voterId] === votedPlayerId) return true;

  game.votes[voterId] = votedPlayerId;
  console.log(`[${roomId}] ${voterId} voted for ${votedPlayerId}`);
  gameServiceEmitter.emit("voteSubmitted", { roomId, voterId, votedId: votedPlayerId });

  const voterIds = Object.keys(game.votes);
  const leavers = game.players.filter(p => p.left && !voterIds.includes(p.id)).length;
  const totalCounted = voterIds.length + leavers;

  if (totalCounted === game.players.length - 1 && !game.__votingClosed && !game.__votingClosing) {
    game.__votingClosing = true;

    setImmediate(async () => {
      try {
        await endVotingPhase(roomId);
      } catch (e) {
        console.error(`[${roomId}] endVotingPhase failed`, e);
      } finally {
        game.__votingClosed = true;
        game.__votingClosing = false;
      }
    });
  }

  return true;
};


export const sendMessageToAI = async (roomId: string) => {
  const game = rooms[roomId];
  const samiPlayer: any = getSamiPlayer(game);
  const cached = [...(cachedRoomsMessages[roomId] || [])];
  cachedRoomsMessages[roomId] = [];

  const messages: Record<string, any> = {};
  for (const index in cached) {
    const { playerIndex, message } = cached[index];
    messages[index] = {
      instruction: `YOU ARE PLAYER ${samiPlayer.index + 1} AND PLAYER ${playerIndex + 1} SENT THIS MESSAGE TO THE GROUP CHAT`,
      message,
    };
  }
  console.log(`[${roomId}] Input to Sami: ${JSON.stringify(messages)}`);

  try {
    const startTime = Date.now();
    const aiResponse = await fetch(`${SAMI_URI}/SAMI-AGENT/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: JSON.stringify(messages),
        userId: samiPlayer.id,
        userName: roomId,
      }),
    });

    const responseText = await aiResponse.text();
    console.log(`[${roomId}] Output of Sami: ${responseText}`);

    const responseData = safeParseJSON(responseText);
    if (!responseData) {
      return console.error("[Backend] Invalid AI response.");
    }
    const agentMessage = responseData[0].text;
    if (responseData.length > 0 && game.status === "active" && responseData[0].action !== "IGNORE") {
      const finalAgentMessage = maybeDisguiseResponse(agentMessage);

      const elapsedTimeSeconds = (Date.now() - startTime) / 1000;
      console.log(`[${roomId}] Time taken for AI response: ${elapsedTimeSeconds} seconds.`);

      gameServiceEmitter.emit("newMessage", {
        roomId,
        playerId: samiPlayer.id,
        playerIndex: samiPlayer.index,
        message: finalAgentMessage,
      });

      if (!roomsMessages[roomId]) roomsMessages[roomId] = [];
      roomsMessages[roomId].push({
        roomId,
        playerId: samiPlayer.id,
        playerIndex: samiPlayer.index,
        isPlayerAI: true,
        message: finalAgentMessage,
      });
    }
  } catch (error) {
    console.error("[Backend] AI Response Timeout or Error:", error);
  }
};

const maybeDisguiseResponse = (agentMessage: string): string => {
  let modifiedMessage = agentMessage;
  if (Math.random() < 0.7) modifiedMessage = modifiedMessage.replace(/,/g, "");
  if (Math.random() < 0.65) return modifiedMessage;
  if (Math.random() < 0.1) modifiedMessage = modifiedMessage.toUpperCase();

  const transformations: Array<(msg: string) => string> = [];
  if (modifiedMessage.includes("q")) transformations.push((msg) => msg.replace("q", "w"));
  if (modifiedMessage.includes("c")) transformations.push((msg) => msg.replace("c", "x"));
  if (modifiedMessage.includes("i")) transformations.push((msg) => msg.replace("i", "u"));
  if (modifiedMessage.includes("h")) transformations.push((msg) => msg.replace("h", "j"));
  if (modifiedMessage.includes("t")) transformations.push((msg) => msg.replace("t", "r"));
  if (modifiedMessage.includes("m")) transformations.push((msg) => msg.replace("m", "n"));
  if (modifiedMessage.includes("p")) transformations.push((msg) => msg.replace("p", "o"));
  if (modifiedMessage.length > 1) transformations.push((msg) => {
    const idx = Math.floor(Math.random() * msg.length);
    return msg.substring(0, idx) + msg[idx].toUpperCase() + msg.substring(idx + 1);
  });
  if (modifiedMessage.length > 1) transformations.push((msg) => msg.substring(1));
  if (modifiedMessage.length > 1) transformations.push((msg) => msg.substring(2));
  transformations.push((msg) => msg.toLowerCase());

  if (transformations.length === 0) return modifiedMessage;
  const randomTransformation = transformations[Math.floor(Math.random() * transformations.length)];
  return randomTransformation(modifiedMessage);
};

const endConversationPhase = async (roomId: string) => {
  const game = rooms[roomId];
  console.log(`[${roomId}] Ending conversation phase...`);

  game.status = "voting";
  const timeBeforeEnds = VOTING_PHASE_TIME;
  const serverTime = Date.now();

  gameServiceEmitter.emit("conversationEnded", { roomId });
  await new Promise((resolve) => setTimeout(resolve, 100));
  gameServiceEmitter.emit("startVoting", { roomId, timeBeforeEnds, serverTime });
  setTimeout(async () => await endVotingPhase(roomId), timeBeforeEnds);
};

export const endVotingPhase = async (roomId: string) => {
  const game = rooms[roomId];
  if (!game || game.status !== "voting") return;
  console.log(`[${roomId}] Ending voting phase...`);

  const results: { playerId: string; won: boolean }[] = [];
  const winnerAddresses: string[] = [];
  const isBetGame = rooms[roomId].isBetGame;
  const samiPlayer = _.find(game.players, { isAI: true });
  if (!samiPlayer) return console.error(`SAMI player not found.`);

  game.players.forEach((player) => {
    const voterPlayer = _.find(game.players, { id: player.id });
    if (!voterPlayer) return console.error(`Voter player not found: ${player.id}`);

    const votedPlayerId = game.votes[player.id];
    const votedPlayer = _.find(game.players, { id: votedPlayerId });

    if (!votedPlayer) {
      console.log(`[${roomId}] ${player.id} did not vote properly.`);
      results.push({ playerId: player.id, won: false });
      return;
    }

    if (votedPlayer.isAI) {
      voterPlayer.winner = true;
      console.log(`[${roomId}] ${player.id} won! Identified SAMI.`);
      results.push({ playerId: player.id, won: true });

      if (isBetGame && player.socketId) {
        const winnerAddress = voterPlayer.walletAddress;
        if (winnerAddress) {
          winnerAddresses.push(winnerAddress);
        } else {
          console.error(`No wallet address found for player ID: ${player.id}`);
        }
      }
    } else {
      voterPlayer.winner = false;
      console.log(`[${roomId}] ${player.id} failed. SAMI wins.`);
      results.push({ playerId: player.id, won: false });
    }
  });

  await sendPrizesToWinners(winnerAddresses);

  gameServiceEmitter.emit("gameOver", { roomId, isBetGame, results });

  game.status = "finished";
  const samiIsTheWinner = _.every(results, (r) => r.won === false);
  if (samiIsTheWinner) (samiPlayer as any).winner = true;
  await persistence.saveGameData(game, samiIsTheWinner);
};

// Helpers
export const getGameById = (roomId: string) => rooms[roomId] || null;

export const calculateNumberOfPlayers = ({ roomId }: { roomId: string }) => {
  const game = getGameById(roomId);
  if (!game) return [-1, -1];
  const humans = game.players.filter(p => !p.isAI).length;
  const amountOfPlayers = humans > MIN_PLAYERS ? MIN_PLAYERS : humans;
  return [amountOfPlayers, MIN_PLAYERS];  
};

export const getSamiPlayer = (game: Game) => _.find(game.players, { isAI: true });

const safeParseJSON = (text: string): any | null => {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("[Backend] Error parsing JSON:", error);
    return null;
  }
};

async function sendTelegramMessage(isBetGame: boolean, playersAmount: number) {
  const base = process.env.VITE_PUBLIC_ENVIRONMENT === "production" ? "https://playsami.fun" : "https://staging.playsami.fun";
  const message = `A player has joined a ${isBetGame ? "betting" : "free"} room in ${base} (players ${playersAmount}/${MIN_PLAYERS})`;
  console.log(message);

  if (!TELEGRAM_BOT_TOKEN || !CHAT_ID) return;

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: CHAT_ID, text: message },
      { timeout: 10000 }
    );
  } catch (error: any) {
    console.error("Error sending the message:", error);
  }
}

/** Background loop sending cached messages to AI per room. */
const processRoomsMessages = async () => {
  // WARNING: long-running loop; runs once when module loads.
  while (true) {
    try {
      const activeRoomIds = Object.keys(cachedRoomsMessages).filter(
        (roomId) => (cachedRoomsMessages[roomId]?.length ?? 0) > 0
      );
      await Promise.all(activeRoomIds.map((roomId) => sendMessageToAI(roomId)));
    } catch (error) {
      console.error("[Backend] Error in processRoomsMessages:", error);
    }
    const delay = Math.floor(Math.random() * (9000 - 2000 + 1)) + 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

processRoomsMessages();
