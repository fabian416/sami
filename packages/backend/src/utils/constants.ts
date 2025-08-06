
export const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT;

export const allowedOrigins = [
  "https://playsami.fun",
  ...(ENVIRONMENT !== "production" ? ["https://staging.playsami.fun", "http://localhost:3001", "https://8lh8dmll-3001.brs.devtunnels.ms"] : [])
];
