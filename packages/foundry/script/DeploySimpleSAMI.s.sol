// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./DeployHelpers.s.sol";
import {USDCSimpleSAMI} from "../contracts/USDCSimpleSAMI.sol";

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
contract DeploySimpleSAMI is ScaffoldETHDeploy {
    /**
     * @dev Opción A: corre sin args y toma la address del USDC de env var `USDC`
     * Requiere: export USDC=0x... (o USDC en .env + source)
     */
    function run() external ScaffoldEthDeployerRunner returns (address) {
        address usdc = vm.envAddress("USDC");
        return _deploy(usdc);
    }

    /**
     * @dev Opción B: corre con parámetro explícito
     * forge script ... --sig "run(address)" 0xUSDC...
     */
    function run(address usdcAddress) external ScaffoldEthDeployerRunner returns (address) {
        return _deploy(usdcAddress);
    }

    function _deploy(address usdc) internal returns (address) {
        USDCSimpleSAMI simpleSAMI = new USDCSimpleSAMI(usdc);

        console.logString(
            string.concat("SimpleSAMI deployed at: ", vm.toString(address(simpleSAMI)))
        );

        // Config inicial (ajustá si corresponde)
        simpleSAMI.setBetAmount(1 * 1e6); // 1 USDC con 6 decimales

        // Registrar para export a deployments/<chainId>.json
        _registerDeployment("USDCSimpleSAMI", address(simpleSAMI));

        return address(simpleSAMI);
    }
}
