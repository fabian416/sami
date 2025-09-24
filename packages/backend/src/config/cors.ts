import { allowedOrigins } from "@src/utils/constants";
import type { CorsOptions } from "cors";

export const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
