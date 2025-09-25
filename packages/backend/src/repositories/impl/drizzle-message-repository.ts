import { db as defaultDb } from "@db/drizzle";
import { messages } from "@db/schema";
import { TempMessage } from "@src/repositories/message-repository";

export class DrizzleMessageRepository {
  constructor(private db = defaultDb) {}

  async bulkInsert(roomId: string, arr: TempMessage[], tx = this.db) {
    if (!arr.length) return;
    await tx.insert(messages).values(
      arr.map(m => ({
        roomId,
        playerId: m.playerId ?? null,
        message: m.message,
        isPlayerAi: m.isPlayerAI,
      }))
    );
  }
}
