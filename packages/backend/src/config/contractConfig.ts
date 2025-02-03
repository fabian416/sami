import { ethers, JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
import SimpleSAMI from "../abi/SimpleSAMI.json";

dotenv.config();

//  Configurar el provider
const provider = new JsonRpcProvider(process.env.RPC_URL);

//  Configurar el signer con la clave privada
const privateKey = process.env.PRIVATE_KEY || "Debes configurar una clave privada";
const signer = new ethers.Wallet(privateKey, provider);

//  Instancia del contrato usando `signer` para leer/escribir
const contract = new ethers.Contract("0x19AEC51fda7607bfCa72D38C935e4dF17Ec69dC6", SimpleSAMI.abi, signer);

export const sendPrizeToWinner = async (winner: string) => {
    try {
        console.log(`Enviando premio a ${winner}`);
        const tx = await contract.sendPrize(winner);
        await tx.wait();
        console.log(`Premio enviado a ${winner}`);
    } catch (error) {
        console.error(`Error enviando premio a ${winner}:`, error);
    }
};

export const useTicket = async (ticketId: number) => {
    try {
        console.log(`Usando ticket ${ticketId}`);
        const tx = await contract.useTicket(ticketId);
        await tx.wait();
        console.log(`Ticket ${ticketId} ha sido usado`);
    } catch (error) {
        console.error(`Error usando ticket ${ticketId}:`, error);
    }
};

export { provider, signer, contract };