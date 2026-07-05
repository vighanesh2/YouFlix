import type { Playlist } from "../api/client";
import { getShowChannel, getShowDescription, getShowTitle } from "./showMetadata";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function searchableText(show: Playlist): string {
  return [
    getShowTitle(show),
    getShowChannel(show),
    getShowDescription(show),
  ]
    .join(" ")
    .toLowerCase();
}

export function scoreShowMatch(show: Playlist, query: string): number {
  const q = normalize(query);
  if (!q) return 0;

  const title = normalize(getShowTitle(show));
  const channel = normalize(getShowChannel(show));
  const description = normalize(getShowDescription(show));

  if (title === q) return 100;
  if (title.startsWith(q)) return 85;
  if (title.includes(q)) return 70;
  if (channel.startsWith(q)) return 55;
  if (channel.includes(q)) return 45;
  if (description.includes(q)) return 30;

  const words = q.split(/\s+/).filter(Boolean);
  if (words.every((word) => searchableText(show).includes(word))) {
    return 25;
  }

  return 0;
}

export function filterShowsByQuery(
  playlists: Playlist[],
  query: string
): Playlist[] {
  const q = normalize(query);
  if (!q) return playlists;

  return playlists
    .map((show) => ({ show, score: scoreShowMatch(show, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || getShowTitle(a.show).localeCompare(getShowTitle(b.show)))
    .map(({ show }) => show);
}

export function buildSuggestions(
  playlists: Playlist[],
  query: string,
  limit = 10
): string[] {
  const q = normalize(query);
  if (!q) return [];

  const seen = new Set<string>();
  const suggestions: string[] = [];

  const ranked = playlists
    .map((show) => ({ title: getShowTitle(show), score: scoreShowMatch(show, q) }))
    .filter(({ title, score }) => title && score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  for (const { title } of ranked) {
    const key = normalize(title);
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push(title);
    if (suggestions.length >= limit) break;
  }

  return suggestions;
}

export function getRecommendationShows(
  playlists: Playlist[],
  query: string,
  matches: Playlist[]
): Playlist[] {
  const matchIds = new Set(matches.map((show) => show.id));
  const q = normalize(query);

  if (!q) {
    return [];
  }

  const partial = playlists
    .filter((show) => !matchIds.has(show.id))
    .map((show) => ({ show, score: scoreShowMatch(show, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ show }) => show);

  if (partial.length > 0) {
    return partial.slice(0, 8);
  }

  return playlists.filter((show) => !matchIds.has(show.id)).slice(0, 8);
}
