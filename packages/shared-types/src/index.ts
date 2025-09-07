// Audio Types
export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
  artist?: string;
  description?: string;
}

export interface WaveformData {
  peaks: number[];
  length: number;
  sampleRate: number;
}

// Content Types
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  publishedAt: string;
  tags: string[];
  readingTime: number;
  slug: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'Active' | 'Experimental' | 'In Progress' | 'Complete';
  icon: string;
  audioUrl?: string;
  meta?: string;
  tags?: string[];
}

// Music Theory Types
export interface Note {
  name: string;
  octave: number;
  frequency: number;
}

export interface Chord {
  root: Note;
  quality: 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant' | 'suspended';
  notes: Note[];
}

export interface Scale {
  root: Note;
  type: 'major' | 'minor' | 'pentatonic' | 'blues' | 'dorian' | 'mixolydian';
  notes: Note[];
}

// Drum Machine Types
export interface DrumPattern {
  id: string;
  name: string;
  tempo: number;
  steps: number;
  tracks: DrumTrack[];
}

export interface DrumTrack {
  id: string;
  name: string;
  instrument: 'kick' | 'snare' | 'hihat' | 'clap' | 'crash' | 'ride';
  pattern: boolean[];
  volume: number;
  muted: boolean;
}

// UI Component Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export interface AudioPlayerProps {
  track: AudioTrack;
  autoPlay?: boolean;
  showWaveform?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

// API Response Types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
}
