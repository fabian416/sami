import { Request, Response } from 'express';
import { createNewGame, getGameById } from '../services/gameService';

// Create a new match
// not async YET because is not making any operations to external services
export const createGame = (req: Request, res: Response) => { 
    const {roomId} = req.body;

    if (!roomId) {
        return res.status(400).json({message: 'The ID of the room is obligatory!!'});   
    }
    const game = createNewGame(roomId);
    res.status(201).json({message: 'Match succesfully created, have fun!'});
};

// Get info of the match
export const getGame = (req:Request, res:Response) => {
    const {id} = req.params;
    const game = getGameById(id);

    if (!game) {
        return res.status(404).json({message: 'Match not founf'});
    }

    res.status(200).json(game);
};