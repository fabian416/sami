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

interface Game {
  roomId: string;
  players: Player[];
  status: "waiting" | "active" | "voting" | "finished";
  round: number;
  votes: { [playerId: string]: string }; // Mapping who vote who
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
    // 5) {
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

  // Logic to start the round
  game.status = "active";
  game.round = 1;

  console.log(`Game started for room: ${roomId}`);
  console.log(`Players in the game:`);
  game.players.forEach((player, index) => {
    game.players[index].index = index;
    console.log(`Index: ${index}, ID: ${player.id}, Index: ${index}, Role: ${player.isAI ? "AI" : "Human"}`);
  });

  await new Promise((resolve) => setTimeout(resolve, 500)); // Esperar 500ms

  let timeBeforeEnds = 2 * 15 * 1000; // 2 * 60 * 1000;
  //let timeBeforeEnds = 20 * 60 * 1000;
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
  console.log(
    `[recordVote] Voter ${voterId} (${voter.index}) voted for ${votedPlayerId} in room: ${roomId}`
  );
  gameServiceEmitter.emit("voteSubmitted", { roomId, voterId, votedId: votedPlayerId });

  if (game.votes && Object.keys(game.votes).length === game.players.length) {
    endVotingPhase(roomId)
  }

  return true;
};

const endConversationPhase = async (roomId: string) => {
  const game = games[roomId];

  console.log(`Ending conversation phase for room: ${roomId}`);

  // Deactivate the elimination of min 20 charracters test purposes
  /*
    game.players.forEach((p: Player) => {
        if (p.totalChars < 20) {
            eliminatePlayer(p);
            console.log(`Player ${p.id} eliminated for not reaching 20 characters.`);
            gameServiceEmitter.emit('playerEliminated', { roomId, playerId: p.id });
        }
    });
    */

  game.status = "voting";

  //const timeBeforeEnds = 30 * 1000;
  const timeBeforeEnds = 2 * 60 * 1000;
  //const timeBeforeEnds = 15 * 1000;
  const serverTime = Date.now();

  gameServiceEmitter.emit("conversationEnded", { roomId });
  await new Promise((resolve) => setTimeout(resolve, 100)); // Controlar tiempos
  gameServiceEmitter.emit("startVoting", { roomId, timeBeforeEnds, serverTime });
  setTimeout(() => endVotingPhase(roomId), timeBeforeEnds);

  const samiPlayer: any = getSamiPlayer(game);
  const body = JSON.stringify({
    text: `You are Player ${samiPlayer.index}. The round has ended. You must now vote for one of these players: ${game.players.map((p) =>  " " + p.index)}. Respond only with a number. No extra words, just the number. You never are gonna be able to vote for yourself. Take into account if a player has accused you.`,
    userId: "",
    userName: "",
  });

  console.log({body})
  // Start the request to the AI without waiting
  const aiResponsePromise = fetch(`http://localhost:3000/SAMI-AGENT/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  try {
    // Wait for AI response
    const response = await aiResponsePromise;
    const responseText = await response.text();
    console.log("[Backend] Response of Eliza (Before JSON parsing):", responseText);
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("[Backend] Error parsing JSON from Eliza:", jsonError);
      return;
    }

    if (responseData && responseData.length > 0) {
      const agentMessage = responseData[0].text;
      console.log(`[Backend] Response of Eliza: ${agentMessage}`);

      const votedPlayer: any = getSafePlayerIndex(roomId, agentMessage, samiPlayer.index);
      // Register the vote
      const voterId = samiPlayer.id;
      const success = recordVote(roomId, voterId, votedPlayer.id);
      if (!success) {
        console.error(
          `[castVote] Failed to register vote from ${voterId} to ${votedPlayer.id} in room: ${roomId}`
        );
        return;
      }
    }
  } catch (error) {
    console.error("[Backend] Error communicating with Eliza:", error);
  }

}

export const endVotingPhase = (roomId: string) => {
  const game = games[roomId];
  if (!game || game.status !== "voting") return; // Make sure game is in 'voting' phase
  console.log(`Ending voting phase for room: ${roomId}`);

  // 1. Count votes
  const voteCount = _.countBy(Object.values(game.votes));
  // 2. Identify the maximum number of votes
  const maxVotes = _.max(Object.values(voteCount));
  // 3. Find all players with max votes
  const maxVotedPlayers = Object.entries(voteCount)
    .filter(([, count]) => count === maxVotes)
    .map(([playerId]) => playerId);

  // 4. If there's only one player with max votes, eliminate them. Otherwise, no one is eliminated.
  const eliminatedPlayerId = maxVotedPlayers.length === 1 ? maxVotedPlayers[0] : null;

  // Process the result of the votation
  if (eliminatedPlayerId) {
    const votedPlayer = _.find(game.players, { id: eliminatedPlayerId });
    if (votedPlayer) {
      eliminatePlayer(votedPlayer);

      // Check if the player eliminated was the IA
      if (votedPlayer.isAI) {
        console.log("AI was eliminated. Game over.");
        game.status = "finished";
        gameServiceEmitter.emit("gameOver", { roomId, winner: "humans" });
        return;
      }

      console.log(`Player ${votedPlayer.id} eliminated as a result of the vote.`);
      // Emit an event to inform clients
      gameServiceEmitter.emit("playerEliminated", {
        roomId,
        playerId: votedPlayer.id,
      });
    }
  }

  // Decide what continue after the votation
  if (game.round === 1) {
    game.round++; // Go into the next round, round 2
    game.status = "active"; // Cambiar el estado para seguir jugando
    setTimeout(() => startConversationPhase(roomId), 1000); // Initiate another phase of conversation after 1 second
  } else {
    console.log("Maximum rounds reached and no clear decision. Game over.");
    game.status = "finished"; // Finalizar el juego después de las rondas máximas
    gameServiceEmitter.emit("gameOver", { roomId, winner: "ia" });
  }
};

function startConversationPhase(roomId: string) {
  const game = games[roomId];
  if (!game || game.status !== "active") return;

  game.votes = {}; // Reset votes for the new round
  console.log(`Starting conversation phase for room: ${roomId}`);
  
  const timeBeforeEnds = 2 * 60 * 1000;
  // const timeBeforeEnds = 2 * 60 * 1000;
  const serverTime = Date.now();

  gameServiceEmitter.emit("startConversation", { roomId, timeBeforeEnds, serverTime });

  // Logic for the conversation phase (e.g., allow players to chat for two minutes)
  setTimeout(() => { endConversationPhase(roomId) }, timeBeforeEnds);
}



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