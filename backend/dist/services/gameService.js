"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGameById = exports.recordVote = exports.startGame = exports.joinGame = exports.createNewGame = exports.games = void 0;
const playerService_1 = require("./playerService");
// Simulation and store of data base  in memory
exports.games = {};
// Create a new Match
const createNewGame = (roomId) => {
    const newGame = {
        roomId,
        players: [],
        status: 'waiting',
        round: 0,
        votes: {}
    };
    exports.games[roomId] = newGame;
    return newGame;
};
exports.createNewGame = createNewGame;
const joinGame = (roomId, playerId) => {
    // get instance of the created game
    const game = exports.games[roomId];
    if (!game)
        return false;
    // Forbid to join the game if is active or finished
    if (game.status !== 'waiting')
        return false;
    const existingPlayer = game.players.find((p) => p.id === playerId);
    if (existingPlayer) {
        return true;
    }
    const newPlayer = (0, playerService_1.createPlayer)(playerId);
    game.players.push(newPlayer);
    // we're ready to add SAMI and start the game and call the function
    if (game.players.length === 5) {
        // Add SAMI as the sixth one
        const samiPlayer = (0, playerService_1.createPlayer)("SAMI-AGENT");
        game.players.push(samiPlayer);
        // Total of 6 players 
        (0, exports.startGame)(roomId);
    }
    // if everything succed we return true
    return true;
};
exports.joinGame = joinGame;
const startGame = (roomId) => {
    const game = exports.games[roomId];
    if (!game)
        return null; // Will need to show a proper error
    const randomIndex = Math.floor(Math.random() * 6);
    (0, playerService_1.assignIARole)(game.players[randomIndex]);
    // Logic to start the round
    game.status = 'active';
    game.round = 1;
    setTimeout(() => {
        endConversationPhase(roomId);
    }, 2 * 60 * 1000);
    // Apply the rules
    // clean votes after voting phase
    // verify if someone got kicked out, etc
    return game;
};
exports.startGame = startGame;
const recordVote = (roomId, voterId, votedId) => {
    const game = exports.games[roomId];
    if (!game)
        return false;
    // Verify the voter wasn't eliminated
    const voterPlayer = game.players.find((p) => p.id === voterId);
    if (!voterPlayer || voterPlayer.isEliminated)
        return false;
    // Verify the voter exist 
    const votedPlayer = game.players.find((p) => p.id === votedId);
    if (!votedPlayer || votedPlayer.isEliminated)
        return false;
    //Register the Vote
    game.votes[voterId] = votedId;
    return true;
};
exports.recordVote = recordVote;
function endConversationPhase(roomId) {
    const game = exports.games[roomId];
    if (!game)
        return;
    // 1 Delete players who didn't reach 20 chars
    game.players.forEach((p) => {
        if (p.totalChars < 20) {
            (0, playerService_1.eliminatePlayer)(p);
        }
    });
    // 2 Initiate Vote Phase ( Example of 20 seconds)
    setTimeout(() => {
        endVotingPhase(roomId);
    }, 20 * 1000);
}
function endVotingPhase(roomId) {
    const game = exports.games[roomId];
    if (!game)
        return;
    // 1. Vote Count
    const voteCount = {};
    // iterate every voter in game.votes after the 20 secs period
    for (const voterId in game.votes) {
        const targetId = game.votes[voterId];
        if (!voteCount[targetId]) {
            voteCount[targetId] = 0;
        }
        voteCount[targetId]++;
    }
    // 2. Identify the most voted
    let maxVotes = -1;
    let maxVotedPlayerId = null;
    for (const votedId in voteCount) {
        if (voteCount[votedId] > maxVotes) {
            maxVotedPlayerId = votedId;
        }
    }
    if (maxVotedPlayerId) {
        // Kick out the most voted
        const votedPlayer = game.players.find((p) => p.id === maxVotedPlayerId);
        if (votedPlayer) {
            (0, playerService_1.eliminatePlayer)(votedPlayer);
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
    }
    else {
        // if it was the second round and humans didn't found the IA, IA wins
        game.status = 'finished';
    }
    // If there is anyone with more votes
    // 3. Verificar si es la IA => termina el juego o pasa a la siguiente ronda.
}
function nextRound(roomId) {
    const game = exports.games[roomId];
    if (!game)
        return;
    game.round++;
    // reset total chars to 0 
    game.players.forEach((p) => (p.totalChars = 0));
    // Second conversation
    setTimeout(() => endConversationPhase(roomId), 2 * 60 * 1000);
}
// Get a Match by his ID
const getGameById = (roomId) => {
    return exports.games[roomId] || null;
};
exports.getGameById = getGameById;
