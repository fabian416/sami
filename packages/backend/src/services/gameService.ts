import { Server, Socket } from 'socket.io';
import { Player, createPlayer,assignIARole, eliminatePlayer} from './playerService';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../server';

class GameServiceEmitter extends EventEmitter {}

const gameServiceEmitter = new GameServiceEmitter();

export default gameServiceEmitter;

interface Game { 
    roomId: string;
    players: Player[];
    status: 'waiting' | 'active' | 'voting' | 'finished';
    round: number;
    votes: { [playerId: string]: string} // Mapping who vote who
}
// Simulation and store of data base  in memory
export const games : {[key: string]: Game} = {};

// Main function to handle the creation or join to a new match
export const createOrJoin = (playerId: string): { roomId: string; success: boolean } => {
    // Search available match
    let game = findAvailableGame();

    // If no available match, create a new one
    if  (!game) { 
        const newRoomId = `room-${Object.keys(games).length + 1}`;
        game = createNewGame(newRoomId);
    }

    // Join the player to the match
    const success = joinGame(game.roomId, playerId);
    return {roomId: game.roomId, success}
}

// Create a new Match
export const createNewGame = (roomId: string) => {
    const newGame = {
        roomId,
        players: [] as Player[],
        status: 'waiting' as const ,
        round: 0,
        votes: {}
    };

    games[roomId] = newGame;
    return newGame;
};

export const joinGame = (roomId: string, playerId: string,): boolean => {
    // Get instance of the created game
    const game = games[roomId];
    if (!game) return false;

    // Forbid joining if game is active or finished
    if (game.status !== 'waiting') return false;

    // Check if the player already exists
    const existingPlayer = game.players.find((p: Player) => p.id === playerId);
    if (existingPlayer) {
        return false;
    }

    // Add the new player
    const newPlayer = createPlayer(playerId, false);
    game.players.push(newPlayer);

    // If the game reaches 5 players, add SAMI and start the game
    if (game.players.length === 3) { // 5) {
        const samiID = uuidv4();
        const samiPlayer = createPlayer(samiID, true);
        game.players.push(samiPlayer); // Add SAMI as the sixth player

        // Start the game
        startGame(roomId);
    }

    // If everything succeeds, return true
    return true;
};

export const findAvailableGame = ():  Game | null => {
    for (const roomId in games) {
        const game = games[roomId];
        if (game.status === "waiting" && game.players.length < 5) {
            return game;
        }
    }
    return null; // No matches availables
}

function shuffleArray(array: Player[]): Player[] {
    for (let i = array.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
    }
    return array;
}


export const startGame = (roomId: string) => { 
    const game = games[roomId];
    if (!game) return null; // Will need to show a proper error

    // Shuffle the players randomly
    game.players = shuffleArray(game.players);

    // Logic to start the round
    game.status = 'active'
    game.round = 1;

    console.log(`Game started for room: ${roomId}`);
    console.log(`Players in the game:`);
    game.players.forEach((player, index) => {
        console.log(`Index: ${index}, ID: ${player.id}, Role: ${player.isIA ? 'IA' : 'Human'}`);
    });
    // Espera medio segundo antes de emitir el evento gameStarted
    setTimeout(() => {
        gameServiceEmitter.emit("gameStarted", { roomId, game });
        gameServiceEmitter.emit('startConversation', { roomId });
        // Comenzar la fase de conversación
        setTimeout(() => {
            endConversationPhase(roomId);
        }, 15 * 1000)
        //2 * 60 * 1000); // Configurar la duración de la fase de conversación
    }, 500); // Retraso de 500 milisegundos
    // Apply the rules
    // clean votes after voting phase
    // verify if someone got kicked out, etc
    return game;
}

