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
export function generateScaleNotes(root: Note, intervals: number[]): Note[] {
  return intervals.map(interval => getNoteAtInterval(root, interval));
}

// Generate major key with all chords
export function generateMajorKey(tonic: Note): Key {
  const scale = generateScaleNotes(tonic, MAJOR_INTERVALS);
  
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
  const scale = generateScaleNotes(tonic, MINOR_INTERVALS);
  
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

// === SCALE EXPLORER TYPES AND CONSTANTS ===

// Scale types for Scale Explorer
export type ScaleType = 
  | 'major' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'minor' | 'locrian' // Major modes
  | 'pentatonic-major' | 'pentatonic-minor' // Pentatonic scales
  | 'blues-major' | 'blues-minor' // Blues scales
  | 'chromatic' // Chromatic scale
  | 'harmonic-minor' | 'melodic-minor'; // Other minor scales

export type ScaleCategory = 'modes' | 'pentatonic' | 'blues' | 'minor-variations' | 'exotic';

export interface Scale {
  root: Note;
  type: ScaleType;
  name: string;
  notes: Note[];
  intervals: number[];
  category: ScaleCategory;
  description: string;
  relatedChords?: string[]; // Suggested chords that work with this scale
}

// Scale intervals (semitones from root)
export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  // Major modes (7-note scales)
  'major': [0, 2, 4, 5, 7, 9, 11], // Ionian
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'minor': [0, 2, 3, 5, 7, 8, 10], // Aeolian (natural minor)
  'locrian': [0, 1, 3, 5, 6, 8, 10],
  
  // Pentatonic scales (5-note scales)
  'pentatonic-major': [0, 2, 4, 7, 9],
  'pentatonic-minor': [0, 3, 5, 7, 10],
  
  // Blues scales (6-note scales)
  'blues-major': [0, 2, 3, 4, 7, 9],
  'blues-minor': [0, 3, 5, 6, 7, 10],
  
  // Chromatic (all 12 notes)
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  
  // Minor variations
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11]
};

// Scale metadata for UI display
export const SCALE_INFO: Record<ScaleType, { category: ScaleCategory; description: string; relatedChords: string[] }> = {
  'major': {
    category: 'modes',
    description: 'The foundation of Western music. Bright and happy sound.',
    relatedChords: ['I', 'IV', 'V', 'vi']
  },
  'dorian': {
    category: 'modes',
    description: 'Minor scale with a raised 6th. Great for jazz and rock.',
    relatedChords: ['i', 'ii', 'IV', 'v']
  },
  'phrygian': {
    category: 'modes',
    description: 'Minor scale with a flat 2nd. Spanish/flamenco flavor.',
    relatedChords: ['i', '♭II', '♭VII']
  },
  'lydian': {
    category: 'modes',
    description: 'Major scale with a raised 4th. Dreamy, floating quality.',
    relatedChords: ['I', '#iv°', 'V']
  },
  'mixolydian': {
    category: 'modes',
    description: 'Major scale with a flat 7th. Perfect for dominant chords.',
    relatedChords: ['I', 'IV', '♭VII']
  },
  'minor': {
    category: 'modes',
    description: 'Natural minor scale. Melancholy and emotional.',
    relatedChords: ['i', 'iv', 'V', '♭VI']
  },
  'locrian': {
    category: 'modes',
    description: 'Most unstable mode. Diminished character.',
    relatedChords: ['i°', '♭II', '♭v']
  },
  'pentatonic-major': {
    category: 'pentatonic',
    description: 'Five-note scale. Universal and melodic.',
    relatedChords: ['I', 'IV', 'V']
  },
  'pentatonic-minor': {
    category: 'pentatonic',
    description: 'Minor pentatonic. Essential for blues and rock.',
    relatedChords: ['i', '♭VII', 'iv']
  },
  'blues-major': {
    category: 'blues',
    description: 'Major blues with blue notes. Soulful expression.',
    relatedChords: ['I7', 'IV7', 'V7']
  },
  'blues-minor': {
    category: 'blues',
    description: 'Classic blues scale. The sound of the blues.',
    relatedChords: ['i7', 'iv7', '♭VII7']
  },
  'chromatic': {
    category: 'exotic',
    description: 'All twelve notes. Ultimate harmonic possibilities.',
    relatedChords: ['Any chord']
  },
  'harmonic-minor': {
    category: 'minor-variations',
    description: 'Minor with raised 7th. Classical and Middle Eastern flavor.',
    relatedChords: ['i', 'iv', 'V']
  },
  'melodic-minor': {
    category: 'minor-variations',
    description: 'Ascending melodic minor. Jazz and classical applications.',
    relatedChords: ['i', 'ii', 'IV']
  }
};

// Generate any scale type
export function generateScale(root: Note, scaleType: ScaleType): Scale {
  const intervals = SCALE_INTERVALS[scaleType];
  const notes = intervals.map(interval => getNoteAtInterval(root, interval));
  const info = SCALE_INFO[scaleType];
  
  const scaleTypeDisplayNames: Record<ScaleType, string> = {
    'major': 'Major (Ionian)',
    'dorian': 'Dorian',
    'phrygian': 'Phrygian',
    'lydian': 'Lydian',
    'mixolydian': 'Mixolydian',
    'minor': 'Minor (Aeolian)',
    'locrian': 'Locrian',
    'pentatonic-major': 'Major Pentatonic',
    'pentatonic-minor': 'Minor Pentatonic',
    'blues-major': 'Major Blues',
    'blues-minor': 'Minor Blues',
    'chromatic': 'Chromatic',
    'harmonic-minor': 'Harmonic Minor',
    'melodic-minor': 'Melodic Minor'
  };
  
  return {
    root,
    type: scaleType,
    name: `${root} ${scaleTypeDisplayNames[scaleType]}`,
    notes,
    intervals,
    category: info.category,
    description: info.description,
    relatedChords: info.relatedChords
  };
}

// Get all scales for a given root note
export function getAllScalesForRoot(root: Note): Scale[] {
  return Object.keys(SCALE_INTERVALS).map(scaleType => 
    generateScale(root, scaleType as ScaleType)
  );
}

// Get scales by category
export function getScalesByCategory(category: ScaleCategory): ScaleType[] {
  return Object.entries(SCALE_INFO)
    .filter(([, info]) => info.category === category)
    .map(([scaleType]) => scaleType as ScaleType);
}

// Find scales that contain specific notes
export function findScalesContainingNotes(notes: Note[], root?: Note): Scale[] {
  const allRoots = root ? [root] : NOTES;
  const results: Scale[] = [];
  
  for (const rootNote of allRoots) {
    const scales = getAllScalesForRoot(rootNote);
    for (const scale of scales) {
      const scaleContainsAllNotes = notes.every(note => scale.notes.includes(note));
      if (scaleContainsAllNotes) {
        results.push(scale);
      }
    }
  }
  
  return results;
}
