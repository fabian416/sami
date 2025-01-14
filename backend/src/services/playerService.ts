// Interface to describe a player

export interface Player{
    id: string;
    totalChars: number;
    isIA: boolean;
    isEliminated: boolean; // Indicate if was eliminated because of votation of because it didn't fullfill the minimum 20 chars
}

// Create a new player
export const createPlayer = (playerId: string): Player => { 
    return  {
        id: playerId,
        totalChars: 0,
        isIA: false,
        isEliminated: false
    };
};
// Increment the amount of chars while he is sendind messages
// If he reach 20 it does not keep counting
export const addCharsToPlayer = (player: Player, charCount: number) => { 
    player.totalChars += charCount;
}

export const eliminatePlayer = (player: Player) => {
    player.isEliminated = true;
}

export const assignIARole = (player: Player) => {
    player.isIA = true; 
};
