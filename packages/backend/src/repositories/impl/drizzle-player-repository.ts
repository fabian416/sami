import { db as defaultDb } from "@db/drizzle";
import { players } from "@db/schema";

export class DrizzlePlayerRepository {
  constructor(private db = defaultDb) {}

  async upsertMany(arr: any[], tx = this.db) {
    if (!arr.length) return;
    
    await Promise.all(arr.map(p =>
      tx.insert(players).values({
        id: p.id,
        index: p.index ?? null,
        isAi: p.isAI,
        winner: p.winner ?? null,
        left: p.left ?? null,
        walletAddress: p.walletAddress ?? null,
      }).onConflictDoUpdate({
        target: players.id,
        set: {
          index: p.index ?? null,
          isAi: p.isAI,
          winner: p.winner ?? null,
          left: p.left ?? null,
          walletAddress: p.walletAddress ?? null,
        }
      })
    ));
  }
}
