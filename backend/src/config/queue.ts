import { Queue } from "bullmq";
import { config } from "./env.js";

export const PLAYLIST_IMPORT_QUEUE = "playlist-import-queue";

export const redisConnectionOptions = {
  url: config.redisUrl,
  maxRetriesPerRequest: null,
} as const;

export const playlistImportQueue = new Queue(PLAYLIST_IMPORT_QUEUE, {
  connection: redisConnectionOptions,
});

import type { ShowOverrides } from "../utils/showOverrides.js";

export interface PlaylistImportJobData extends ShowOverrides {
  jobId: string;
  playlistUrl: string;
  youtubePlaylistId: string;
  userId?: string;
  coverUrl?: string;
}
