"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignIARole = exports.eliminatePlayer = exports.addCharsToPlayer = exports.createPlayer = void 0;
const gameService_1 = require("./gameService");
// Create a new player
const createPlayer = (playerId) => {
    return {
        id: playerId,
        totalChars: 0,
        isIA: false,
        isEliminated: false
    };
};
exports.createPlayer = createPlayer;
// Increment the amount of chars while he is sendind messages
// If he reach 20 it does not keep counting
const addCharsToPlayer = (roomId, playerId, charCount) => {
    const game = gameService_1.games[roomId];
    if (!game)
        return false;
    // find the player
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        return false;
    // Incrementar chars (tope en 20, si quieres)
    player.totalChars = Math.min(player.totalChars + charCount, 20);
};
exports.addCharsToPlayer = addCharsToPlayer;
const eliminatePlayer = (player) => {
    player.isEliminated = true;
};
exports.eliminatePlayer = eliminatePlayer;
const assignIARole = (player) => {
    player.isIA = true;
};
exports.assignIARole = assignIARole;
