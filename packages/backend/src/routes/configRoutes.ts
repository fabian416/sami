import { Router } from 'express';
import dotenv from "dotenv";
import { ENVIRONMENT } from '@src/utils/constants';
dotenv.config();

const router = Router();

const simpleSamiContractAddress = ENVIRONMENT === "production"
  ? process.env.BASE_MAINNET_SIMPLE_SAMI_ADDRESS
  : process.env.BASE_SEPOLIA_SIMPLE_SAMI_ADDRESS;

const usdcContractAddress = ENVIRONMENT === "production"
  ? process.env.BASE_MAINNET_USDC_ADDRESS
  : process.env.BASE_SEPOLIA_USDC_ADDRESS;

if (!simpleSamiContractAddress || !usdcContractAddress) {
  throw new Error("Missing contract addresses in environment variables");
}

router.get('/', (_req, res) => {
  res.json({
    environment: ENVIRONMENT,
    simpleSamiContractAddress,
    usdcContractAddress,
  });
});

export default router;
