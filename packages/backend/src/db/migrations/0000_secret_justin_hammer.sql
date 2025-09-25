CREATE TABLE "lefters_before_game_starts" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_address" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" uuid NOT NULL,
	"player_id" text,
	"message" text NOT NULL,
	"is_player_ai" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"index" integer,
	"is_ai" boolean DEFAULT false NOT NULL,
	"winner" boolean,
	"left" boolean,
	"wallet_address" text
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text NOT NULL,
	"is_bet_game" boolean DEFAULT false NOT NULL,
	"players" text[] NOT NULL,
	"is_ai_winner" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"room_id" uuid NOT NULL,
	"from_player_id" text NOT NULL,
	"to_player_id" text NOT NULL,
	CONSTRAINT "votes_room_id_from_player_id_pk" PRIMARY KEY("room_id","from_player_id")
);
