/**
 * Ethers/contract wiring centralized here so the rest of the codebase
 * does not construct providers/signers manually.
 */

import { Contract, JsonRpcProvider, Wallet } from "ethers";
import simpleSami from "@abi/SimpleSAMI.json";
import { env } from "@config/env";
import logger from "@core/logger";

// Provider & signer
const provider = new JsonRpcProvider(env.RPC_URL);
const signer = new Wallet(env.PRIVATE_KEY, provider);

// Contract instance (connected with signer for writes)
const contract = new Contract(env.SIMPLE_SAMI_ADDRESS, simpleSami.abi, signer);

/**
 * Sends prizes to a list of winner addresses in a single tx.
 * Guards against empty input and logs tx hash.
 */
export const sendPrizesToWinners = async (winners: string[]) => {
  try {
    if (!Array.isArray(winners)) {
      throw new Error("winners must be an array of addresses");
    }
    if (winners.length === 0) {
      logger.info("No winners; SAMI retains all bets.");
      return;
    }

    logger.debug({ winners }, "sendPrizesToWinners called");
    const tx = await contract.sendPrizes(winners);
    logger.info({ hash: tx.hash }, "sendPrizes transaction sent");

    const receipt = await tx.wait();
    logger.info(
      { txHash: tx.hash, status: receipt?.status },
      `Prizes sent to ${winners.join(", ")}`
    );
  } catch (error) {
    logger.error({ error }, "Error sending prizes");
    throw error;
  }
};

export { provider, signer, contract };