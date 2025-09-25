import { db as defaultDb } from "@db/drizzle";
import { leftersBeforeStart } from "@db/schema";

export class DrizzleLefterRepository {
  constructor(private db = defaultDb) {}

  async insert(id: string, walletAddress?: string | null, tx = this.db) {
    await tx.insert(leftersBeforeStart).values({ id, walletAddress: walletAddress ?? null })
      .onConflictDoNothing();
  }
}
