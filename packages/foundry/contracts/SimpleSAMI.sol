// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleSAMI is Ownable {
    //////////////////////////////////////////
    // State Variables
    //////////////////////////////////////////

    IERC20 public immutable MODE_TOKEN;

    uint256 public betAmount;
    uint256 public samiReserves;
    uint256 public ticketCounter;

    mapping(uint256 => address) public ticketToOwner;
    mapping(address => uint256) public ownerTicketCount;
    mapping(uint256 => bool) public ticketUsed;

    //////////////////////////////////////////
    // Events
    //////////////////////////////////////////

    event TicketBought(address indexed owner, uint256 ticketId);
    event TicketUsed(address indexed owner, uint256 ticketId);
    event PrizeSent(address indexed winner, uint256 amount);

    //////////////////////////////////////////
    // Constructor
    //////////////////////////////////////////
    constructor(address _modeTokenAddress) Ownable(msg.sender) {
        MODE_TOKEN = IERC20(_modeTokenAddress);
    }

    //////////////////////////////////////////
    // Functions
    //////////////////////////////////////////

    function buyTicket() public {
        require(MODE_TOKEN.transferFrom(msg.sender, address(this), betAmount), "Transfer failed");

        ticketCounter++;
        ticketToOwner[ticketCounter] = msg.sender;
        ownerTicketCount[msg.sender]++;
        samiReserves += betAmount;

        emit TicketBought(msg.sender, ticketCounter);
    }

    function useTicket(uint256 _ticketId) public {
        require(ticketToOwner[_ticketId] == msg.sender, "You don't own this ticket");
        require(!ticketUsed[_ticketId], "Ticket already used");

        ticketUsed[_ticketId] = true;
        ownerTicketCount[msg.sender]--;
        samiReserves -= betAmount;

        emit TicketUsed(msg.sender, _ticketId);
    }

    function sendPrize(address _winner) public onlyOwner {
        require(samiReserves > 0, "No prize to send");

        uint256 prizeAmount = samiReserves;
        samiReserves = 0;

        require(MODE_TOKEN.transfer(_winner, prizeAmount), "Transfer failed");

        emit PrizeSent(_winner, prizeAmount);
    }

    function setBetAmount(uint256 _betAmount) public onlyOwner {
        betAmount = _betAmount;
    }

    function withdraw(uint256 _amount) external onlyOwner {
        MODE_TOKEN.transfer(owner(), _amount);
    }
}
