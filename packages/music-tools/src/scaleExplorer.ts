// Scale Explorer - Interactive Scale Discovery Tool

import { 
  Note, 
  Scale, 
  ScaleType,
  ScaleCategory,
  generateScale, 
  getAllScalesForRoot, 
  getScalesByCategory,
  findScalesContainingNotes,
  NOTES,
  SCALE_INFO
} from './theory.js';

export interface ScaleExplorerState {
  currentScale: Scale;
  selectedNotes: Note[];
  activeCategory: ScaleCategory | 'all';
  showIntervals: boolean;
  showRelatedChords: boolean;
  visualMode: 'keyboard' | 'fretboard' | 'circle';
}

export class ScaleExplorer {
  private state: ScaleExplorerState;
  private container: HTMLElement;
  private callbacks: {
    onScaleChange?: (scale: Scale) => void;
    onNoteSelect?: (note: Note) => void;
    onCategoryChange?: (category: ScaleCategory | 'all') => void;
    onVisualModeChange?: (mode: 'keyboard' | 'fretboard' | 'circle') => void;
  } = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      currentScale: generateScale('C', 'major'),
      selectedNotes: [],
      activeCategory: 'all',
      showIntervals: true,
      showRelatedChords: true,
      visualMode: 'keyboard'
    };
  }

  // Initialize the Scale Explorer UI
  public init(): void {
    this.render();
    this.attachEventListeners();
  }

  // Set callbacks for interactions
  public on(event: 'scaleChange', callback: (scale: Scale) => void): void;
  public on(event: 'noteSelect', callback: (note: Note) => void): void;
  public on(event: 'categoryChange', callback: (category: ScaleCategory | 'all') => void): void;
  public on(event: 'visualModeChange', callback: (mode: 'keyboard' | 'fretboard' | 'circle') => void): void;
  public on(event: string, callback: Function): void {
    this.callbacks[event as keyof typeof this.callbacks] = callback as any;
  }

  // Change the current scale
  public setScale(root: Note, scaleType: ScaleType): void {
    const newScale = generateScale(root, scaleType);
    this.state.currentScale = newScale;
    this.state.selectedNotes = [];
    
    this.updateScaleDisplay();
    this.updateVisualDisplay();
    this.updateRelatedInfo();
    
    this.callbacks.onScaleChange?.(newScale);
  }

  // Set scale category filter
  public setCategory(category: ScaleCategory | 'all'): void {
    this.state.activeCategory = category;
    this.updateScaleSelector();
    this.callbacks.onCategoryChange?.(category);
  }

  // Toggle note selection (for finding scales that contain selected notes)
  public toggleNote(note: Note): void {
    const existingIndex = this.state.selectedNotes.indexOf(note);
    
    if (existingIndex >= 0) {
      this.state.selectedNotes.splice(existingIndex, 1);
    } else {
      this.state.selectedNotes.push(note);
    }
    
    this.updateNoteSelector();
    this.updateSuggestions();
    this.callbacks.onNoteSelect?.(note);
  }

  // Set visual display mode
  public setVisualMode(mode: 'keyboard' | 'fretboard' | 'circle'): void {
    this.state.visualMode = mode;
    this.updateVisualDisplay();
    this.callbacks.onVisualModeChange?.(mode);
  }

  // Toggle interval display
  public toggleIntervals(): void {
    this.state.showIntervals = !this.state.showIntervals;
    this.updateVisualDisplay();
  }

  // Toggle related chords display
  public toggleRelatedChords(): void {
    this.state.showRelatedChords = !this.state.showRelatedChords;
    this.updateRelatedInfo();
  }

  // Find scales containing selected notes
  public findScalesWithNotes(): Scale[] {
    if (this.state.selectedNotes.length === 0) return [];
    return findScalesContainingNotes(this.state.selectedNotes);
  }

  // Get current state (useful for parent components)
  public getState(): ScaleExplorerState {
    return { ...this.state };
  }

  // Render the complete UI
  private render(): void {
    this.container.innerHTML = `
      <div class="scale-explorer">
        <div class="scale-explorer-header">
          <h2 class="scale-explorer-title">
            <span class="tool-icon">🎼</span>
            Scale Explorer
          </h2>
          <p class="scale-explorer-description">
            Discover scales, modes, and their musical relationships
          </p>
        </div>

        <div class="scale-explorer-content">
          <!-- Scale Selector Section -->
          <div class="scale-selector-section">
            <h3>Choose Your Scale</h3>
            <div class="scale-controls">
              <div class="root-selector">
                <label for="scale-root">Root Note:</label>
                <select id="scale-root" class="scale-select">
                  ${NOTES.map(note => `
                    <option value="${note}" ${note === 'C' ? 'selected' : ''}>${note}</option>
                  `).join('')}
                </select>
              </div>
              <div class="category-selector">
                <label for="scale-category">Category:</label>
                <select id="scale-category" class="scale-select">
                  <option value="all">All Scales</option>
                  <option value="modes">Modes</option>
                  <option value="pentatonic">Pentatonic</option>
                  <option value="blues">Blues</option>
                  <option value="minor-variations">Minor Variations</option>
                  <option value="exotic">Exotic</option>
                </select>
              </div>
              <div class="scale-type-selector">
                <label for="scale-type">Scale Type:</label>
                <select id="scale-type" class="scale-select">
                  ${this.renderScaleTypeOptions()}
                </select>
              </div>
            </div>
          </div>

          <!-- Current Scale Display -->
          <div class="current-scale-display">
            <div class="scale-info">
              <h4 class="current-scale-name">${this.state.currentScale.name}</h4>
              <p class="scale-description">${this.state.currentScale.description}</p>
            </div>
          </div>

          <!-- Visual Display Controls -->
          <div class="visual-controls">
            <div class="visual-mode-selector">
              <label>Visual Mode:</label>
              <div class="visual-mode-buttons">
                <button class="visual-mode-btn active" data-mode="keyboard">🎹 Keyboard</button>
                <button class="visual-mode-btn" data-mode="fretboard">🎸 Fretboard</button>
                <button class="visual-mode-btn" data-mode="circle">⭕ Circle</button>
              </div>
            </div>
            <div class="display-toggles">
              <button class="toggle-intervals-btn" data-show-intervals="${this.state.showIntervals}">
                ${this.state.showIntervals ? '🎵' : '📊'} ${this.state.showIntervals ? 'Hide' : 'Show'} Intervals
              </button>
              <button class="toggle-chords-btn" data-show-chords="${this.state.showRelatedChords}">
                ${this.state.showRelatedChords ? '🎹' : '🔗'} ${this.state.showRelatedChords ? 'Hide' : 'Show'} Chords
              </button>
            </div>
          </div>

          <!-- Visual Scale Display -->
          <div class="scale-visual-display">
            <div id="scale-visual" class="scale-visual ${this.state.visualMode}">
              ${this.renderVisualDisplay()}
            </div>
          </div>

          <!-- Scale Information -->
          <div class="scale-info-section">
            <div class="scale-notes">
              <h4>Scale Notes</h4>
              <div class="notes-display">
                ${this.state.currentScale.notes.map((note, index) => `
                  <div class="scale-note-item">
                    <span class="note-name">${note}</span>
                    ${this.state.showIntervals ? `
                      <span class="note-interval">${this.getIntervalName(index)}</span>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            
            ${this.state.showRelatedChords ? `
              <div class="related-chords">
                <h4>Related Chords</h4>
                <div class="chords-list">
                  ${this.state.currentScale.relatedChords?.map(chord => `
                    <span class="related-chord">${chord}</span>
                  `).join('') || '<span class="no-chords">No specific chord suggestions</span>'}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Note Finder Section -->
          <div class="note-finder-section">
            <h3>Find Scales by Notes</h3>
            <p class="finder-description">Select notes to find scales that contain them:</p>
            <div class="note-selector">
              ${NOTES.map(note => `
                <button class="note-btn" data-note="${note}">${note}</button>
              `).join('')}
            </div>
            <div class="scale-suggestions" id="scale-suggestions">
              <div class="empty-state">
                <span class="empty-icon">🔍</span>
                <p>Select notes above to find matching scales</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render scale type options based on current category
  private renderScaleTypeOptions(): string {
    const scaleTypes = this.state.activeCategory === 'all' 
      ? Object.keys(SCALE_INFO) 
      : getScalesByCategory(this.state.activeCategory);
    
    return scaleTypes.map(scaleType => {
      const isSelected = scaleType === this.state.currentScale.type;
      const scaleName = scaleType.replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      return `<option value="${scaleType}" ${isSelected ? 'selected' : ''}>${scaleName}</option>`;
    }).join('');
  }

  // Render the visual display based on current mode
  private renderVisualDisplay(): string {
    switch (this.state.visualMode) {
      case 'keyboard':
        return this.renderKeyboard();
      case 'fretboard':
        return this.renderFretboard();
      case 'circle':
        return this.renderCircle();
      default:
        return this.renderKeyboard();
    }
  }

  // Render piano keyboard visualization
  private renderKeyboard(): string {
    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
    
    const whiteKeysHtml = whiteKeys.map(note => {
      const isInScale = this.state.currentScale.notes.includes(note as Note);
      const isRoot = note === this.state.currentScale.root;
      return `
        <div class="key white-key ${isInScale ? 'in-scale' : ''} ${isRoot ? 'root-note' : ''}" 
             data-note="${note}">
          <span class="key-label">${note}</span>
        </div>
      `;
    }).join('');
    
    const blackKeysHtml = blackKeys.map(note => {
      const isInScale = this.state.currentScale.notes.includes(note as Note);
      const isRoot = note === this.state.currentScale.root;
      return `
        <div class="key black-key ${isInScale ? 'in-scale' : ''} ${isRoot ? 'root-note' : ''}" 
             data-note="${note}">
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

  // Render fretboard visualization (simplified)
  private renderFretboard(): string {
    const frets = Array.from({ length: 13 }, (_, i) => i); // 0-12 frets
    const strings = ['E', 'A', 'D', 'G', 'B', 'E']; // Standard tuning
    
    return `
      <div class="fretboard">
        ${strings.map((stringNote, stringIndex) => `
          <div class="string" data-string="${stringIndex}">
            ${frets.map(fret => {
              const noteIndex = (NOTES.indexOf(stringNote as Note) + fret) % 12;
              const note = NOTES[noteIndex];
              const isInScale = this.state.currentScale.notes.includes(note);
              const isRoot = note === this.state.currentScale.root;
              
              return `
                <div class="fret ${isInScale ? 'in-scale' : ''} ${isRoot ? 'root-note' : ''}" 
                     data-note="${note}" data-fret="${fret}">
                  <span class="fret-note">${note}</span>
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render circle of fifths visualization
  private renderCircle(): string {
    const circleNotes = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
    
    return `
      <div class="circle-of-notes">
        <svg viewBox="0 0 200 200" class="circle-svg">
          <circle cx="100" cy="100" r="80" class="circle-outline" />
          ${circleNotes.map((note, index) => {
            const angle = (index * 30) - 90; // Start at top (12 o'clock)
            const radian = (angle * Math.PI) / 180;
            const x = 100 + 70 * Math.cos(radian);
            const y = 100 + 70 * Math.sin(radian);
            
            const isInScale = this.state.currentScale.notes.includes(note as Note);
            const isRoot = note === this.state.currentScale.root;
            
            return `
              <g class="circle-note ${isInScale ? 'in-scale' : ''} ${isRoot ? 'root-note' : ''}" 
                 data-note="${note}">
                <circle cx="${x}" cy="${y}" r="12" class="note-circle" />
                <text x="${x}" y="${y + 4}" text-anchor="middle" class="note-text">${note}</text>
              </g>
            `;
          }).join('')}
        </svg>
      </div>
    `;
  }

  // Get interval name for display
  private getIntervalName(index: number): string {
    const intervalNames = [
      'Root', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'
    ];
    const interval = this.state.currentScale.intervals[index];
    return intervalNames[interval] || '';
  }

  // Update scale display
  private updateScaleDisplay(): void {
    const nameEl = this.container.querySelector('.current-scale-name');
    const descEl = this.container.querySelector('.scale-description');
    
    if (nameEl) nameEl.textContent = this.state.currentScale.name;
    if (descEl) descEl.textContent = this.state.currentScale.description;
  }

  // Update visual display
  private updateVisualDisplay(): void {
    const visualEl = this.container.querySelector('#scale-visual');
    if (visualEl) {
      visualEl.className = `scale-visual ${this.state.visualMode}`;
      visualEl.innerHTML = this.renderVisualDisplay();
    }
  }

  // Update scale selector options
  private updateScaleSelector(): void {
    const scaleTypeSelect = this.container.querySelector('#scale-type') as HTMLSelectElement;
    if (scaleTypeSelect) {
      scaleTypeSelect.innerHTML = this.renderScaleTypeOptions();
    }
  }

  // Update note selector
  private updateNoteSelector(): void {
    const noteBtns = this.container.querySelectorAll('.note-btn');
    noteBtns.forEach(btn => {
      const note = btn.getAttribute('data-note') as Note;
      if (this.state.selectedNotes.includes(note)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  // Update related info display
  private updateRelatedInfo(): void {
    const notesDisplay = this.container.querySelector('.notes-display');
    const relatedChords = this.container.querySelector('.related-chords');
    
    if (notesDisplay) {
      notesDisplay.innerHTML = this.state.currentScale.notes.map((note, index) => `
        <div class="scale-note-item">
          <span class="note-name">${note}</span>
          ${this.state.showIntervals ? `
            <span class="note-interval">${this.getIntervalName(index)}</span>
          ` : ''}
        </div>
      `).join('');
    }
    
    if (relatedChords) {
      (relatedChords as HTMLElement).style.display = this.state.showRelatedChords ? 'block' : 'none';
    }
  }

  // Update scale suggestions
  private updateSuggestions(): void {
    const suggestionsEl = this.container.querySelector('#scale-suggestions');
    if (!suggestionsEl) return;
    
    if (this.state.selectedNotes.length === 0) {
      suggestionsEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>Select notes above to find matching scales</p>
        </div>
      `;
    } else {
      const matchingScales = this.findScalesWithNotes();
      if (matchingScales.length === 0) {
        suggestionsEl.innerHTML = `
          <div class="no-results">
            <span class="no-results-icon">❌</span>
            <p>No scales found containing: ${this.state.selectedNotes.join(', ')}</p>
          </div>
        `;
      } else {
        suggestionsEl.innerHTML = `
          <div class="suggestions-list">
            <h4>Matching Scales (${matchingScales.length}):</h4>
            <div class="scale-suggestions-grid">
              ${matchingScales.slice(0, 12).map(scale => `
                <button class="suggestion-btn" data-root="${scale.root}" data-type="${scale.type}">
                  <span class="suggestion-name">${scale.name}</span>
                  <span class="suggestion-category">${scale.category}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }
    }
  }

  // Attach event listeners
  private attachEventListeners(): void {
    // Scale selector changes
    const rootSelect = this.container.querySelector('#scale-root') as HTMLSelectElement;
    const categorySelect = this.container.querySelector('#scale-category') as HTMLSelectElement;
    const typeSelect = this.container.querySelector('#scale-type') as HTMLSelectElement;
    
    rootSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.setScale(target.value as Note, this.state.currentScale.type);
    });
    
    categorySelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.setCategory(target.value as ScaleCategory | 'all');
    });
    
    typeSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.setScale(this.state.currentScale.root, target.value as ScaleType);
    });
    
    // Delegated event handling
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Visual mode selection
      if (target.classList.contains('visual-mode-btn')) {
        this.container.querySelectorAll('.visual-mode-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        const mode = target.getAttribute('data-mode') as 'keyboard' | 'fretboard' | 'circle';
        this.setVisualMode(mode);
      }
      
      // Toggle buttons
      if (target.classList.contains('toggle-intervals-btn')) {
        this.toggleIntervals();
        target.textContent = `${this.state.showIntervals ? '🎵' : '📊'} ${this.state.showIntervals ? 'Hide' : 'Show'} Intervals`;
      }
      
      if (target.classList.contains('toggle-chords-btn')) {
        this.toggleRelatedChords();
        target.textContent = `${this.state.showRelatedChords ? '🎹' : '🔗'} ${this.state.showRelatedChords ? 'Hide' : 'Show'} Chords`;
      }
      
      // Note selection for finder
      if (target.classList.contains('note-btn')) {
        const note = target.getAttribute('data-note') as Note;
        this.toggleNote(note);
      }
      
      // Scale suggestions
      if (target.closest('.suggestion-btn')) {
        const btn = target.closest('.suggestion-btn') as HTMLElement;
        const root = btn.getAttribute('data-root') as Note;
        const type = btn.getAttribute('data-type') as ScaleType;
        this.setScale(root, type);
      }
    });
  }
}

// Factory function for easy initialization
export function createScaleExplorer(container: HTMLElement): ScaleExplorer {
  return new ScaleExplorer(container);
}
