import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Playlist, PlaylistVideo } from "../api/client";
import { getPlaylist, getPlaylistVideos } from "../api/client";
import { formatDuration } from "../utils/format";
import { getPlaylistCover } from "../utils/playlistCover";
import {
  formatShowMeta,
  getShowChannel,
  getShowDescription,
  getShowTitle,
} from "../utils/showMetadata";
import { isMovieShow } from "../utils/youtubeImport";
import LazyPoster from "./LazyPoster";
import NetflixPlayer from "./NetflixPlayer";
import styles from "./PlaylistView.module.css";

export default function PlaylistView() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<PlaylistVideo | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) return;

    let cancelled = false;

    async function load() {
      try {
        const [p, v] = await Promise.all([
          getPlaylist(playlistId!),
          getPlaylistVideos(playlistId!),
        ]);
        if (cancelled) return;
        setPlaylist(p);
        setVideos(v);
        if (v.length > 0) {
          setSelectedVideo(v[0]);
          if (isMovieShow(p)) {
            setPlaying(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load playlist");
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

  if (loading) {
    return <div className={styles.centered}>Loading playlist…</div>;
  }

  if (error || !playlist) {
    return (
      <div className={styles.centered}>
        <p className={styles.error}>{error ?? "Playlist not found"}</p>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          ← Back
        </button>
      </div>
    );
  }

  const showTitle = getShowTitle(playlist);
  const showChannel = getShowChannel(playlist);
  const showDescription = getShowDescription(playlist);
  const showMeta = formatShowMeta(playlist);
  const isMovie = isMovieShow(playlist);

  const currentIndex = selectedVideo
    ? videos.findIndex((v) => v.id === selectedVideo.id)
    : -1;
  const hasNext = currentIndex >= 0 && currentIndex < videos.length - 1;

  function playVideo(video: PlaylistVideo) {
    setSelectedVideo(video);
    setPlaying(true);
  }

  function playNext() {
    if (hasNext) {
      setSelectedVideo(videos[currentIndex + 1]);
    }
  }

  function closePlayer() {
    if (isMovie) {
      navigate("/");
    } else {
      setPlaying(false);
    }
  }

  if (isMovie && playing && selectedVideo) {
    return (
      <NetflixPlayer
        videoId={selectedVideo.youtubeVideoId}
        title={showTitle}
        onClose={closePlayer}
      />
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          ← Back
        </button>
        <span className={styles.logo}>YOUFLIX</span>
      </header>

      <section
        className={styles.hero}
        style={
          getPlaylistCover(playlist)
            ? { backgroundImage: `url(${getPlaylistCover(playlist)})` }
            : undefined
        }
      >
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.title}>{showTitle}</h1>
          {showChannel && <p className={styles.channel}>{showChannel}</p>}
          <p className={styles.meta}>{showMeta}</p>
          {showDescription && (
            <p className={styles.description}>{showDescription}</p>
          )}
          {!isMovie && videos.length > 0 && (
            <div className={styles.heroActions}>
              <button
                className={styles.playCta}
                onClick={() => playVideo(selectedVideo ?? videos[0])}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
                  <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" />
                </svg>
                Play
              </button>
            </div>
          )}
        </div>
      </section>

      {videos.length > 0 && !isMovie && (
        <section className={styles.episodes}>
          <h3 className={styles.episodesTitle}>
            {isMovie ? "More" : "Episodes"}
          </h3>
          <div className={styles.episodeList}>
            {videos.map((video) => (
              <button
                key={video.id}
                className={`${styles.episodeCard} ${
                  selectedVideo?.id === video.id ? styles.episodeActive : ""
                }`}
                onClick={() => playVideo(video)}
              >
                <div className={styles.episodeThumb}>
                  {video.thumbnailUrl ? (
                    <LazyPoster
                      src={video.thumbnailUrl}
                      className={styles.thumbFrame}
                      imgClassName={styles.thumbImg}
                    />
                  ) : (
                    <div className={styles.thumbPlaceholder} />
                  )}
                  <span className={styles.episodeNum}>
                    {video.episodeNumber}
                  </span>
                  <span className={styles.episodePlayIcon}>
                    <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden>
                      <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" />
                    </svg>
                  </span>
                </div>
                <div className={styles.episodeInfo}>
                  <p className={styles.episodeTitle}>{video.title}</p>
                  <p className={styles.episodeDuration}>
                    {formatDuration(video.durationSeconds)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {playing && selectedVideo && (
        <NetflixPlayer
          videoId={selectedVideo.youtubeVideoId}
          title={showTitle}
          subtitle={
            isMovie
              ? undefined
              : `Ep ${selectedVideo.episodeNumber} · ${selectedVideo.title}`
          }
          hasNext={hasNext}
          onNext={hasNext ? playNext : undefined}
          onClose={closePlayer}
        />
      )}
    </div>
  );
}
