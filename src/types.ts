export interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  category: string;
  chefMoodTag?: string;
  durationSec?: number;
  addedAt?: number;
  isDbRecord?: boolean;
}

export type ItalianVibeTag =
  | 'All'
  | 'Midnight Margherita'
  | 'Tiramisu Chill'
  | 'Espresso Rush'
  | 'Napoletana Lo-Fi'
  | 'Late Night Calzone'
  | string;

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 - 100
  isMuted: boolean;
  currentIndex: number;
  selectedCategory: string;
  vinylCrackle: boolean;
  nightRain: boolean;
  rainVolume: number; // 0 - 100
}
