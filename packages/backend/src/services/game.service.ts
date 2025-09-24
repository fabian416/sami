/**
 * Game service: game lifecycle, in-memory state and event emission.
 * This file keeps your original logic; we just removed direct socket imports
 * and centralized env/constants usage.
 */

import { createPlayer, type Player } from "@services/player.service";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import { sendPrizesToWinners } from "@src/config/contract-config";
import supabase from "@src/config/supabase-client";
import axios from "axios";
import {
  MIN_PLAYERS,
  CONVERTATION_PHASE_TIME,
  VOTING_PHASE_TIME,
  TELEGRAM_BOT_TOKEN,
  CHAT_ID,
  SAMI_URI,
} from "@utils/constants";

class GameServiceEmitter extends EventEmitter {}
const gameServiceEmitter = new GameServiceEmitter();
export default gameServiceEmitter;

export interface Message {
  roomId: string;
  playerId: string;
  playerIndex: number;
  isPlayerAI: boolean;
  message: string;
}

export interface Game {
  roomId: string;
  players: Player[];
  status: "waiting" | "active" | "voting" | "finished";
  votes: { [playerId: string]: string };
  isBetGame: boolean;
}


export const rooms: { [key: string]: Game } = {};
export const roomsMessages: { [key: string]: Message[] } = {};
export const cachedRoomsMessages: { [key: string]: Message[] } = {};

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
  isBetGame: boolean = false,
  socketId: string,
): { roomId: string; success: boolean } => {
  let game = isBetGame ? findBetGame() : findFreeGame();

  if (!game) {
    const newRoomId = `room-${Object.keys(rooms).length + 1}`;
    game = createNewGame(newRoomId, isBetGame);
  }

  if (!game) {
    console.error(`Error creating the match for ${playerId} (isBetGame: ${isBetGame})`);
    return { roomId: "", success: false };
  }

  const success = joinGame(game.roomId, playerId, isBetGame, socketId);

  if (!success) {
    console.warn(`⚠️ The player ${playerId} could not join the game ${game.roomId}`);
    return { roomId: "", success: false };
  }

  console.log(`Player ${playerId} joined the match ${game.roomId} (isBetGame: ${isBetGame})`);
  return { roomId: game.roomId, success: true };
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

/** Joins a player into a waiting room. Starts game when MIN_PLAYERS is reached. */
export const joinGame = (
  roomId: string,
  playerId: string,
  isBetGame: boolean,
  socketId: string,
): boolean => {
  const game = rooms[roomId];
  if (!game) return false;

  if (game.status !== "waiting") return false;

  if (game.isBetGame !== isBetGame) {
    console.warn(`Player ${playerId} tried to join a mismatched game type (expected: ${game.isBetGame}, received: ${isBetGame})`);
    return false;
  }

  const existingPlayer = _.find(game.players, { id: playerId });
  if (existingPlayer) return false;

  const newPlayer = createPlayer(playerId, socketId);
  game.players.push(newPlayer);

  if (game.players.length === MIN_PLAYERS) {
    const samiID = uuidv4();
    const samiPlayer = createPlayer(samiID);
    game.players.push(samiPlayer);

    startGame(roomId);
  } else {
    if (TELEGRAM_BOT_TOKEN) void sendTelegramMessage(isBetGame, game.players.length);
  }

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

export const recordVote = (roomId: string, voterId: string, votedPlayerId: string): boolean => {
  const game = rooms[roomId];
  if (!game) {
    console.error(`[recordVote] Game not found for room: ${roomId}`);
    return false;
  }

  const voter = _.find(game.players, { id: voterId });
  const votedPlayer = _.find(game.players, { id: votedPlayerId });

  if (!voter || !votedPlayer) {
    console.warn(`[recordVote]Invalid vote in room : ${roomId}`);
    return false;
  }

  game.votes[voterId] = votedPlayerId;
  console.log(`[${roomId}] ${voterId} Voted for ${votedPlayerId}.`);
  gameServiceEmitter.emit("voteSubmitted", { roomId, voterId, votedId: votedPlayerId });

  const voterPlayerIds = Object.keys(game.votes);
  const amountOfPlayersWhoLeft = _.filter(
    game.players,
    (player) => player.left && !voterPlayerIds.includes(player.id)
  ).length;
  const totalAmount = voterPlayerIds.length + amountOfPlayersWhoLeft;
  if (totalAmount === game.players.length - 1) {
    endVotingPhase(roomId);
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
  setTimeout(() => endVotingPhase(roomId), timeBeforeEnds);
};

export const endVotingPhase = (roomId: string) => {
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

  sendPrizesToWinners(winnerAddresses);

  gameServiceEmitter.emit("gameOver", { roomId, isBetGame, results });

  game.status = "finished";
  const samiIsTheWinner = _.every(results, (r) => r.won === false);
  if (samiIsTheWinner) (samiPlayer as any).winner = true;
  void saveGameData(game, samiIsTheWinner);
};

const saveGameData = async (game: Game, samiIsTheWinner: boolean) => {
  const room = await saveRoom(game, samiIsTheWinner);
  if (!room) {
    console.error("[Backend] Error saving room, aborting...");
    return;
  }
  await savePlayers(game.players);
  await saveVotes(room.id, game.votes);
  await saveMessages(game.roomId, room.id);
  console.log(`[${room.id}] Game data saved successfully.`);
};

const saveRoom = async (game: Game, samiIsTheWinner: boolean) => {
  const { data, error } = await supabase
    .from("rooms")
    .insert([
      {
        status: game.status,
        is_bet_game: game.isBetGame,
        players: game.players.map((p) => p.id),
        is_ai_winner: samiIsTheWinner,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("[Backend] Error saving room:", error);
    return null;
  }
  return data;
};

const savePlayers = async (players: Player[]) => {
  const playerRecords = players.map((player) => ({
    id: player.id,
    index: player.index,
    is_ai: player.isAI,
    winner: player.winner,
    left: player.left,
    wallet_address: player.walletAddress,
  }));

  const { error } = await supabase.from("players").upsert(playerRecords);
  if (error) {
    console.error("[Backend] Error saving players:", error);
  } else {
    console.log("[Backend] Players saved successfully.");
  }
};

const saveVotes = async (roomId: string, votes: { [playerId: string]: string }) => {
  const voteRecords = Object.entries(votes).map(([voter, voted]) => ({
    room_id: roomId,
    from_player_id: voter,
    to_player_id: voted,
  }));

  const { error } = await supabase.from("votes").upsert(voteRecords);
  if (error) {
    console.error("[Backend] Error saving votes:", error);
  }
};

const saveMessages = async (tempRoomId: string, roomId: string) => {
  const messages = roomsMessages[tempRoomId];
  if (!messages) return;

  const messageRecords = messages.map((m) => ({
    room_id: roomId,
    player_id: m.playerId,
    message: m.message,
    is_player_ai: m.isPlayerAI,
  }));

  const { error } = await supabase.from("messages").upsert(messageRecords);
  if (error) {
    console.error("[Backend] Error saving messages:", error);
  }
};

// Helpers
export const getGameById = (roomId: string) => rooms[roomId] || null;

export const calculateNumberOfPlayers = ({ roomId }: { roomId: string }) => {
  const game = getGameById(roomId);
  if (!game) return [-1, -1];
  const amountOfPlayers = game.players.length > MIN_PLAYERS ? MIN_PLAYERS : game.players.length;
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