export const recordVote = (roomId: string, voterId: string, votedPlayerId: string): boolean => {
    const game = games[roomId];
    if (!game) {
        console.error(`[recordVote] Game not found for room: ${roomId}`);
        return false;
    }

    // Verify the voter exists in the game and has not been eliminated
    const voter = game.players.find((player) => player.id === voterId);
    if (!voter) {
        console.warn(`[recordVote] Voter ${voterId} does not exist in room: ${roomId}`);
        return false;
    }
    if (voter.isEliminated) {
        console.warn(`[recordVote] Voter ${voterId} is eliminated and cannot vote in room: ${roomId}`);
        return false;
    }

    // Verify the voted player exists in the game and has not been eliminated
    const votedPlayer = game.players.find((player) => player.id === votedPlayerId);
    if (!votedPlayer) {
        console.warn(`[recordVote] Voted player ${votedPlayerId} does not exist in room: ${roomId}`);
        return false;
    }
    if (votedPlayer.isEliminated) {
        console.warn(`[recordVote] Voted player ${votedPlayerId} is eliminated in room: ${roomId}`);
        return false;
    }

    // Register vote
    game.votes[voterId] = votedPlayerId;
    console.log(`[recordVote] Voter ${voterId} voted for ${votedPlayerId} in room: ${roomId}`);
    return true;
};

function endConversationPhase(roomId: string) { 
    const game = games[roomId];
    if (!game) return;

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
    
    game.status = 'voting';
    // 2 Initiate Vote Phase ( Example of 20 seconds)
    gameServiceEmitter.emit('conversationEnded', { roomId });
    gameServiceEmitter.emit('startVoting', roomId); 

    setTimeout(() => { 
        //  Continue after 25 seconds and the register of the votes
        endVotingPhase(roomId)
    }, //2 * 30 * 1000)
    15 * 1000);
}

export const endVotingPhase = (roomId: string) => {
    const game = games[roomId];
    if (!game || game.status !== 'voting') return;  // Make sure game is in 'voting' phase

    console.log(`Ending voting phase for room: ${roomId}`);

    // 1. Count votes
    const voteCount: { [votedId: string]: number } = {};
    for (const voterId in game.votes) {
        const targetId = game.votes[voterId];
        voteCount[targetId] = (voteCount[targetId] || 0) + 1;
    }

    // 2. Identify the most voted
    let maxVotes = -1;
    let maxVotedPlayerId = null;
    for (const [votedId, count] of Object.entries(voteCount)) {
        if (count > maxVotes) {
            maxVotes = count;
            maxVotedPlayerId = votedId;
        }
    }

    // Process the result of the votation
    if (maxVotedPlayerId) {
        const votedPlayer = game.players.find(p => p.id === maxVotedPlayerId);
        if (votedPlayer) {
            eliminatePlayer(votedPlayer);

            // Check if the player eliminated was the IA
            if (votedPlayer.isIA) {
                console.log('IA was eliminated. Game over.');
                game.status = 'finished';
                gameServiceEmitter.emit('gameOver', { roomId, winner: 'humans' });
                return;
            }

            console.log(`Player ${votedPlayer.id} eliminated as a result of the vote.`);
            // Emit an event to inform clients
            gameServiceEmitter.emit('playerEliminated', { roomId, playerId: votedPlayer.id });
        }
    }

    // Decide what continue after the votation
    if (game.round === 1) {
        game.round++;  // Go into the next round, round 2
        game.status = 'active';  // Cambiar el estado para seguir jugando
        setTimeout(() => startConversationPhase(roomId), 1000);  // Initiate another phase of conversation after 1 second
    } else {
        console.log('Maximum rounds reached or no clear decision. Game over.');
        game.status = 'finished';  // Finalizar el juego después de las rondas máximas
        gameServiceEmitter.emit('gameOver', { roomId, winner: 'ia' });
    }
};

function startConversationPhase(roomId: string) {
    const game = games[roomId];
    if (!game || game.status !== 'active') return;

    console.log(`Starting conversation phase for room: ${roomId}`);
    // Emit for the controller
    gameServiceEmitter.emit('startConversation', { roomId });

    game.votes = {};  // Reset votes for the new round

    // Logic for the conversation phase (e.g., allow players to chat for two minutes)
    setTimeout(() => {
        endConversationPhase(roomId);
    }, 
     15 * 1000);   
    //2 * 60 * 1000); // Establece la duración de la fase de conversación
}

// Get a Match by his ID
export const getGameById = (roomId: string) => {
    return games[roomId] || null ;
};
