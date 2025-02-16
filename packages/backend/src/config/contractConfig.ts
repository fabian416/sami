import { ethers, JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
import TicketSystem from "@abi/TicketSystem.json";

dotenv.config();

//  set provider
const provider = new JsonRpcProvider(process.env.RPC_URL);

//  Set the signer with the private key
const privateKey = process.env.PRIVATE_KEY || "Debes configurar una clave privada";
const signer = new ethers.Wallet(privateKey, provider);

//  Instance of the contract in order to read and write
const contract = new ethers.Contract("0x8d06D63e2D74413b972dCd23F943b3E73028f96F", TicketSystem.abi, signer);

export const sendPrizesToWinners = async (winners: string[]) => {
    try {
        console.log(`sendPrizesToWinners called with winners: ${JSON.stringify(winners)}`);

        if (winners.length === 0) {
            console.log("No winners, calling sendPrizes([]) to update SAMI stats.");
        } else {
            console.log(`Sending prizes to: ${winners.join(", ")}`);
        }

        const tx = await contract.sendPrizes(winners);
        console.log("sendPrizes transaction sent:", tx.hash);

        await tx.wait();
        console.log(`Prizes sent successfully to: ${winners.length > 0 ? winners.join(", ") : "No winners, SAMI won"}`);
    } catch (error) {
        console.error(`Error sending prizes:`, error);
    }
};

export const useTicket = async (ticketId: number) => {
    try {
        console.log(`Using ticket ${ticketId}`);
        const tx = await contract.useTicket(ticketId);
        await tx.wait();
        console.log(`Ticket ${ticketId} has been used`);
    } catch (error) {
        console.error(`Error using ticket ${ticketId}:`, error);
    }
};

export { provider, signer, contract };