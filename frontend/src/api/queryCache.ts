type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const CACHE_TTL = {
  playlists: 10 * 60 * 1000,
  playlist: 10 * 60 * 1000,
  videos: 10 * 60 * 1000,
} as const;

export const CACHE_KEYS = {
  playlists: "playlists",
  playlist: (id: string) => `playlist:${id}`,
  playlistVideos: (id: string) => `playlist:${id}:videos`,
} as const;

export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== undefined) return cached;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((data) => {
      setCached(key, data, ttlMs);
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

export function invalidateKey(key: string): void {
  cache.delete(key);
  inflight.delete(key);
}

export function invalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

export function clearQueryCache(): void {
  cache.clear();
  inflight.clear();
}

export function invalidatePlaylist(playlistId: string): void {
  invalidateKey(CACHE_KEYS.playlist(playlistId));
  invalidateKey(CACHE_KEYS.playlistVideos(playlistId));
  invalidateKey(CACHE_KEYS.playlists);
}

export function invalidatePlaylistsList(): void {
  invalidateKey(CACHE_KEYS.playlists);
}
