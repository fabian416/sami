import express from 'express';
import configRoutes from './routes/configRoutes';
import { allowedOrigins } from "./utils/constants";
import cors from 'cors';

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));


app.use(express.json());

app.use('/api/config', configRoutes);

export default app; 