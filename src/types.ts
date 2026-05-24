export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  durationString: string;
  isFavorite: boolean;
  genre: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'claudio';
  text: string;
  timestamp: string;
  status?: 'REPLAY' | 'PLAYING';
}

export interface DJWord {
  text: string;
  start: number; // relative start time in seconds
  end: number;   // relative end time in seconds
}

export interface DJTranscript {
  id: string;
  text: string;
  timestamp: string;
  words: DJWord[];
}

export type Theme = 'dark' | 'light';
