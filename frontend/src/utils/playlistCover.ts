function isLocalUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/");
}

/** Local /uploads paths only exist on the machine that saved them (not on Vercel). */
function resolveCoverUrl(coverUrl?: string, thumbnailUrl?: string): string {
  if (!coverUrl) return thumbnailUrl || "";
  if (isLocalUploadUrl(coverUrl) && import.meta.env.PROD) {
    return thumbnailUrl || coverUrl;
  }
  return coverUrl;
}

export function getPlaylistCover(playlist: {
  coverUrl?: string;
  thumbnailUrl?: string;
}): string {
  return resolveCoverUrl(playlist.coverUrl, playlist.thumbnailUrl);
}
