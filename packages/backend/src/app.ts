import express from "express";
import cors from "cors";
import { corsOptions } from "@config/cors";
import healthRoutes from "@src/routes/config-routes";
import configRoutes from "@src/routes/config-routes";

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/config", configRoutes);

export default app;