import { Types } from "mongoose";
import type { PlaylistImportJobData } from "../../config/queue.js";
import { getImportStorageKeyFromUrl } from "../../utils/parseYouTubeImport.js";
import { pickDefinedOverrides } from "../../utils/showOverrides.js";
import { loadImportSource } from "../import-jobs/importSource.js";
import { getVideosByIds } from "../youtube/youtube.client.js";
import { ImportJob } from "../import-jobs/importJob.model.js";
import { Playlist } from "../playlists/playlist.model.js";
import { PlaylistVideo } from "../playlist-videos/playlistVideo.model.js";
import { Video } from "../videos/video.model.js";

export async function processPlaylistImportJob(
  data: PlaylistImportJobData
): Promise<void> {
  const { jobId, playlistUrl, coverUrl, ...rawOverrides } = data;
  const overrides = pickDefinedOverrides(rawOverrides);
  let storageKey: string | null = null;

  await ImportJob.updateOne(
    { _id: new Types.ObjectId(jobId) },
    { status: "PROCESSING", startedAt: new Date() }
  );

  try {
    const source = await loadImportSource(playlistUrl);
    storageKey = source.storageKey;
    const { metadata, items: playlistItems, contentType } = source;

    const youtubeVideoIds = playlistItems
      .map((item) => item.youtubeVideoId)
      .filter(Boolean);

    const videoDetails = await getVideosByIds(youtubeVideoIds);
    const videoDetailsMap = new Map(
      videoDetails.map((v) => [v.youtubeVideoId, v])
    );

    const playlistUpdate: Record<string, unknown> = {
      youtubePlaylistId: storageKey,
      source: "youtube",
      contentType,
      title: metadata.title,
      description: metadata.description,
      thumbnailUrl: metadata.thumbnailUrl,
      channelId: metadata.channelId,
      channelTitle: metadata.channelTitle,
      videoCount: playlistItems.length,
      syncStatus: "READY",
      lastSyncedAt: new Date(),
      lastImportJobId: new Types.ObjectId(jobId),
    };

    if (coverUrl) {
      playlistUpdate.coverUrl = coverUrl;
    }

    for (const [key, value] of Object.entries(overrides)) {
      playlistUpdate[key] = value;
    }

    const playlist = await Playlist.findOneAndUpdate(
      { youtubePlaylistId: storageKey },
      playlistUpdate,
      { upsert: true, new: true }
    );

    let importedCount = 0;
    let failedCount = 0;

    for (const video of videoDetails) {
      try {
        await Video.findOneAndUpdate(
          { youtubeVideoId: video.youtubeVideoId },
          {
            ...video,
            source: "youtube",
          },
          { upsert: true, new: true }
        );
        importedCount++;
      } catch {
        failedCount++;
      }
    }

    const fetchedVideoIds = new Set(youtubeVideoIds);

    await PlaylistVideo.updateMany(
      {
        playlistId: playlist._id,
        youtubeVideoId: { $nin: [...fetchedVideoIds] },
        isActive: true,
      },
      {
        isActive: false,
        removedFromPlaylistAt: new Date(),
      }
    );

    for (const item of playlistItems) {
      const detail = videoDetailsMap.get(item.youtubeVideoId);
      if (!detail) {
        failedCount++;
        continue;
      }

      const video = await Video.findOne({
        youtubeVideoId: item.youtubeVideoId,
      });
      if (!video) {
        failedCount++;
        continue;
      }

      await PlaylistVideo.findOneAndUpdate(
        {
          playlistId: playlist._id,
          youtubeVideoId: item.youtubeVideoId,
        },
        {
          playlistId: playlist._id,
          videoId: video._id,
          youtubePlaylistId: storageKey,
          youtubeVideoId: item.youtubeVideoId,
          position: item.position,
          episodeNumber: item.position + 1,
          isActive: true,
          removedFromPlaylistAt: null,
          addedToPlaylistAt: item.videoPublishedAt ?? new Date(),
        },
        { upsert: true, new: true }
      );
    }

    const finalStatus =
      failedCount > 0 && importedCount > 0
        ? "PARTIAL_FAILED"
        : failedCount > 0 && importedCount === 0
          ? "FAILED"
          : "COMPLETED";

    await ImportJob.updateOne(
      { _id: new Types.ObjectId(jobId) },
      {
        status: finalStatus,
        playlistId: playlist._id,
        totalVideosFound: playlistItems.length,
        totalVideosImported: importedCount,
        totalVideosFailed: failedCount,
        completedAt: new Date(),
        errorMessage:
          failedCount > 0
            ? `${failedCount} video(s) could not be imported`
            : null,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown import error";

    await ImportJob.updateOne(
      { _id: new Types.ObjectId(jobId) },
      {
        status: "FAILED",
        errorMessage: message,
        completedAt: new Date(),
      }
    );

    if (!storageKey) {
      try {
        storageKey = getImportStorageKeyFromUrl(playlistUrl);
      } catch {
        storageKey = null;
      }
    }

    if (storageKey) {
      await Playlist.updateOne(
        { youtubePlaylistId: storageKey },
        { syncStatus: "FAILED" }
      ).catch(() => {});
    }

    throw error;
  }
}
