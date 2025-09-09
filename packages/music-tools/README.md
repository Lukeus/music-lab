# 🎵 Music Tools Package

> Interactive music theory tools and utilities for the Lukeus Music Lab ecosystem

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🎯 Overview

The Music Tools package provides a comprehensive suite of interactive music theory tools built with TypeScript. This package serves as the core engine for music theory exploration, scale discovery, and chord progression analysis in the Lukeus Music Lab.

## 🚀 Features

### 🗝️ Key Friend
Interactive chord progression explorer featuring:
- All 12 major and minor keys
- Complete chord pattern generation (I-ii-iii-IV-V-vi-vii°)
- Common progression templates (I-V-vi-IV, ii-V-I, etc.)
- Interactive chord selection and building
- Educational note display with intervals

### 🎼 Scale Explorer
Comprehensive scale discovery tool with:
- **14 Scale Types**: Major modes, pentatonic, blues, minor variations, exotic scales
- **Multiple Visualization Modes**: Keyboard, fretboard, circle of fifths
- **Scale Finder**: Discover scales containing specific notes
- **Related Chords**: Suggested chord progressions for each scale
- **Interactive UI**: Visual feedback and educational information

## 📦 Installation

```bash
npm install @lukeus/music-tools
```

## 🛠️ Usage

### Key Friend

```typescript
import { createKeyFriend, generateMajorKey } from '@lukeus/music-tools';

// Create an instance
const container = document.getElementById('key-friend-container');
const keyFriend = createKeyFriend(container);
keyFriend.init();

// Set up callbacks
keyFriend.on('keyChange', (key) => {
  console.log('Key changed to:', key.name);
});

keyFriend.on('chordSelect', (chord) => {
  console.log('Chord selected:', chord.name);
});

// Programmatic usage
const cMajorKey = generateMajorKey('C');
console.log(cMajorKey.chords); // All chords in C Major
```

### Scale Explorer

```typescript
import { createScaleExplorer, generateScale } from '@lukeus/music-tools';

// Create an instance
const container = document.getElementById('scale-explorer-container');
const scaleExplorer = createScaleExplorer(container);
scaleExplorer.init();

// Set up callbacks
scaleExplorer.on('scaleChange', (scale) => {
  console.log('Scale changed to:', scale.name);
});

scaleExplorer.on('visualModeChange', (mode) => {
  console.log('Visual mode:', mode); // 'keyboard', 'fretboard', or 'circle'
});

// Programmatic usage
const cMajorScale = generateScale('C', 'major');
console.log(cMajorScale.notes); // ['C', 'D', 'E', 'F', 'G', 'A', 'B']
```

### Music Theory Utilities

```typescript
import { 
  getAllMajorKeys, 
  getAllMinorKeys, 
  findScalesContainingNotes,
  getScalesByCategory 
} from '@lukeus/music-tools';

// Get all keys
const majorKeys = getAllMajorKeys();
const minorKeys = getAllMinorKeys();

// Find scales containing specific notes
const scalesWithCAndE = findScalesContainingNotes(['C', 'E']);

// Get scales by category
const pentatonicScales = getScalesByCategory('pentatonic');
const bluesScales = getScalesByCategory('blues');
```

## 🎨 API Reference

### Core Types

```typescript
export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type ChordType = 'major' | 'minor' | 'diminished';
export type ScaleType = 'major' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'minor' | 'locrian' | 'pentatonic-major' | 'pentatonic-minor' | 'blues-major' | 'blues-minor' | 'chromatic' | 'harmonic-minor' | 'melodic-minor';

export interface Chord {
  root: Note;
  type: ChordType;
  numeral: ChordNumeral;
  name: string;
  notes: Note[];
}

export interface Scale {
  root: Note;
  type: ScaleType;
  name: string;
  notes: Note[];
  intervals: number[];
  category: ScaleCategory;
  description: string;
  relatedChords?: string[];
}
```

### Key Friend Methods

