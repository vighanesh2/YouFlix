import { useEffect, useState } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        options: Record<string, unknown>
      ) => YouTubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type YouTubeQuality =
  | "default"
  | "auto"
  | "highres"
  | "hd2160"
  | "hd1440"
  | "hd1080"
  | "hd720"
  | "large"
  | "medium"
  | "small"
  | "tiny"
  | "unknown";

export interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoLoadedFraction(): number;
  getPlayerState(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  getAvailableQualityLevels(): string[];
  getPlaybackQuality(): string;
  setPlaybackQuality(quality: string): void;
  loadVideoById(videoId: string): void;
  destroy(): void;
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}

export function useYouTubeApi(): boolean {
  const [ready, setReady] = useState<boolean>(
    typeof window !== "undefined" && !!window.YT?.Player
  );

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}
