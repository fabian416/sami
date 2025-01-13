// Simulation of data base  in memory
const games : {[key: string]: any} = {};

// Create a new Match
export const createNewMatcg = (roomId: string) => {
    const newGame = {
        roomId,
        players: [],
        status: 'waiting',
        rounds: 0,
    };
    games[roomId] = newGame;
    return newGame;
};

// Get a Match by his ID
export const getGameById = (roomId: string) => {
    return games[roomId] || null ;
};
