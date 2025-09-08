// Key Friend - Interactive Key and Chord Explorer

import { 
  Note, 
  Key, 
  Chord, 
  generateMajorKey, 
  generateMinorKey, 
  getAllMajorKeys, 
  getAllMinorKeys,
  COMMON_PROGRESSIONS,
  NOTES 
} from './theory.js';

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

  // Change the current key
  public setKey(tonic: Note, mode: 'major' | 'minor' = 'major'): void {
    const newKey = mode === 'major' ? generateMajorKey(tonic) : generateMinorKey(tonic);
    this.state.currentKey = newKey;
    this.state.selectedChords = [];
    this.state.activeProgression = undefined;
    
    this.updateKeyDisplay();
    this.updateChordsDisplay();
    
    this.callbacks.onKeyChange?.(newKey);
  }

  // Toggle chord selection
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

  // Apply a common progression
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

  // Clear all selections
  public clearSelections(): void {
    this.state.selectedChords = [];
    this.state.activeProgression = undefined;
    this.updateChordsDisplay();
    this.updateProgressionsDisplay();
  }

  // Toggle note display
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

  // Update key display
  private updateKeyDisplay(): void {
    const keyNameEl = this.container.querySelector('.current-key-name');
    const scaleNotesEl = this.container.querySelector('.scale-notes');
    
    if (keyNameEl) {
      keyNameEl.textContent = this.state.currentKey.name;
      keyNameEl.classList.add('updating');
      setTimeout(() => keyNameEl.classList.remove('updating'), 300);
    }

    if (scaleNotesEl) {
      scaleNotesEl.innerHTML = this.state.currentKey.scale.map(note => `
        <span class="scale-note">${note}</span>
      `).join('');
    }
  }

  // Update chords display
  private updateChordsDisplay(): void {
    const chordsGrid = this.container.querySelector('#chords-grid');
    if (chordsGrid) {
      chordsGrid.innerHTML = this.renderChords();
    }

    // Update selected chords display
    const selectedContainer = this.container.querySelector('#selected-chords');
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
            ${this.state.selectedChords.map(chord => `
              <div class="selected-chord">
                <span class="selected-chord-name">${chord.name}</span>
                <span class="selected-chord-numeral">${chord.numeral}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // Update notes toggle button
    const toggleNotesBtn = this.container.querySelector('.toggle-notes-btn');
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
    // Key selector
    const tonicSelect = this.container.querySelector('#key-tonic') as HTMLSelectElement;
    tonicSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const mode = this.container.querySelector('.mode-btn.active')?.getAttribute('data-mode') as 'major' | 'minor' || 'major';
      this.setKey(target.value as Note, mode);
    });

    // Mode buttons
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Mode selection
      if (target.classList.contains('mode-btn')) {
        this.container.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        
        const mode = target.getAttribute('data-mode') as 'major' | 'minor';
        const tonic = (this.container.querySelector('#key-tonic') as HTMLSelectElement).value as Note;
        this.setKey(tonic, mode);
      }

      // Chord selection
      if (target.closest('.chord-card')) {
        const chordCard = target.closest('.chord-card') as HTMLElement;
        const chordIndex = parseInt(chordCard.getAttribute('data-chord-index') || '0');
        const chord = this.state.currentKey.chords[chordIndex];
        if (chord) {
          this.toggleChord(chord);
        }
      }

      // Progression selection
      if (target.closest('.progression-btn')) {
        const progressionBtn = target.closest('.progression-btn') as HTMLElement;
        const progressionName = progressionBtn.getAttribute('data-progression') as keyof typeof COMMON_PROGRESSIONS;
        if (progressionName) {
          this.applyProgression(progressionName);
        }
      }

      // Toggle notes display
      if (target.classList.contains('toggle-notes-btn')) {
        this.toggleNoteDisplay();
      }

      // Clear selections
      if (target.classList.contains('clear-selection-btn')) {
        this.clearSelections();
      }
    });
  }
}

// Factory function for easy initialization
export function createKeyFriend(container: HTMLElement): KeyFriend {
  return new KeyFriend(container);
}
