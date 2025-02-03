//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
// import { DeployYourContract } from "./DeployYourContract.s.sol";
import { DeploySimpleSAMI } from "./DeploySimpleSAMI.s.sol";
import { DeployMockMODE } from "./DeployMockMODE.s.sol";

/**
 * @notice Main deployment script for all contracts
 * @dev Run this when you want to deploy multiple contracts at once
 *
 * Example: yarn deploy # runs this script(without`--file` flag)
 */
contract DeployScript is ScaffoldETHDeploy {
    // address public MODE_TOKEN = 0x56C4c8dbb6E9598b90119686c40271a969e1eE44;
    function run() external {
        // Deploys all your contracts sequentially
        // Add new deployments here when needed

        DeployMockMODE deployMockMode = new DeployMockMODE();
        address modeToken = deployMockMode.run();

        DeploySimpleSAMI deploySami = new DeploySimpleSAMI();
        deploySami.run();

        // Deploy another contract
        // DeployMyContract myContract = new DeployMyContract();
        // myContract.run();
    }
}
