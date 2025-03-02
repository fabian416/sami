import { EventEmitter } from "events";
import { players } from "@src/server";

class PlayerServiceEmitter extends EventEmitter {}

const playerServiceEmitter = new PlayerServiceEmitter();

export default playerServiceEmitter;

// Interface to describe a player
export interface Player{
    id: string;
    socketId?: string;
    walletAddress?: string
    index?: number;
    isAI: boolean;
    left: boolean;
    winner: boolean;
}

// Create a new player
export const createPlayer = (playerId: string, socketId?: string): Player => {
    const walletAddress = socketId ? players[socketId].walletAddress : undefined;
    return  {
        id: playerId,
        socketId,
        walletAddress,
        isAI: socketId ? false : true,
        winner: false,
        left: false,
    };
};

/*
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
}*/

export const assignIARole = (player: Player) => {
    player.isAI = true; 
};

