import e from 'express';
import { Player, createPlayer, addCharsToPlayer, eliminatePlayer} from './playerService';


interface Game { 
    roomId: string;
    players: Player[];
    status: 'waiting' | 'active' | 'finished';
    round: number;
}

// Simulation and store of data base  in memory
const games : {[key: string]: any} = {};

// Create a new Match
export const createNewGame = (roomId: string) => {
    const newGame = {
        roomId,
        players: [],
        status: 'waiting',
        rounds: 0,
    };

    games[roomId] = newGame;
    return newGame;
};

export const joinGame = (roomId: string, playerId: string): boolean => { 
    // get instance of the created game
    const game = games[roomId];
    if (!game) return false;
    // Forbid to join the game if is active or finished
    if (game.status !== 'waiting') return false;

    const existingPlayer = game.players.find((p: Player) => p.id === playerId);
    if (existingPlayer) {
    return true;
    }

    const newPlayer = createPlayer(playerId);
    game.players.push(newPlayer);

    // we're ready to start the round and call the function
    if (game.players.length === 5) {
        startRound(roomId);
    }

    // if everything succed we return true
    return true;
}

export const startRound = (roomId: string) => { 
    const game = games[roomId];
    if (!game) {
        return null; // Will need to show a proper error
    }

    // Logic to start the round
    if (game.status === 'waiting') {
        game.status === 'active';
    } else if (game.satus === 'active') {
        // Next round
        game.round +=1;
    }

    // Apply the rules
    // clean votes after voting phase
    // verify if someone got kicked out, etc
    return game;
}

export const endRound = (roomId: string) =>  {
    const game = games[roomId];
    if(!game) {
        return null;
    }
    // Apply the end of the round 
    // Calculate results
    // delete players
    // Change status from waiting to finished
    game.status = 'finished';
    return game;
}

// Get a Match by his ID
export const getGameById = (roomId: string) => {
    return games[roomId] || null ;
};
