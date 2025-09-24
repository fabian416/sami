/**
 * Config routes: exposes environment-dependent config for clients/admin tools.
 * Reads ONLY from @config/env (single source of truth).
 */
import { Router } from "express";
import { env } from "@config/env";

const router = Router();

/**
 * GET /api/config
 * Returns selected addresses and current app environment.
 * DO NOT expose secrets here (no private keys, no service keys).
 */
router.get("/", (_req, res) => {
  res.json({
    environment: env.APP_ENV,                 // "development" | "staging" | "production"
    simpleSamiContractAddress: env.SIMPLE_SAMI_ADDRESS,
    usdcContractAddress: env.USDC_ADDRESS,
  });
});

export default router;