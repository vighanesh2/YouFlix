import { useCallback, useEffect, useState } from "react";
import {
  listPlaylists,
  type Playlist,
} from "../api/client";
import { CACHE_KEYS, getCached } from "../api/queryCache";

export function usePlaylists() {
  const initial = getCached<{ playlists: Playlist[] }>(CACHE_KEYS.playlists);
  const [playlists, setPlaylists] = useState<Playlist[]>(initial?.playlists ?? []);
  const [loading, setLoading] = useState(initial === undefined);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cached = getCached<{ playlists: Playlist[] }>(CACHE_KEYS.playlists);
    if (cached) {
      setPlaylists(cached.playlists);
      setLoading(false);
    }

    try {
      const data = await listPlaylists();
      setPlaylists(data.playlists);
      setError(null);
    } catch (err) {
      if (!cached) {
        setError(err instanceof Error ? err.message : "Failed to load shows");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { playlists, loading, error, refresh, setPlaylists };
}
