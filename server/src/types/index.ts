export interface TrackData {
  id: string;
  title: string;
  artist: string;
  duration: number;
  durationString: string;
  isFavorite: boolean;
  genre: string;
}

export interface ChatMessageData {
  id: string;
  sender: 'user' | 'claudio';
  text: string;
  timestamp: string;
  status?: 'REPLAY' | 'PLAYING';
}

export interface DJIntroRequest {
  title: string;
  artist: string;
  genre: string;
}

export interface TastePlaylistRequest {
  neteaseUid: string;
}

export interface TasteProfile {
  topGenres: string[];
  moodDescriptors: string[];
}

export interface PlaylistResponse {
  id: string;
  tracks: TrackData[];
  tasteProfile: TasteProfile;
  source: 'netease' | 'manual' | 'ai-generated';
}
