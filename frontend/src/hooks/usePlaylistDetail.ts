import { useEffect, useState } from "react";
import {
  getPlaylist,
  getPlaylistVideos,
  type Playlist,
  type PlaylistVideo,
} from "../api/client";
import { CACHE_KEYS, getCached } from "../api/queryCache";

export function usePlaylistDetail(playlistId: string | undefined) {
  const [playlist, setPlaylist] = useState<Playlist | null>(() =>
    playlistId ? getCached<Playlist>(CACHE_KEYS.playlist(playlistId)) ?? null : null
  );
  const [videos, setVideos] = useState<PlaylistVideo[]>(() =>
    playlistId
      ? getCached<PlaylistVideo[]>(CACHE_KEYS.playlistVideos(playlistId)) ?? []
      : []
  );
  const [loading, setLoading] = useState(() =>
    Boolean(playlistId && !getCached(CACHE_KEYS.playlist(playlistId)))
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) return;

    const id = playlistId;
    let cancelled = false;
    const cachedPlaylist = getCached<Playlist>(CACHE_KEYS.playlist(id));
    const cachedVideos = getCached<PlaylistVideo[]>(
      CACHE_KEYS.playlistVideos(id)
    );

    if (cachedPlaylist) setPlaylist(cachedPlaylist);
    if (cachedVideos) setVideos(cachedVideos);
    if (!cachedPlaylist) setLoading(true);

    async function load() {
      try {
        const [p, v] = await Promise.all([
          getPlaylist(id),
          getPlaylistVideos(id),
        ]);
        if (cancelled) return;
        setPlaylist(p);
        setVideos(v);
        setError(null);
      } catch (err) {
        if (!cancelled && !cachedPlaylist) {
          setError(
            err instanceof Error ? err.message : "Failed to load playlist"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  return { playlist, videos, loading, error };
}
