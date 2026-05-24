import { env } from '../config/env.js';
import type { TrackData, TasteProfile } from '../types/index.js';

interface NeteaseTrack {
  id: number;
  name: string;
  ar: { name: string }[];
  dt: number;
  al: { name: string };
}

interface NeteasePlaylistResponse {
  code: number;
  playlist?: {
    tracks: NeteaseTrack[];
  };
}

interface NeteaseTopSongsResponse {
  code: number;
  data?: {
    list: {
      id: number;
      name: string;
      ar: { name: string }[];
      dt: number;
    }[];
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function extractGenreFromNetease(track: { name: string; ar: { name: string }[] }): string {
  const text = (track.name + ' ' + track.ar.map((a) => a.name).join(' ')).toLowerCase();

  if (text.includes('rock') || text.includes('摇滚')) return 'ROCK';
  if (text.includes('jazz') || text.includes('爵士')) return 'JAZZ';
  if (text.includes('hip') && text.includes('hop')) return 'HIP-HOP';
  if (text.includes('r&b') || text.includes('rnb') || text.includes('节奏')) return 'R&B';
  if (text.includes('electronic') || text.includes('电子') || text.includes('edm')) return 'ELECTRONIC';
  if (text.includes('classical') || text.includes('古典') || text.includes('piano')) return 'CLASSICAL';
  if (text.includes('indie') || text.includes('独立')) return 'INDIE';
  if (text.includes('pop') || text.includes('流行')) return 'POP';
  if (text.includes('ballad') || text.includes('抒情') || text.includes('情歌')) return 'BALLAD';
  if (text.includes('folk') || text.includes('民谣')) return 'FOLK';
  if (text.includes('metal') || text.includes('金属')) return 'METAL';
  if (text.includes('punk') || text.includes('朋克')) return 'PUNK';
  if (text.includes('soul') || text.includes('灵魂')) return 'SOUL';
  return 'OTHER';
}

function analyzeTaste(tracks: TrackData[]): TasteProfile {
  const genreCount: Record<string, number> = {};
  const artistCount: Record<string, number> = {};

  for (const t of tracks) {
    genreCount[t.genre] = (genreCount[t.genre] || 0) + 1;
    artistCount[t.artist] = (artistCount[t.artist] || 0) + 1;
  }

  const sortedGenres = Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([g]) => g);

  const moodMap: Record<string, string[]> = {
    ROCK: ['energetic', 'rebellious'],
    JAZZ: ['relaxed', 'sophisticated'],
    'HIP-HOP': ['confident', 'rhythmic'],
    'R&B': ['smooth', 'sensual'],
    ELECTRONIC: ['futuristic', 'intense'],
    CLASSICAL: ['contemplative', 'refined'],
    INDIE: ['introspective', 'authentic'],
    POP: ['upbeat', 'catchy'],
    BALLAD: ['emotional', 'melancholic'],
    FOLK: ['earthy', 'nostalgic'],
    METAL: ['powerful', 'aggressive'],
    PUNK: ['raw', 'defiant'],
    SOUL: ['warm', 'deep'],
  };

  const moodSet = new Set<string>();
  for (const genre of sortedGenres) {
    const moods = moodMap[genre] || ['eclectic'];
    moods.forEach((m) => moodSet.add(m));
  }

  return {
    topGenres: sortedGenres,
    moodDescriptors: Array.from(moodSet).slice(0, 5),
  };
}

function convertNeteaseTrack(nt: NeteaseTrack, index: number): TrackData {
  const durationSec = Math.round((nt.dt || 180000) / 1000);
  return {
    id: `netease-${nt.id}`,
    title: nt.name,
    artist: nt.ar.map((a) => a.name).join(', '),
    duration: durationSec,
    durationString: formatDuration(durationSec),
    isFavorite: false,
    genre: extractGenreFromNetease({ name: nt.name, ar: nt.ar }),
  };
}

/**
 * Fetch user's top songs from NetEase Cloud Music via an external API bridge.
 * Requires the NeteaseCloudMusicApi server running at NETEASE_API_BASE.
 *
 * See: https://github.com/Binaryify/NeteaseCloudMusicApi
 */
export async function fetchUserTopSongs(uid: string): Promise<TrackData[]> {
  // Attempt to reach the NetEase API bridge
  try {
    const url = `${env.NETEASE_API_BASE}/user/record?uid=${uid}&type=0`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`NetEase API returned ${res.status}`);
    }

    const data = (await res.json()) as NeteaseTopSongsResponse;

    if (data.code !== 200 || !data.data?.list) {
      throw new Error('NetEase API returned unexpected data');
    }

    const tracks = data.data.list.slice(0, 50).map((item, i) =>
      convertNeteaseTrack(
        {
          id: item.id,
          name: item.name,
          ar: item.ar,
          dt: item.dt,
          al: { name: '' },
        },
        i
      )
    );

