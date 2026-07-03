import { useCallback, useEffect, useRef, useState } from "react";
import { YOUFLIX_INTRO_SRC } from "../constants/intro";
import {
  useYouTubeApi,
  type YouTubePlayer,
  type YouTubeQuality,
} from "../hooks/useYouTubeApi";
import styles from "./NetflixPlayer.module.css";

const QUALITY_RANK: Record<string, number> = {
  highres: 8,
  hd2160: 7,
  hd1440: 6,
  hd1080: 5,
  hd720: 4,
  large: 3,
  medium: 2,
  small: 1,
  tiny: 0,
};

function qualityLabel(quality: string): string {
  switch (quality) {
    case "default":
    case "auto":
      return "Auto";
    case "highres":
      return "4K";
    case "hd2160":
      return "2160p";
    case "hd1440":
      return "1440p";
    case "hd1080":
      return "1080p";
    case "hd720":
      return "720p";
    case "large":
      return "480p";
    case "medium":
      return "360p";
    case "small":
      return "240p";
    case "tiny":
      return "144p";
    default:
      return quality;
  }
}

function sortQualities(levels: string[]): string[] {
  return [...levels].sort(
    (a, b) => (QUALITY_RANK[b] ?? -1) - (QUALITY_RANK[a] ?? -1)
  );
}

function readQualities(player: YouTubePlayer) {
  try {
    const levels = sortQualities(player.getAvailableQualityLevels());
    const active = player.getPlaybackQuality();
    return { levels, active };
  } catch {
    return { levels: [] as string[], active: "unknown" };
  }
}

