import { getToken } from "./auth";

export interface ImportResponse {
  jobId?: string;
  playlistId?: string;
  status: string;
  message: string;
}

export interface ImportJob {
  jobId: string;
  status: string;
  youtubePlaylistId: string;
  playlistId: string | null;
  totalVideosFound: number;
  totalVideosImported: number;
  totalVideosFailed: number;
  errorMessage: string | null;
}

export interface ImportShowDetails {
  title?: string;
  channelTitle?: string;
  year?: string;
  seriesLabel?: string;
  rating?: string;
  description?: string;
}

export interface Playlist {
  id: string;
  youtubePlaylistId: string;
  contentType: "series" | "movie";
  title: string;
  description: string;
  customTitle: string;
  customChannelTitle: string;
  customYear: string;
  customSeriesLabel: string;
  customRating: string;
  customDescription: string;
  thumbnailUrl: string;
  coverUrl: string;
  channelTitle: string;
  videoCount: number;
  lastSyncedAt: string | null;
}

export interface PlaylistVideo {
  id: string;
  youtubeVideoId: string;
  position: number;
  episodeNumber: number;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  channelTitle: string;
  embeddable: boolean;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? `Request failed (${res.status})`);
  }

  return data as T;
}

export function listPlaylists(): Promise<{ playlists: Playlist[] }> {
  return apiFetch<{ playlists: Playlist[] }>("/api/playlists");
}

function appendIfSet(formData: FormData, key: string, value?: string) {
  const trimmed = value?.trim();
  if (trimmed) formData.append(key, trimmed);
}

export function importPlaylist(
  url: string,
  cover?: File | null,
  details?: ImportShowDetails
): Promise<ImportResponse> {
  const token = getToken();
  const formData = new FormData();
  formData.append("url", url);
  if (cover) {
    formData.append("cover", cover);
  }
  if (details) {
    appendIfSet(formData, "title", details.title);
    appendIfSet(formData, "channelTitle", details.channelTitle);
    appendIfSet(formData, "year", details.year);
    appendIfSet(formData, "seriesLabel", details.seriesLabel);
    appendIfSet(formData, "rating", details.rating);
    appendIfSet(formData, "description", details.description);
  }

  return fetch("/api/playlists/import", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? data.message ?? `Request failed (${res.status})`);
    }
    return data as ImportResponse;
  });
}

export function getImportJob(jobId: string): Promise<ImportJob> {
  return apiFetch<ImportJob>(`/api/import-jobs/${jobId}`);
}

export function getPlaylist(playlistId: string): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${playlistId}`);
}

export function updatePlaylist(
  playlistId: string,
  details: ImportShowDetails,
  options: { cover?: File | null; removeCover?: boolean } = {}
): Promise<Playlist> {
  const token = getToken();
  const formData = new FormData();
  formData.append("title", details.title ?? "");
  formData.append("channelTitle", details.channelTitle ?? "");
  formData.append("year", details.year ?? "");
  formData.append("seriesLabel", details.seriesLabel ?? "");
  formData.append("rating", details.rating ?? "");
  formData.append("description", details.description ?? "");

  if (options.cover) {
    formData.append("cover", options.cover);
  }
  if (options.removeCover) {
    formData.append("removeCover", "true");
  }

  return fetch(`/api/playlists/${playlistId}`, {
    method: "PATCH",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? data.message ?? `Request failed (${res.status})`);
    }
    return data as Playlist;
  });
}

export function getPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
  return apiFetch<PlaylistVideo[]>(`/api/playlists/${playlistId}/videos`);
}

export function pollImportJob(
  jobId: string,
  onProgress?: (job: ImportJob) => void
): Promise<ImportJob> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const job = await getImportJob(jobId);
        onProgress?.(job);

        if (job.status === "COMPLETED" || job.status === "PARTIAL_FAILED") {
          resolve(job);
          return;
        }

        if (job.status === "FAILED") {
          reject(new Error(job.errorMessage ?? "Import failed"));
          return;
        }

        setTimeout(poll, 2000);
      } catch (err) {
        reject(err);
      }
    };

    poll();
  });
}
