//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { DeployMockUSDC } from "./DeployMockUSDC.s.sol";
// import { DeployTicketSystem } from "./DeployTicketSystem.s.sol";
import { DeploySimpleSAMI } from "./DeploySimpleSAMI.s.sol";

/**
 * @notice Main deployment script for all contracts
 * @dev Run this when you want to deploy multiple contracts at once
 *
 * Example: yarn deploy # runs this script(without`--file` flag)
 */
contract DeployScript is ScaffoldETHDeploy {
    // address public MODE_TOKEN = 0x56C4c8dbb6E9598b90119686c40271a969e1eE44;
    function run() external returns (address mockUSDC, address simpleSAMI) {
        // Deploys all your contracts sequentially
        // Add new deployments here when needed
        
        DeploySimpleSAMI deploySimpleSAMI = new DeploySimpleSAMI();
        simpleSAMI = deploySimpleSAMI.run(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);

        // DeployTicketSystem deployTicketSystem = new DeployTicketSystem();
        // ticketSystem = deployTicketSystem.run(mockUSDC);
    }
}
