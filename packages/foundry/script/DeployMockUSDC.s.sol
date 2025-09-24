// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./DeployHelpers.s.sol";
import {USDC} from "../contracts/USDC.sol";

/**
 * @notice Deploy script for YourContract contract
 * @dev Inherits ScaffoldETHDeploy which:
 *      - Includes forge-std/Script.sol for deployment
 *      - Includes ScaffoldEthDeployerRunner modifier
 *      - Provides `deployer` variable
 * Example:
 * yarn deploy --file DeployYourContract.s.sol  # local anvil chain
 * yarn deploy --file DeployYourContract.s.sol --network optimism # live network (requires keystore)
 */
contract DeployMockUSDC is ScaffoldETHDeploy {
    /**
     * @dev Deployer setup based on `ETH_KEYSTORE_ACCOUNT` in `.env`:
     *      - "scaffold-eth-default": Uses Anvil's account #9 (0xa0Ee7A142d267C1f36714E4a8F75612F20a79720), no password prompt
     *      - "scaffold-eth-custom": requires password used while creating keystore
     *
     * Note: Must use ScaffoldEthDeployerRunner modifier to:
     *      - Setup correct `deployer` account and fund it
     *      - Export contract addresses & ABIs to `nextjs` packages
     */
    function run() external ScaffoldEthDeployerRunner returns (address) {
        // `deployer` provisto por el helper (no es necesario usarlo explícitamente para new)
        USDC mockUsdc = new USDC();

        console.logString(
            string.concat("MockUSDC deployed at: ", vm.toString(address(mockUsdc)))
        );

        // Registrar para export a deployments/<chainId>.json
        _registerDeployment("USDC", address(mockUsdc));

        return address(mockUsdc);
    }
}
