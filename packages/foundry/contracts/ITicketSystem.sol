// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface ITicketSystem { 
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

    /// @notice Emitted when a error occurs sending the prize
    /// @param winner The address of the winner
    /// @param amount The amount of tokens that failed
    event ErrorSendingPrize(address indexed winner, uint256 amount);


    function buyTicket() external;


}