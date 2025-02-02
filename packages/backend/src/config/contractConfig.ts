import { ethers } from "ethers";
import dotenv from "dotenv";
import SimpleSAMI from "../abi/SimpleSAMI.json"; 

// Load env variables
dotenv.config();

// Blockchain Provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Dirección del contrato desplegado (debe estar en `.env`)
const modeContractAddress = "0x5ba1b40c2503b716bcb67c439a63bbfe3071147d";

// Instance of the contract
const contract = new ethers.Contract(modeContractAddress, SimpleSAMI.abi, provider);

export { provider, contract };