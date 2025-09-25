import { db as defaultDb } from "@db/drizzle";
import { votes } from "@db/schema";

export class DrizzleVoteRepository {
  constructor(private db = defaultDb) {}

  async upsertMany(roomId: string, map: Record<string,string>, tx = this.db) {
    const entries = Object.entries(map);
    if (!entries.length) return;

    await Promise.all(entries.map(([from, to]) =>
      tx.insert(votes).values({ roomId, fromPlayerId: from, toPlayerId: to })
        .onConflictDoUpdate({
          target: [votes.roomId, votes.fromPlayerId],
          set: { toPlayerId: to }
        })
    ));
  }
}
