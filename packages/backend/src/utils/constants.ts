
import dotenv from "dotenv";
dotenv.config();

export const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";

export const allowedOrigins = [
  "https://playsami.fun",
  ...(ENVIRONMENT !== "production" ? ["https://staging.playsami.fun", "http://localhost:3001", "https://8lh8dmll-3001.brs.devtunnels.ms"] : [])
];


const AGENT_URL = process.env.AGENT_URL;
export const SAMI_URI = AGENT_URL || "http://localhost:3000";

export const MIN_PLAYERS = 3;
export const CONVERTATION_PHASE_TIME = 60 * 1000;
export const VOTING_PHASE_TIME = 15 * 1000;

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const CHAT_ID = -1002404242449;