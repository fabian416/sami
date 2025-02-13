import { Server, Socket } from "socket.io";
import {
  Player,
  createPlayer,
  findPlayerById,
  updatePlayerIndex,
} from "./playerService";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import { sendPrizesToWinners } from "../config/contractConfig";
import { players } from "../server"; // Import player mapping
import supabase from "@config/supabaseClient";

class GameServiceEmitter extends EventEmitter {}
const gameServiceEmitter = new GameServiceEmitter();
export default gameServiceEmitter;

const AGENT_URL = process.env.AGENT_URL;
export const SAMI_URI = AGENT_URL || "http://localhost:3000";

const MIN_PLAYERS = 3;
const CONVERTATION_PHASE_TIME = 2* 60 * 1000;
const VOTING_PHASE_TIME = 30 * 1000;

interface Game {
  id: string;
  players: string[];
  status: "waiting" | "active" | "voting" | "finished";
  is_bet_game: boolean,
}

export const rooms: { [key: string]: Game } = {};

export interface Message {
  roomId: string,
  playerId: string,
  playerIndex: number,
  message: string
}

export const roomsCachedMessages: { [key: string]: Message[] } = {};

export const findRoomIfAvailable = async (isBetGame: boolean) => {
  const { data, error } = await supabase
    .from("rooms")
    .select()
    .eq("status", "waiting")
    .eq("is_bet_game", isBetGame)
    .lt("array_length(players, 1)", MIN_PLAYERS)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("[Backend] Error finding game:", error);
    return null;
  }

  return data;
};

export const findRoomById = async (roomId: string) => {
  const { data, error } = await supabase
    .from("rooms")
    .select()
    .eq("room_id", roomId)
    .single();

  if (error) {
    console.error("[Backend] Error finding room:", error);
    return null;
  }

  return data;
};

export const addPlayerToRoom = async (roomId: string, playerId: string) => {
  const room = await findRoomById(roomId);
  if (!room) {
    console.error(`[Backend] Room not found: ${roomId}`);
    return null;
  }

  const currentPlayers = room.players || [];
  if (currentPlayers.includes(playerId)) {
    console.warn(`[Backend] Player ${playerId} is already in room ${roomId}`);
    return room;
  }

  const updatedPlayers = [...currentPlayers, playerId];
  const { data, error } = await supabase
    .from("rooms")
    .update({ players: updatedPlayers })
    .eq("room_id", roomId)
    .select()
    .single();

  if (error) {
    console.error("[Backend] Error updating room players:", error);
    return null;
  }

  return data;
};



export const createOrJoin = async (playerId: string, isBetGame: boolean = false)
  : Promise<{ roomId: string; success: boolean }> => {
  const game = await findRoomIfAvailable(isBetGame);

  if (!game) {
    const newRoomId = `room-${Object.keys(rooms).length + 1}`;
    const newGame = await createNewGame(newRoomId, playerId, isBetGame);
    if (!newGame) {
      console.error(`Error creating the match for ${playerId} (isBetGame: ${isBetGame})`);
      return { roomId: "", success: false };
    } else {
      console.log(`Player ${playerId} joined the match ${newGame.id} (isBetGame: ${isBetGame})`);
      return { roomId: newGame.id, success: true };
    }
  }
  
  const success = await joinGame(game, playerId, isBetGame);

  if (!success) {
    console.warn(`⚠️ The player ${playerId} could not join the game${game.roomId}`);
    return { roomId: "", success: false };
  }

  console.log(`Player ${playerId} joined the match ${game.roomId} (isBetGame: ${isBetGame})`);
  return { roomId: game.roomId, success: true };
};


export const createNewGame = async (roomId: string, playerId: string, isBetGame: boolean) => {
  const { data, error } = await supabase
    .from("rooms")
    .insert([{ room_id: roomId, status: "waiting", is_bet_game: isBetGame, player: [playerId] }])
    .select()
    .single();

  if (error) {
    console.error("[Backend] Error al insertar en Supabase:", error);
    return null;
  }
  return data;
};

