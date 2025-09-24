/**
 * Config routes: exposes environment-dependent config for clients/admin tools.
 * Reads ONLY from @config/env (single source of truth).
 */
import { Router } from "express";
import { env, isProd } from "@config/env";

const router = Router();

/**
 * GET /api/config
 * Returns selected addresses and current app environment.
 * DO NOT expose secrets here (no private keys, no service keys).
 */
router.get("/", (_req, res) => {
  const CHAIN_ID_HEX = isProd ? "0x89" : "0x13882";

  res.json({
    environment: env.APP_ENV,                 // "development" | "staging" | "production"
    simpleSamiContractAddress: env.SIMPLE_SAMI_ADDRESS,
    usdcContractAddress: env.USDC_ADDRESS,
    chainId: CHAIN_ID_HEX,
    rpcUrl: env.RPC_URL
  });
});

export default router;