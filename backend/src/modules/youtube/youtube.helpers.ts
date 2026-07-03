import type { youtube_v3 } from "googleapis";

export function getBestThumbnail(
  thumbnails: youtube_v3.Schema$ThumbnailDetails | null | undefined
): string {
  if (!thumbnails) return "";

  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ""
  );
}
