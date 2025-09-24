import { z } from "zod";

/**
 * Server-side env resolver driven solely by VITE_PUBLIC_ENVIRONMENT.
 * Valid values: "development" | "staging" | "production".
 * Load dotenv once in your entrypoint (e.g., server.ts): `import "dotenv/config"`.
 */

const AppEnvSchema = z.enum(["development", "staging", "production"]).default("development");

const RawEnvSchema = z.object({
  // UI-provided environment flag (we rely on this exclusively)
  VITE_PUBLIC_ENVIRONMENT: AppEnvSchema.optional(),

  // Network
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(5001),

  // RPC URLs
  RPC_URL_STAGING: z.string().optional(),
  RPC_URL_PRODUCTION: z.string().optional(),

  // Contract addresses
  POLYGON_AMOY_SIMPLE_SAMI_ADDRESS: z.string().optional(),
  POLYGON_MAINNET_SIMPLE_SAMI_ADDRESS: z.string().optional(),

  // Usdc addresses
  POLYGON_AMOY_USDC_ADDRESS: z.string().optional(),
  POLYGON_MAINNET_USDC_ADDRESS: z.string().optional(),

  // Private keys
  PRIVATE_KEY_STAGING: z.string().optional(),
  PRIVATE_KEY_PRODUCTION: z.string().optional(),

  // Supabase (service role for backend only)
  SUPABASE_URL_STAGING: z.string().optional(),
  SUPABASE_URL_PRODUCTION: z.string().optional(),
  SUPABASE_SECRET_KEY_STAGING: z.string().optional(),
  SUPABASE_SECRET_KEY_PRODUCTION: z.string().optional(),

  // App URLs / integrations
  AGENT_URL: z.string().optional(),      // SAMI_URI fallback
  DEV_TUNNEL_URL: z.string().optional(), // optional CORS origin

  // Telegram bot
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),     // keep string, we’ll coerce to number
});

const raw = RawEnvSchema.parse(process.env);

/** Current app environment (backend), driven only by VITE_PUBLIC_ENVIRONMENT. */
const APP_ENV: z.infer<typeof AppEnvSchema> = raw.VITE_PUBLIC_ENVIRONMENT ?? "development";

/** Helper to pick per-environment values with a clear error if missing. */
function pickByEnv(
  map: Partial<Record<typeof APP_ENV, string | undefined>>,
  keyLabel: string
): string {
  const value = map[APP_ENV];
  if (!value) throw new Error(`Missing required env for ${keyLabel} in ${APP_ENV}`);
  return value;
}

/** Coerce Telegram chat id to a number when possible (supports negatives). */
function coerceChatId(v?: string) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export const env = {
  APP_ENV,                 // "development" | "staging" | "production"
  HOST: raw.HOST,
  PORT: raw.PORT,

  // EVM / Contracts
  RPC_URL: pickByEnv(
    { 
        development: raw.RPC_URL_STAGING,
        staging: raw.RPC_URL_STAGING,
        production: raw.RPC_URL_PRODUCTION
    },
    "RPC_URL"
  ),
  SIMPLE_SAMI_ADDRESS: pickByEnv(
    {
      development: raw.POLYGON_AMOY_SIMPLE_SAMI_ADDRESS,
      staging: raw.POLYGON_AMOY_SIMPLE_SAMI_ADDRESS,
      production: raw.POLYGON_MAINNET_SIMPLE_SAMI_ADDRESS,
    },
    "SIMPLE_SAMI_ADDRESS"
  ),

  USDC_ADDRESS: pickByEnv(
    {
      development: raw.POLYGON_AMOY_USDC_ADDRESS,
      staging: raw.POLYGON_AMOY_USDC_ADDRESS,
      production: raw.POLYGON_MAINNET_USDC_ADDRESS,
    },
    "USDC_ADDRESS"
  ),

  PRIVATE_KEY: pickByEnv(
    {
      development: raw.PRIVATE_KEY_STAGING,
      staging: raw.PRIVATE_KEY_STAGING,
      production: raw.PRIVATE_KEY_PRODUCTION,
    },
    "PRIVATE_KEY"
  ),

  // Supabase (service role)
  SUPABASE_URL: pickByEnv(
    {
      development: raw.SUPABASE_URL_STAGING,
      staging: raw.SUPABASE_URL_STAGING,
      production: raw.SUPABASE_URL_PRODUCTION,
    },
    "SUPABASE_URL"
  ),
  SUPABASE_SERVICE_KEY: pickByEnv(
    {
      development: raw.SUPABASE_SECRET_KEY_STAGING,
      staging: raw.SUPABASE_SECRET_KEY_STAGING,
      production: raw.SUPABASE_SECRET_KEY_PRODUCTION,
    },
    "SUPABASE_SERVICE_KEY"
  ),

  // App URLs
  AGENT_URL: raw.AGENT_URL ?? "http://localhost:3000",
  DEV_TUNNEL_URL: raw.DEV_TUNNEL_URL,

  // Telegram
  TELEGRAM_BOT_TOKEN: raw.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: coerceChatId(raw.TELEGRAM_CHAT_ID),
} as const;

export const isProd = env.APP_ENV === "production";
export const isStaging = env.APP_ENV === "staging";
export const isDev = env.APP_ENV === "development";
