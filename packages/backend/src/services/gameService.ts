import { Server, Socket } from "socket.io";
import {
  Player,
  createPlayer,
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
  roomId: string;
  players: Player[];
  status: "waiting" | "active" | "voting" | "finished";
  votes: { [playerId: string]: string }; // Mapping who vote who
  isBetGame: boolean,
}

export const rooms: { [key: string]: Game } = {};

export interface Message {
  roomId: string,
  playerId: string,
  playerIndex: number,
  message: string
}

export const roomsCachedMessages: { [key: string]: Message[] } = {};

// Encuentra una partida SOLO si es del mismo tipo (apuesta o gratuita)
export const findBetGame = (): Game | null => {
  return _.find(
    _.reverse(Object.values(rooms)),
    (game) => game.status === "waiting" && game.players.length < MIN_PLAYERS && game.isBetGame === true
  ) || null;
};

export const findFreeGame = (): Game | null => {
  return _.find(
    _.reverse(Object.values(rooms)),
    (game) => game.status === "waiting" && game.players.length < MIN_PLAYERS && game.isBetGame === false
  ) || null;
};

// Main function to handle the creation or join to a new match
export const createOrJoin = (
  playerId: string,
  socket: Socket,
  io: Server,
  isBetGame: boolean = false
): { roomId: string; success: boolean } => {
  let game = isBetGame ? findBetGame() : findFreeGame(); // find based on type bet or not

  if (!game) {
    const newRoomId = `room-${Object.keys(rooms).length + 1}`;
    game = createNewGame(newRoomId, isBetGame);
  }

  if (!game) {
    console.error(`Error creating the match for ${playerId} (isBetGame: ${isBetGame})`);
    return { roomId: "", success: false };
  }

  const success = joinGame(game.roomId, playerId, isBetGame);

  if (!success) {
    console.warn(`⚠️ The player ${playerId} could not join the game${game.roomId}`);
    return { roomId: "", success: false };
  }

  console.log(`Player ${playerId} joined the match ${game.roomId} (isBetGame: ${isBetGame})`);
  return { roomId: game.roomId, success: true };
};

// Create a new Match
export const createNewGame = (roomId: string, isBetGame: boolean) => {
  const newGame: Game = {
    roomId,
    players: [] as Player[],
    status: "waiting",
    votes: {},
    isBetGame, 
  };

  rooms[roomId] = newGame; //  Se almacena en la memoria correctamente
  console.log(`New match created ${roomId} | Bet: ${isBetGame}`);

  return newGame;
};

export const joinGame = (roomId: string, playerId: string, isBetGame: boolean): boolean => {
  // Get instance of the created game
  const game = rooms[roomId];
  if (!game) return false;

  // Forbid joining if game is active or finished
  if (game.status !== "waiting") return false;

  if (game.isBetGame !== isBetGame) {
    console.warn(`Player ${playerId} tried to join a mismatched game type (expected: ${game.isBetGame}, received: ${isBetGame})`);
    return false;
  }

  // Check if the player already exists
  const existingPlayer = _.find(game.players, { id: playerId });
  if (existingPlayer) {
    return false;
  }

  // Add the new player
  const newPlayer = createPlayer(playerId, false);
  game.players.push(newPlayer);

  // If the game reaches 5 players, add SAMI and start the game
  if (game.players.length === MIN_PLAYERS) {
    const samiID = uuidv4();
    const samiPlayer = createPlayer(samiID, true);
    game.players.push(samiPlayer); // Add SAMI as the sixth player

    // Start the game
    startGame(roomId);
  }

  // If everything succeeds, return true
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

  //const body: {[key: string]: any} = {};
  let body;
  for (const index in cachedMessages) {
    const {playerIndex, message} = cachedMessages[0];
    body = {
      instruction: `YOU ARE PLAYER ${samiPlayer.index + 1} AND PLAYER ${playerIndex + 1} SENT THIS MESSAGE TO THE GROUP CHAT`,
      message,
    };
  }
  console.log(`[${roomId}] Input to Sami: ${JSON.stringify(body)}`);
 
  try {
    const startTime = Date.now();
    // Iniciar solicitud a la IA sin esperar la respuesta (se manejará con timeout)
    const aiResponse = await fetch(`${SAMI_URI}/SAMI-AGENT/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

    // Esperar entre 2 y 7 segundos de manera aleatoria antes de la siguiente ejecución
    const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

processRoomsMessages();