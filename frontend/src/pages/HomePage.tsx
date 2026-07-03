import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPlaylists, type Playlist } from "../api/client";
import NavBar from "../components/NavBar";
import ShowCarousel from "../components/ShowCarousel";
import Top10Carousel from "../components/Top10Carousel";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listPlaylists();
        if (!cancelled) setPlaylists(data.playlists);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load shows");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rotate = (offset: number) =>
    playlists.length > 0
      ? [...playlists.slice(offset), ...playlists.slice(0, offset)]
      : playlists;

  const continueWatching = rotate(1);
  const youMayLike = [...playlists].reverse();
  const mostWatched = rotate(Math.floor(playlists.length / 2));

  const movies = playlists.filter((show) => show.contentType === "movie");
  const topMovies = (movies.length > 0 ? movies : playlists).slice(0, 10);

  return (
    <div className={styles.page}>
      <NavBar />

      <main className={styles.main}>
        {loading && <p className={styles.status}>Loading shows…</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && playlists.length === 0 && (
          <div className={styles.empty}>
            <h1 className={styles.emptyTitle}>No shows yet</h1>
            <p className={styles.emptyText}>
              Import a YouTube playlist to add your first show.
            </p>
            <Link to="/import" className={styles.emptyBtn}>
              Import a playlist
            </Link>
          </div>
        )}

        {!loading && !error && playlists.length > 0 && (
          <>
            <ShowCarousel title="My list" shows={playlists} />
            <Top10Carousel
              title="Top 10 Movies in United States"
              shows={topMovies}
            />
            <ShowCarousel title="Continue Watching" shows={continueWatching} />
            <ShowCarousel title="You May Like These" shows={youMayLike} />
            <ShowCarousel title="Most Watched This Week" shows={mostWatched} />
          </>
        )}
      </main>
    </div>
  );
}
