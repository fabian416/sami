// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title SimpleSAMI - Manage tickets (USDC) and distribute prizes
contract USDCSimpleSAMI is Ownable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error NoPlayers();
    error NoWinners();
    error InsufficientPot(uint256 want, uint256 have);
    error GameStartedFailed(address[] players, uint256 timestamp);

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event GameStarted(address[] players, uint256 timestamp);
    event PrizeSent(address indexed winner, uint256 amount);
    event WithdrawFromReserves(uint256 amount);
    event BetAmountChanged(uint256 newBetAmount);
    event MaxPlayersChanged(uint256 newMaxPlayers);
    event PrizeFailed(address indexed winner, uint256 amount, bytes data);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    IERC20 public immutable USDC_TOKEN;
    uint256 public constant DECIMALS = 1e6; // USDC 6 decimals
    uint256 public betAmount;
    uint256 public maxPlayers;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(address _usdcTokenAddress) Ownable(msg.sender) {
        USDC_TOKEN = IERC20(_usdcTokenAddress);
        betAmount = 1 * DECIMALS;
        maxPlayers = 3;
    }

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Each player must have approved `betAmount` beforehand
    function startGame(address[] calldata _players) external {
        uint256 n = _players.length;
        if (n == 0) revert NoPlayers();

        uint256 _bet = betAmount;
        address[] memory failed = new address[](n);
        uint256 f = 0;

        for (uint256 i = 0; i < n; ) {
            (bool ok, bytes memory ret) = address(USDC_TOKEN).call(
                abi.encodeWithSelector(IERC20.transferFrom.selector, _players[i], address(this), _bet)
            );
            bool success = ok && (ret.length == 0 || (ret.length == 32 && abi.decode(ret, (bool))));

            if (!success) {
                failed[f] = _players[i];
                unchecked { ++f; }
            }
            unchecked { ++i; }
        }

        if (f > 0) {
            address[] memory failedTrim = new address[](f);
            for (uint256 j = 0; j < f; ) {
                failedTrim[j] = failed[j];
                unchecked { ++j; }
            }
            revert GameStartedFailed(failedTrim, block.timestamp);
        }

        emit GameStarted(_players, block.timestamp);
    }



    /// @notice Distribute current pot equally among winners
    function sendPrizes(address[] memory _winners) external onlyOwner {
        uint256 numWinners = _winners.length;
        if (numWinners == 0) revert NoWinners();

        uint256 totalPot = betAmount * maxPlayers;
        uint256 individualPayout = totalPot / numWinners;
        uint256 balance = USDC_TOKEN.balanceOf(address(this));
        if (balance < totalPot) {
            revert InsufficientPot(totalPot, balance);
        }

        for (uint256 i = 0; i < numWinners; ) {
            (bool ok, bytes memory ret) = address(USDC_TOKEN).call(
                abi.encodeWithSelector(IERC20.transfer.selector, _winners[i], individualPayout)
            );
            bool success = ok && (ret.length == 0 || (ret.length == 32 && abi.decode(ret, (bool))));

            if (success) {
                emit PrizeSent(_winners[i], individualPayout);
            } else {
                emit PrizeFailed(_winners[i], individualPayout, ret);
            }

            unchecked { ++i; }
        }
    }


    /// @notice Owner sets the per-player bet amount (in 6 decimals)
    function setBetAmount(uint256 _betAmount) external onlyOwner {
        betAmount = _betAmount;
        emit BetAmountChanged(_betAmount);
    }

    function setMaxPlayers(uint256 _maxPlayers) external onlyOwner {
        maxPlayers = _maxPlayers;
        emit MaxPlayersChanged(_maxPlayers);
    }

    /// @notice Owner can withdraw reserves (in USDC 6 decimals)
    function withdraw(uint256 _amount) external onlyOwner {
        USDC_TOKEN.safeTransfer(owner(), _amount);
        emit WithdrawFromReserves(_amount);
    }
}