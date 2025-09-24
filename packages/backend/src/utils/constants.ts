/**
 * Static app constants derived from validated env.
 * No direct 'dotenv' or process.env access here.
 */
import { env, isProd } from "@config/env";

/** Allowed CORS origins depending on current environment. */
export const allowedOrigins: string[] = [
  "https://playsami.fun",
  ...(isProd
    ? []
    : [
        "https://staging.playsami.fun",
        "http://localhost:3001",
        // Optional dev tunnel origin if set
        ...(env.DEV_TUNNEL_URL ? [env.DEV_TUNNEL_URL] : []),
      ]),
];

/** Base URL for the SAMI Agent service (server-to-server). */
export const SAMI_URI = env.AGENT_URL;

/** Game timing constants (pure domain values). */
export const MIN_PLAYERS = 3;
export const CONVERTATION_PHASE_TIME = 60 * 1000;
export const VOTING_PHASE_TIME = 15 * 1000;

/** Telegram integration (optional). */
export const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
/** Telegram chat id (can be negative). */
export const CHAT_ID = env.TELEGRAM_CHAT_ID ?? -1002404242449;
