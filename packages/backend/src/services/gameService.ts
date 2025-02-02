import { Server, Socket } from "socket.io";
import {
  Player,
  createPlayer,
  assignIARole,
  eliminatePlayer,
} from "./playerService";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { io } from "../server";
import _ from "lodash";

class GameServiceEmitter extends EventEmitter {}

const gameServiceEmitter = new GameServiceEmitter();

export default gameServiceEmitter;

const MIN_PLAYERS = 3;
const CONVERTATION_PHASE_TIME = 2 * 60 * 1000;
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

// Main function to handle the creation or join to a new match
export const createOrJoin = (
  playerId: string,
  socket: Socket,
  io: Server
): { roomId: string; success: boolean } => {
  // Search available match
  let game = findAvailableGame();

  // If no available match, create a new one
  if (!game) {
    const newRoomId = `room-${Object.keys(games).length + 1}`;
    game = createNewGame(newRoomId);
  }

  // Join the player to the match
  const success = joinGame(game.roomId, playerId);
  return { roomId: game.roomId, success };
};

// Create a new Match
export const createNewGame = (roomId: string) => {
  const newGame = {
    roomId,
    players: [] as Player[],
    status: "waiting" as const,
    round: 0,
    votes: {},
    isBetGame: false,
  };

  games[roomId] = newGame;
  return newGame;
};

export const joinGame = (roomId: string, playerId: string): boolean => {
  // Get instance of the created game
  const game = games[roomId];
  if (!game) return false;

  // Forbid joining if game is active or finished
  if (game.status !== "waiting") return false;

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


export const findAvailableGame = (): Game | null => {
  return _.find(_.reverse(Object.values(games)), (game) => game.status === "waiting" && game.players.length < MIN_PLAYERS) || null;
};

export const startGame = async (roomId: string) => {
  const game = games[roomId];
  if (!game) return null; // Will need to show a proper error

  // Shuffle the players randomly
  game.players = _.shuffle(game.players);
  game.status = "active";

  console.log(`[${roomId}] Starting game...`);
  console.log(`[${roomId}] Players in the game:`);
  game.players.forEach((player, index) => {
    game.players[index].index = index;
    console.log(`Index: ${index}, ID: ${player.id}, Index: ${index}, Role: ${player.isAI ? "AI" : "Human"}`);
  });

  await new Promise((resolve) => setTimeout(resolve, 500)); // Esperar 500ms
  const timeBeforeEnds = CONVERTATION_PHASE_TIME;
  const serverTime = Date.now();
  gameServiceEmitter.emit("gameStarted", { roomId, game, timeBeforeEnds, serverTime });
  await new Promise((resolve) => setTimeout(resolve, 100)); // Esperar 100ms

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

  // Verify the voter exists in the game and has not been eliminated
  const voter = _.find(game.players, { id: voterId });
  if (!voter) {
    console.warn(
      `[recordVote] Voter ${voterId} does not exist in room: ${roomId}`
    );
    return false;
  }
  if (voter.isEliminated) {
    console.warn(
      `[recordVote] Voter ${voterId} is eliminated and cannot vote in room: ${roomId}`
    );
    return false;
  }

  // Verify the voted player exists in the game and has not been eliminated
  const votedPlayer = _.find(game.players, { id: votedPlayerId });
  if (!votedPlayer) {
    console.warn(
      `[recordVote] Voted player ${votedPlayerId} does not exist in room: ${roomId}`
    );
    return false;
  }
  if (votedPlayer.isEliminated) {
    console.warn(
      `[recordVote] Voted player ${votedPlayerId} is eliminated in room: ${roomId}`
    );
    return false;
  }

  // Register vote
  game.votes[voterId] = votedPlayerId;
  console.log(`[${roomId}] Voter ${voterId} (Player ${voter.index}) voted for ${votedPlayerId} (Player ${votedPlayer.index}).`);
  gameServiceEmitter.emit("voteSubmitted", { roomId, voterId, votedId: votedPlayerId });

  // Filtrar solo los jugadores que no han sido eliminados
  const activePlayers = game.players.filter(player => !player.isEliminated);
  const totalVotes = Object.keys(game?.votes).length;

  // Comparar solo con la cantidad de jugadores activos
  if (game.votes && totalVotes === activePlayers.length) {
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
  if (!game || game.status !== "voting") return; // Make sure game is in 'voting' phase
  console.log(`[${roomId}] Ending voting phase...`);

  // Evaluar every player independently
  game.players.forEach((player) => {
    const votedPlayerId = game.votes[player.id];
    const votedPlayer = _.find(game.players, { id: votedPlayerId });

    if (!votedPlayer) {
        console.log(`[${roomId}] ${player.id} no votó correctamente.`);
        gameServiceEmitter.emit("playerLost", { roomId, playerId: player.id });
        return;
    }

    if (votedPlayer.isAI) {
        console.log(`[${roomId}] ¡${player.id} ganó! Identificó a SAMI.`);
        gameServiceEmitter.emit("playerWon", { roomId, playerId: player.id });
    } else {
        console.log(`[${roomId}] ${player.id} falló. SAMI gana.`);
        gameServiceEmitter.emit("playerLost", { roomId, playerId: player.id });
    }
});

game.status = "finished";
};


// AUXILIAR FUNCTIONS
// Get a Match by his ID
export const getGameById = (roomId: string) => {
  return games[roomId] || null;
};

const getPlayerByIndex = (roomId: string, playerIndex: number) => {
  const game = games[roomId];

  return _.find(game.players, { index: playerIndex });
}

const getSafePlayerIndex = (roomId: string, agentMessage: string, agentId: number) => {
  let parsedIndex = parseInt(agentMessage);

  // Si el parseo falla (es NaN), se elige un número válido aleatorio entre 0 y 5
  if (isNaN(parsedIndex) || parsedIndex === agentId) {
    do {
      parsedIndex = Math.floor(Math.random() * MIN_PLAYERS); // Número entre 0 y 5
    } while (parsedIndex === agentId); // Asegurar que no sea el mismo que agentId
  }

  return getPlayerByIndex(roomId, parsedIndex);
};

export const calculateNumberOfPlayers = ({roomId}: {roomId: string}) => {
  const game = getGameById(roomId);
  if (!game) return [-1, -1];

  const partialAmountOfPlayers = _.size(game.players);
  const amountOfPlayers = partialAmountOfPlayers > MIN_PLAYERS ? MIN_PLAYERS : partialAmountOfPlayers;
  return [amountOfPlayers, MIN_PLAYERS];
}

export const getSamiPlayer = (game: Game) => {
  return _.find(game.players, { isAI: true });

}