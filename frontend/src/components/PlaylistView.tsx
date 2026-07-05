import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PlaylistVideo } from "../api/client";
import { formatDuration } from "../utils/format";
import { usePlaylistDetail } from "../hooks/usePlaylistDetail";
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
  const { playlist, videos, loading, error } = usePlaylistDetail(playlistId);
  const [selectedVideo, setSelectedVideo] = useState<PlaylistVideo | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setSelectedVideo(null);
    setPlaying(false);
  }, [playlistId]);

  useEffect(() => {
    if (!playlist || videos.length === 0 || selectedVideo) return;
    setSelectedVideo(videos[0]);
    if (isMovieShow(playlist)) {
      setPlaying(true);
    }
  }, [playlist, videos, selectedVideo]);

  if (loading && !playlist) {
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
  const heroCover = getPlaylistCover(playlist);

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
        style={heroCover ? { backgroundImage: `url(${heroCover})` } : undefined}
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
