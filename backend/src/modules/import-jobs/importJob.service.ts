import { Types } from "mongoose";
import { config } from "../../config/env.js";
import {
  getPlaylistImportQueue,
  useJobQueue,
  type PlaylistImportJobData,
} from "../../config/queue.js";
import { getImportStorageKeyFromUrl, getYouTubeSourceUrl } from "../../utils/parseYouTubeImport.js";
import {
  pickDefinedOverrides,
  type ShowOverrides,
} from "../../utils/showOverrides.js";
import { processPlaylistImportJob } from "../workers/playlistImport.worker.js";
import { ImportJob, type ImportJobDocument } from "./importJob.model.js";
import { Playlist } from "../playlists/playlist.model.js";

const SYNC_COOLDOWN_MS = config.syncCooldownHours * 60 * 60 * 1000;

export function formatImportJob(job: ImportJobDocument) {
  return {
    jobId: job._id.toString(),
    status: job.status,
    youtubePlaylistId: job.youtubePlaylistId,
    playlistId: job.playlistId?.toString() ?? null,
    totalVideosFound: job.totalVideosFound,
    totalVideosImported: job.totalVideosImported,
    totalVideosFailed: job.totalVideosFailed,
    errorMessage: job.errorMessage,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    createdAt: job.createdAt,
  };
}

export async function getImportJobById(
  jobId: string
): Promise<ImportJobDocument | null> {
  if (!Types.ObjectId.isValid(jobId)) return null;
  return ImportJob.findById(jobId);
}

export async function createImportJob(options: {
  playlistUrl: string;
  youtubePlaylistId: string;
  userId?: string;
  coverUrl?: string;
} & ShowOverrides): Promise<ImportJobDocument> {
  const overrides = pickDefinedOverrides(options);
  const job = await ImportJob.create({
    playlistUrl: options.playlistUrl,
    youtubePlaylistId: options.youtubePlaylistId,
    userId: options.userId ? new Types.ObjectId(options.userId) : null,
    coverUrl: options.coverUrl ?? null,
    customTitle: overrides.customTitle ?? null,
    customChannelTitle: overrides.customChannelTitle ?? null,
    customYear: overrides.customYear ?? null,
    customSeriesLabel: overrides.customSeriesLabel ?? null,
    customRating: overrides.customRating ?? null,
    customDescription: overrides.customDescription ?? null,
    status: "QUEUED",
  });

  const jobData: PlaylistImportJobData = {
    jobId: job._id.toString(),
    playlistUrl: options.playlistUrl,
    youtubePlaylistId: options.youtubePlaylistId,
    userId: options.userId,
    coverUrl: options.coverUrl,
    ...overrides,
  };

  if (useJobQueue()) {
    await getPlaylistImportQueue().add("import-playlist", jobData, {
      jobId: job._id.toString(),
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  } else {
    await processPlaylistImportJob(jobData);
  }

  return job;
}

export async function startPlaylistImport(
  playlistUrl: string,
  options: { coverUrl?: string } & ShowOverrides = {}
) {
  const storageKey = getImportStorageKeyFromUrl(playlistUrl);
  const { coverUrl, ...rawOverrides } = options;
  const overrides = pickDefinedOverrides(rawOverrides);

  const existing = await Playlist.findOne({ youtubePlaylistId: storageKey });
  if (existing?.lastSyncedAt) {
    const age = Date.now() - existing.lastSyncedAt.getTime();
    if (age < SYNC_COOLDOWN_MS) {
      const updates: Record<string, string> = {};
      if (coverUrl) updates.coverUrl = coverUrl;
      for (const [key, value] of Object.entries(overrides)) {
        updates[key] = value;
      }
      if (Object.keys(updates).length > 0) {
        await Playlist.updateOne({ _id: existing._id }, updates);
      }
      return {
        type: "ALREADY_IMPORTED" as const,
        playlistId: existing._id.toString(),
        status: "ALREADY_IMPORTED" as const,
        message: "Show already exists",
      };
    }
  }

  const job = await createImportJob({
    playlistUrl,
    youtubePlaylistId: storageKey,
    coverUrl,
    ...overrides,
  });

  return {
    type: "JOB_CREATED" as const,
    jobId: job._id.toString(),
    status: "QUEUED" as const,
    message: "Import started",
  };
}

export async function startPlaylistSync(playlistId: string) {
  if (!Types.ObjectId.isValid(playlistId)) {
    throw new Error("Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new Error("Playlist not found");
  }

  const playlistUrl = getYouTubeSourceUrl(
    playlist.youtubePlaylistId,
    playlist.contentType
  );

  await Playlist.updateOne(
    { _id: playlist._id },
    { syncStatus: "SYNCING" }
  );

  const job = await createImportJob({
    playlistUrl,
    youtubePlaylistId: playlist.youtubePlaylistId,
  });

  return {
    jobId: job._id.toString(),
    status: "QUEUED" as const,
    message: "Playlist sync started",
  };
}
