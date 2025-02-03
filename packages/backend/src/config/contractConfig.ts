import { ethers, JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
import SimpleSAMI from "../abi/SimpleSAMI.json";

dotenv.config();

//  set provider
const provider = new JsonRpcProvider(process.env.RPC_URL);

//  Set the signer with the private key
const privateKey = process.env.PRIVATE_KEY || "Debes configurar una clave privada";
const signer = new ethers.Wallet(privateKey, provider);

//  Instance of the contract in order to read and write
const contract = new ethers.Contract("0x533DEbde0849BaF70f56e9d66852b4a14EF9Dc3A", SimpleSAMI.abi, signer);

export const sendPrizeToWinner = async (winner: string) => {
    try {
        console.log(`Sending prize to ${winner}`);
        const tx = await contract.sendPrize(winner);
        await tx.wait();
        console.log(`Prize sent to ${winner}`);
    } catch (error) {
        console.error(`Error sending prize ${winner}:`, error);
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