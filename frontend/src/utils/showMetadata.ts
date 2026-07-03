import type { Playlist } from "../api/client";
import { isMovieShow } from "./youtubeImport";

export function getShowTitle(show: Playlist): string {
  return (show.customTitle || show.title || "").trim();
}

export function getShowChannel(show: Playlist): string {
  return (show.customChannelTitle || show.channelTitle || "").trim();
}

export function getShowYear(show: Playlist): string | null {
  const custom = show.customYear?.trim();
  if (custom) return custom;

  const date = show.lastSyncedAt;
  if (!date) return null;
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? null : String(year);
}

export function getShowSeriesLabel(show: Playlist): string {
  const custom = show.customSeriesLabel?.trim();
  if (custom) return custom;
  return isMovieShow(show) ? "Movie" : "Series";
}

export function getShowRating(show: Playlist): string | null {
  const rating = show.customRating?.trim();
  return rating || null;
}

export function getShowDescription(show: Playlist): string {
  return (show.customDescription || show.description || "").trim();
}

export function formatShowMeta(show: Playlist): string {
  const parts: string[] = [];

  const channel = getShowChannel(show);
  if (channel) parts.push(channel);

  const year = getShowYear(show);
  if (year) parts.push(year);

  parts.push(getShowSeriesLabel(show));

  const rating = getShowRating(show);
  if (rating) parts.push(rating);

  if (!isMovieShow(show)) {
    parts.push(
      `${show.videoCount} episode${show.videoCount !== 1 ? "s" : ""}`
    );
  }

  return parts.join(" • ");
}
