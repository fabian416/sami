// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Sami is a game where players pay a fee to enter, and the winner or winners get the pot.
// The owner of the contract sets the winner and the fee to enter.
contract Sami {
    struct Game {
        mapping(address => bool) players;
        address[] winners;
        uint16 totalPlayers;
        bool gameClosed;
        bool gameFinished;
        bool winnerIsAI;
    }

    //////////////////////////////////////////
    // State Variables
    //////////////////////////////////////////

    uint16 public maxPlayers;
    uint256 public fee;
    uint256 public gamesCreated;
    address public owner;

    mapping(uint256 => Game) public games;

    //////////////////////////////////////////
    // Events
    //////////////////////////////////////////

    event GameCreated(uint256 gameId);
    event GameFinished(uint256 gameId, bool winnerIsAI);

    event PlayerJoined(uint256 gameId, address player);
    event PlayerWithdrawPrize(uint256 gameId, address player);

    event NewMaxPlayers(uint16 maxPlayers);

    //////////////////////////////////////////
    // Constructor
    //////////////////////////////////////////
    constructor(uint256 _fee, uint16 _maxPlayers) {
        owner = msg.sender;
        fee = _fee;
        maxPlayers = _maxPlayers;
    }

    //////////////////////////////////////////
    // Modifiers
    //////////////////////////////////////////

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyPlayer(uint256 gameId) {
        require(games[gameId].players[msg.sender], "Only player can call this function");
        _;
    }
    //////////////////////////////////////////
    // Functions
    //////////////////////////////////////////

    function changeMaxPlayers(uint16 _maxPlayers) public onlyOwner {
        maxPlayers = _maxPlayers;
        emit NewMaxPlayers(_maxPlayers);
    }

    function createGame() public onlyOwner {
        uint256 gameId = gamesCreated++;

        Game storage newGame = games[gameId];
        newGame.gameFinished = false;
        newGame.winnerIsAI = false;

        emit GameCreated(gameId);
    }

    function joinGame(uint256 gameId) public payable onlyPlayer(gameId) {
        require(msg.value == fee, "Fee is not correct");
        require(gameId < gamesCreated, "Game does not exist");
        require(!games[gameId].gameFinished, "Game is finished");
        require(games[gameId].totalPlayers >= maxPlayers, "Game already reach max amount of players");

        games[gameId].players[msg.sender] = true;
    }

    function finishGame(uint256 _gameId, address[] memory _winners) public onlyOwner {
        require(_gameId < gamesCreated, "Game does not exist");
        require(!games[_gameId].gameFinished, "Game is finished");

        delete games[_gameId].winners;
        for (uint256 i = 0; i < _winners.length; i++) {
            games[_gameId].winners.push(_winners[i]);
        }
        games[_gameId].gameFinished = true;

        uint256 totalWinners = _winners.length;
        uint256 totalPlayers = games[_gameId].totalPlayers;
        uint256 totalPot = totalPlayers * fee;

        for (uint256 i = 0; i < totalWinners; i++) {
            (bool success,) = _winners[i].call{ value: totalPot / totalWinners }("");
            require(success, "Failed to send Ether");
        }
        emit GameFinished(_gameId, _winners.length > 0);
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

    function getNumberOfPlayers(uint256 _gameId) public view returns (uint256) {
        return games[_gameId].totalPlayers;
    }

    function getWinners(uint256 _gameId) public view returns (address[] memory) {
        return games[_gameId].winners;
    }

    function getNumberOfWinners(uint256 _gameId) public view returns (uint256) {
        return games[_gameId].winners.length;
    }

    function getPot(uint256 _gameId) public view returns (uint256) {
        return games[_gameId].totalPlayers * fee;
    }
}
