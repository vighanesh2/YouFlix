function isLocalCoverUrl(url: string): boolean {
  return url.startsWith("/uploads/covers/");
}

function resolveCoverUrl(coverUrl?: string, thumbnailUrl?: string): string {
  if (!coverUrl) return thumbnailUrl || "";
  // Legacy prod entries saved before Blob was configured — fall back to YouTube.
  if (isLocalCoverUrl(coverUrl) && import.meta.env.PROD) {
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
