import { Worker } from "bullmq";
import {
  PLAYLIST_IMPORT_QUEUE,
  redisConnectionOptions,
  type PlaylistImportJobData,
} from "../../config/queue.js";
import { processPlaylistImportJob } from "../workers/playlistImport.worker.js";

export function startPlaylistImportWorker(): Worker<PlaylistImportJobData> {
  const worker = new Worker<PlaylistImportJobData>(
    PLAYLIST_IMPORT_QUEUE,
    async (job) => {
      await processPlaylistImportJob(job.data);
    },
    { connection: redisConnectionOptions, concurrency: 2 }
  );

  worker.on("completed", (job) => {
    console.log(`Import job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Import job ${job?.id} failed:`, err.message);
  });

  console.log("Playlist import worker started");
  return worker;
}
