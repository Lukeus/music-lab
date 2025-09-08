// Key Friend - Interactive Key and Chord Explorer
// Client-side implementation for the website

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

// Common chord progressions
export const COMMON_PROGRESSIONS = {
  'I-V-vi-IV': ['I', 'V', 'vi', 'IV'],
  'vi-IV-I-V': ['vi', 'IV', 'I', 'V'],
  'I-vi-IV-V': ['I', 'vi', 'IV', 'V'],
  'ii-V-I': ['ii', 'V', 'I'],
  'I-iii-vi-IV': ['I', 'iii', 'vi', 'IV']
} as const;

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
  
  // Chord patterns for major keys (using scale degrees)
  const MAJOR_CHORD_PATTERNS: Array<{ numeral: ChordNumeral; type: ChordType; intervals: number[] }> = [
    { numeral: 'I', type: 'major', intervals: [0, 2, 4] },      // 1-3-5
    { numeral: 'ii', type: 'minor', intervals: [1, 3, 5] },     // 2-4-6
    { numeral: 'iii', type: 'minor', intervals: [2, 4, 6] },    // 3-5-7
    { numeral: 'IV', type: 'major', intervals: [3, 5, 0] },     // 4-6-1
    { numeral: 'V', type: 'major', intervals: [4, 6, 1] },      // 5-7-2
    { numeral: 'vi', type: 'minor', intervals: [5, 0, 2] },     // 6-1-3
    { numeral: 'vii°', type: 'diminished', intervals: [6, 1, 3] } // 7-2-4
  ];
  
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

export interface KeyFriendState {
  currentKey: Key;
  selectedChords: Chord[];
  activeProgression?: keyof typeof COMMON_PROGRESSIONS;
  showNotes: boolean;
}

