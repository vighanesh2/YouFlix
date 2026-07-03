import { google, youtube_v3 } from "googleapis";
import { config } from "../../config/env.js";
import { chunk } from "../../utils/chunk.js";
import { parseYouTubeDuration } from "../../utils/parseYouTubeDuration.js";
import { getBestThumbnail } from "./youtube.helpers.js";

const youtube = google.youtube("v3");

export interface PlaylistMetadata {
  youtubePlaylistId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  videoCount: number;
}

export interface PlaylistItemData {
  youtubeVideoId: string;
  title: string;
  description: string;
  position: number;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  videoPublishedAt: Date | null;
}

export interface VideoDetailData {
  youtubeVideoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationIso: string;
  durationSeconds: number;
  publishedAt: Date | null;
  viewCount: number;
  likeCount: number;
  privacyStatus: "public" | "private" | "unlisted";
  embeddable: boolean;
  availabilityStatus: "available" | "private" | "deleted" | "unavailable";
}

function getClient(): youtube_v3.Youtube {
  return youtube;
}

export async function getPlaylistMetadata(
  playlistId: string
): Promise<PlaylistMetadata> {
  const response = await getClient().playlists.list({
    key: config.youtubeApiKey,
    part: ["snippet", "contentDetails"],
    id: [playlistId],
  });

  const item = response.data.items?.[0];
  if (!item) {
    throw new Error(`Playlist not found: ${playlistId}`);
  }

  return {
    youtubePlaylistId: playlistId,
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
    thumbnailUrl: getBestThumbnail(item.snippet?.thumbnails),
    channelId: item.snippet?.channelId ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    videoCount: item.contentDetails?.itemCount ?? 0,
  };
}

export async function getAllPlaylistItems(
  playlistId: string
): Promise<PlaylistItemData[]> {
  const allItems: PlaylistItemData[] = [];
  let nextPageToken: string | undefined;

  do {
    const response = await getClient().playlistItems.list({
      key: config.youtubeApiKey,
      part: ["snippet", "contentDetails"],
      playlistId,
      maxResults: 50,
      pageToken: nextPageToken,
    });

    for (const item of response.data.items ?? []) {
      const videoId =
        item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;

      if (!videoId) continue;

      allItems.push({
        youtubeVideoId: videoId,
        title: item.snippet?.title ?? "",
        description: item.snippet?.description ?? "",
        position: item.snippet?.position ?? allItems.length,
        thumbnailUrl: getBestThumbnail(item.snippet?.thumbnails),
        channelId: item.snippet?.channelId ?? "",
        channelTitle: item.snippet?.channelTitle ?? "",
        videoPublishedAt: item.contentDetails?.videoPublishedAt
          ? new Date(item.contentDetails.videoPublishedAt)
          : null,
      });
    }

    nextPageToken = response.data.nextPageToken ?? undefined;
  } while (nextPageToken);

  return allItems;
}

export async function getVideosByIds(
  videoIds: string[]
): Promise<VideoDetailData[]> {
  if (videoIds.length === 0) return [];

  const batches = chunk(videoIds, 50);
  const videos: VideoDetailData[] = [];

  for (const batch of batches) {
    const response = await getClient().videos.list({
      key: config.youtubeApiKey,
      part: ["snippet", "contentDetails", "statistics", "status"],
      id: batch,
    });

    const returnedIds = new Set<string>();

    for (const item of response.data.items ?? []) {
      if (!item.id) continue;
      returnedIds.add(item.id);

      const privacyStatus = (item.status?.privacyStatus ??
        "public") as VideoDetailData["privacyStatus"];

      videos.push({
        youtubeVideoId: item.id,
        title: item.snippet?.title ?? "",
        description: item.snippet?.description ?? "",
        channelId: item.snippet?.channelId ?? "",
        channelTitle: item.snippet?.channelTitle ?? "",
        thumbnailUrl: getBestThumbnail(item.snippet?.thumbnails),
        durationIso: item.contentDetails?.duration ?? "",
        durationSeconds: parseYouTubeDuration(item.contentDetails?.duration),
        publishedAt: item.snippet?.publishedAt
          ? new Date(item.snippet.publishedAt)
          : null,
        viewCount: Number(item.statistics?.viewCount ?? 0),
        likeCount: Number(item.statistics?.likeCount ?? 0),
        privacyStatus,
        embeddable: item.status?.embeddable ?? true,
        availabilityStatus:
          privacyStatus === "public" && item.status?.embeddable !== false
            ? "available"
            : "unavailable",
      });
    }

    for (const id of batch) {
      if (!returnedIds.has(id)) {
        videos.push({
          youtubeVideoId: id,
          title: "Deleted video",
          description: "",
          channelId: "",
          channelTitle: "",
          thumbnailUrl: "",
          durationIso: "",
          durationSeconds: 0,
          publishedAt: null,
          viewCount: 0,
          likeCount: 0,
          privacyStatus: "private",
          embeddable: false,
          availabilityStatus: "deleted",
        });
      }
    }
  }

  return videos;
}
