import { pgTable, text, boolean, integer, uuid, timestamp, serial } from "drizzle-orm/pg-core";
import { primaryKey } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  index: integer("index"),
  isAi: boolean("is_ai").notNull().default(false),
  winner: boolean("winner"),
  left: boolean("left"),
  walletAddress: text("wallet_address"),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").notNull(),
  isBetGame: boolean("is_bet_game").notNull().default(false),
  players: text("players").array().notNull(),
  isAiWinner: boolean("is_ai_winner"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const votes = pgTable("votes", {
  roomId: uuid("room_id").notNull(),
  fromPlayerId: text("from_player_id").notNull(),
  toPlayerId: text("to_player_id").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.roomId, t.fromPlayerId] }),
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: uuid("room_id").notNull(),
  playerId: text("player_id"),
  message: text("message").notNull(),
  isPlayerAi: boolean("is_player_ai").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leftersBeforeStart = pgTable("lefters_before_game_starts", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address"),
});
