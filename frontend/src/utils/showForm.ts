import type { ImportShowDetails, Playlist } from "../api/client";
import { isMovieShow } from "./youtubeImport";

export function playlistToEditDetails(playlist: Playlist): ImportShowDetails {
  return {
    title: playlist.customTitle,
    channelTitle: playlist.customChannelTitle,
    year: playlist.customYear,
    seriesLabel: playlist.customSeriesLabel,
    rating: playlist.customRating,
    description: playlist.customDescription,
  };
}

export function playlistToPlaceholders(playlist: Playlist): ImportShowDetails {
  const year = playlist.lastSyncedAt
    ? String(new Date(playlist.lastSyncedAt).getFullYear())
    : "";

  return {
    title: playlist.title,
    channelTitle: playlist.channelTitle,
    year,
    seriesLabel: isMovieShow(playlist) ? "Movie" : "Series",
    rating: "",
    description: playlist.description,
  };
}
