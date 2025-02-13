import { rooms } from "./gameService";
import { EventEmitter } from "events";


class PlayerServiceEmitter extends EventEmitter {}

const playerServiceEmitter = new PlayerServiceEmitter();

export default playerServiceEmitter;

// Interface to describe a player
export interface Player{
    id: string;
    index?: number;
    totalChars: number;
    isAI: boolean;
    isEliminated: boolean; // Indicate if was eliminated because of votation of because it didn't fullfill the minimum 20 chars
}

// Create a new player
export const createPlayer = (playerId: string, isAI = false): Player => { 
    return  {
        id: playerId,
        totalChars: 0,
        isAI,
        isEliminated: false
    };
};
// Increment the amount of chars while he is sendind messages
// If he reach 20 it does not keep counting
export const addCharsToPlayer = (roomId: string, playerId: string, charCount: number) => { 
    const game = rooms[roomId];
    if (!game) return false;
    // find the player
    const player = game.players.find((p: Player) => p.id === playerId);
    if (!player) return false;

    // Incrementar chars (tope en 20, si quieres)
    player.totalChars = Math.min(player.totalChars + charCount, 20);
}

export const eliminatePlayer = (player: Player) => {
    player.isEliminated = true;
}

export const assignIARole = (player: Player) => {
    player.isAI = true; 
};

