import type { PlaylistItemData } from "../youtube/youtube.client.js";
import {
  getAllPlaylistItems,
  getPlaylistMetadata,
  getVideosByIds,
} from "../youtube/youtube.client.js";
import {
  getImportStorageKey,
  parseYouTubeImport,
  type YouTubeImportTarget,
} from "../../utils/parseYouTubeImport.js";

export interface ImportSourceData {
  storageKey: string;
  contentType: "series" | "movie";
  metadata: {
    title: string;
    description: string;
    thumbnailUrl: string;
    channelId: string;
    channelTitle: string;
  };
  items: PlaylistItemData[];
}

async function loadPlaylistSource(
  playlistId: string
): Promise<ImportSourceData> {
  const playlistMetadata = await getPlaylistMetadata(playlistId);
  const playlistItems = await getAllPlaylistItems(playlistId);

  return {
    storageKey: getImportStorageKey({ kind: "playlist", playlistId }),
    contentType: "series",
    metadata: {
      title: playlistMetadata.title,
      description: playlistMetadata.description,
      thumbnailUrl: playlistMetadata.thumbnailUrl,
      channelId: playlistMetadata.channelId,
      channelTitle: playlistMetadata.channelTitle,
    },
    items: playlistItems,
  };
}

async function loadMovieSource(videoId: string): Promise<ImportSourceData> {
  const videoDetails = await getVideosByIds([videoId]);
  const video = videoDetails.find((entry) => entry.youtubeVideoId === videoId);

  if (!video || video.availabilityStatus === "deleted") {
    throw new Error(`Video not found: ${videoId}`);
  }

  return {
    storageKey: getImportStorageKey({ kind: "video", videoId }),
    contentType: "movie",
    metadata: {
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      channelId: video.channelId,
      channelTitle: video.channelTitle,
    },
    items: [
      {
        youtubeVideoId: video.youtubeVideoId,
        title: video.title,
        description: video.description,
        position: 0,
        thumbnailUrl: video.thumbnailUrl,
        channelId: video.channelId,
        channelTitle: video.channelTitle,
        videoPublishedAt: video.publishedAt,
      },
    ],
  };
}

export async function loadImportSource(
  inputUrl: string
): Promise<ImportSourceData> {
  const target = parseYouTubeImport(inputUrl);
  return loadImportSourceFromTarget(target);
}

export async function loadImportSourceFromTarget(
  target: YouTubeImportTarget
): Promise<ImportSourceData> {
  if (target.kind === "playlist") {
    return loadPlaylistSource(target.playlistId);
  }
  return loadMovieSource(target.videoId);
}
