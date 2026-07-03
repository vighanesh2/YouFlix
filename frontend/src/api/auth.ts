export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt?: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

const TOKEN_KEY = "youflix_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

export async function checkEmail(email: string): Promise<boolean> {
  const data = await authFetch<{ exists: boolean }>("/api/auth/check-email", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return data.exists;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await authFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthUser> {
  const data = await authFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  setToken(data.token);
  return data.user;
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await authFetch<{ user: AuthUser }>("/api/auth/me");
  return data.user;
}
