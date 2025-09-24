/**
 * Ethers/contract wiring centralized here so the rest of the codebase
 * does not construct providers/signers manually.
 */

import { Contract, JsonRpcProvider, Wallet, isAddress } from "ethers";
import simpleSami from "@abi/SimpleSAMI.json";
import erc20 from "@abi/ERC20.json";
import { env } from "@config/env";
import logger from "@core/logger";
import { MIN_PLAYERS } from "@src/utils/constants";

// Provider & signer
const provider = new JsonRpcProvider(env.RPC_URL);
const signer = new Wallet(env.PRIVATE_KEY, provider);

// Contract instance (connected with signer for writes)
const contract = new Contract(env.SIMPLE_SAMI_ADDRESS, simpleSami.abi, signer);

const usdcRead = new Contract(env.USDC_ADDRESS, erc20.abi, provider);

/** Check balances & allowances for each owner before calling the on-chain start. */
export const preflightUSDC = async (owners: string[]) => {
  const NEED: bigint = await contract.betAmount();

  const spender = String(contract.target);
  const results = await Promise.all(
    owners.map(async (o) => {
      const [bal, allo] = await Promise.all([
        usdcRead.balanceOf(o),
        usdcRead.allowance(o, spender),
      ]);
      return { owner: o, balance: bal as bigint, allowance: allo as bigint };
    })
  );

  const bad = results.filter(r => r.balance < NEED || r.allowance < NEED);
  return { ok: bad.length === 0, bad, results, need: NEED, spender };
};

/**
 * Start a game with the provided player addresses.
 * - Expects every player to have approved `betAmount` beforehand (per on-chain docs).
 * - On success, returns [true, []].
 * - If the contract reverts with GameStartedFailed(address[], uint256),
 *   returns [false, failedAddresses].
 */
export const startGameOnChain = async (players: string[]): Promise<[boolean, string[]]> => {
  // Basic input checks
  if (!Array.isArray(players)) {
    throw new Error("players must be an array of addresses");
  }
  //const unique = [...new Set(players.map(p => p.trim()))].filter(Boolean);
  const unique = players;
  if (unique.length < MIN_PLAYERS) {
    logger.info("Not enough players provided; aborting startGame.");
    return [false, []];
  }
  const invalid = unique.filter(p => !isAddress(p));
  if (invalid.length > 0) {
    throw new Error(`Invalid player address(es): ${invalid.join(", ")}`);
  }

  try {
    logger.debug({ players: unique }, "startGame called");
    const tx = await contract.startGame(unique);
    logger.info({ hash: tx.hash }, "startGame transaction sent");

    const receipt = await tx.wait();
    logger.info({ txHash: tx.hash, status: receipt?.status }, `Game started with ${unique.length} players`);
    return [true, []];
  } catch (err: any) {
    // Try to extract raw revert data from various ethers/provider shapes
    const rawData =
      err?.data ??
      err?.error?.data ??
      err?.info?.error?.data ??
      (typeof err?.error?.body === "string" ? (() => {
        try { return JSON.parse(err.error.body)?.error?.data; } catch { return undefined; }
      })() : undefined);

    try {
      if (rawData) {
        const parsed = contract.interface.parseError(rawData);
        if (parsed?.name === "GameStartedFailed") {
          const failed = (parsed.args?.[0] ?? []) as string[];
          return [false, failed];
        }
        if (parsed?.name === "OwnableUnauthorizedAccount") {
          // Map friendly reason so el caller pueda reaccionar
          const unauthorized = parsed.args?.[0];
          throw new Error(`ONLY_OWNER: caller ${unauthorized} is not the owner`);
        }
      }
    } catch (_) { /* ignore parse failures */ }

    throw err;
  }
};

/**
 * Sends prizes to a list of winner addresses in a single tx.
 * - Validates input (array, unique, valid addresses).
 * - On success, decodes PrizeSent / PrizeFailed logs and returns a summary.
 * - On pre-loop revert (NoWinners / InsufficientPot), decodes the custom error.
 *
 * @returns {
 *   txHash: string;
 *   successes: Array<{ winner: string; amount: string }>;
 *   failures: Array<{ winner: string; amount: string; returnData: string }>;
 * }
 */
export const sendPrizesToWinners = async (winners: string[]) => {
  if (!Array.isArray(winners)) {
    throw new Error("winners must be an array of addresses");
  }
  //const unique = [...new Set(winners.map(w => w?.trim()))].filter(Boolean) as string[];
  const unique = winners;
  if (unique.length === 0) {
    logger.info("No winners; SAMI retains all bets.");
    return { txHash: "", successes: [], failures: [] };
  }
  const invalid = unique.filter(w => !isAddress(w));
  if (invalid.length > 0) {
    throw new Error(`Invalid winner address(es): ${invalid.join(", ")}`);
  }

  try {
    logger.debug({ winners: unique }, "sendPrizesToWinners called");
    const tx = await contract.sendPrizes(unique);
    logger.info({ hash: tx.hash }, "sendPrizes transaction sent");

    const receipt = await tx.wait();
    logger.info({ txHash: tx.hash, status: receipt?.status }, "sendPrizes mined");

    // ---- Parse logs for PrizeSent / PrizeFailed ----
    const successes: Array<{ winner: string; amount: string }> = [];
    const failures: Array<{ winner: string; amount: string; returnData: string }> = [];

    // In ethers v6, `receipt.logs` items have `address`, `topics`, `data`
    const contractAddr = String(contract.target).toLowerCase();

    for (const log of receipt?.logs ?? []) {
      if ((log as any).address?.toLowerCase() !== contractAddr) continue;

      try {
        const parsed = contract.interface.parseLog(log);
        if (!parsed) continue;

        if (parsed.name === "PrizeSent") {
          const [winner, amount] = parsed.args as unknown as [string, bigint];
          successes.push({ winner, amount: amount.toString() });
        } else if (parsed.name === "PrizeFailed") {
          const [winner, amount, ret] = parsed.args as unknown as [string, bigint, string];
          failures.push({ winner, amount: amount.toString(), returnData: ret });
        }
      } catch {
        // Not one of our events; ignore
      }
    }

    return { txHash: tx.hash, successes, failures };
  } catch (err: any) {
    // ---- Decode top-level revert (before loop) for better diagnostics ----
    const rawData =
      err?.data ??
      err?.error?.data ??
      err?.info?.error?.data ??
      (typeof err?.error?.body === "string"
        ? (() => {
            try {
              return JSON.parse(err.error.body)?.error?.data;
            } catch {
              return undefined;
            }
          })()
        : undefined);

    try {
      if (rawData) {
        const parsed = contract.interface.parseError(rawData);
        if (parsed) {
          if (parsed.name === "NoWinners") {
            logger.error("sendPrizes reverted: NoWinners");
            throw new Error("sendPrizes reverted: NoWinners");
          }
          if (parsed.name === "InsufficientPot") {
            const [required, balance] = parsed.args as unknown as [bigint, bigint];
            const msg = `sendPrizes reverted: InsufficientPot (required=${required.toString()}, balance=${balance.toString()})`;
            logger.error(msg);
            throw new Error(msg);
          }
          // Unknown custom error: surface its name/args
          logger.error({ name: parsed.name, args: parsed.args }, "sendPrizes reverted with custom error");
          throw new Error(`sendPrizes reverted: ${parsed.name}`);
        }
      }
    } catch {
      logger.warn("We couldn't identify the error");
    }

    logger.error({ err }, "Error sending prizes");
    throw err;
  }
};

export { provider, signer, contract };