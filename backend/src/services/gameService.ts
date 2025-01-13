// Simulation of data base  in memory
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

export const startRound = (roomId: string) => { 
    const game = games[roomId];
    if (!game) {
        return null; // Will need to show a proper error
    }

    // Logic to start the round
    if (game.status === 'waiting') {
        game.status === 'active';
    } else if (game.sattus === 'active') {
        // Next round
        game.round +=1;
    }

    // Apply the rules
    // clean votes after voting phase
    // verify if someone got kicked out, etc

    return game;
}

const endRound = (roomId: string) =>  {
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
