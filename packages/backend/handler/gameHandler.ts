import { samiBlockchainAgent } from "../sami/blockchainAgent";

interface Player {
    id: string;
    walletAddress: string;
    score?: number;
}

interface GameData {
    players: Player[];
    gameId: string;
    completed: boolean;
}

export async function handleGameCompletion(gameData: GameData) {
    try {
        if (!gameData.completed) {
            throw new Error("Game not marked as completed");
        }

        // Process game results to determine winners
        const winners = await samiBlockchainAgent.processGameResults(gameData);

        if (winners.length === 0) {
            console.log(`Game ${gameData.gameId}: No winners determined`);
            return;
        }

        // Distribute prizes to winners
        const receipt = await samiBlockchainAgent.distributeWinnings(winners);

        console.log(`Game ${gameData.gameId}: Prizes distributed to ${winners.length} winners`);
        return receipt;
    } catch (error) {
        console.error(`Error handling game completion for game ${gameData.gameId}:`, error);
        throw error;
    }
}

export function mapPlayerToWallet(playerId: string, walletAddress: string): Player {
    return {
        id: playerId,
        walletAddress: walletAddress
    };
}