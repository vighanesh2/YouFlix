import { getToken } from "./auth";

export interface Profile {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

export const PROFILE_COLORS = [
  "#e50914",
  "#f5a623",
  "#00b4d8",
  "#9e9e9e",
  "#6a0dad",
  "#2ecc71",
] as const;

async function profilesFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }

  return data as T;
}

export function listProfiles(): Promise<{ profiles: Profile[] }> {
  return profilesFetch<{ profiles: Profile[] }>("/api/profiles");
}

export function createProfile(
  name: string,
  color?: string
): Promise<{ profile: Profile }> {
  return profilesFetch<{ profile: Profile }>("/api/profiles", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
}
