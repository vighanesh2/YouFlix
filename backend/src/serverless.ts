import type { Request, Response, NextFunction } from "express";
import { assertConfig } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { createApp } from "./app.js";

assertConfig();

const app = createApp();

let dbReady: Promise<unknown> | null = null;

function ensureDatabase() {
  if (!dbReady) {
    dbReady = connectDatabase().catch((err) => {
      dbReady = null;
      throw err;
    });
  }
  return dbReady;
}

async function handler(req: Request, res: Response, next: NextFunction) {
  try {
    await ensureDatabase();
    app(req, res, next);
  } catch (err) {
    next(err as Error);
  }
}

export default handler;
