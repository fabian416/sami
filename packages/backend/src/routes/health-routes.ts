/**
 * Health routes:
 * - /live  : liveness probe (process is up)
 * - /ready : readiness probe (dependencies OK - keep it cheap)
 *
 * Keep these endpoints lightweight; infra/load-balancers hit them often.
 */
import { Router, type RequestHandler } from "express";
import { env } from "@config/env";

const router = Router();

/** Liveness: process is running. Avoid heavy checks here. */
router.get("/live", (_req, res) => {
  res.status(200).json({
    status: "ok",
    appEnv: env.APP_ENV,
    uptimeSec: Math.floor(process.uptime()),
    nowIso: new Date().toISOString(),
  });
});

/** Readiness: add cheap dependency checks if needed. */
const readyHandler: RequestHandler = async (_req, res) => {
  try {
    // TODO: add lightweight checks here if you want (e.g., a quick DB ping)
    res.status(200).json({
      status: "ready",
      appEnv: env.APP_ENV,
      nowIso: new Date().toISOString(),
    });
  } catch (e) {
    // If a dependency fails, report not ready
    res.status(503).json({
      status: "not_ready",
      reason: "dependency check failed",
    });
  }
};

router.get("/ready", readyHandler);

export default router;
