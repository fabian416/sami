import { ethers } from "ethers";
import dotenv from "dotenv";
import SimpleSAMI from "../abi/SimpleSAMI.json"; 

// Load env variables
dotenv.config();

// Blockchain Provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Dirección del contrato desplegado (debe estar en `.env`)
const contractAddress = process.env.CONTRACT_ADDRESS;

// ABI del contrato (puedes importar el JSON generado por Hardhat/Foundry)

// Instancia del contrato
const contract = new ethers.Contract(contractAddress, SimpleSAMI.abi, provider);

export { provider, contract };