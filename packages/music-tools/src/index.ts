// Music Tools Package - Main Export
export * from './theory.js';
export * from './keyFriend.js';
export * from './scaleExplorer.js';
export * from './chordFinder.js';

// Convenience re-exports
export { createKeyFriend } from './keyFriend.js';
export { createScaleExplorer } from './scaleExplorer.js';
export { createChordFinder } from './chordFinder.js';
export { generateMajorKey, generateMinorKey, getAllMajorKeys, getAllMinorKeys, generateScale, getAllScalesForRoot, getScalesByCategory, findScalesContainingNotes, identifyChord, generateChord, generateChordInversions, generateChordVoicings } from './theory.js';
