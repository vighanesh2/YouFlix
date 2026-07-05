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

function optimizeYouTubeThumbnail(url: string): string {
  if (!url.includes("ytimg.com") && !url.includes("img.youtube.com")) {
    return url;
  }

  return url.replace(
    /\/(maxresdefault|sddefault|hqdefault|mqdefault|default)\.(jpg|webp)/i,
    "/mqdefault.jpg"
  );
}

export function getPlaylistCover(playlist: {
  coverUrl?: string;
  thumbnailUrl?: string;
}): string {
  return resolveCoverUrl(playlist.coverUrl, playlist.thumbnailUrl);
}

/** Smaller cover for grids/search — uses uploaded cover when available. */
export function getGridCover(playlist: {
  coverUrl?: string;
  thumbnailUrl?: string;
}): string {
  if (playlist.coverUrl?.trim()) {
    const cover = resolveCoverUrl(playlist.coverUrl, playlist.thumbnailUrl);
    if (cover) {
      return optimizeYouTubeThumbnail(cover);
    }
  }

  const thumbnail = resolveCoverUrl("", playlist.thumbnailUrl);
  return optimizeYouTubeThumbnail(thumbnail);
}
