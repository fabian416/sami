import { Player } from "@domain/player.types";
export interface PlayerRepository { upsertMany(players: Player[], tx?: any): Promise<void>; }