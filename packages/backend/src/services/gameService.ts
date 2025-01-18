import express from 'express';
import { Player, createPlayer,assignIARole, eliminatePlayer} from './playerService';
import { timeStamp } from 'console';


interface Game { 
    roomId: string;
    players: Player[];
    status: 'waiting' | 'active' | 'finished';
    round: number;
    votes: { [playerId: string]: string} // Mapping who vote who
}
// Simulation and store of data base  in memory
export const games : {[key: string]: Game} = {};

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
    }, 2 * 60 * 1000);
    // Apply the rules
    // clean votes after voting phase
    // verify if someone got kicked out, etc
    return game;
}

export const recordVote = (roomId: string, voterId: string, votedId: string): boolean => { 
    const game = games[roomId];
    if (!game) return false;

    // Verify the voter wasn't eliminated
    const voterPlayer = game.players.find((p: Player) => p.id === voterId);
    if (!voterPlayer || voterPlayer.isEliminated) return false;
   
    // Verify the voter exist 
    const votedPlayer = game.players.find((p:Player) => p.id === votedId);
    if (!votedPlayer || votedPlayer.isEliminated) return false;

    //Register the Vote
    game.votes[voterId] = votedId;
    return true;
}

function endConversationPhase(roomId: string) { 
    const game = games[roomId];
    if (!game) return;

    // 1 Delete players who didn't reach 20 chars
    game.players.forEach((p:Player) => {
        if (p.totalChars < 20 ) {
            eliminatePlayer(p)
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
    // 1. Vote Count
    const voteCount : { [votedId: string]: number} = {};

    // iterate every voter in game.votes after the 20 secs period
    for (const voterId in game.votes) { 
        const targetId = game.votes[voterId];
        if(!voteCount[targetId]) { 
            voteCount[targetId] =0
        }
        voteCount[targetId]++;
    }
    // 2. Identify the most voted
    let maxVotes = -1;
    let maxVotedPlayerId: string | null = null;

    for (const votedId in voteCount) { 
        if (voteCount[votedId] > maxVotes) {
            maxVotedPlayerId = votedId;
        }
    }
    
    if (maxVotedPlayerId) {
        // Kick out the most voted
        const votedPlayer = game.players.find((p:Player) => p.id === maxVotedPlayerId);
        if (votedPlayer) { 
            eliminatePlayer(votedPlayer)

            // 3 Verify if was the IA
            if (votedPlayer.isIA) { 
                // Human wins
                game.status = 'finished';
                // It could set a flag like outcome = HUMANS_WIN
                return;
            }
        }
    }

    // If it wasn't the IA or was a empate the game continue
    if (game.round === 1) { 
        nextRound(roomId);
    } else { 
        // if it was the second round and humans didn't found the IA, IA wins
        game.status = 'finished';
    }

    // If there is anyone with more votes
    // 3. Verificar si es la IA => termina el juego o pasa a la siguiente ronda.
}

function nextRound(roomId: string) { 
    const game = games[roomId];
    if (!game) return;

    game.round++;
    // reset total chars to 0 
    game.players.forEach((p: Player) => (p.totalChars = 0));

    // Second conversation
    setTimeout(() => endConversationPhase(roomId), 2 * 60 * 1000);

}

// Get a Match by his ID
export const getGameById = (roomId: string) => {
    return games[roomId] || null ;
};
