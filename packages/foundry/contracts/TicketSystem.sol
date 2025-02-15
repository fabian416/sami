// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import {ITicketSystem} from "./ITicketSystem.sol";

/// @title SimpleSAMI - A simple contract for managing tickets and prizes
/// @notice This contract allows users to buy tickets to play SAMI, , use them, and allows the owner to send prizes.
contract TicketSystem is Ownable, ITicketSystem { 

    //////////////////////////////////////////
    // State Variables
    //////////////////////////////////////////
    ///@notice USDC Mantle for bets token has 18 decimals
    IERC20 public immutable USDC_TOKEN;

    uint256 public betAmount;
    uint256 public samiReserves;
    uint256 public ticketCounter;
    ///@notice State variable, the backend can change it in order to balance the system
    uint256 public threshold;
    ///@notice samiWins and TotalRounds using in order to get win ratio coeficient
    uint256 public samiWins;
    uint256 public totalRounds;
    uint256 public houseFee;
    uint256 public collectedFees;

    ///@dev To get coeficient 
    uint256 public liquidityPool; 

    mapping(uint256 => address) public ticketToOwner;
    mapping(uint256 => bool) public ticketUsed;

    //////////////////////////////////////////
    // Constructor
    //////////////////////////////////////////

    /// @notice Initializes the Token usdc address
    ///@dev We set 2000 usd with 6 decimals as initial threshold, 
    /// @param _modeTokenAddress The address of the MODE ERC20 token
    constructor(address _modeTokenAddress) Ownable(msg.sender) {
        USDC_TOKEN = IERC20(_modeTokenAddress);
        threshold = 2000 * 1e6;
        houseFee = 1e4; // 1% = 1 * 10^4 (To represent 0.01 with 6 decimals)
    }

    //////////////////////////////////////////
    // Functions
    //////////////////////////////////////////

    /// @notice Allows a user to buy a ticket by transferring the bet amount
    /// @dev The user must approve the contract to spend the bet amount of MODE tokens
    function buyTicket() external override {
        bool success = USDC_TOKEN.transferFrom(msg.sender, address(this), betAmount);
        require(success, "Transfer failed");

        // Calculate and store fee
        uint256 feeAmount = (betAmount * houseFee) / 1e6;
        collectedFees += feeAmount; // Acumula el fee

        uint256 netBet = betAmount - feeAmount;
        liquidityPool += netBet;

        ticketCounter++;
        ticketToOwner[ticketCounter] = msg.sender;

        emit TicketBought(msg.sender, ticketCounter);
    }

    /// @notice Allows a user to use a ticket they own
    /// @dev The ticket must not have been used before
    /// @param _ticketId The ID of the ticket to be used
    function useTicket(uint256 _ticketId) external onlyOwner {
         require(ticketToOwner[_ticketId] == msg.sender, "Not your ticket");
        require(!ticketUsed[_ticketId], "Ticket already used");

        ticketUsed[_ticketId] = true;

        emit TicketUsed(msg.sender, _ticketId);
    }

    /// @notice Allows the owner to send the prize or not 3 players.
    /// @dev The contract must have sufficient reserves to send the prize.
    /// @param _winners The addresses of the winners who will receive the prize.
    function sendPrizes(address[] memory _winners) external onlyOwner { 
        uint256 numWinners = _winners.length;

        if (numWinners == 0) {
            samiWins++; // If nobody wins, we update sami wins
            return;
        }

        uint256 liquidityCoeff = getLiquidityCoefficient();
        uint256 winRatioCoeff = getWinRatioCoefficient();

        // Total pot already adjusted with the fee
        uint256 totalPot = betAmount * 3;

        // Base payment 
        uint256 basePayout = totalPot / numWinners;

        // Adjust payments based on coefficients
        uint256 calculatedPayout = basePayout;
        calculatedPayout = (calculatedPayout * liquidityCoeff) / 1e6;
        calculatedPayout = (calculatedPayout * winRatioCoeff) / 1e6;

        // Guarante a minimum payout
        uint256 minPayout = betAmount;
        uint256 finalPayout = calculatedPayout > minPayout ? calculatedPayout : minPayout;

        require(liquidityPool >= finalPayout * numWinners, "Not enough reserves");

        // Distribute and update liquidity 
        for (uint i = 0; i < numWinners; i++) {
            bool success = USDC_TOKEN.transfer(_winners[i], finalPayout);
            if (success) {
                liquidityPool -= finalPayout;
                emit PrizeSent(_winners[i], finalPayout);
            } else {
                emit ErrorSendingPrize(_winners[i], finalPayout);
            }
        }
    }
    
    /// @notice Allows the owner to withdraw tokens from the contract
    /// @param _amount The amount of tokens to withdraw
    function withdraw(uint256 _amount) external onlyOwner {
        USDC_TOKEN.transfer(owner(), _amount);
    }
    /// @notice Allows the owner to withdraw the collected house fees.
    /// @param _amount The amount of fees to withdraw.
    function withdrawFees(uint256 _amount) external onlyOwner {
        require(_amount <= collectedFees, "Not enough fees collected");
        collectedFees -= _amount;
        require(USDC_TOKEN.transfer(owner(), _amount), "Fee withdrawal failed");
    }

    /// @notice Allows the owner to set the bet amount required to buy a ticket
    /// @param _betAmount The new bet amount
    function setBetAmount(uint256 _betAmount) external onlyOwner {
        betAmount = _betAmount;
    }

    ///@notice Sets the threshold value used for liquidity calculations.
    ///@dev The new threshold must be greater than zero. It is multiplied by 1e6 to match 6 decimal precision.
    ///@param _newThrewshold The new threshold value to set.
    function setThreshold(uint256 _newThrewshold) external onlyOwner { 
        require (_newThrewshold > 0, "Invalid Amount");
        threshold = _newThrewshold * 1e6;
        emit ThresholdChanged(threshold);
    }
    ///@notice Updates the house fee applied to bets.
    ///@dev The house fee should be expressed with 6 decimals (e.g., 1% = 1e4).
    ///@param _newHouseFee The new house fee percentage in 6 decimal precision.
    function setHouseFee(uint256 _newHouseFee) external onlyOwner { 
        require (_newHouseFee > 0, "Invalid Amount");
        emit HouseFeeChanged(_newHouseFee);
    }
    ///@notice Calculates the liquidity coefficient (L/T).
    ///@dev Returns 1e6 (1.0) if the threshold is zero to prevent division by zero.
    ///@return The liquidity coefficient with 6 decimal precision.
    function getLiquidityCoefficient() public view returns (uint256) {
        if (threshold == 0) return 1e6; // Evita división por cero, devuelve 1.0 con 6 decimales
        return (liquidityPool * 1e6) / threshold; // L / T con 6 decimales
    }
    ///@notice Calculates the win ratio coefficient (S/P).
    ///@dev Returns 1e6 (1.0) if no rounds have been played to prevent division by zero.
    ///@return The win ratio coefficient with 6 decimal precision.
    function getWinRatioCoefficient() public view returns(uint256) { 
        if (totalRounds == 0) return 1e6; 
        return (samiWins * 1e6 ) / totalRounds;
    }
}