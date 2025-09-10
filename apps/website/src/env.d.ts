/// <reference types="astro/client" />

// Window object extensions
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    chordFinder?: any;
    dataLayer?: any[];
    drumMachine?: {
      start: () => void;
      stop: () => void;
      state: {
        playing: boolean;
        step: number;
        bpm: number;
        timer: number | null;
        samples: Record<string, AudioBuffer> | null;
      };
      randomize: () => void;
      clear: () => void;
    };
    drumMachineClient?: any;
    chordFinderClient?: any;
  }
}

// Re-export music-tools Note type to avoid conflicts with shared-types
export type { Note } from '@lukeus/music-tools';

export {};
