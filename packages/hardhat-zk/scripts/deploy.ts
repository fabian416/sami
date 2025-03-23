// scripts/deploy-both.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy USDC
  const usdcFactory = await ethers.getContractFactory("USDC");
  const usdc = await usdcFactory.deploy();
  await usdc.waitForDeployment();
  console.log("Mock USDC deployed at:", usdc.target);

  // Deploy SAMI
  const samiFactory = await ethers.getContractFactory("USDCSimpleSAMI");
  const sami = await samiFactory.deploy(usdc.target);
  await sami.waitForDeployment();
  console.log("USDCSimpleSAMI deployed at:", sami.target);

  // Set bet amount
  const tx = await sami.setBetAmount(1 * 1e6);
  await tx.wait();
  console.log("Bet amount set to 1 USDC (1e6)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });