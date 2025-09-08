// Music Theory Types and Constants

export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type ChordType = 'major' | 'minor' | 'diminished';
export type ChordNumeral = 'I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi' | 'vii°';

export interface Chord {
  root: Note;
  type: ChordType;
  numeral: ChordNumeral;
  name: string;
  notes: Note[];
}

export interface Key {
  tonic: Note;
  mode: 'major' | 'minor';
  name: string;
  chords: Chord[];
  scale: Note[];
}

// All 12 notes in chromatic order
export const NOTES: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Major scale intervals (semitones from root)
export const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

// Minor scale intervals (natural minor)
export const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

// Chord patterns for major keys (using scale degrees)
export const MAJOR_CHORD_PATTERNS: Array<{ numeral: ChordNumeral; type: ChordType; intervals: number[] }> = [
  { numeral: 'I', type: 'major', intervals: [0, 2, 4] },      // 1-3-5
  { numeral: 'ii', type: 'minor', intervals: [1, 3, 5] },     // 2-4-6
  { numeral: 'iii', type: 'minor', intervals: [2, 4, 6] },    // 3-5-7
  { numeral: 'IV', type: 'major', intervals: [3, 5, 0] },     // 4-6-1
  { numeral: 'V', type: 'major', intervals: [4, 6, 1] },      // 5-7-2
  { numeral: 'vi', type: 'minor', intervals: [5, 0, 2] },     // 6-1-3
  { numeral: 'vii°', type: 'diminished', intervals: [6, 1, 3] } // 7-2-4
];

// Helper function to get note by semitone offset
export function getNoteAtInterval(root: Note, interval: number): Note {
  const rootIndex = NOTES.indexOf(root);
  const targetIndex = (rootIndex + interval) % 12;
  return NOTES[targetIndex];
}

// Generate scale from root note and intervals
export function generateScale(root: Note, intervals: number[]): Note[] {
  return intervals.map(interval => getNoteAtInterval(root, interval));
}

// Generate major key with all chords
export function generateMajorKey(tonic: Note): Key {
  const scale = generateScale(tonic, MAJOR_INTERVALS);
  
  const chords: Chord[] = MAJOR_CHORD_PATTERNS.map(pattern => {
    const chordNotes = pattern.intervals.map(scaleIndex => scale[scaleIndex]);
    const root = chordNotes[0];
    
    return {
      root,
      type: pattern.type,
      numeral: pattern.numeral,
      name: `${root}${pattern.type === 'major' ? '' : pattern.type === 'minor' ? 'm' : 'dim'}`,
      notes: chordNotes
    };
  });

  return {
    tonic,
    mode: 'major',
    name: `${tonic} Major`,
    chords,
    scale
  };
}

// Generate minor key with all chords
export function generateMinorKey(tonic: Note): Key {
  const scale = generateScale(tonic, MINOR_INTERVALS);
  
  // Minor key chord patterns (i, ii°, III, iv, v, VI, VII)
  const MINOR_CHORD_PATTERNS: Array<{ numeral: ChordNumeral; type: ChordType; intervals: number[] }> = [
    { numeral: 'I', type: 'minor', intervals: [0, 2, 4] },      // i (minor tonic)
    { numeral: 'ii', type: 'diminished', intervals: [1, 3, 5] }, // ii° (diminished)
    { numeral: 'iii', type: 'major', intervals: [2, 4, 6] },    // III (major)
    { numeral: 'IV', type: 'minor', intervals: [3, 5, 0] },     // iv (minor)
    { numeral: 'V', type: 'minor', intervals: [4, 6, 1] },      // v (minor, though often played major)
    { numeral: 'vi', type: 'major', intervals: [5, 0, 2] },     // VI (major)
    { numeral: 'vii°', type: 'major', intervals: [6, 1, 3] }    // VII (major)
  ];
  
  const chords: Chord[] = MINOR_CHORD_PATTERNS.map(pattern => {
    const chordNotes = pattern.intervals.map(scaleIndex => scale[scaleIndex]);
    const root = chordNotes[0];
    
    return {
      root,
      type: pattern.type,
      numeral: pattern.numeral,
      name: `${root}${pattern.type === 'major' ? '' : pattern.type === 'minor' ? 'm' : 'dim'}`,
      notes: chordNotes
    };
  });

  return {
    tonic,
    mode: 'minor',
    name: `${tonic} Minor`,
    chords,
    scale
  };
}

// Get all major keys
export function getAllMajorKeys(): Key[] {
  return NOTES.map(note => generateMajorKey(note));
}

// Get all minor keys  
export function getAllMinorKeys(): Key[] {
  return NOTES.map(note => generateMinorKey(note));
}

// Common chord progressions
export const COMMON_PROGRESSIONS = {
  'I-V-vi-IV': ['I', 'V', 'vi', 'IV'],
  'vi-IV-I-V': ['vi', 'IV', 'I', 'V'],
  'I-vi-IV-V': ['I', 'vi', 'IV', 'V'],
  'ii-V-I': ['ii', 'V', 'I'],
  'I-iii-vi-IV': ['I', 'iii', 'vi', 'IV']
} as const;
