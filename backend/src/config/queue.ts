import { Queue } from "bullmq";
import { config } from "./env.js";
import type { ShowOverrides } from "../utils/showOverrides.js";

export const PLAYLIST_IMPORT_QUEUE = "playlist-import-queue";

export interface PlaylistImportJobData extends ShowOverrides {
  jobId: string;
  playlistUrl: string;
  youtubePlaylistId: string;
  userId?: string;
  coverUrl?: string;
}

/** Vercel has no long-running worker — run imports inline there. */
export function useJobQueue(): boolean {
  if (process.env.VERCEL === "1") return false;
  return Boolean(config.redisUrl);
}

let playlistImportQueue: Queue | null = null;

export function getPlaylistImportQueue(): Queue {
  if (!useJobQueue()) {
    throw new Error("Job queue is not available in this environment");
  }

  if (!playlistImportQueue) {
    playlistImportQueue = new Queue(PLAYLIST_IMPORT_QUEUE, {
      connection: {
        url: config.redisUrl,
        maxRetriesPerRequest: null,
      },
    });
  }

  return playlistImportQueue;
}
