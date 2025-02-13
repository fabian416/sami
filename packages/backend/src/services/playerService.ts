import { rooms } from "./gameService";
import { EventEmitter } from "events";
import supabase from "@config/supabaseClient";


class PlayerServiceEmitter extends EventEmitter {}

const playerServiceEmitter = new PlayerServiceEmitter();

export default playerServiceEmitter;

export interface Player{
    id: string;
    index?: number;
    is_ai: boolean;
    is_eliminated: boolean;
}


export const createPlayer = async (playerId: string, isAI = false) => {
    const { data, error } = await supabase
      .from("players")
      .insert([{ id: playerId, is_ai: isAI, is_eliminated: false}])
      .select()
      .single();
  
    if (error) {
      console.error("[Backend] Error al insertar en Supabase:", error);
      return null;
    }
    return data;
};


export const findPlayerById = async (playerId: string) => {
    const { data, error } = await supabase
      .from("players")
      .select()
      .eq("id", playerId)
      .limit(1)
      .single();
  
    if (error) {
      console.error("[Backend] Error finding player:", error);
      return null;
    }
  
    return data;
};

export const updatePlayerIndex = async (playerId: string, playerIndex: number): Promise<Player | null> => {
    const { data, error } = await supabase
      .from("players")
      .update({ index: playerIndex })
      .eq("id", playerId)
      .limit(1)
      .single();
  
    if (error) {
      console.error("[Backend] Error updating player:", error);
      return null;
    }
  
    return data;
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

