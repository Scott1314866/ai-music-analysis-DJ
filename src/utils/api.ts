import type { Track, ChatMessage } from '../types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('claudio-fm-token');
}

function setToken(token: string): void {
  localStorage.setItem('claudio-fm-token', token);
}

function clearToken(): void {
  localStorage.removeItem('claudio-fm-token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────────────

export async function login(
  username: string,
  password: string
): Promise<{ token: string; user: { id: string; username: string; neteaseUid: string | null } }> {
  const data = await request<{
    token: string;
    user: { id: string; username: string; neteaseUid: string | null };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  setToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch {
    // Even if the server call fails, clear local token
  }
  clearToken();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ─── Music / Tracks ────────────────────────────────────

export async function fetchTracks(): Promise<Track[]> {
  const data = await request<{ tracks: Track[] }>('/music/tracks');
  return data.tracks;
}

export async function fetchTastePlaylist(
  neteaseUid: string
): Promise<{ playlist: { id: string; tracks: Track[]; tasteProfile: { topGenres: string[]; moodDescriptors: string[] } } }> {
  return request('/music/taste-playlist', {
    method: 'POST',
    body: JSON.stringify({ neteaseUid }),
  });
}

export async function getUserPlaylist(): Promise<{
  playlist: { id: string; source: string; tasteProfile: { topGenres: string[]; moodDescriptors: string[] } } | null;
  tracks: Track[];
}> {
  return request('/music/playlist');
}

// ─── AI Chat ───────────────────────────────────────────

export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<{ reply: ChatMessage; recommendedTrackId: string | null }> {
  return request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
}

export async function getChatHistory(): Promise<{ messages: ChatMessage[] }> {
  return request('/ai/history');
}

// ─── AI DJ Intro ───────────────────────────────────────

export async function generateDjIntro(track: {
  title: string;
  artist: string;
  genre: string;
}): Promise<{ introText: string }> {
  return request('/ai/dj-intro', {
    method: 'POST',
    body: JSON.stringify(track),
  });
}
