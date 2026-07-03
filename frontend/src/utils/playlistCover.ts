export function getPlaylistCover(playlist: {
  coverUrl?: string;
  thumbnailUrl?: string;
}): string {
  return playlist.coverUrl || playlist.thumbnailUrl || "";
}