export const joinGame = async (game: Game, playerId: string, isBetGame: boolean): Promise<boolean> => {
  // Forbid joining if game is active or finished
  if (game.status !== "waiting") return false;

  if (game.is_bet_game !== isBetGame) {
    console.warn(`Player ${playerId} tried to join a mismatched game type (expected: ${game.is_bet_game}, received: ${isBetGame})`);
    return false;
  }

  // Add the new player
  const newPlayer = await createPlayer(playerId, false);
  addPlayerToRoom(game.id, newPlayer.id);

  // If the game reaches min players, add SAMI and start the game
  if (game.players.length === MIN_PLAYERS) {
    const samiID = uuidv4();
    const samiPlayer = await createPlayer(samiID, true);
    addPlayerToRoom(game.id, samiPlayer.id); // Add SAMI as a player

    // Start the game
    startGame(game.id);
  }

  // If everything succeeds, return true
  return true;
};

export const startGame = async (roomId: string) => {
  const game = await findRoomById(roomId);
  if (!game) return null;

  const shuffledPlayers = _.shuffle(game.players);
  const { data, error } = await supabase
    .from("rooms")
    .update({ players: shuffledPlayers, status: "active" })
    .eq("room_id", roomId)
    .select()
    .single();

  if (error) {
    console.error("[Backend] Error updating room players:", error);
    return null;
  }

  console.log(`[${roomId}] Starting game...`);
  console.log(`[${roomId}] Players in the game:`);
  for (const [index, playerId] of shuffledPlayers.entries()) {
    const player: Player | null = await updatePlayerIndex(playerId, index);
    player && console.log(`Index: ${index}, ID: ${player.id}, Role: ${player.is_ai ? "AI" : "Human"}`);
  }

  // Emit event start of the game
  await new Promise((resolve) => setTimeout(resolve, 500));
  const timeBeforeEnds = CONVERTATION_PHASE_TIME;
  const serverTime = Date.now();
  gameServiceEmitter.emit("gameStarted", { roomId, game, timeBeforeEnds, serverTime });

  await new Promise((resolve) => setTimeout(resolve, 100));
  gameServiceEmitter.emit("startConversation", { roomId, timeBeforeEnds, serverTime });

  setTimeout(() => endConversationPhase(roomId), timeBeforeEnds);

  return game;
};

export const recordVote = (
  roomId: string,
  voterId: string,
  votedPlayerId: string
): boolean => {
  const game = rooms[roomId];
  if (!game) {
    console.error(`[recordVote] Game not found for room: ${roomId}`);
    return false;
  }

  // Verify the player is in the match
  const voter = _.find(game.players, { id: voterId });
  const votedPlayer = _.find(game.players, { id: votedPlayerId });

  if (!voter || !votedPlayer) {
    console.warn(`[recordVote]Invalid vote in room : ${roomId}`);
    return false;
  }

  // Register the vote
  game.votes[voterId] = votedPlayerId;
  console.log(`[${roomId}] ${voterId} Voted for ${votedPlayerId}.`);
  gameServiceEmitter.emit("voteSubmitted", { roomId, voterId, votedId: votedPlayerId });

  //  Verify that all the players have voted
  if (Object.keys(game.votes).length === game.players.length - 1) {
    endVotingPhase(roomId);
  }

  return true;
};