```typescript
class KeyFriend {
  init(): void;
  setKey(tonic: Note, mode: 'major' | 'minor'): void;
  toggleChord(chord: Chord): void;
  applyProgression(progressionName: string): void;
  clearSelections(): void;
  on(event: string, callback: Function): void;
}
```

### Scale Explorer Methods

```typescript
class ScaleExplorer {
  init(): void;
  setScale(root: Note, scaleType: ScaleType): void;
  setCategory(category: ScaleCategory | 'all'): void;
  setVisualMode(mode: 'keyboard' | 'fretboard' | 'circle'): void;
  toggleNote(note: Note): void;
  findScalesWithNotes(): Scale[];
  on(event: string, callback: Function): void;
}
```

## 🎯 Scale Types Supported

### Major Modes (7-note scales)
- **Major (Ionian)** - The foundation of Western music
- **Dorian** - Minor scale with raised 6th, great for jazz and rock
- **Phrygian** - Minor scale with flat 2nd, Spanish/flamenco flavor  
- **Lydian** - Major scale with raised 4th, dreamy floating quality
- **Mixolydian** - Major scale with flat 7th, perfect for dominant chords
- **Minor (Aeolian)** - Natural minor scale, melancholy and emotional
- **Locrian** - Most unstable mode with diminished character

### Pentatonic Scales (5-note scales)
- **Major Pentatonic** - Universal and melodic
- **Minor Pentatonic** - Essential for blues and rock

### Blues Scales (6-note scales)
- **Major Blues** - Major blues with blue notes, soulful expression
- **Minor Blues** - Classic blues scale, the sound of the blues

### Minor Variations
- **Harmonic Minor** - Minor with raised 7th, classical and Middle Eastern flavor
- **Melodic Minor** - Ascending melodic minor, jazz and classical applications

### Exotic Scales
- **Chromatic** - All twelve notes, ultimate harmonic possibilities

## 🏗️ Architecture

The music-tools package follows a clean, modular architecture:

```
src/
├── theory.ts          # Core music theory types and functions
├── keyFriend.ts       # Key Friend interactive tool class
├── scaleExplorer.ts   # Scale Explorer interactive tool class
└── index.ts           # Main exports and convenience functions
```

### Design Principles

1. **Type Safety** - Complete TypeScript coverage with strict types
2. **Modularity** - Clean separation of concerns between tools
3. **Extensibility** - Easy to add new scales, chords, and features
4. **Performance** - Efficient algorithms for real-time interaction
5. **Accessibility** - Screen reader friendly with semantic HTML

## 🎨 Styling

The tools generate semantic HTML that can be styled with CSS. Each tool includes comprehensive CSS classes for customization:

```css
/* Key Friend */
.key-friend { /* Main container */ }
.chord-card { /* Individual chord cards */ }
.chord-card.selected { /* Selected chord state */ }

/* Scale Explorer */  
.scale-explorer { /* Main container */ }
.keyboard .key { /* Piano keys */ }
.fretboard .fret { /* Guitar frets */ }
.circle-note { /* Circle of fifths notes */ }
```

See the included CSS files for complete styling examples.

## 🚀 Performance

- **Bundle Size**: ~17KB gzipped for Scale Explorer, ~10KB for Key Friend
- **Runtime**: Optimized algorithms for real-time interaction
- **Memory**: Efficient data structures, minimal memory footprint
- **Animations**: 60fps smooth animations with requestAnimationFrame

## 🤝 Contributing

This package is part of the Lukeus Music Lab monorepo. Contributions are welcome!

### Development Setup

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch for changes during development
npm run dev
```

### Adding New Scales

1. Add scale intervals to `SCALE_INTERVALS` in `theory.ts`
2. Add scale metadata to `SCALE_INFO`
3. Update the `ScaleType` type union
4. Add appropriate category classification

## 📄 License

MIT License - See the main repository for full license details.

---

<div align="center">

**Built with ❤️ for musicians, by musicians**

*Part of the [Lukeus Music Lab](https://music-labs-1d8e1.web.app) ecosystem*

</div>
