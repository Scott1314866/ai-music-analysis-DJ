import { Request, Response } from 'express';
import { fetchUserTopSongs, fetchPlaylistById, analyzeTaste } from '../services/neteaseService.js';
import type { TrackData } from '../types/index.js';

const DEFAULT_TRACKS: TrackData[] = [
  { id: 'track-1', title: 'If', artist: 'Bread', duration: 158, durationString: '2:38', isFavorite: true, genre: 'SOFT ROCK' },
  { id: 'track-2', title: '비행운', artist: 'MoonMoon', duration: 178, durationString: '2:58', isFavorite: false, genre: 'INDIE BALLAD' },
  { id: 'track-3', title: "Creepin'", artist: 'Tabber, Paul Blanco, MISO', duration: 195, durationString: '3:15', isFavorite: false, genre: 'R&B / HIP-HOP' },
  { id: 'track-4', title: 'Hero', artist: 'Mili', duration: 165, durationString: '2:45', isFavorite: false, genre: 'ELECTRO-CLASSICAL' },
  { id: 'track-5', title: 'Wine', artist: 'SoulChef', duration: 185, durationString: '3:05', isFavorite: true, genre: 'JAZZ-HIPHOP' },
  { id: 'track-6', title: '天菜 (prod. by Bubbleboy)', artist: 'GAHO', duration: 170, durationString: '2:50', isFavorite: false, genre: '90s INDIE' },
];

export async function getTracks(_req: Request, res: Response): Promise<void> {
  res.json({ tracks: DEFAULT_TRACKS });
}

export async function getPlaylist(_req: Request, res: Response): Promise<void> {
  res.json({ playlist: null, tracks: DEFAULT_TRACKS });
}

export async function createTastePlaylist(req: Request, res: Response): Promise<void> {
  try {
    const { neteaseUid, playlistId } = req.body as { neteaseUid?: string; playlistId?: string };

    const uid = neteaseUid || playlistId;
    if (!uid) {
      res.status(400).json({ error: 'neteaseUid or playlistId is required' });
      return;
    }

    let tracks: TrackData[];
    if (playlistId) {
      tracks = await fetchPlaylistById(playlistId);
    } else {
      tracks = await fetchUserTopSongs(neteaseUid!);
    }

    if (tracks.length === 0) {
      res.status(404).json({ error: 'No tracks found. Try running the NetEase API bridge or check the UID.' });
      return;
    }

    const tasteProfile = analyzeTaste(tracks);

    res.json({
      playlist: {
        id: `taste-${Date.now()}`,
        tracks,
        tasteProfile,
        source: 'netease' as const,
      },
    });
  } catch (err) {
    console.error('[Music] Taste playlist error:', err);
    res.status(500).json({ error: 'Failed to create taste playlist' });
  }
}
