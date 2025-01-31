// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleSAMI is Ownable {
    struct Game {
        uint256 gameId;
        address[] players;
        address[] winners;
        bool gameFinished;
        mapping(address => bool) isPlayer;
    }

    //////////////////////////////////////////
    // State Variables
    //////////////////////////////////////////

    IERC20 public immutable modeToken;

    // Add a variable for the amount of players per game
    uint256 public playersPerGame;
    uint256 public fee;
    uint256 public reserves;
    uint256 public gamesCreated;

    mapping(address => uint256) public bets;
    mapping(uint256 => Game) games;

    //////////////////////////////////////////
    // Events
    //////////////////////////////////////////

    event PlayerJoined(address indexed player, uint256 amount);
    event PrizeDistributed(address indexed winner, uint256 amount);
    event LossLogged(address indexed loser, uint256 amount);
    event GameCreated(uint256 gameId);
    event GameFinished(uint256 gameId, address[] winners);

    //////////////////////////////////////////
    // Constructor
    //////////////////////////////////////////
    constructor(address _modeTokenAddress) Ownable(msg.sender) {
        modeToken = IERC20(_modeTokenAddress);
    }

    //////////////////////////////////////////
    // Functions
    //////////////////////////////////////////

    function createOrJoinGame() public payable {
        // Check if the last game is full or doesn't exist
        if (gamesCreated == 0 || games[gamesCreated - 1].players.length >= playersPerGame) {
            // Create a new game if the last one is full or no games exist
            uint256 _gameId = gamesCreated;

            // Create a new Game struct and initialize it
            Game storage newGame = games[_gameId];
            newGame.gameId = _gameId;
            newGame.players.push(msg.sender);
            newGame.isPlayer[msg.sender] = true; // Initialize the mapping
            newGame.gameFinished = false;

            require(modeToken.transferFrom(msg.sender, address(this), fee), "Transfer failed");

            gamesCreated++;

            emit GameCreated(newGame.gameId);
        } else {
            // Join the last game if it's not full
            require(fee > 0, "Bet amount must be positive");

            // Transfer MODE tokens from player to contract
            require(modeToken.transferFrom(msg.sender, address(this), fee), "Transfer failed");

            // Check contract has enough funds to cover potential 2x payout
            require((reserves + fee) * 2 <= modeToken.balanceOf(address(this)), "Not enough funds to cover prizes");

            bets[msg.sender] += fee;
            reserves += fee;

            // Add the player to the last game
            Game storage currentGame = games[gamesCreated - 1];
            currentGame.players.push(msg.sender);
            currentGame.isPlayer[msg.sender] = true;

            emit PlayerJoined(msg.sender, reserves);
        }
    }

    function distributePrizes(address[] calldata winners, address[] calldata losers) external onlyOwner {
        uint256 totalPrize;

        // Calculate total needed prize first
        for (uint256 i = 0; i < winners.length; i++) {
            uint256 bet = bets[winners[i]];
            require(bet > 0, "No bet for winner");
            totalPrize += bet * 2;
        }

        require(modeToken.balanceOf(address(this)) >= totalPrize, "Insufficient contract balance");

        // Distribute prizes to winners
        for (uint256 i = 0; i < winners.length; i++) {
            address winner = winners[i];
            uint256 bet = bets[winner];
            uint256 prize = bet * 2;

            bets[winner] = 0;
            reserves -= bet;

            require(modeToken.transfer(winner, prize), "Prize transfer failed");
            emit PrizeDistributed(winner, prize);
        }

        // Process losers
        for (uint256 i = 0; i < losers.length; i++) {
            address loser = losers[i];
            uint256 bet = bets[loser];

            if (bet > 0) {
                bets[loser] = 0;
                reserves -= bet;
                emit LossLogged(loser, bet);
            }
        }
    }

    function setFee(uint256 _fee) public onlyOwner {
        fee = _fee;
    }

    // Emergency function to recover ERC20 tokens (optional)
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}
