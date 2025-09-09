// Chord Finder - Interactive Chord Identification and Discovery Tool

import { 
  Note, 
  ExtendedChordType,
  ChordIdentification,
  ChordVoicing,
  ChordInversion,
  identifyChord,
  generateChord,
  generateChordInversions,
  generateChordVoicings,
  NOTES,
  CHORD_INFO
} from './theory.js';

export interface ChordFinderState {
  selectedNotes: Note[];
  identifiedChords: ChordIdentification[];
  activeChord?: ChordIdentification;
  showInversions: boolean;
  showVoicings: boolean;
  selectedInstrument: 'piano' | 'guitar';
  visualMode: 'keyboard' | 'note-selector';
}

export class ChordFinder {
  private state: ChordFinderState;
  private container: HTMLElement;
  private callbacks: {
    onNotesChange?: (notes: Note[]) => void;
    onChordIdentify?: (chords: ChordIdentification[]) => void;
    onChordSelect?: (chord: ChordIdentification) => void;
    onInstrumentChange?: (instrument: 'piano' | 'guitar') => void;
  } = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      selectedNotes: [],
      identifiedChords: [],
      showInversions: true,
      showVoicings: true,
      selectedInstrument: 'piano',
      visualMode: 'keyboard'
    };
  }

  // Initialize the Chord Finder UI
  public init(): void {
    this.render();
    this.attachEventListeners();
  }

  // Set callbacks for interactions
  public on(event: 'notesChange', callback: (notes: Note[]) => void): void;
  public on(event: 'chordIdentify', callback: (chords: ChordIdentification[]) => void): void;
  public on(event: 'chordSelect', callback: (chord: ChordIdentification) => void): void;
  public on(event: 'instrumentChange', callback: (instrument: 'piano' | 'guitar') => void): void;
  public on(event: string, callback: Function): void {
    this.callbacks[event as keyof typeof this.callbacks] = callback as any;
  }

  // Toggle note selection
  public toggleNote(note: Note): void {
    const existingIndex = this.state.selectedNotes.indexOf(note);
    
    if (existingIndex >= 0) {
      this.state.selectedNotes.splice(existingIndex, 1);
    } else {
      this.state.selectedNotes.push(note);
    }
    
    this.identifyCurrentChords();
    this.updateNotesDisplay();
    this.updateChordsDisplay();
    
    this.callbacks.onNotesChange?.(this.state.selectedNotes);
  }

  // Clear all selected notes
  public clearNotes(): void {
    this.state.selectedNotes = [];
    this.state.identifiedChords = [];
    this.state.activeChord = undefined;
    
    this.updateNotesDisplay();
    this.updateChordsDisplay();
    
    this.callbacks.onNotesChange?.(this.state.selectedNotes);
  }

  // Select a specific chord
  public selectChord(chord: ChordIdentification): void {
    this.state.activeChord = chord;
    this.state.selectedNotes = [...chord.notes];
    
    this.updateNotesDisplay();
    this.updateChordDetails();
    
    this.callbacks.onChordSelect?.(chord);
  }

  // Set instrument for voicings
  public setInstrument(instrument: 'piano' | 'guitar'): void {
    this.state.selectedInstrument = instrument;
    this.updateVoicingsDisplay();
    this.callbacks.onInstrumentChange?.(instrument);
  }

  // Toggle inversions display
  public toggleInversions(): void {
    this.state.showInversions = !this.state.showInversions;
    this.updateChordDetails();
  }

  // Toggle voicings display
  public toggleVoicings(): void {
    this.state.showVoicings = !this.state.showVoicings;
    this.updateChordDetails();
  }

  // Set visual mode
  public setVisualMode(mode: 'keyboard' | 'note-selector'): void {
    this.state.visualMode = mode;
    this.updateVisualDisplay();
  }

  // Get current state
  public getState(): ChordFinderState {
    return { ...this.state };
  }

  // Identify chords from currently selected notes
  private identifyCurrentChords(): void {
    if (this.state.selectedNotes.length < 2) {
      this.state.identifiedChords = [];
      this.state.activeChord = undefined;
      return;
    }

    const chords = identifyChord(this.state.selectedNotes);
    this.state.identifiedChords = chords;
    
    // Auto-select the first chord if available
    if (chords.length > 0 && !this.state.activeChord) {
      this.state.activeChord = chords[0];
    }
    
    this.callbacks.onChordIdentify?.(chords);
  }

  // Render the complete UI
  private render(): void {
    this.container.innerHTML = `
      <div class="chord-finder">
        <div class="chord-finder-header">
          <h2 class="chord-finder-title">
            <span class="tool-icon">🎯</span>
            Chord Finder
          </h2>
          <p class="chord-finder-description">
            Select notes to identify chords, discover inversions, and explore voicings
          </p>
        </div>

        <div class="chord-finder-content">
          <!-- Visual Mode Selector -->
          <div class="visual-mode-controls">
            <label>Input Mode:</label>
            <div class="mode-buttons">
              <button class="mode-btn active" data-mode="keyboard">🎹 Keyboard</button>
              <button class="mode-btn" data-mode="note-selector">🎵 Note Selector</button>
            </div>
          </div>

          <!-- Note Input Section -->
          <div class="note-input-section">
            <h3>Select Notes</h3>
            <div class="input-controls">
              <button class="clear-notes-btn">🗑️ Clear All</button>
              <div class="selected-notes-count">
                Selected: <span id="notes-count">0</span> notes
              </div>
            </div>
            <div id="note-input-visual" class="note-input-visual">
              ${this.renderVisualInput()}
            </div>
          </div>

          <!-- Chord Results Section -->
          <div class="chord-results-section">
            <h3>Identified Chords</h3>
            <div id="chord-results" class="chord-results">
              ${this.renderChordResults()}
            </div>
          </div>

          <!-- Active Chord Details -->
          <div class="chord-details-section" id="chord-details-section">
            ${this.renderChordDetails()}
          </div>
        </div>
      </div>
    `;
  }

  // Render visual input based on mode
  private renderVisualInput(): string {
    if (this.state.visualMode === 'keyboard') {
      return this.renderKeyboard();
    } else {
      return this.renderNoteSelector();
    }
  }

  // Render piano keyboard for note input
  private renderKeyboard(): string {
    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
    
    const whiteKeysHtml = whiteKeys.map(note => {
      const isSelected = this.state.selectedNotes.includes(note as Note);
      return `
        <div class="key white-key ${isSelected ? 'selected' : ''}" data-note="${note}">
          <span class="key-label">${note}</span>
        </div>
      `;
    }).join('');
    
    const blackKeysHtml = blackKeys.map(note => {
      const isSelected = this.state.selectedNotes.includes(note as Note);
      return `
        <div class="key black-key ${isSelected ? 'selected' : ''}" data-note="${note}">
          <span class="key-label">${note}</span>
        </div>
      `;
    }).join('');
    
    return `
      <div class="keyboard">
        <div class="white-keys">${whiteKeysHtml}</div>
        <div class="black-keys">${blackKeysHtml}</div>
      </div>
    `;
  }

  // Render note selector buttons
  private renderNoteSelector(): string {
    return `
      <div class="note-selector-input">
        ${NOTES.map(note => {
          const isSelected = this.state.selectedNotes.includes(note);
          return `
            <button class="note-btn ${isSelected ? 'selected' : ''}" data-note="${note}">
              ${note}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  // Render chord identification results
  private renderChordResults(): string {
    if (this.state.selectedNotes.length < 2) {
      return `
        <div class="empty-state">
          <span class="empty-icon">🎹</span>
          <p>Select at least 2 notes to identify chords</p>
        </div>
      `;
    }

    if (this.state.identifiedChords.length === 0) {
      return `
        <div class="no-results">
          <span class="no-results-icon">❓</span>
          <p>No standard chords found for notes: ${this.state.selectedNotes.join(', ')}</p>
          <p class="suggestion">Try selecting different notes or check for enharmonic equivalents</p>
        </div>
      `;
    }

    return `
      <div class="chord-results-grid">
        ${this.state.identifiedChords.map((chord, index) => {
          const isActive = this.state.activeChord?.name === chord.name;
          return `
            <div class="chord-result-card ${isActive ? 'active' : ''}" data-chord-index="${index}">
              <div class="chord-result-header">
                <span class="chord-name">${chord.name}</span>
                <span class="chord-quality ${chord.quality}">${chord.quality}</span>
              </div>
              <div class="chord-result-info">
                <div class="chord-notes">
                  ${chord.notes.map(note => `<span class="chord-note">${note}</span>`).join('')}
                </div>
                <div class="chord-inversion">${this.getInversionLabel(chord.inversion)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Render active chord details
  private renderChordDetails(): string {
    if (!this.state.activeChord) {
      return `
        <div class="no-active-chord">
          <h3>Chord Details</h3>
          <p>Select a chord above to see detailed information</p>
        </div>
      `;
    }

    const chord = this.state.activeChord;
    const inversions = this.state.showInversions ? generateChordInversions(chord) : [];
    const voicings = this.state.showVoicings ? generateChordVoicings(chord, this.state.selectedInstrument) : [];

    return `
      <div class="chord-details active">
        <div class="chord-details-header">
          <h3>${chord.name} - ${chord.quality} chord</h3>
          <div class="chord-controls">
            <div class="instrument-selector">
              <label>Instrument:</label>
              <select id="instrument-select" class="instrument-select">
                <option value="piano" ${this.state.selectedInstrument === 'piano' ? 'selected' : ''}>Piano</option>
                <option value="guitar" ${this.state.selectedInstrument === 'guitar' ? 'selected' : ''}>Guitar</option>
              </select>
            </div>
            <button class="toggle-inversions-btn ${this.state.showInversions ? 'active' : ''}">
              ${this.state.showInversions ? '👁️' : '👁️‍🗨️'} Inversions
            </button>
            <button class="toggle-voicings-btn ${this.state.showVoicings ? 'active' : ''}">
              ${this.state.showVoicings ? '🎹' : '🎼'} Voicings
            </button>
          </div>
        </div>

        <div class="chord-info">
          <div class="chord-description">
            <p>${chord.description}</p>
          </div>
          
          <div class="chord-notes-display">
            <h4>Chord Notes</h4>
            <div class="notes-list">
              ${chord.notes.map((note, index) => `
                <div class="note-item ${index === 0 ? 'root-note' : ''}">
                  <span class="note-name">${note}</span>
                  <span class="note-role">${index === 0 ? 'Root' : this.getNoteRole(index, chord.type)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        ${this.state.showInversions ? `
          <div class="inversions-section">
            <h4>Inversions</h4>
            <div class="inversions-grid">
              ${inversions.map(inversion => `
                <div class="inversion-card">
                  <div class="inversion-header">
                    <span class="inversion-name">${this.getInversionLabel(inversion.inversion)}</span>
                    <span class="inversion-symbol">${inversion.name}</span>
                  </div>
                  <div class="inversion-notes">
                    ${inversion.notes.map(note => `<span class="inversion-note">${note}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${this.state.showVoicings ? `
          <div class="voicings-section" id="voicings-section">
            <h4>Common ${this.state.selectedInstrument === 'piano' ? 'Piano' : 'Guitar'} Voicings</h4>
            <div class="voicings-grid">
              ${voicings.map(voicing => `
                <div class="voicing-card">
                  <div class="voicing-header">
                    <span class="voicing-name">${voicing.name}</span>
                    <span class="voicing-difficulty ${voicing.difficulty}">${voicing.difficulty}</span>
                  </div>
                  <div class="voicing-notes">
                    ${voicing.notes.map(note => `<span class="voicing-note">${note}</span>`).join('')}
                  </div>
                  ${voicing.fingering ? `<div class="voicing-fingering">${voicing.fingering}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Helper function to get inversion label
  private getInversionLabel(inversion: ChordInversion): string {
    const labels: Record<ChordInversion, string> = {
      'root': 'Root Position',
      'first': '1st Inversion',
      'second': '2nd Inversion',
      'third': '3rd Inversion'
    };
    return labels[inversion];
  }

  // Helper function to get note role in chord
  private getNoteRole(index: number, chordType: ExtendedChordType): string {
    const roleMap: Record<number, string> = {
      0: 'Root',
      1: chordType.includes('sus2') ? '2nd' : chordType.includes('sus4') ? '4th' : '3rd',
      2: chordType.includes('sus') ? '5th' : '5th',
      3: '7th',
      4: '9th'
    };
    return roleMap[index] || `${index + 1}`;
  }

  // Update notes display
  private updateNotesDisplay(): void {
    const visual = this.container.querySelector('#note-input-visual');
    const countEl = this.container.querySelector('#notes-count');
    
    if (visual) {
      visual.innerHTML = this.renderVisualInput();
    }
    
    if (countEl) {
      countEl.textContent = this.state.selectedNotes.length.toString();
    }
  }

  // Update chord results display
  private updateChordsDisplay(): void {
    const resultsEl = this.container.querySelector('#chord-results');
    if (resultsEl) {
      resultsEl.innerHTML = this.renderChordResults();
    }
  }

  // Update chord details display
  private updateChordDetails(): void {
    const detailsEl = this.container.querySelector('#chord-details-section');
    if (detailsEl) {
      detailsEl.innerHTML = this.renderChordDetails();
    }
  }

  // Update visual display
  private updateVisualDisplay(): void {
    const visual = this.container.querySelector('#note-input-visual');
    const modeButtons = this.container.querySelectorAll('.mode-btn');
    
    if (visual) {
      visual.innerHTML = this.renderVisualInput();
    }
    
    modeButtons.forEach(btn => {
      const mode = btn.getAttribute('data-mode');
      if (mode === this.state.visualMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Update voicings display
  private updateVoicingsDisplay(): void {
    const voicingsSection = this.container.querySelector('#voicings-section');
    if (voicingsSection && this.state.activeChord) {
      const voicings = generateChordVoicings(this.state.activeChord, this.state.selectedInstrument);
      const voicingsGrid = voicingsSection.querySelector('.voicings-grid');
      if (voicingsGrid) {
        voicingsGrid.innerHTML = voicings.map(voicing => `
          <div class="voicing-card">
            <div class="voicing-header">
              <span class="voicing-name">${voicing.name}</span>
              <span class="voicing-difficulty ${voicing.difficulty}">${voicing.difficulty}</span>
            </div>
            <div class="voicing-notes">
              ${voicing.notes.map(note => `<span class="voicing-note">${note}</span>`).join('')}
            </div>
            ${voicing.fingering ? `<div class="voicing-fingering">${voicing.fingering}</div>` : ''}
          </div>
        `).join('');
      }
    }
  }

  // Attach event listeners
  private attachEventListeners(): void {
    // Delegated event handling
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Note selection (keyboard or buttons)
      if (target.closest('.key') || target.classList.contains('note-btn')) {
        const noteElement = target.closest('.key') || target;
        const note = noteElement.getAttribute('data-note') as Note;
        if (note) {
          this.toggleNote(note);
        }
      }
      
      // Visual mode selection
      if (target.classList.contains('mode-btn')) {
        const mode = target.getAttribute('data-mode') as 'keyboard' | 'note-selector';
        this.setVisualMode(mode);
      }
      
      // Clear notes
      if (target.classList.contains('clear-notes-btn')) {
        this.clearNotes();
      }
      
      // Chord result selection
      if (target.closest('.chord-result-card')) {
        const card = target.closest('.chord-result-card') as HTMLElement;
        const chordIndex = parseInt(card.getAttribute('data-chord-index') || '0');
        const chord = this.state.identifiedChords[chordIndex];
        if (chord) {
          this.selectChord(chord);
        }
      }
      
      // Toggle inversions
      if (target.classList.contains('toggle-inversions-btn')) {
        this.toggleInversions();
      }
      
      // Toggle voicings
      if (target.classList.contains('toggle-voicings-btn')) {
        this.toggleVoicings();
      }
    });
    
    // Instrument selection
    this.container.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.id === 'instrument-select') {
        this.setInstrument(target.value as 'piano' | 'guitar');
      }
    });
  }
}

// Factory function for easy initialization
export function createChordFinder(container: HTMLElement): ChordFinder {
  return new ChordFinder(container);
}