    return tracks;
  } catch (err) {
    console.warn('[NetEase] Failed to fetch top songs from API bridge:', (err as Error).message);
    console.warn('[NetEase] Using simulated taste profile generation instead.');

    // Return a curated fallback set based on the UID hash to give each user variety
    return generateSimulatedTastePlaylist(uid);
  }
}

/**
 * Fetch a specific playlist by ID from NetEase.
 */
export async function fetchPlaylistById(playlistId: string): Promise<TrackData[]> {
  try {
    const url = `${env.NETEASE_API_BASE}/playlist/detail?id=${playlistId}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`NetEase API returned ${res.status}`);

    const data = (await res.json()) as NeteasePlaylistResponse;

    if (data.code !== 200 || !data.playlist?.tracks) {
      throw new Error('NetEase API returned unexpected playlist data');
    }

    return data.playlist.tracks.map((item, i) => convertNeteaseTrack(item, i));
  } catch (err) {
    console.warn('[NetEase] Failed to fetch playlist:', (err as Error).message);
    return [];
  }
}

/**
 * Generate a deterministic simulated taste playlist when NetEase API is unavailable.
 * Uses a hash of the UID to create variety per user.
 */
function generateSimulatedTastePlaylist(uid: string): TrackData[] {
  // Deterministic shuffle based on UID
  const hash = uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const pool: Omit<TrackData, 'id' | 'isFavorite'>[] = [
    { title: 'If', artist: 'Bread', duration: 158, durationString: '2:38', genre: 'SOFT ROCK' },
    { title: '비행운', artist: 'MoonMoon', duration: 178, durationString: '2:58', genre: 'INDIE BALLAD' },
    { title: "Creepin'", artist: 'Tabber, Paul Blanco, MISO', duration: 195, durationString: '3:15', genre: 'R&B' },
    { title: 'Hero', artist: 'Mili', duration: 165, durationString: '2:45', genre: 'ELECTRONIC' },
    { title: 'Wine', artist: 'SoulChef', duration: 185, durationString: '3:05', genre: 'JAZZ' },
    { title: '天菜', artist: 'GAHO', duration: 170, durationString: '2:50', genre: 'INDIE' },
    { title: 'Lemon', artist: 'Kenshi Yonezu', duration: 192, durationString: '3:12', genre: 'POP' },
    { title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, durationString: '3:20', genre: 'POP' },
    { title: 'Bohemian Rhapsody', artist: 'Queen', duration: 355, durationString: '5:55', genre: 'ROCK' },
    { title: 'Take Five', artist: 'Dave Brubeck', duration: 324, durationString: '5:24', genre: 'JAZZ' },
    { title: 'Für Elise', artist: 'Beethoven', duration: 180, durationString: '3:00', genre: 'CLASSICAL' },
    { title: 'Shape of You', artist: 'Ed Sheeran', duration: 233, durationString: '3:53', genre: 'POP' },
    { title: 'Lose Yourself', artist: 'Eminem', duration: 326, durationString: '5:26', genre: 'HIP-HOP' },
    { title: 'Numb', artist: 'Linkin Park', duration: 187, durationString: '3:07', genre: 'ROCK' },
    { title: 'Fly Me To The Moon', artist: 'Frank Sinatra', duration: 149, durationString: '2:29', genre: 'JAZZ' },
    { title: 'Yesterday', artist: 'The Beatles', duration: 125, durationString: '2:05', genre: 'ROCK' },
    { title: 'Gangnam Style', artist: 'PSY', duration: 219, durationString: '3:39', genre: 'POP' },
    { title: 'River Flows in You', artist: 'Yiruma', duration: 178, durationString: '2:58', genre: 'CLASSICAL' },
    { title: 'Numb Little Bug', artist: 'Em Beihold', duration: 168, durationString: '2:48', genre: 'INDIE' },
    { title: 'STAY', artist: 'The Kid LAROI, Justin Bieber', duration: 141, durationString: '2:21', genre: 'POP' },
    { title: 'Bad Guy', artist: 'Billie Eilish', duration: 194, durationString: '3:14', genre: 'ELECTRONIC' },
    { title: 'Sunflower', artist: 'Post Malone, Swae Lee', duration: 158, durationString: '2:38', genre: 'HIP-HOP' },
    { title: 'Perfect', artist: 'Ed Sheeran', duration: 263, durationString: '4:23', genre: 'POP' },
    { title: 'Counting Stars', artist: 'OneRepublic', duration: 257, durationString: '4:17', genre: 'ROCK' },
    { title: 'Havana', artist: 'Camila Cabello', duration: 217, durationString: '3:37', genre: 'POP' },
  ];

  // Pick 15 tracks deterministically based on UID hash
  const selected: TrackData[] = [];
  const used = new Set<number>();
  let seed = hash;

  while (selected.length < 15 && used.size < pool.length) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const idx = seed % pool.length;
    if (!used.has(idx)) {
      used.add(idx);
      const t = pool[idx];
      selected.push({
        ...t,
        id: `sim-netease-${idx}`,
        isFavorite: false,
      });
    }
  }

  return selected;
}

export { analyzeTaste };
