/**
 * Minimal Pino logger:
 * - Level from env (default debug in dev, info in prod).
 * - Pretty print in non-production.
 * - No redaction, no extra formatters.
 */
import pino, { LoggerOptions } from "pino";
import { env, isProd } from "@config/env";

const level = (env as any).LOG_LEVEL ?? (isProd ? "info" : "debug");

let transport: LoggerOptions["transport"] | undefined = undefined;

if (!isProd) {
  try {
    // Resolve absolute path to pino-pretty to avoid "unable to determine transport target"
    const target = require.resolve("pino-pretty");
    transport = {
      target,
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        singleLine: false,
        ignore: "pid,hostname",
      },
    };
  } catch (e) {
    // Fallback: run without pretty if not installed/resolve fails
    // (Keeps dev working instead of crashing)
    console.warn("pino-pretty not available, falling back to raw JSON logs.");
  }
}

const logger = pino({
  level,
  base: { service: "backend", app_env: env.APP_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport,
});

export default logger;
export const withLogger = (bindings: Record<string, unknown>) =>
  logger.child(bindings);
