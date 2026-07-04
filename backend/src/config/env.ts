import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? "development";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  nodeEnv,
  mongodbUri:
    process.env.MONGODB_URI ??
    (nodeEnv === "production" ? "" : "mongodb://localhost:27017/youflix"),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  syncCooldownHours: parseInt(process.env.SYNC_COOLDOWN_HOURS ?? "24", 10),
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN ?? "",
};

export function assertConfig(): void {
  requireEnv("YOUTUBE_API_KEY");
}
