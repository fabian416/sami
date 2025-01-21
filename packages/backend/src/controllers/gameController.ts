import { Request, Response } from 'express';
import {  endVotingPhase, getGameById, recordVote, createOrJoin, startGame, games } from '../services/gameService';
import { Server, Socket
 } from 'socket.io';
import { addCharsToPlayer } from '../services/playerService';
import { io } from '../server'; 
import gameServiceEmitter from '../services/gameService';


gameServiceEmitter.on('startConversation', ({ roomId }) => {
    const message = { message: 'Conversation phase has started' };
    io.to(roomId).emit('startConversationPhase', message);
});

gameServiceEmitter.on('conversationEnded', (data: any) => {
    console.log(`Conversation phase ended for room: ${data.roomId}`);
});

gameServiceEmitter.on('playerEliminated', ({ roomId, playerId }) => {
    console.log(`Notifying clients: Player ${playerId} was eliminated from room ${roomId}`);
    io.to(roomId).emit('playerEliminated', { playerId });
});

gameServiceEmitter.on('startVoting', (roomId: string) => {
    const game = games[roomId];
    if (!game) return;

    // Get list of active players 
    const activePlayers = game.players
        .filter(player => !player.isEliminated)
        .map((player, index) => ({ id: player.id, index }));

    console.log(`Starting voting phase for room: ${roomId}`);
    io.to(roomId).emit('startVotePhase', { 
        message: 'Voting phase has started',
        roomId: roomId, 
        players: activePlayers // Send list of active players
    });
});


gameServiceEmitter.on('gameOver', ({ roomId, winner }) => {
    console.log(`Game over for room: ${roomId}, winner: ${winner}`);
    io.to(roomId).emit('gameOver', {
        message: `Game over. Winner: ${winner === 'ia' ? 'IA' : 'Humans'}`,
    });
});

// Create or join a new match
export const createOrJoinGame = (data: any, socket: Socket, io: Server) => {
    const { playerId } = data;

    // Delegate to service
    const { roomId, success } = createOrJoin(playerId);

    if (!success) {
        socket.emit('error', { message: 'There was an error creating or joining into the match' });
        console.log(`Error joining the player ${playerId} into the room ${roomId}:`);
        return;
    }

    // Notify the client a player joined
    socket.join(roomId);
    io.to(roomId).emit('playerJoined', { playerId, roomId });

    const game = games[roomId];
    if (game.players.length === 6) {
        io.to(roomId).emit('gameStarted', { game });
    }
};

export const castVote = (data: any, socket: Socket, io: Server) => {
    const { roomId, voterId, voteIndex } = data;

    if (!roomId || !voterId || voteIndex === undefined) {
        console.error(`[castVote] Invalid data:`, data);
        socket.emit('error', { message: 'Incomplete data for voting' });
        return;
    }

    const game = getGameById(roomId);
    if (!game || game.status !== 'voting') {
        console.error(`[castVote] Voting phase is not active for room: ${roomId}`);
        socket.emit('error', { message: 'Voting phase is not active' });
        return;
    }

    // Validate voteIndex
    if (voteIndex < 0 || voteIndex >= game.players.length) {
        console.error(`[castVote] Invalid voteIndex: ${voteIndex} for room: ${roomId}`);
        socket.emit('error', { message: 'Invalid vote index' });
        return;
    }

    const votedPlayer = game.players[voteIndex]?.id;
    if (!votedPlayer) {
        console.error(`[castVote] Voted player not found for index: ${voteIndex} in room: ${roomId}`);
        socket.emit('error', { message: 'Voted player does not exist' });
        return;
    }

    // Prevent self-voting
    if (votedPlayer === voterId) {
        console.warn(`[castVote] Player ${voterId} attempted to vote for themselves in room: ${roomId}`);
        socket.emit('error', { message: 'You cannot vote for yourself' });
        return;
    }

    // Register the vote
    const success = recordVote(roomId, voterId, votedPlayer);
    if (!success) {
        console.error(`[castVote] Failed to register vote from ${voterId} to ${votedPlayer} in room: ${roomId}`);
        socket.emit('error', { message: 'Failed to register the vote' });
        return;
    }

    // Count votes for the voted player
    const votesForTarget = Object.values(game.votes).filter(vote => vote === votedPlayer).length;

    console.log(`[castVote] Player ${voterId} voted for ${votedPlayer} in room: ${roomId}`);
    console.log(`[castVote] Current votes:`, game.votes);

    // Emit the vote update to all players
    io.to(roomId).emit('voteUpdate', {
        votedPlayer,
        totalVotes: votesForTarget,
    });

    // Emit all votes (optional, for debugging or client visualization)
    io.to(roomId).emit('allVotes', {
        votes: game.votes,
    });
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

