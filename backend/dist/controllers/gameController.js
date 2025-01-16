"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGame = exports.castVote = exports.createGame = void 0;
const gameService_1 = require("../services/gameService");
// Create a new match
// not async YET because is not making any operations to external services
const createGame = (req, res) => {
    const { roomId } = req.body;
    if (!roomId) {
        return res.status(400).json({ message: 'The ID of the room is obligatory!!' });
    }
    const game = (0, gameService_1.createNewGame)(roomId);
    return res.status(201).json({ message: 'Match succesfully created, have fun!', game });
};
exports.createGame = createGame;
const castVote = (req, res) => {
    const { roomId, voterId, votedId } = req.body;
    // Validation
    if (!roomId || !voterId || !votedId) {
        return res.status(400).json({ message: 'Incomplete data' });
    }
    const success = (0, gameService_1.recordVote)(roomId, voterId, votedId);
    if (!success) {
        return res.status(400).json({ message: 'Failed to register the Vote' });
    }
    return res.status(200).json({ message: 'Success registering the Vote' });
};
exports.castVote = castVote;
// Get info of the match
const getGame = (req, res) => {
    const { id } = req.params;
    const game = (0, gameService_1.getGameById)(id);
    if (!game) {
        return res.status(404).json({ message: 'Match not founf' });
    }
    return res.status(200).json(game);
};
exports.getGame = getGame;
