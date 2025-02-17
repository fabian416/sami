// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";
import { console } from "forge-std/console.sol";
import { TicketSystem } from "contracts/TicketSystem.sol";
import { ITicketSystem } from "contracts/ITicketSystem.sol";
import { MockUSDC } from "contracts/MockUSDC.sol";

contract TestTicketSystem is Test, ITicketSystem {
    // Constants
    uint256 internal constant DECIMALS = 1e6;
    uint256 internal constant STARTING_GAS_BALANCE = 10 ether;
    uint256 internal constant TICKET_PRICE = 1 * DECIMALS;
    uint256 internal constant THRESHOLD = 2000 * DECIMALS;
    uint256 internal constant HOUSE_FEE = 1e4; // 1% = 1 * 10^4 (To represent 0.01 with 6 decimals)

    // Contracts
    MockUSDC public USDC_TOKEN;
    TicketSystem public ticketSystem;

    // Addresses
    address internal owner;
    address internal player1 = makeAddr("player1");
    address internal player2 = makeAddr("player2");
    address internal player3 = makeAddr("player3");

    function setUp() public {
        // Set up owner and deal some gas
        owner = msg.sender;
        vm.deal(owner, STARTING_GAS_BALANCE);
        vm.deal(player1, STARTING_GAS_BALANCE);
        vm.deal(player2, STARTING_GAS_BALANCE);
        vm.deal(player3, STARTING_GAS_BALANCE);

        // Deploy contracts
        vm.startPrank(owner);
        USDC_TOKEN = new MockUSDC();
        ticketSystem = new TicketSystem(address(USDC_TOKEN));

        // Set up contracts and players
        ticketSystem.setBetAmount(TICKET_PRICE);
        USDC_TOKEN.mint(address(ticketSystem), 10000 * DECIMALS);
        USDC_TOKEN.mint(address(player1), 10 * DECIMALS);
        USDC_TOKEN.mint(address(player2), 10 * DECIMALS);
        USDC_TOKEN.mint(address(player3), 10 * DECIMALS);
        vm.stopPrank();
    }

    // Required override for using the interface
    function buyTicket() external override returns (uint256) { }

    function testInitialParameters() public view {
        assertEq(address(USDC_TOKEN), address(ticketSystem.USDC_TOKEN()));
        assertEq(THRESHOLD, ticketSystem.threshold());
        assertEq(HOUSE_FEE, ticketSystem.houseFee());
    }

    function testBuyTicket() public {
        uint256 playerBalanceBefore = USDC_TOKEN.balanceOf(player1);
        uint256 ticketSystemBalanceBefore = USDC_TOKEN.balanceOf(address(ticketSystem));
        uint256 ticketCounterBefore = ticketSystem.ticketCounter();
        uint256 collectedFeesBefore = ticketSystem.collectedFees();

        vm.startPrank(player1);
        USDC_TOKEN.approve(address(ticketSystem), TICKET_PRICE);
        ticketSystem.buyTicket();
        vm.stopPrank();

        uint256 playerBalanceAfter = USDC_TOKEN.balanceOf(player1);
        uint256 ticketSystemBalanceAfter = USDC_TOKEN.balanceOf(address(ticketSystem));
        uint256 ticketCounterAfter = ticketSystem.ticketCounter();
        uint256 collectedFeesAfter = ticketSystem.collectedFees();

        assertEq(playerBalanceBefore - TICKET_PRICE, playerBalanceAfter);
        assertEq(ticketSystemBalanceBefore + TICKET_PRICE, ticketSystemBalanceAfter);
        assertEq(ticketCounterBefore + 1, ticketCounterAfter);
        assertEq(collectedFeesBefore + (TICKET_PRICE * HOUSE_FEE) / DECIMALS, collectedFeesAfter);
        assertEq(ticketSystem.ticketToOwner(ticketCounterAfter), player1);
    }

    function testBuyTicketFailsIfNotEnoughAllowance() public {
        vm.startPrank(player1);
        vm.expectRevert();
        ticketSystem.buyTicket();
        vm.stopPrank();
    }

    function testBuyTicketFailsIfNotEnoughBalance() public {
        address playerWithoutTokens = makeAddr("playerWithoutTokens");

        vm.startPrank(playerWithoutTokens);
        USDC_TOKEN.approve(address(ticketSystem), TICKET_PRICE);
        vm.expectRevert();
        ticketSystem.buyTicket();
        vm.stopPrank();
    }

    function testBuyTicketEmitsEvent() public {
        vm.startPrank(player1);
        USDC_TOKEN.approve(address(ticketSystem), TICKET_PRICE);

        // Expect to emit TicketBought event by the buyTicket function
        vm.expectEmit(true, false, false, true, address(ticketSystem));
        emit TicketBought(player1, ticketSystem.ticketCounter() + 1);
        ticketSystem.buyTicket();

        vm.stopPrank();
    }

    function testUseTicket() public {
        testBuyTicket();

        assertEq(ticketSystem.ticketUsed(ticketSystem.ticketCounter()), false);

        vm.startPrank(owner);
        ticketSystem.useTicket(ticketSystem.ticketCounter());
        vm.stopPrank();

        assertEq(ticketSystem.ticketUsed(ticketSystem.ticketCounter()), true);
    }

    // function testUseTicketCannotBeUsedTwice() public {
    //     testBuyTicket();

    //     assertEq(ticketSystem.ticketUsed(ticketSystem.ticketCounter()), false);

    //     vm.startPrank(owner);
    //     ticketSystem.useTicket(ticketSystem.ticketCounter());
    //     vm.expectRevert(ITicketSystem.TicketSystem__TicketAlreadyUsed.selector);
    //     ticketSystem.useTicket(ticketSystem.ticketCounter());
    //     vm.stopPrank();

    //     assertEq(ticketSystem.ticketUsed(ticketSystem.ticketCounter()), true);
    // }

    function testUseTicketEmitsEvent() public {
        testBuyTicket();

        // Expect to emit TicketUsed event by the useTicket function
        vm.expectEmit(true, false, false, true, address(ticketSystem));
        emit TicketUsed(owner, ticketSystem.ticketCounter());
        vm.startPrank(owner);
        ticketSystem.useTicket(ticketSystem.ticketCounter());
        vm.stopPrank();
    }
}
