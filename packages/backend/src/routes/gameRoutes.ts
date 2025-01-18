import { Router } from "express";
import { createGame, getGame } from '../controllers/gameController';

const router = Router();

// Create a new match
router.post('/create', createGame);

// Get info of a specific match

router.get('/:id', getGame);

export default router;