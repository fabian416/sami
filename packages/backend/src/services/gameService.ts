import { Server, Socket } from "socket.io";
import {
  Player,
  createPlayer,
} from "./playerService";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import { contract, sendPrizeToWinner } from "../config/contractConfig";
import { players } from "../server"; // Import player mapping


class GameServiceEmitter extends EventEmitter {}

const gameServiceEmitter = new GameServiceEmitter();

export default gameServiceEmitter;

const MIN_PLAYERS = 3;
const CONVERTATION_PHASE_TIME = 20 * 1000;
const VOTING_PHASE_TIME = 30 * 1000;

interface Game {
  roomId: string;
  players: Player[];
  status: "waiting" | "active" | "voting" | "finished";
  votes: { [playerId: string]: string }; // Mapping who vote who
  isBetGame: boolean,
}
// Simulation and store of data base  in memory
export const games: { [key: string]: Game } = {};

// Encuentra una partida SOLO si es del mismo tipo (apuesta o gratuita)
export const findBetGame = (): Game | null => {
  return _.find(
    _.reverse(Object.values(games)),
    (game) => game.status === "waiting" && game.players.length < MIN_PLAYERS && game.isBetGame === true
  ) || null;
};

export const findFreeGame = (): Game | null => {
  return _.find(
    _.reverse(Object.values(games)),
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
    const newRoomId = `room-${Object.keys(games).length + 1}`;
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

  games[roomId] = newGame; //  Se almacena en la memoria correctamente
  console.log(`New match created ${roomId} | Bet: ${isBetGame}`);

  return newGame;
};

export const joinGame = (roomId: string, playerId: string, isBetGame: boolean): boolean => {
  // Get instance of the created game
  const game = games[roomId];
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
  const game = games[roomId];
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
  const game = games[roomId];
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

const endConversationPhase = async (roomId: string) => {
  const game = games[roomId];

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
  const game = games[roomId];
  if (!game || game.status !== "voting") return; // Ensure game is in the voting phase
  console.log(`[${roomId}] Ending voting phase...`);

  // Store results
  const results: { playerId: string; won: boolean }[] = [];

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

      if (game.isBetGame) {
        const winnerAddress = players[player.id]?.walletAddress;

        if (winnerAddress) {
          console.log(`Sending prize to${winnerAddress}`);
          sendPrizeToWinner(winnerAddress);
        } else {
          console.error(` No wallet address found for player ID: ${player.id}`);
          console.log("Players mapping:", players);
        }
      }
    } else {
      console.log(`[${roomId}] ${player.id} falló. SAMI gana.`);
      results.push({ playerId: player.id, won: false });
    }
  });

  // Emit game over event
  gameServiceEmitter.emit("gameOver", { roomId, results });

  // Mark game as finished
  game.status = "finished";
};

// AUXILIAR FUNCTIONS
// Get a Match by his ID
export const getGameById = (roomId: string) => {
  return games[roomId] || null;
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