interface Props {
  videoId: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onNext?: () => void;
  hasNext?: boolean;
  onShowEpisodes?: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default function NetflixPlayer({
  videoId,
  title,
  subtitle,
  onClose,
  onNext,
  hasNext = false,
  onShowEpisodes,
}: Props) {
  const apiReady = useYouTubeApi();
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const hideTimer = useRef<number | null>(null);
  const mainStartedRef = useRef(false);
  const playingRef = useRef(false);
  const qualityRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<"intro" | "main">("intro");
  const [introFading, setIntroFading] = useState(false);
  const [youtubeRevealed, setYoutubeRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] =
    useState<YouTubeQuality>("default");
  const [activeQuality, setActiveQuality] = useState<string>("unknown");
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playingRef.current) {
        setControlsVisible(false);
      }
    }, 3200);
  }, []);

  const revealControls = useCallback(() => {
    if (phase !== "main") return;
    setControlsVisible(true);
    scheduleHide();
  }, [phase, scheduleHide]);

  const beginMain = useCallback(() => {
    if (mainStartedRef.current) return;
    mainStartedRef.current = true;
    setIntroFading(true);

    window.setTimeout(() => {
      setPhase("main");

      const player = playerRef.current;
      if (player) {
        player.unMute();
        player.setVolume(100);
        setMuted(false);
        player.playVideo();
        setDuration(player.getDuration());
      }

      setControlsVisible(true);
      scheduleHide();
    }, 650);
  }, [scheduleHide]);

  const skipIntro = useCallback(() => {
    introRef.current?.pause();
    beginMain();
  }, [beginMain]);

  useEffect(() => {
    mainStartedRef.current = false;
    setPhase("intro");
    setIntroFading(false);
    setYoutubeRevealed(false);
    setReady(false);
    setPlaying(false);
    playingRef.current = false;
    setControlsVisible(false);
    setAvailableQualities([]);
    setSelectedQuality("default");
    setActiveQuality("unknown");
    setQualityMenuOpen(false);
  }, [videoId]);

  useEffect(() => {
    const video = introRef.current;
    if (!video || phase !== "intro") return;

    video.currentTime = 0;
    video.play().catch(() => skipIntro());

    function onEnded() {
      beginMain();
    }

    function onError() {
      skipIntro();
    }

    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [videoId, phase, beginMain, skipIntro]);

  useEffect(() => {
    if (!apiReady || !mountRef.current || !window.YT) return;

    const player = new window.YT.Player(mountRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
        mute: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
      },
      events: {
        onReady: (e: { target: YouTubePlayer }) => {
          playerRef.current = e.target;
          setDuration(e.target.getDuration());
          setMuted(e.target.isMuted());
          setReady(true);
          const { levels, active } = readQualities(e.target);
          setAvailableQualities(levels);
          setActiveQuality(active);
          if (mainStartedRef.current) {
            e.target.unMute();
            e.target.setVolume(100);
            setMuted(false);
            e.target.playVideo();
          }
        },
        onPlaybackQualityChange: (e: { data: string }) => {
          setActiveQuality(e.data);
        },
        onStateChange: (e: { data: number; target: YouTubePlayer }) => {
          const YT = window.YT;
          if (!YT) return;
          if (e.data === YT.PlayerState.PLAYING) {
            playingRef.current = true;
            setPlaying(true);
            setYoutubeRevealed(true);
            setDuration(e.target.getDuration());
            const { levels, active } = readQualities(e.target);
            setAvailableQualities(levels);
            setActiveQuality(active);
          } else if (
            e.data === YT.PlayerState.PAUSED ||
            e.data === YT.PlayerState.ENDED
          ) {
            playingRef.current = false;
            setPlaying(false);
            setControlsVisible(true);
            if (hideTimer.current) window.clearTimeout(hideTimer.current);
          }
        },
      },
    });

    playerRef.current = player;

    return () => {
      player.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady, videoId]);

  useEffect(() => {
    if (phase !== "main") return;

    const id = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || scrubbing) return;
      try {
        setCurrentTime(player.getCurrentTime());
        setBuffered(player.getVideoLoadedFraction());
        const d = player.getDuration();
        if (d && d !== duration) setDuration(d);
      } catch {
        /* player not ready */
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [duration, scrubbing, phase]);

  useEffect(() => {
    if (phase !== "main") return;
    revealControls();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [phase, revealControls]);

  useEffect(() => {
    if (phase === "main" && !playing) {
      setControlsVisible(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    }
  }, [phase, playing]);

  useEffect(() => {
    if (!qualityMenuOpen) return;

    function onPointerDown(e: PointerEvent) {
      if (!qualityRef.current?.contains(e.target as Node)) {
        setQualityMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [qualityMenuOpen]);

  const setQuality = useCallback(
    (quality: YouTubeQuality) => {
      const player = playerRef.current;
      if (!player) return;
      player.setPlaybackQuality(quality);
      setSelectedQuality(quality);
      setQualityMenuOpen(false);
      revealControls();
    },
    [revealControls]
  );

  const togglePlay = useCallback(() => {
    if (phase !== "main") return;
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
    revealControls();
  }, [phase, playing, revealControls]);

  const seek = useCallback(
    (time: number) => {
      const player = playerRef.current;
      if (!player) return;
      const clamped = Math.max(0, Math.min(time, duration || time));
      player.seekTo(clamped, true);
      setCurrentTime(clamped);
    },
    [duration]
  );

  const skip = useCallback(
    (delta: number) => {
      seek(currentTime + delta);
      revealControls();
    },
    [currentTime, seek, revealControls]
  );

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      player.setVolume(100);
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
    revealControls();
  }, [revealControls]);

  const toggleFullscreen = useCallback(() => {
    const el = overlayRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
    revealControls();
  }, [revealControls]);

  useEffect(() => {
    function onFsChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase === "intro") {
        if (e.key === "Escape") onClose();
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          skip(-10);
          break;
        case "ArrowRight":
          skip(10);
          break;
        case "j":
          skip(-10);
          break;
        case "l":
          skip(10);
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "Escape":
          onClose();
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, togglePlay, skip, toggleMute, toggleFullscreen, onClose]);

  function handleScrubChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    setCurrentTime(value);
  }

  function handleScrubCommit() {
    seek(currentTime);
    setScrubbing(false);
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = buffered * 100;
  const qualityButtonLabel =
    selectedQuality === "default"
      ? qualityLabel(activeQuality === "unknown" ? "auto" : activeQuality)
      : qualityLabel(selectedQuality);

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${
        phase === "main" && controlsVisible ? "" : phase === "main" ? styles.hideCursor : ""
      }`}
      onMouseMove={revealControls}
      onClick={revealControls}
    >
      <div className={styles.videoLayer}>
        <div
          className={`${styles.mainLayer} ${
            youtubeRevealed ? styles.mainVisible : ""
          }`}
        >
          <div ref={mountRef} className={styles.iframeHost} />
        </div>

        {phase === "main" && !youtubeRevealed && (
          <div className={styles.youtubeCover} aria-hidden />
        )}

        {phase === "intro" && (
          <video
            ref={introRef}
            className={`${styles.introVideo} ${
              introFading ? styles.introFadeOut : ""
            }`}
            src={YOUFLIX_INTRO_SRC}
            playsInline
            preload="auto"
            aria-label="YouFlix intro"
          />
        )}
      </div>

      {phase === "intro" && (
        <button
          className={styles.introBackBtn}
          onClick={onClose}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {phase === "main" && (
      <div
        className={`${styles.controls} ${
          controlsVisible ? styles.controlsVisible : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.topBar}>
          <button
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className={styles.topTitle}>
            {subtitle && <span className={styles.topSubtitle}>{subtitle}</span>}
            <span className={styles.topName}>{title}</span>
          </div>
          <button className={styles.iconBtn} aria-label="Cast" disabled>
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"
              />
              <circle cx="3" cy="20" r="1.2" fill="currentColor" />
            </svg>
          </button>
        </div>

        <div className={styles.centerControls}>
          <button
            className={styles.skipBtn}
            onClick={() => skip(-10)}
            aria-label="Rewind 10 seconds"
          >
            <svg viewBox="0 0 24 24" width="46" height="46">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12a9 9 0 1 0 3-6.7L3 8"
              />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                d="M3 4v4h4"
              />
            </svg>
            <span className={styles.skipLabel}>10</span>
          </button>

          <button
            className={styles.playBtn}
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="56" height="56">
                <rect x="5" y="4" width="4.5" height="16" rx="1" fill="currentColor" />
                <rect x="14.5" y="4" width="4.5" height="16" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="56" height="56">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            )}
          </button>

          <button
            className={styles.skipBtn}
            onClick={() => skip(10)}
            aria-label="Forward 10 seconds"
          >
            <svg viewBox="0 0 24 24" width="46" height="46">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 1 1-3-6.7L21 8"
              />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                d="M21 4v4h-4"
              />
            </svg>
            <span className={styles.skipLabel}>10</span>
          </button>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.scrubRow}>
            <div className={styles.progressWrap}>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBuffered}
                  style={{ width: `${bufferedPct}%` }}
                />
                <div
                  className={styles.progressPlayed}
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className={styles.progressThumb}
                  style={{ left: `${progressPct}%` }}
                />
              </div>
              <input
                type="range"
                className={styles.scrubInput}
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onPointerDown={() => setScrubbing(true)}
                onChange={handleScrubChange}
                onPointerUp={handleScrubCommit}
                onMouseUp={handleScrubCommit}
                aria-label="Seek"
                disabled={!ready}
              />
            </div>
            <span className={styles.timeLabel}>
              {formatTime(Math.max(0, duration - currentTime))}
            </span>
          </div>

          <div className={styles.actionRow}>
            <button
              className={styles.actionBtn}
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    d="M11 5 6 9H2v6h4l5 4V5z"
                    fill="currentColor"
                  />
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M22 9l-6 6M16 9l6 6"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" />
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"
                  />
                </svg>
              )}
              <span>{muted ? "Unmute" : "Volume"}</span>
            </button>

            {onShowEpisodes && (
              <button className={styles.actionBtn} onClick={onShowEpisodes}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <rect x="3" y="4" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 7v10a2 2 0 0 1-2 2H7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Episodes</span>
              </button>
            )}

            {hasNext && onNext && (
              <button className={styles.actionBtn} onClick={onNext}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M5 5v14l11-7z" fill="currentColor" />
                  <rect x="17.5" y="5" width="2.5" height="14" rx="1" fill="currentColor" />
                </svg>
                <span>Next</span>
              </button>
            )}

            <div className={styles.qualityWrap} ref={qualityRef}>
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setQualityMenuOpen((open) => !open);
                  revealControls();
                }}
                aria-label="Video quality"
                aria-expanded={qualityMenuOpen}
                aria-haspopup="listbox"
                disabled={!ready || availableQualities.length === 0}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 15l3-3 2 2 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{qualityButtonLabel}</span>
              </button>

              {qualityMenuOpen && (
                <div className={styles.qualityMenu} role="listbox" aria-label="Video quality">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedQuality === "default"}
                    className={`${styles.qualityOption} ${
                      selectedQuality === "default" ? styles.qualityOptionActive : ""
                    }`}
                    onClick={() => setQuality("default")}
                  >
                    <span>Auto</span>
                    {selectedQuality === "default" && (
                      <span className={styles.qualityCheck}>✓</span>
                    )}
                  </button>
                  {availableQualities.map((quality) => (
                    <button
                      key={quality}
                      type="button"
                      role="option"
                      aria-selected={selectedQuality === quality}
                      className={`${styles.qualityOption} ${
                        selectedQuality === quality ? styles.qualityOptionActive : ""
                      }`}
                      onClick={() => setQuality(quality as YouTubeQuality)}
                    >
                      <span>{qualityLabel(quality)}</span>
                      {selectedQuality === quality && (
                        <span className={styles.qualityCheck}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className={`${styles.actionBtn} ${styles.actionBtnEnd}`}
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 4v3a2 2 0 0 1-2 2H4M15 4v3a2 2 0 0 0 2 2h3M9 20v-3a2 2 0 0 0-2-2H4M15 20v-3a2 2 0 0 1 2-2h3"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3"
                  />
                </svg>
              )}
              <span>{fullscreen ? "Exit" : "Fullscreen"}</span>
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
