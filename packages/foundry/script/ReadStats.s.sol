// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Script, console } from "forge-std/Script.sol";
import { TicketSystem } from "../contracts/TicketSystem.sol"; // Asegúrate de importar correctamente

contract ReadStats is Script {
    function run() external {
        // Dirección del contrato TicketSystem desplegado (cambia esta dirección por la real)
        address ticketSystemAddress = 0x8d06D63e2D74413b972dCd23F943b3E73028f96F;

        // Iniciar la transmisión de la transacción en modo lectura (no gasta gas)
        vm.startBroadcast();

        // Instanciar el contrato
        TicketSystem ticketSystem = TicketSystem(ticketSystemAddress);

        // Leer los valores de samiWins y totalRounds
        uint256 samiWins = ticketSystem.samiWins();
        uint256 totalRounds = ticketSystem.totalRounds();

        // Llamar la función getWinRatioCoefficient
        uint256 winRatioCoefficient = ticketSystem.getWinRatioCoefficient();

        // Mostrar los valores en la consola
        console.log("El valor de samiWins es:", samiWins);
        console.log("El valor de totalRounds es:", totalRounds);
        console.log("El coeficiente de victorias (Win Ratio Coefficient) es:", winRatioCoefficient);

        // Finalizar transmisión
        vm.stopBroadcast();
    }
}