// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title SimpleSAMI - A simple contract for managing tickets and prizes
/// @notice This contract allows users to buy tickets to play SAMI, , use them, and allows the owner to send prizes.
contract SimpleSAMI is Ownable {
    //////////////////////////////////////////
    // State Variables
    //////////////////////////////////////////

    IERC20 public immutable MODE_TOKEN;

    uint256 public betAmount;
    uint256 public samiReserves;
    uint256 public ticketCounter;

    mapping(uint256 => address) public ticketToOwner;
    mapping(uint256 => bool) public ticketUsed;

    //////////////////////////////////////////
    // Events
    //////////////////////////////////////////

    /// @notice Emitted when a ticket is bought
    /// @param owner The address of the ticket owner
    /// @param ticketId The ID of the ticket bought
    event TicketBought(address indexed owner, uint256 ticketId);

    /// @notice Emitted when a ticket is used
    /// @param owner The address of the ticket owner
    /// @param ticketId The ID of the ticket used
    event TicketUsed(address indexed owner, uint256 ticketId);

    /// @notice Emitted when a prize is sent to a winner
    /// @param winner The address of the winner
    /// @param amount The amount of tokens sent as a prize
    event PrizeSent(address indexed winner, uint256 amount);

    //////////////////////////////////////////
    // Constructor
    //////////////////////////////////////////

    /// @notice Initializes the contract with the address of the MODE token
    /// @param _modeTokenAddress The address of the MODE ERC20 token
    constructor(address _modeTokenAddress) Ownable(msg.sender) {
        MODE_TOKEN = IERC20(_modeTokenAddress);
    }

    //////////////////////////////////////////
    // Functions
    //////////////////////////////////////////

    /// @notice Allows a user to buy a ticket by transferring the bet amount
    /// @dev The user must approve the contract to spend the bet amount of MODE tokens
    function buyTicket() public  {
        require(MODE_TOKEN.transferFrom(msg.sender, address(this), betAmount), "Transfer failed");

        ticketCounter++;
        ticketToOwner[ticketCounter] = msg.sender;
        samiReserves += betAmount;

        emit TicketBought(msg.sender, ticketCounter);
    }

    /// @notice Allows a user to use a ticket they own
    /// @dev The ticket must not have been used before
    /// @param _ticketId The ID of the ticket to be used
    function useTicket(uint256 _ticketId) public onlyOwner {
        require(!ticketUsed[_ticketId], "Ticket already used");

        ticketUsed[_ticketId] = true;
  

        emit TicketUsed(msg.sender, _ticketId);
    }

    /// @notice Allows the owner to send the prize to a winner
    /// @dev The contract must have sufficient reserves to send the prize
    /// @param _winner The address of the winner to receive the prize
    function sendPrize(address _winner) public onlyOwner {
        uint256 prize = betAmount * 2;
        require(samiReserves >= prize, "No prize to send");
        samiReserves -= prize;
        require(MODE_TOKEN.transfer(_winner, prize), "Transfer failed");

        emit PrizeSent(_winner, prize);
    }

    /// @notice Allows the owner to set the bet amount required to buy a ticket
    /// @param _betAmount The new bet amount
    function setBetAmount(uint256 _betAmount) public onlyOwner {
        betAmount = _betAmount;
    }

    /// @notice Allows the owner to withdraw tokens from the contract
    /// @param _amount The amount of tokens to withdraw
    function withdraw(uint256 _amount) external onlyOwner {
        MODE_TOKEN.transfer(owner(), _amount);
    }
}