export class KeyFriend {
  private state: KeyFriendState;
  private container: HTMLElement;
  private callbacks: {
    onKeyChange?: (key: Key) => void;
    onChordSelect?: (chord: Chord) => void;
    onProgressionSelect?: (progression: string) => void;
  } = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      currentKey: generateMajorKey('C'),
      selectedChords: [],
      showNotes: true
    };
  }

  // Initialize the Key Friend UI
  public init(): void {
    this.render();
    this.attachEventListeners();
  }

  // Set callbacks for interactions
  public on(event: 'keyChange', callback: (key: Key) => void): void;
  public on(event: 'chordSelect', callback: (chord: Chord) => void): void;
  public on(event: 'progressionSelect', callback: (progression: string) => void): void;
  public on(event: string, callback: Function): void {
    this.callbacks[event as keyof typeof this.callbacks] = callback as any;
  }

  // Change the current key with smooth animations
  public setKey(tonic: Note, mode: 'major' | 'minor' = 'major'): void {
    const newKey = mode === 'major' ? generateMajorKey(tonic) : generateMinorKey(tonic);
    this.state.currentKey = newKey;
    this.state.selectedChords = [];
    this.state.activeProgression = undefined;
    
    this.updateKeyDisplay();
    this.updateChordsDisplay();
    
    this.callbacks.onKeyChange?.(newKey);
  }

  // Toggle chord selection with animation
  public toggleChord(chord: Chord): void {
    const existingIndex = this.state.selectedChords.findIndex(c => 
      c.root === chord.root && c.type === chord.type
    );

    if (existingIndex >= 0) {
      this.state.selectedChords.splice(existingIndex, 1);
    } else {
      this.state.selectedChords.push(chord);
    }

    this.updateChordsDisplay();
    this.callbacks.onChordSelect?.(chord);
  }

  // Apply a common progression with staggered animations
  public applyProgression(progressionName: keyof typeof COMMON_PROGRESSIONS): void {
    const progression = COMMON_PROGRESSIONS[progressionName];
    const progressionChords = progression
      .map(numeral => this.state.currentKey.chords.find(chord => chord.numeral === numeral))
      .filter((chord): chord is Chord => chord !== undefined);

    this.state.selectedChords = progressionChords;
    this.state.activeProgression = progressionName;
    
    this.updateChordsDisplay();
    this.updateProgressionsDisplay();
    this.callbacks.onProgressionSelect?.(progressionName);
  }

  // Clear all selections with fade out animation
  public clearSelections(): void {
    this.state.selectedChords = [];
    this.state.activeProgression = undefined;
    this.updateChordsDisplay();
    this.updateProgressionsDisplay();
  }

  // Toggle note display with transition
  public toggleNoteDisplay(): void {
    this.state.showNotes = !this.state.showNotes;
    this.updateChordsDisplay();
  }

  // Render the complete UI
  private render(): void {
    this.container.innerHTML = `
      <div class="key-friend">
        <div class="key-friend-header">
          <h2 class="key-friend-title">
            <span class="tool-icon">🗝️</span>
            Key Friend
          </h2>
          <p class="key-friend-description">
            Discover chord patterns and progressions for any key
          </p>
        </div>

        <div class="key-friend-content">
          <!-- Key Selector -->
          <div class="key-selector-section">
            <h3>Choose Your Key</h3>
            <div class="key-controls">
              <div class="key-selector">
                <label for="key-tonic">Root Note:</label>
                <select id="key-tonic" class="key-select">
                  ${NOTES.map(note => `
                    <option value="${note}" ${note === 'C' ? 'selected' : ''}>${note}</option>
                  `).join('')}
                </select>
              </div>
              <div class="mode-selector">
                <label>Mode:</label>
                <div class="mode-buttons">
                  <button class="mode-btn active" data-mode="major">Major</button>
                  <button class="mode-btn" data-mode="minor">Minor</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Key Display -->
          <div class="current-key-display">
            <div class="key-info">
              <h4 class="current-key-name">${this.state.currentKey.name}</h4>
              <div class="key-scale">
                <span class="scale-label">Scale:</span>
                <div class="scale-notes">
                  ${this.state.currentKey.scale.map(note => `
                    <span class="scale-note">${note}</span>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Chords Display -->
          <div class="chords-section">
            <div class="chords-header">
              <h3>Available Chords</h3>
              <div class="chord-controls">
                <button class="toggle-notes-btn" data-show-notes="${this.state.showNotes}">
                  ${this.state.showNotes ? '🎵' : '📝'} ${this.state.showNotes ? 'Hide' : 'Show'} Notes
                </button>
                <button class="clear-selection-btn">🗑️ Clear</button>
              </div>
            </div>
            <div class="chords-grid" id="chords-grid">
              ${this.renderChords()}
            </div>
          </div>

          <!-- Common Progressions -->
          <div class="progressions-section">
            <h3>Common Progressions</h3>
            <div class="progressions-grid">
              ${Object.entries(COMMON_PROGRESSIONS).map(([name, progression]) => `
                <button class="progression-btn" data-progression="${name}">
                  <span class="progression-name">${name}</span>
                  <span class="progression-chords">${progression.join(' - ')}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Selected Chords Display -->
          <div class="selected-section">
            <h3>Your Progression</h3>
            <div class="selected-chords" id="selected-chords">
              <div class="empty-state">
                <span class="empty-icon">🎹</span>
                <p>Select chords above to build your progression</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render individual chord buttons
  private renderChords(): string {
    return this.state.currentKey.chords.map((chord, index) => {
      const isSelected = this.state.selectedChords.some(c => 
        c.root === chord.root && c.type === chord.type
      );
      
      return `
        <div class="chord-card ${isSelected ? 'selected' : ''}" data-chord-index="${index}">
          <div class="chord-header">
            <span class="chord-numeral">${chord.numeral}</span>
            <span class="chord-name">${chord.name}</span>
          </div>
          ${this.state.showNotes ? `
            <div class="chord-notes">
              ${chord.notes.map(note => `<span class="chord-note">${note}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // Update key display with smooth animation
  private updateKeyDisplay(): void {
    const keyNameEl = this.container.querySelector('.current-key-name') as HTMLElement;
    const scaleNotesEl = this.container.querySelector('.scale-notes') as HTMLElement;
    
    if (keyNameEl) {
      keyNameEl.textContent = this.state.currentKey.name;
      keyNameEl.classList.add('updating');
      setTimeout(() => keyNameEl.classList.remove('updating'), 300);
    }

    if (scaleNotesEl) {
      // Animate scale notes update
      scaleNotesEl.style.opacity = '0';
      scaleNotesEl.style.transform = 'translateY(10px)';
      setTimeout(() => {
        scaleNotesEl.innerHTML = this.state.currentKey.scale.map(note => `
          <span class="scale-note">${note}</span>
        `).join('');
        scaleNotesEl.style.opacity = '1';
        scaleNotesEl.style.transform = 'translateY(0)';
      }, 150);
    }
  }

  // Update chords display with animations
  private updateChordsDisplay(): void {
    const chordsGrid = this.container.querySelector('#chords-grid') as HTMLElement;
    if (chordsGrid) {
      // Add fade animation for better UX
      chordsGrid.style.opacity = '0.7';
      chordsGrid.style.transform = 'scale(0.98)';
      setTimeout(() => {
        chordsGrid.innerHTML = this.renderChords();
        chordsGrid.style.opacity = '1';
        chordsGrid.style.transform = 'scale(1)';
      }, 100);
    }

    // Update selected chords display with staggered animation
    const selectedContainer = this.container.querySelector('#selected-chords') as HTMLElement;
    if (selectedContainer) {
      if (this.state.selectedChords.length === 0) {
        selectedContainer.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">🎹</span>
            <p>Select chords above to build your progression</p>
          </div>
        `;
      } else {
        selectedContainer.innerHTML = `
          <div class="progression-display">
            ${this.state.selectedChords.map((chord, index) => `
              <div class="selected-chord" style="animation-delay: ${index * 0.1}s">
                <span class="selected-chord-name">${chord.name}</span>
                <span class="selected-chord-numeral">${chord.numeral}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // Update notes toggle button
    const toggleNotesBtn = this.container.querySelector('.toggle-notes-btn') as HTMLElement;
    if (toggleNotesBtn) {
      toggleNotesBtn.textContent = `${this.state.showNotes ? '🎵' : '📝'} ${this.state.showNotes ? 'Hide' : 'Show'} Notes`;
      toggleNotesBtn.setAttribute('data-show-notes', this.state.showNotes.toString());
    }
  }

  // Update progressions display
  private updateProgressionsDisplay(): void {
    const progressionBtns = this.container.querySelectorAll('.progression-btn');
    progressionBtns.forEach(btn => {
      const progressionName = btn.getAttribute('data-progression');
      if (progressionName === this.state.activeProgression) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Attach event listeners
  private attachEventListeners(): void {
    // Key selector change with smooth transition
    const tonicSelect = this.container.querySelector('#key-tonic') as HTMLSelectElement;
    tonicSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const mode = this.container.querySelector('.mode-btn.active')?.getAttribute('data-mode') as 'major' | 'minor' || 'major';
      this.setKey(target.value as Note, mode);
    });

    // Delegated event handling for all interactions
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Mode selection with transition effect
      if (target.classList.contains('mode-btn')) {
        this.container.querySelectorAll('.mode-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        target.classList.add('active');
        
        const mode = target.getAttribute('data-mode') as 'major' | 'minor';
        const tonic = (this.container.querySelector('#key-tonic') as HTMLSelectElement).value as Note;
        this.setKey(tonic, mode);
      }

      // Chord selection with feedback animation
      if (target.closest('.chord-card')) {
        const chordCard = target.closest('.chord-card') as HTMLElement;
        const chordIndex = parseInt(chordCard.getAttribute('data-chord-index') || '0');
        const chord = this.state.currentKey.chords[chordIndex];
        if (chord) {
          // Add click feedback
          chordCard.style.transform = 'scale(0.95)';
          setTimeout(() => {
            chordCard.style.transform = 'scale(1)';
          }, 100);
          this.toggleChord(chord);
        }
      }

      // Progression selection with ripple effect
      if (target.closest('.progression-btn')) {
        const progressionBtn = target.closest('.progression-btn') as HTMLElement;
        const progressionName = progressionBtn.getAttribute('data-progression') as keyof typeof COMMON_PROGRESSIONS;
        if (progressionName) {
          // Add selection feedback
          progressionBtn.style.transform = 'scale(0.98)';
          setTimeout(() => {
            progressionBtn.style.transform = 'scale(1)';
          }, 150);
          this.applyProgression(progressionName);
        }
      }

      // Toggle notes display with transition
      if (target.classList.contains('toggle-notes-btn')) {
        target.style.transform = 'scale(0.95)';
        setTimeout(() => {
          target.style.transform = 'scale(1)';
        }, 100);
        this.toggleNoteDisplay();
      }

      // Clear selections with fade effect
      if (target.classList.contains('clear-selection-btn')) {
        target.style.transform = 'scale(0.95)';
        setTimeout(() => {
          target.style.transform = 'scale(1)';
        }, 100);
        this.clearSelections();
      }
    });
  }
}

// Factory function for easy initialization
export function createKeyFriend(container: HTMLElement): KeyFriend {
  return new KeyFriend(container);
}

// Initialize Key Friend when DOM is loaded (auto-init if container exists)
export function initKeyFriend(): void {
  document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('[data-key-friend]');
    containers.forEach(container => {
      if (container instanceof HTMLElement) {
        const keyFriend = createKeyFriend(container);
        keyFriend.init();
      }
    });
  });
}
