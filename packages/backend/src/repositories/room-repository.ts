import { Game } from "@domain/game.types";
export interface RoomRepository {
  insertFromGame(game: Game, isAIWinner: boolean, tx?: any): Promise<{ id: string }>;
}