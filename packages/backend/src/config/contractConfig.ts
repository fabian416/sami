import { ethers, JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
import SimpleSami from "@abi/SimpleSAMI.json";

dotenv.config();

//  set provider
const provider = new JsonRpcProvider(process.env.RPC_URL);

//  Set the signer with the private key
const privateKey =
  process.env.PRIVATE_KEY || "Debes configurar una clave privada";
const signer = new ethers.Wallet(privateKey, provider);

//  Instance of the contract in order to read and write
const contract = new ethers.Contract(
  "0x500FA05407c9f39Cc188B28dc28814b609e43788",
  SimpleSami.abi,
  signer
);

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
