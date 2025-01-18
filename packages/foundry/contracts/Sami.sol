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
    }

    //////////////////////////////////////////
    // State Variables
    //////////////////////////////////////////

    uint256 public fee;
    address public owner;
    Game[] public games;
    uint256 public gamesCreated;

    //////////////////////////////////////////
    // Events
    //////////////////////////////////////////

    event GameCreated(uint256 gameId);
    event GameFinished(uint256 gameId, address[] winners);

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

    //////////////////////////////////////////
    // Functions
    //////////////////////////////////////////

    function createGame() public payable {
        require(msg.value == fee, "Fee is not correct");

        uint256 _gameId = games.length;

        Game memory newGame =
            Game({ gameId: _gameId, players: new address[](0), winners: new address[](0), gameFinished: false });

        games.push(newGame);

        games[_gameId].players.push(msg.sender);
        gamesCreated++;

        emit GameCreated(newGame.gameId);
    }

    function joinGame(uint256 _gameId) public payable {
        require(msg.value == fee, "Fee is not correct");
        require(_gameId < games.length, "Game does not exist");
        require(!games[_gameId].gameFinished, "Game is finished");

        // Get list of players then verify if the player is already in the game
        address[] memory players = games[_gameId].players;
        for (uint256 i = 0; i < players.length; i++) {
            require(players[i] != msg.sender, "Player already in the game");
        }

        games[_gameId].players.push(msg.sender);
    }

    function finishGame(uint256 _gameId, address[] memory _winners) public onlyOwner {
        require(_gameId < games.length, "Game does not exist");
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
