import {
  getImportStorageKeyFromUrl,
  parseYouTubeImport,
} from "./parseYouTubeImport.js";

/** @deprecated Use parseYouTubeImport for playlist-only flows */
export function extractPlaylistId(inputUrl: string): string {
  const target = parseYouTubeImport(inputUrl);
  if (target.kind !== "playlist") {
    throw new Error("URL is a video, not a playlist");
  }
  return target.playlistId;
}

export { getImportStorageKeyFromUrl, parseYouTubeImport };
