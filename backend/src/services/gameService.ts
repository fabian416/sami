import express from 'express';
import { Player, createPlayer,assignIARole, addCharsToPlayer, eliminatePlayer} from './playerService';
import { timeStamp } from 'console';


interface Game { 
    roomId: string;
    players: Player[];
    status: 'waiting' | 'active' | 'finished';
    round: number;
    votes: { [playerId: string]: string} // Mapping who vote who
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

    // we're ready to add SAMI and start the game and call the function
    if (game.players.length === 5) {
        // Add SAMI as the sixth one
        const samiPlayer = createPlayer("SAMI-AGENT");
        game.players.push(samiPlayer);
        // Total of 6 players 
        startGame(roomId);
    }
    
    // if everything succed we return true
    return true;
}

export const startGame = (roomId: string) => { 
    const game = games[roomId];
    if (!game) return null; // Will need to show a proper error

    const randomIndex = Math.floor(Math.random() * 6);
    assignIARole(game.players[randomIndex]);

    // Logic to start the round
    game.status = 'active'
    game.round = 1;
    setTimeout(() => {
        endConversationPhase(roomId);
    }, 3 * 60 * 1000);
    // Apply the rules
    // clean votes after voting phase
    // verify if someone got kicked out, etc
    return game;
}

export const recordVote = (roomId: string, voterId: string, votedId: string): boolean => { 
    const game = games[roomId];
    if (!game) return false;

    const voterPlayer = game.players.find((p: Player) => p.id === voterId);

    return true;
}

function endConversationPhase(roomId: string) { 
    const game = games[roomId];
    if (!game) return;

    // 1 Delete players who didn't reach 20 chars
    game.players.forEach((p:Player) => {
        if (p.totalChars < 20 ) {
            p.isEliminated = true;
        }
    });
    // 2 Initiate Vote Phase ( Example of 20 seconds)
    setTimeout(() => { 
        endVotingPhase(roomId)
    }, 20 * 1000);
}

function endVotingPhase(roomId: string) {
    const game = games[roomId];
    if (!game) return;
      // 1. Contar votos (que fuiste recibiendo por WS o API).
  // 2. Eliminar al más votado.
  // 3. Verificar si es la IA => termina el juego o pasa a la siguiente ronda.

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
