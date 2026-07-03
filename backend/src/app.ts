import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import mongoose from "mongoose";
import { config } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { importJobsRouter } from "./routes/importJobs.js";
import { profilesRouter } from "./routes/profiles.js";
import { playlistsRouter } from "./routes/playlists.js";
import { videosRouter } from "./routes/videos.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.frontendUrl,
    })
  );
  app.use(express.json());

  app.use(
    "/uploads",
    express.static(path.resolve("uploads"), {
      setHeaders(res, filePath) {
        if (filePath.endsWith(".avif")) {
          res.setHeader("Content-Type", "image/avif");
        }
        if (filePath.endsWith(".mp4")) {
          res.setHeader("Content-Type", "video/mp4");
        }
      },
    })
  );

  app.get("/health", async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    res.status(mongoOk ? 200 : 503).json({
      status: mongoOk ? "ok" : "degraded",
      service: "youflix-api",
      database: mongoOk ? "connected" : "disconnected",
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/profiles", profilesRouter);
  app.use("/api/playlists", playlistsRouter);
  app.use("/api/import-jobs", importJobsRouter);
  app.use("/api/videos", videosRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err.message.includes("Cover must be")) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err.message.includes("File too large") || err.message.includes("LIMIT_FILE_SIZE")) {
      res.status(400).json({ error: "Cover image must be 8 MB or smaller." });
      return;
    }
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  });

  return app;
}
