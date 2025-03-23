import { ethers, JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
import simpleSami from "@abi/SimpleSAMI.json";

dotenv.config();

// Detect environment
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";

// Set contract address based on environment
const RPC_URL = ENVIRONMENT === "production"
  ? process.env.MANTLE_RPC_URL_PRODUCTION
  : process.env.MANTLE_RPC_URL_DEVELOPMENT;
if (!RPC_URL) {
  throw new Error("Missing RPC URL in environment variables");
}

// Set contract address based on environment
const CONTRACT_ADDRESS = ENVIRONMENT === "production"
  ? process.env.MANTLE_MAINNET_SIMPLE_SAMI_ADDRESS
  : process.env.MANTLE_SEPOLIA_SIMPLE_SAMI_ADDRESS;
if (!CONTRACT_ADDRESS) {
  throw new Error("Missing contract addresses in environment variables");
}
// Validate private key
const privateKey = ENVIRONMENT === "production"
  ? process.env.PRIVATE_KEY_PRODUCTION
  : process.env.PRIVATE_KEY_DEVELOPMENT;

if (!privateKey) {
  throw new Error("Missing PRIVATE_KEY in environment variables");
}

// Initialize provider and signer
const provider = new JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(privateKey, provider);

// Instance of the contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, simpleSami.abi, signer);

export const sendPrizesToWinners = async (winners: string[]) => {
  try {
    console.log(
      `sendPrizesToWinners called with winners: ${JSON.stringify(winners)}`
    );

    if (winners.length === 0) {
      console.log("No winners, SAMI won all bets!.");
    } else {
      const tx = await contract.sendPrizes(winners);
      console.log("sendPrizes transaction sent:", tx.hash);

      await tx.wait();
      console.log(`Prizes sent successfully to: ${winners.join(", ")}`);
    }
  } catch (error) {
    console.error(`Error sending prizes:`, error);
  }
};

export { provider, signer, contract };
