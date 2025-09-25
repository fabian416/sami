import { db as defaultDb } from "@db/drizzle";
import { rooms } from "@db/schema";
import { Game } from "@domain/game.types";

export class DrizzleRoomRepository {
  constructor(private db = defaultDb) {}

  async insertFromGame(game: Game, isAIWinner: boolean, tx = this.db) {
    const [row] = await tx.insert(rooms).values({
      status: game.status,
      isBetGame: game.isBetGame,
      players: game.players.map(p => p.id),
      isAiWinner: isAIWinner,
    }).returning({ id: rooms.id });
    return { id: row.id };
  }
}
