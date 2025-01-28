// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Sami is a game where players pay a fee to enter, and the winner or winners get the pot.
// The owner of the contract sets the winner and the fee to enter.
contract Sami {
    struct Game {
        address[] players;
        address[] winners;
        bool gameFinished;
        bool isAIWinner;
    }

    //////////////////////////////////////////
    // State Variables
    //////////////////////////////////////////
    uint256 public fee;
    address public owner;
    uint16 public maxPlayers;
    Game[] public games;
    uint256 public gamesCreated;

    address public token;
    uint256 public betAmount;

    //////////////////////////////////////////
    // Events
    //////////////////////////////////////////
    event GameCreated(uint256 gameId);
    event GameFinished(uint256 gameId, address[] winners);

    event PlayerJoined(uint256 gameId, address player);
    event PlayerWithdrawPrize(uint256 gameId, address player);

    event NewFee(uint256 newFee);
    event NewMaxPlayers(uint16 newMaxPlayers);
    event NewBetAmount(uint256 newBetAmount);

    //////////////////////////////////////////
    // Constructor
    //////////////////////////////////////////
    constructor(uint256 _fee, uint16 _maxPlayers, address _token) {
        owner = msg.sender;
        fee = _fee;
        maxPlayers = _maxPlayers;
        token = _token;
    }

    //////////////////////////////////////////
    // Modifiers
    //////////////////////////////////////////
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyWinner(uint256 gameId) { 
        address[] memory winners = games[gameId].winners;
        bool isWinner = false;
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == msg.sender) {
                isWinner = true;
                break;
            }
        }
        require(isWinner, "Only winners can call this function");
        _;
    }

    //////////////////////////////////////////
    // Functions
    //////////////////////////////////////////
    function createGame() public onlyOwner() {
        uint256 gameId = gamesCreated++;
        Game storage newGame = games[gameId];

        newGame.gameFinished = false;
        newGame.isAIWinner = false;
        newGame.players = new address[](0);
        newGame.winners = new address[](0);

        emit GameCreated(gameId);
    }

    function joinGame(uint256 gameId) public payable {
        require(msg.value == fee, "Fee is not correct");
        require(gameId < games.length, "Game does not exist");
        require(!games[gameId].gameFinished, "Game is finished");
        require(games[gameId].players.length <= maxPlayers, "Game already reach max amount of players");

        // Get list of players then verify if the player is already in the game
        address[] memory players = games[gameId].players;
        for (uint256 i = 0; i < players.length; i++) {
            require(players[i] != msg.sender, "Player already in the game");
        }

        // Hacer un transferFrom de los tokens

        games[gameId].players.push(msg.sender);
        emit PlayerJoined(gameId, msg.sender);
    }

    function finishGame(uint256 gameId, address[] calldata winners, bool isAIWinner) public onlyOwner {
        require(gameId <= games.length, "Game does not exist");
        require(!games[gameId].gameFinished, "Game is already finished");

        games[gameId].winners = winners;
        games[gameId].gameFinished = true;
        games[gameId].isAIWinner = isAIWinner;

        emit GameFinished(gameId, winners);
    }


    function withdraw(uint256 gameId) public onlyWinner(gameId) {
        require(games[gameId].gameFinished, "Game is not finished");
        require(!games[gameId].isAIWinner, "AI won the game");

        uint256 totalWinners = games[gameId].winners.length;
        uint256 totalPlayers = games[gameId].players.length;
        uint256 potPerWinner = (totalPlayers * betAmount) / totalWinners;

        // transfer de tokens

        emit PlayerWithdrawPrize(gameId, msg.sender);
    }

    function setFee(uint256 _fee) public onlyOwner {
        fee = _fee;
        emit NewFee(_fee);
    }

    function setMaxPlayers(uint16 _maxPlayers) public onlyOwner {
        maxPlayers = _maxPlayers;
        emit NewMaxPlayers(_maxPlayers);
    }

    function setBetAmount(uint256 _betAmount) public onlyOwner {
        betAmount = _betAmount;
        emit NewBetAmount(_betAmount);
    }

    //////////////////////////////////////////
    // View Functions
    //////////////////////////////////////////
    function getPlayers(uint256 _gameId) public view returns (address[] memory) {
        return games[_gameId].players;
    }

    function getNumberOfPlayers(uint256 _gameId) public view returns (uint256) {
        return games[_gameId].players.length;
    }

    function getWinners(uint256 _gameId) public view returns (address[] memory) {
        return games[_gameId].winners;
    }

    function getNumberOfWinners(uint256 _gameId) public view returns (uint256) {
        return games[_gameId].winners.length;
    }

    function getPot(uint256 _gameId) public view returns (uint256) {
        return games[_gameId].players.length * betAmount;
    }
}
