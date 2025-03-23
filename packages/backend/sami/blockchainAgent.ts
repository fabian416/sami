import { Contract } from "ethers";
import { ethers } from "ethers";

import dotenv from "dotenv";

dotenv.config();
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";

const RPC_URL = ENVIRONMENT === "production"
  ? process.env.MANTLE_RPC_URL_PRODUCTION
  : process.env.MANTLE_RPC_URL_DEVELOPMENT;
if (!RPC_URL) {
  throw new Error("Missing RPC URL in environment variables");
}
const privateKey = ENVIRONMENT === "production"
  ? process.env.PRIVATE_KEY_PRODUCTION
  : process.env.PRIVATE_KEY_DEVELOPMENT;

if (!privateKey) {
  throw new Error("Missing PRIVATE_KEY in environment variables");
}


const provider = new ethers.JsonRpcProvider(RPC_URL);
const initSAMIWallet = new ethers.Wallet(privateKey, provider);
const USDC_SIMPLE_SAMI_ABI = [
    "function sendPrizes(address[] memory _winners) external",
    "event PrizeSent(address indexed winner, uint256 amount)",
    "event ErrorSendingPrize(address indexed winner, uint256 amount)"
];

export class SAMIBlockchainAgent {
    private wallet: ethers.Wallet;
    private contract: Contract;
    private initialized: boolean = false;

    constructor() {
        this.wallet = initSAMIWallet;
        this.contract = new Contract(
            process.env.USDC_SIMPLE_SAMI_ADDRESS || "",
            USDC_SIMPLE_SAMI_ABI,
            this.wallet
        );
    }

    async initialize() {
        if (this.initialized) return;

        const address = await this.wallet.getAddress();
        console.log(`SAMI Blockchain Agent initialized with address: ${address}`);
        this.initialized = true;
    }

    async distributeWinnings(winners: string[]) {
        await this.initialize();

        try {
            const tx = await this.contract.sendPrizes(winners);
            const receipt = await tx.wait();

            console.log(`Prize distribution transaction: ${receipt.transactionHash}`);
            return receipt;
        } catch (error) {
            console.error("Error distributing winnings:", error);
            throw error;
        }
    }

    async processGameResults(gameData: any): Promise<string[]> {
        // Simple winner determination logic - can be enhanced based on game rules
        const players = gameData.players || [];
        const winnerCount = Math.min(3, players.length); // Max 3 winners
        const winners: string[] = [];

        // Randomly select winners (replace with actual game logic from Eliza)
        const shuffled = [...players].sort(() => 0.5 - Math.random());
        for (let i = 0; i < winnerCount; i++) {
            if (shuffled[i]?.walletAddress) {
                winners.push(shuffled[i].walletAddress);
            }
        }

        return winners;
    }

    getWalletAddress(): Promise<string> {
        return this.wallet.getAddress();
    }
}

export const samiBlockchainAgent = new SAMIBlockchainAgent();