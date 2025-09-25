import { db } from "@db/drizzle";
import { Game } from "@domain/game.types";
import { DrizzleRoomRepository } from "@repositories/impl/drizzle-room-repository";
import { DrizzlePlayerRepository } from "@repositories/impl/drizzle-player-repository";
import { DrizzleVoteRepository } from "@repositories/impl/drizzle-vote-repository";
import { DrizzleMessageRepository } from "@repositories/impl/drizzle-message-repository";

export class GamePersistenceService {
  constructor(
    private roomsRepo = new DrizzleRoomRepository(),
    private playersRepo = new DrizzlePlayerRepository(),
    private votesRepo = new DrizzleVoteRepository(),
    private messagesRepo = new DrizzleMessageRepository(),
    private getRoomMessages: (tempRoomId: string) => { playerId?: string; message: string; isPlayerAI: boolean }[] | undefined
  ) {}

  async saveGameData(game: Game, samiIsTheWinner: boolean): Promise<void> {
    await db.transaction(async (tx: any) => {
      const { id: persistedRoomId } = await this.roomsRepo.insertFromGame(game, samiIsTheWinner, tx);
      await this.playersRepo.upsertMany(game.players, tx);
      await this.votesRepo.upsertMany(persistedRoomId, game.votes, tx);
      const msgs = this.getRoomMessages(game.roomId) ?? [];
      await this.messagesRepo.bulkInsert(persistedRoomId, msgs, tx);
      console.log(`[${persistedRoomId}] Game data saved successfully.`);
    });
  }
}
