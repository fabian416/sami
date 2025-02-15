// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Script, console } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMintableToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract MintTokens is Script {
    function run() external {
        // Dirección del contrato del token (cambiar por la dirección real en la red)
        address tokenAddress = 0xe1Cde8a9C3cB7455BbEefB86003Fc8c959776875; 

        // Dirección a la que se enviarán los tokens
        address recipient = vm.envAddress("RECIPIENT"); 

        // Cantidad a mintear (ejemplo: 1000 USDC con 6 decimales)
        uint256 mintAmount = 1000 * 1e6;

        // Iniciar la transmisión de la transacción con el deployer
        vm.startBroadcast();

        // Instanciar el contrato del token
        IMintableToken token = IMintableToken(tokenAddress);

        // Mintear tokens
        token.mint(recipient, mintAmount);

        console.log("Minted", mintAmount, "tokens to", recipient);

        // Finalizar transmisión
        vm.stopBroadcast();
    }
}