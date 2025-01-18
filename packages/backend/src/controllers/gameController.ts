import { Request, Response } from 'express';
import { createNewGame, getGameById, recordVote } from '../services/gameService';

// Create a new match
// not async YET because is not making any operations to external services
export const createGame = (req: Request, res: Response) => { 
    const {roomId} = req.body;

    if (!roomId) {
        res.status(400).json({message: 'The ID of the room is obligatory!!'});   
        return;
    }
    const game = createNewGame(roomId);
    res.status(201).json({message: 'Match succesfully created, have fun!', game});
    return;
};

export const castVote = (req: Request, res: Response) => {
    const {roomId, voterId, votedId} = req.body;
    // Validation
    if (!roomId || !voterId || !votedId) {
        res.status(400).json({message: 'Incomplete data'});
        return;
    }

    const success = recordVote(roomId, voterId, votedId);
    if (!success){
        res.status(400).json({message: 'Failed to register the Vote'});
        return;
    }
    res.status(200).json({message: 'Success registering the Vote'});
    return;
}


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