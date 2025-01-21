import { Request, Response } from 'express';
import {  endVotingPhase, getGameById, recordVote, createOrJoin, startGame, games } from '../services/gameService';
import { Server, Socket
 } from 'socket.io';
import { addCharsToPlayer } from '../services/playerService';

// Create or join a new match
export const createOrJoinGame = (data: any, socket: Socket, io: Server) => {
    const { playerId } = data;

    // Delegate to service
    const { roomId, success } = createOrJoin(playerId);

    if (!success) {
        socket.emit('error', { message: 'There was an error creating or joining into the match' });
        return;
    }

    // Notify the client a player joined
    socket.join(roomId);
    io.to(roomId).emit('playerJoined', { playerId, roomId });

    // If the match is full, strat the game
    const game = games[roomId];
    if (game.players.length === 6) {
        startGame(roomId);
        io.to(roomId).emit('gameStarted', { game });
    }
};

export const startVotePhase = (data: any, io: Server) => {
    const { roomId } = data;

    const game = getGameById(roomId);
    if (!game) {
        io.to(roomId).emit('error', { message: 'Game not found' });
        return;
    }

    io.to(roomId).emit('startVotePhase', { message: 'Voting phase has started' });
    setTimeout(() => endVotingPhase(roomId), 20 * 1000);
};

export const castVote = (data: any, socket: Socket, io: Server) => {
    const { roomId, voterId, votedId } = data;

    if (!roomId || !voterId || !votedId) {
        socket.emit('error', { message: 'Incomplete data' });
        return;
    }

    const success = recordVote(roomId, voterId, votedId);
    if (!success) {
        socket.emit('error', { message: 'Failed to register the Vote' });
        return;
    }

    const game = games[roomId];
    if (game) {
        let votesForTarget = 0;
        for (const voter in game.votes) {
            if (game.votes[voter] === votedId) {
                votesForTarget++;
            }
        }

        io.to(roomId).emit('voteUpdate', {
            votedId,
            totalVotes: votesForTarget,
        });
    }
};

export const handleMessage = (data: any, socket: Socket, io: Server) => {
    const { roomId, message, playerId } = data;

    // Validate if the instance exists
    const game = games[roomId];
    if (!game) {
        socket.emit("error", { message: "La sala no existe" });
        return;
    }

    // Verify if the game has started
    if (game.status !== "active") {
        socket.emit("error", { message: "La partida no ha comenzado" });
        return;
    }

    // Update the count of the chars a player did
    addCharsToPlayer(roomId, playerId, message.length);

    // Register the message in the server test purposes only
    console.log(`Mensaje de ${playerId} en sala ${roomId}: ${message}`);

    // Resend the message to all the other players
    io.to(roomId).emit("newMessage", data);
};

export const handleGameOver = (roomId: string, winner: 'humans' | 'ia', io: Server) => {
    // Notify clients about the game result
    io.to(roomId).emit('gameOver', {
        message: winner === 'humans' ? 'Humans win!' : 'SAMI wins!',
        winner,
    });
};  

// Get info of the match
export const getGame = (req:Request, res:Response) => {
    const {id} = req.params;
    const game = getGameById(id);

    if (!game) {
        res.status(404).json({message: 'Match not founf'});
        return;
    }

    res.status(200).json(game);
    return;
};