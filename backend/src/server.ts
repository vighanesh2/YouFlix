import type { Worker } from "bullmq";
import { assertConfig } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { startPlaylistImportWorker } from "./modules/workers/startWorker.js";

assertConfig();

const app = createApp();
let worker: Worker | null = null;

async function start() {
  await connectDatabase();
  worker = startPlaylistImportWorker();

  const server = app.listen(config.port, () => {
    console.log(`YouFlix API running on http://localhost:${config.port}`);
  });

  async function shutdown() {
    server.close(async () => {
      if (worker) await worker.close();
      await disconnectDatabase();
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
