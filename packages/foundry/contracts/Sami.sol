    // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Sami is a game where players pay a fee to enter, and the winner or winners get the pot.
// The owner of the contract sets the winner and the fee to enter.
contract Sami {
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

    uint256 public fee;
    uint256 public gamesCreated;
    address public owner;

    mapping(uint256 => Game) games;

    //////////////////////////////////////////
    // Events
    //////////////////////////////////////////

    event GameCreated(uint256 gameId);
    event GameFinished(uint256 gameId, address[] winners);

    // joingGame event
    // Withdraw prize event

    //////////////////////////////////////////
    // Constructor
    //////////////////////////////////////////
    constructor(uint256 _fee) {
        owner = msg.sender;
        fee = _fee;
    }

    //////////////////////////////////////////
    // Modifiers
    //////////////////////////////////////////

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyPlayer(uint256 _gameId) {
        require(games[_gameId].isPlayer[msg.sender], "Only players can call this function");
        _;
    }

    //////////////////////////////////////////
    // Functions
    //////////////////////////////////////////

    function createGame() public payable {
        require(msg.value == fee, "Fee is not correct");

        uint256 _gameId = gamesCreated;

        // Create a new Game struct and initialize it
        Game storage newGame = games[_gameId];
        newGame.gameId = _gameId;
        newGame.players.push(msg.sender);
        newGame.isPlayer[msg.sender] = true; // Initialize the mapping
        newGame.gameFinished = false;

        gamesCreated++;

        emit GameCreated(newGame.gameId);
    }

    function joinGame(uint256 _gameId) public payable {
        require(msg.value == fee, "Fee is not correct");
        require(_gameId < gamesCreated, "Game does not exist");
        require(!games[_gameId].gameFinished, "Game is finished");

        // Get list of players then verify if the player is already in the game
        address[] memory players = games[_gameId].players;
        for (uint256 i = 0; i < players.length; i++) {
            require(players[i] != msg.sender, "Player already in the game");
        }

        games[_gameId].players.push(msg.sender);
    }

    function finishGame(uint256 _gameId, address[] memory _winners) public onlyOwner {
        require(_gameId < gamesCreated, "Game does not exist");
        require(!games[_gameId].gameFinished, "Game is finished");

        games[_gameId].winners = _winners;
        games[_gameId].gameFinished = true;

        uint256 totalWinners = _winners.length;
        uint256 totalPlayers = games[_gameId].players.length;
        uint256 totalPot = totalPlayers * fee;

        for (uint256 i = 0; i < totalWinners; i++) {
            (bool success,) = _winners[i].call{ value: totalPot / totalWinners }("");
            require(success, "Failed to send Ether");
        }

        emit GameFinished(_gameId, _winners);
    }

    function setFee(uint256 _fee) public onlyOwner {
        fee = _fee;
    }

    function withdraw() public onlyOwner {
        (bool success,) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
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
        return games[_gameId].players.length * fee;
    }
}
