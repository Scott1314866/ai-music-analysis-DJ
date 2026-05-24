import mongoose, { Document, Schema, Types } from 'mongoose';
import type { TrackData, TasteProfile } from '../types/index.js';

export interface IPlaylistTrack {
  trackId: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  durationString: string;
  isFavorite: boolean;
}

export interface IPlaylist extends Document {
  userId: Types.ObjectId;
  source: 'netease' | 'manual' | 'ai-generated';
  sourceId: string | null;
  tracks: IPlaylistTrack[];
  tasteProfile: TasteProfile;
  createdAt: Date;
}

const PlaylistTrackSchema = new Schema<IPlaylistTrack>(
  {
    trackId: { type: String, required: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    genre: { type: String, required: true },
    duration: { type: Number, required: true },
    durationString: { type: String, required: true },
    isFavorite: { type: Boolean, default: false },
  },
  { _id: false }
);

const PlaylistSchema = new Schema<IPlaylist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    source: {
      type: String,
      enum: ['netease', 'manual', 'ai-generated'],
      required: true,
    },
    sourceId: { type: String, default: null },
    tracks: [PlaylistTrackSchema],
    tasteProfile: {
      topGenres: [String],
      moodDescriptors: [String],
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);

export function toTrackData(t: IPlaylistTrack): TrackData {
  return {
    id: t.trackId,
    title: t.title,
    artist: t.artist,
    duration: t.duration,
    durationString: t.durationString,
    isFavorite: t.isFavorite,
    genre: t.genre,
  };
}
