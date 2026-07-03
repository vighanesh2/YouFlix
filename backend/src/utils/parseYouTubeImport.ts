export type YouTubeImportTarget =
  | { kind: "playlist"; playlistId: string }
  | { kind: "video"; videoId: string };

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const PLAYLIST_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;

export function getImportStorageKey(target: YouTubeImportTarget): string {
  return target.kind === "playlist"
    ? target.playlistId
    : `movie:${target.videoId}`;
}

export function isMovieStorageKey(storageKey: string): boolean {
  return storageKey.startsWith("movie:");
}

export function getYouTubeSourceUrl(
  storageKey: string,
  contentType?: string
): string {
  if (contentType === "movie" || isMovieStorageKey(storageKey)) {
    const videoId = storageKey.replace(/^movie:/, "");
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return `https://www.youtube.com/playlist?list=${storageKey}`;
}

export function parseYouTubeImport(input: string): YouTubeImportTarget {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Invalid YouTube playlist or video URL");
  }

  if (PLAYLIST_ID_PATTERN.test(trimmed) && !trimmed.includes("/")) {
    if (trimmed.startsWith("PL") || trimmed.length > 11) {
      return { kind: "playlist", playlistId: trimmed };
    }
    if (VIDEO_ID_PATTERN.test(trimmed)) {
      return { kind: "video", videoId: trimmed };
    }
    return { kind: "playlist", playlistId: trimmed };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    );
  } catch {
    throw new Error("Invalid YouTube playlist or video URL");
  }

  const listParam = parsedUrl.searchParams.get("list");
  if (listParam) {
    return { kind: "playlist", playlistId: listParam };
  }

  const videoParam = parsedUrl.searchParams.get("v");
  if (videoParam) {
    return { kind: "video", videoId: videoParam };
  }

  const host = parsedUrl.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const videoId = parsedUrl.pathname.slice(1).split("/")[0];
    if (videoId) {
      return { kind: "video", videoId };
    }
  }

  const pathVideoMatch = parsedUrl.pathname.match(
    /\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]+)/
  );
  if (pathVideoMatch?.[1]) {
    return { kind: "video", videoId: pathVideoMatch[1] };
  }

  const playlistPathMatch = parsedUrl.pathname.match(
    /\/playlist\/([a-zA-Z0-9_-]+)/
  );
  if (playlistPathMatch?.[1]) {
    return { kind: "playlist", playlistId: playlistPathMatch[1] };
  }

  throw new Error("Invalid YouTube playlist or video URL");
}

export function tryParseYouTubeImport(
  input: string
): YouTubeImportTarget | null {
  try {
    return parseYouTubeImport(input);
  } catch {
    return null;
  }
}

export function getImportStorageKeyFromUrl(input: string): string {
  return getImportStorageKey(parseYouTubeImport(input));
}