export const sendMessageToAI = async (roomId: string) => {
  const game = rooms[roomId];
  const samiPlayer: any = getSamiPlayer(game);
  // Copiar los mensajes actuales en una variable temporal
  const cachedMessages = [...roomsCachedMessages[roomId]]; 
  roomsCachedMessages[roomId].length = 0;

  const messages: {[key: string]: any} = {};
  for (const index in cachedMessages) {
    const {playerIndex, message} = cachedMessages[index];
    messages[index] = {
      instruction: `YOU ARE PLAYER ${samiPlayer.index + 1} AND PLAYER ${playerIndex + 1} SENT THIS MESSAGE TO THE GROUP CHAT`,
      message,
    };
  }
  console.log(`[${roomId}] Input to Sami: ${JSON.stringify(messages)}`);
 
  try {
    const startTime = Date.now();
    // Iniciar solicitud a la IA sin esperar la respuesta (se manejará con timeout)
    const aiResponse = await fetch(`${SAMI_URI}/SAMI-AGENT/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: JSON.stringify(messages),
        userId: samiPlayer.id,
        userName: roomId,
      }),
    });

    // Convertir la respuesta en texto
    const responseText = await aiResponse.text();
    console.log(`[${roomId}] Output of Sami: ${responseText}`);

    // Intentar parsear la respuesta
    const responseData = safeParseJSON(responseText);
    if (!responseData) {
      return console.error("[Backend] Invalid AI response.");
    }
    const agentMessage = responseData[0].text;
    if (responseData.length > 0 && game.status === "active" && responseData[0].action !== "IGNORE") {
      const endTime = Date.now();
      const elapsedTimeSeconds = (endTime - startTime) / 1000;
      console.log(`[${roomId}] Time taken for AI response: ${elapsedTimeSeconds} seconds.`);

      gameServiceEmitter.emit("newMessage", {
        roomId,
        playerId: samiPlayer.id,
        playerIndex: samiPlayer.index,
        message: agentMessage
      });

      await supabase
        .from("messages")
        .insert([{ room_id: roomId, player_id: samiPlayer.id, is_player_ai: true, message: agentMessage }])
        .then(({ error }) => { error && console.error("[Backend] Error al insertar en Supabase:", error)});
    }
   } catch (error) {
     console.error("[Backend] AI Response Timeout or Error:", error);
   }
}

const endConversationPhase = async (roomId: string) => {
  const game = rooms[roomId];

  console.log(`[${roomId}] Ending conversation phase...`);

  game.status = "voting";
  const timeBeforeEnds = VOTING_PHASE_TIME;
  const serverTime = Date.now();

  gameServiceEmitter.emit("conversationEnded", { roomId });
  await new Promise((resolve) => setTimeout(resolve, 100)); // Controlar tiempos
  gameServiceEmitter.emit("startVoting", { roomId, timeBeforeEnds, serverTime });
  setTimeout(() => endVotingPhase(roomId), timeBeforeEnds);
}

export const endVotingPhase = (roomId: string) => {
  const game = rooms[roomId];
  if (!game || game.status !== "voting") return; // Ensure game is in the voting phase
  console.log(`[${roomId}] Ending voting phase...`);
  const isBetGame = rooms[roomId].isBetGame;

  const results: { playerId: string; won: boolean }[] = [];
  const winners: string[] = []; // Guardamos las direcciones de los ganadores

  game.players.forEach((player) => {
    const votedPlayerId = game.votes[player.id];
    const votedPlayer = _.find(game.players, { id: votedPlayerId });

    if (!votedPlayer) {
      console.log(`[${roomId}] ${player.id} no votó correctamente.`);
      results.push({ playerId: player.id, won: false });
      return;
    }

    if (votedPlayer.isAI) {
      console.log(`[${roomId}] ¡${player.id} ganó! Identificó a SAMI.`);
      results.push({ playerId: player.id, won: true });

      if (isBetGame) {
        const winnerAddress = players[player.id]?.walletAddress;
        if (winnerAddress) {
          winners.push(winnerAddress); // Agregamos la dirección del ganador al array
        } else {
          console.error(`No wallet address found for player ID: ${player.id}`);
        }
      }
    } else {
      console.log(`[${roomId}] ${player.id} falló. SAMI gana.`);
      results.push({ playerId: player.id, won: false });
    }
  });

  // Enviar premios a todos los ganadores en una sola transacción
  if (winners.length > 0) {
    sendPrizesToWinners(winners);
  }

  // Emit game over event
  gameServiceEmitter.emit("gameOver", { roomId, isBetGame, results });

  // Mark game as finished
  game.status = "finished";
};

// AUXILIAR FUNCTIONS
// Get a Match by his ID
export const getGameById = (roomId: string) => {
  return rooms[roomId] || null;
};

export const calculateNumberOfPlayers = ({ roomId }: { roomId: string }) => {
  const game = getGameById(roomId);
  if (!game) return [-1, -1];

  //  Only count players in the same game, no need for `player.isBetGame`
  const amountOfPlayers = game.players.length > MIN_PLAYERS ? MIN_PLAYERS : game.players.length;

  return [amountOfPlayers, MIN_PLAYERS];
};

export const getSamiPlayer = (game: Game) => {
  return _.find(game.players, { isAI: true });

}

const safeParseJSON = (text: string): any | null => {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("[Backend] Error parsing JSON:", error);
    return null;
  }
};


const processRoomsMessages = async () => {
  while (true) {
    try {
      // Obtener todos los roomIds que tienen mensajes guardados
      const activeRoomIds = Object.keys(roomsCachedMessages).filter(
        (roomId) => roomsCachedMessages[roomId].length > 0
      );

      // Ejecutar sendMessageToAI para cada roomId encontrado
      await Promise.all(activeRoomIds.map((roomId) => sendMessageToAI(roomId)));
      
    } catch (error) {
      console.error("[Backend] Error in processRoomsMessages:", error);
    }

    // Esperar entre 3 y 6 segundos de manera aleatoria antes de la siguiente ejecución
    const delay = Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

processRoomsMessages();