import mongoose from "mongoose";
import { config } from "./env.js";

export async function connectDatabase(): Promise<void> {
  if (!config.mongodbUri) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }
  await mongoose.connect(config.mongodbUri);
  console.log("Connected to MongoDB");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
