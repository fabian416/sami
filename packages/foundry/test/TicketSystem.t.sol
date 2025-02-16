// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";
import { console } from "forge-std/console.sol";
import { TicketSystem } from "contracts/TicketSystem.sol";
import { MockMANTLE } from "contracts/MockMANTLE.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestTickerSystem is Test {
    event TicketBought(address indexed owner, uint256 ticketId);
    event TicketUsed(address indexed owner, uint256 ticketId);
    event PrizeSent(address indexed winner, uint256 amount);
    event ErrorSendingPrize(address indexed winner, uint256 amount);
    event ThresholdChanged(uint256 newThreshold);
    event HouseFeeChanged(uint256 newHouseFee);

    uint256 internal constant STARTING_GAS_BALANCE = 10 ether;
    uint256 internal constant TICKET_PRICE = 1 * 1e6;

    MockMANTLE public USDC_TOKEN;
    TicketSystem public ticketSystem;
    address internal owner;
    address internal player1 = makeAddr("player1");
    address internal player2 = makeAddr("player2");
    address internal player3 = makeAddr("player3");

    function setUp() public {
        owner = msg.sender;
        vm.deal(owner, STARTING_GAS_BALANCE);
        vm.deal(player1, STARTING_GAS_BALANCE);
        vm.deal(player2, STARTING_GAS_BALANCE);
        vm.deal(player3, STARTING_GAS_BALANCE);

        vm.startPrank(owner);
        USDC_TOKEN = new MockMANTLE();
        ticketSystem = new TicketSystem(address(USDC_TOKEN));
        ticketSystem.setBetAmount(TICKET_PRICE);
        USDC_TOKEN.mint(address(ticketSystem), 10000 * 1e6);
        USDC_TOKEN.mint(address(player1), 10 * 1e6);
        USDC_TOKEN.mint(address(player2), 10 * 1e6);
        USDC_TOKEN.mint(address(player3), 10 * 1e6);
        vm.stopPrank();
    }

    function testBuyTicket() public {
        uint256 balanceBefore = USDC_TOKEN.balanceOf(player1);
        vm.startPrank(player1);
        USDC_TOKEN.approve(address(ticketSystem), TICKET_PRICE);
        ticketSystem.buyTicket();
        vm.stopPrank();
        uint256 balanceAfter = USDC_TOKEN.balanceOf(player1);
        assertEq(balanceBefore - TICKET_PRICE, balanceAfter);
    }
}
