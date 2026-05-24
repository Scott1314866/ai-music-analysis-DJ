import { Track } from '../types';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'If',
    artist: 'Bread',
    duration: 158,
    durationString: '2:38',
    isFavorite: true,
    genre: 'SOFT ROCK'
  },
  {
    id: 'track-2',
    title: '비행운',
    artist: 'MoonMoon',
    duration: 178,
    durationString: '2:58',
    isFavorite: false,
    genre: 'INDIE BALAD'
  },
  {
    id: 'track-3',
    title: "Creepin'",
    artist: 'Tabber, Paul Blanco, MISO',
    duration: 195,
    durationString: '3:15',
    isFavorite: false,
    genre: 'R&B / HIP-HOP'
  },
  {
    id: 'track-4',
    title: 'Hero',
    artist: 'Mili',
    duration: 165,
    durationString: '2:45',
    isFavorite: false,
    genre: 'ELECTRO-CLASSICAL'
  },
  {
    id: 'track-5',
    title: 'Wine',
    artist: 'SoulChef',
    duration: 185,
    durationString: '3:05',
    isFavorite: true,
    genre: 'JAZZ-HIPHOP'
  },
  {
    id: 'track-6',
    title: '天菜 (prod. by Bubbleboy)',
    artist: 'GAHO',
    duration: 170,
    durationString: '2:50',
    isFavorite: false,
    genre: '90s INDIE'
  }
];

export const DJ_RESPONSES = [
  {
    trigger: 'hello',
    text: "Hello there! This is Claudio. It's late, and here's a song that moves with your breath. Take a break and let the frequencies ground you.",
    songId: 'track-1'
  },
  {
    trigger: 'love',
    text: "Sometimes finding good music is a struggle—finding gold you can't pocket. But hey, good tunes always have a way of finding their way back to you.",
    songId: 'track-5'
  },
  {
    trigger: 'sad',
    text: "Feeing a bit down? I've got you. Let's slide into retro R&B. Let this rhythm wash over your thoughts. We're on air, together.",
    songId: 'track-3'
  },
  {
    trigger: 'energetic',
    text: "Let's turn it up. Neon lines, heavy baselines, and uncompromising groove. Here is a track that breaks standard algorithms.",
    songId: 'track-6'
  },
  {
    trigger: 'jazz',
    text: "Ah, raw acoustic keys paired with soft boom-bap percussion. My personal favorite. Relax, breathe, and drift.",
    songId: 'track-5'
  },
  {
    trigger: 'mood',
    text: "Your mood is my prompt. Tell me what is on your mind, and I will tailor the frequency. No algorithm, just pure selection.",
    songId: 'track-2'
  }
];

export const GENERAL_DJ_RESPONSES = [
  "This is Claudio, your personal sound curators. Let's keep the vibe going.",
  "That track was handpicked. I hate algorithms. I have taste.",
  "Breathe in, breathe out. Running 24/7 on air, bringing you the finest wavs.",
  "You're listening to Claudio FM. Deep navy frequencies, late night broadcasts.",
  "Every track tells a silent story. What's yours tonight?"
];
