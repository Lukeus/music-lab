# 🎵 Music Tools Package

> *"Where music theory meets interactive magic - transforming abstract concepts into playful, beautiful experiences."*

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🎆 The Heart of Musical Creation

The **Music Tools package** is the beating heart of musical intelligence within the Lukeus Music Lab ecosystem - a **comprehensive suite of interactive music theory tools** that transform abstract musical concepts into delightful, hands-on learning experiences. This isn't just another library; it's a **digital music teacher** that makes theory exploration feel like play.

## ✨ Musical Magic at Your Fingertips

### 🗝️ Key Friend - *Your Chord Progression Companion*
Your **personal music theory mentor** that makes chord progressions feel like a creative conversation:
- **🎹 12 Musical Universes** - Explore every major and minor key with confidence
- **🎼 Harmonic DNA** - Complete chord pattern generation that reveals the musical genetics (I-ii-iii-IV-V-vi-vii°)
- **🎭 Hit Song Templates** - Pre-loaded progressions like I-V-vi-IV that have launched a thousand melodies
- **🎯 Interactive Building Blocks** - Click, play, and discover chord combinations that spark inspiration
- **🎼 Educational Enlightenment** - See the note relationships that make harmony work

### 🎼 Scale Explorer - *Your Musical Discovery Engine*
A **comprehensive playground for scale discovery** that transforms music theory into visual art:
- **🌈 14 Sonic Flavors** - From familiar major modes to exotic scales that transport you to different worlds
- **🎨 Triple Vision** - Experience scales through keyboard, fretboard, and circle of fifths visualizations
- **🔍 Scale Detective** - Input notes and discover which scales contain your musical ideas
- **🎵 Harmonic Relationships** - Get chord suggestions that complement each scale perfectly
- **✨ Responsive Magic** - Visual feedback that makes learning feel like playing a game

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

## 🏭 The Creative Code Architecture

Like a well-composed symphony, the music-tools package follows an elegant, harmonious structure:

```
src/
├── theory.ts          # 🎼 The Musical Brain - Core theory types and harmonic intelligence
├── keyFriend.ts       # 🗝️ The Chord Whisperer - Interactive progression magic
├── scaleExplorer.ts   # 🔍 The Scale Alchemist - Musical discovery and visualization
└── index.ts           # 🎆 The Grand Conductor - Orchestrating all the musical pieces
```

### 🎨 Creative Design Philosophy

Our architecture dances to these fundamental rhythms:

1. **🔒 Type-Safe Harmony** - Complete TypeScript coverage that prevents discord
2. **🧩 Modular Composition** - Each tool is a beautiful, self-contained musical phrase
3. **🌱 Infinite Extensibility** - Add new scales, chords, and features with the ease of writing a new verse
4. **⚡ Lightning Performance** - Algorithms optimized for real-time creative flow
5. **🌍 Universal Accessibility** - Screen reader friendly design that welcomes every musician

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

## 🎆 Join the Musical Revolution

**This package is the creative heartbeat of the Lukeus Music Lab monorepo** - and we'd love for you to add your voice to the chorus! Every contribution makes the musical experience richer for creators everywhere.

### 🎵 Creative Development Setup

```bash
# 🌱 Plant the seeds of musical creativity
npm install

# 🏗️ Build your musical architecture
npm run build

# 👀 Watch your creations come to life in real-time
npm run dev
```

### 🌈 Expanding the Musical Universe

**Adding new scales is like discovering new colors in the musical palette:**

1. **🎼 Define the intervals** - Add your scale's DNA to `SCALE_INTERVALS` in `theory.ts`
2. **✨ Tell its story** - Add rich metadata and descriptions to `SCALE_INFO`
3. **🕰️ Update the catalog** - Include your scale in the `ScaleType` type union
4. **🏷️ Organize beautifully** - Place it in the perfect category classification

## 📄 License

MIT License - See the main repository for full license details.

---

<div align="center">

**Built with ❤️ for musicians, by musicians**

*Part of the [Lukeus Music Lab](https://music-labs-1d8e1.web.app) ecosystem*

</div>
