import { Types } from "mongoose";
import { deleteCoverFile } from "../../services/imageProcessor.js";
import { getReadableCoverUrl } from "../../services/blobStorage.js";
import type { ShowOverrides } from "../../utils/showOverrides.js";
import { Playlist, type PlaylistDocument } from "./playlist.model.js";
import { PlaylistVideo } from "../playlist-videos/playlistVideo.model.js";
import type { VideoDocument } from "../videos/video.model.js";

import { isMovieStorageKey } from "../../utils/parseYouTubeImport.js";

function mapPlaylistFields(playlist: PlaylistDocument | Record<string, unknown>) {
  const p = playlist as PlaylistDocument;
  const contentType =
    p.contentType ??
    (isMovieStorageKey(p.youtubePlaylistId) ? "movie" : "series");

  return {
    id: p._id.toString(),
    youtubePlaylistId: p.youtubePlaylistId,
    contentType,
    title: p.title,
    description: p.description,
    customTitle: p.customTitle ?? "",
    customChannelTitle: p.customChannelTitle ?? "",
    customYear: p.customYear ?? "",
    customSeriesLabel: p.customSeriesLabel ?? "",
    customRating: p.customRating ?? "",
    customDescription: p.customDescription ?? "",
    thumbnailUrl: p.thumbnailUrl,
    coverUrl: p.coverUrl,
    channelId: p.channelId,
    channelTitle: p.channelTitle,
    videoCount: p.videoCount,
    syncStatus: p.syncStatus,
    lastSyncedAt: p.lastSyncedAt ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function formatPlaylist(playlist: PlaylistDocument) {
  const fields = mapPlaylistFields(playlist);
  return {
    ...fields,
    coverUrl: await getReadableCoverUrl(fields.coverUrl),
  };
}

export async function listPlaylists() {
  const playlists = await Playlist.find()
    .sort({ updatedAt: -1 })
    .lean();

  return Promise.all(playlists.map((playlist) => formatPlaylist(playlist)));
}

export async function getPlaylistById(playlistId: string) {
  if (!Types.ObjectId.isValid(playlistId)) return null;
  return Playlist.findById(playlistId);
}

export async function getPlaylistByYoutubeId(youtubePlaylistId: string) {
  return Playlist.findOne({ youtubePlaylistId });
}

export async function getPlaylistVideos(playlistId: string) {
  if (!Types.ObjectId.isValid(playlistId)) return null;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) return null;

  const entries = await PlaylistVideo.find({
    playlistId: playlist._id,
    isActive: true,
  })
    .sort({ position: 1 })
    .populate<{ videoId: VideoDocument }>("videoId");

  return entries.map((entry) => {
    const video = entry.videoId;
    return {
      id: video._id.toString(),
      youtubeVideoId: video.youtubeVideoId,
      position: entry.position,
      episodeNumber: entry.episodeNumber,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      durationSeconds: video.durationSeconds,
      channelTitle: video.channelTitle,
      embeddable: video.embeddable,
      availabilityStatus: video.availabilityStatus,
    };
  });
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(playlistId)) return false;

  const playlist = await Playlist.findByIdAndDelete(playlistId);
  if (!playlist) return false;

  if (playlist.coverUrl) {
    deleteCoverFile(playlist.coverUrl);
  }

  await PlaylistVideo.deleteMany({ playlistId: playlist._id });
  return true;
}

export async function updatePlaylistById(
  playlistId: string,
  options: {
    overrides?: Partial<ShowOverrides>;
    coverUrl?: string | null;
  }
): Promise<PlaylistDocument | null> {
  if (!Types.ObjectId.isValid(playlistId)) return null;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) return null;

  const updates: Record<string, string> = {};

  if (options.overrides) {
    for (const [key, value] of Object.entries(options.overrides)) {
      if (typeof value === "string") {
        updates[key] = value;
      }
    }
  }

  if (options.coverUrl !== undefined) {
    if (playlist.coverUrl && options.coverUrl !== playlist.coverUrl) {
      deleteCoverFile(playlist.coverUrl);
    }
    updates.coverUrl = options.coverUrl ?? "";
  }

  if (Object.keys(updates).length === 0) {
    return playlist;
  }

  return Playlist.findByIdAndUpdate(playlistId, updates, { new: true });
}
