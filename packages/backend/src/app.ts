import express from 'express';
import gameRoutes from './routes/gameRoutes';

const app = express();

// Middleware to manage JSON
app.use(express.json());

// Main routes
app.use('/api/games', gameRoutes);

export default app;