import type { IncomingMessage, ServerResponse } from "http";
import { connectDatabase } from "./config/database.js";
import { createApp } from "./app.js";

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

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    await ensureDatabase();
  } catch (err) {
    console.error("Database connection failed:", err);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Database unavailable",
        message: err instanceof Error ? err.message : "Unknown error",
      })
    );
    return;
  }

  // Express apps are valid (req, res) request listeners.
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(
    req,
    res
  );
}
