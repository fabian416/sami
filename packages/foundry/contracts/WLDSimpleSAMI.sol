// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title SimpleSAMI - A simple contract for managing tickets and prizes
/// @notice This contract allows users to buy tickets to play SAMI,and allows the owner to send prizes.
contract USDCSimpleSAMI is Ownable {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error SimpleSAMI__TransferFailed();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event GameEntered(address indexed player, uint256 timestamp);
    event PrizeSent(address indexed winner, uint256 amount);
    event ErrorSendingPrize(address indexed winner, uint256 amount);
    event WithdrawFromReserves(uint256 amount);
    event BetAmountChanged(uint256 newBetAmount);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    IERC20 public immutable USDC_TOKEN;
    uint256 public constant DECIMALS = 1e6; // USDC decimals

    uint256 public betAmount;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Initializes the USDC token address and the deployer as the owner
    /// @param _usdcTokenAddress The address of the USDC ERC20 token
    constructor(address _usdcTokenAddress) Ownable(msg.sender) {
        USDC_TOKEN = IERC20(_usdcTokenAddress);
        betAmount = 1 * DECIMALS;
    }

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Allows a user to enter a SAMI game by transferring the bet amount
    /// @dev The user must previosly approve the contract to spend the bet amount of tokens
    function enterGame() external {
        // Transferir el monto de la apuesta del usuario al contrato
        bool success = USDC_TOKEN.transferFrom(msg.sender, address(this), betAmount);
        if (!success) revert SimpleSAMI__TransferFailed();

        emit GameEntered(msg.sender, block.timestamp);
    }

    /// @notice Allows the owner to send the prize.
    /// @param _winners The addresses of the winners who will receive the prize.
    function sendPrizes(address[] memory _winners) external onlyOwner {
        uint256 numWinners = _winners.length;
        uint256 totalPot = betAmount * 3;

        // Prize division
        uint256 individalPayout = totalPot / numWinners;

        // Distribute and update liquidity
        for (uint256 i = 0; i < numWinners; i++) {
            bool success = USDC_TOKEN.transfer(_winners[i], individalPayout);
            if (success) {
                emit PrizeSent(_winners[i], individalPayout);
            } else {
                emit ErrorSendingPrize(_winners[i], individalPayout);
            }
        }
    }

    /// @notice Allows the owner to set the bet amount required to buy a ticket
    /// @param _betAmount The new bet amount
    function setBetAmount(uint256 _betAmount) external onlyOwner {
        betAmount = _betAmount;
        emit BetAmountChanged(_betAmount);
    }

    /// @notice Allows the owner to withdraw tokens from the contract
    /// @param _amount The amount of tokens to withdraw
    function withdraw(uint256 _amount) external onlyOwner {
        USDC_TOKEN.transfer(owner(), _amount);
        emit WithdrawFromReserves(_amount);
    }
}
