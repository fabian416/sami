// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { TicketSystem } from "../contracts/TicketSystem.sol";

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
contract DeployTicketSystem is ScaffoldETHDeploy {
    /**
     * @dev Deployer setup based on `ETH_KEYSTORE_ACCOUNT` in `.env`:
     *      - "scaffold-eth-default": Uses Anvil's account #9 (0xa0Ee7A142d267C1f36714E4a8F75612F20a79720), no password prompt
     *      - "scaffold-eth-custom": requires password used while creating keystore
     *
     * Note: Must use ScaffoldEthDeployerRunner modifier to:
     *      - Setup correct `deployer` account and fund it
     *      - Export contract addresses & ABIs to `nextjs` packages
     */
     
    function run() external ScaffoldEthDeployerRunner { 
        TicketSystem ticketSystem = new TicketSystem(0xe1Cde8a9C3cB7455BbEefB86003Fc8c959776875);
        console.logString(string.concat("SimpleSAMI deployed at: ", vm.toString(address(ticketSystem))));

        ticketSystem.setBetAmount(1 * 1e6);
    }
}
