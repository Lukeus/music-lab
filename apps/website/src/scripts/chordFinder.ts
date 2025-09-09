// Client-side Chord Finder implementation
// Integrates with the music-tools package ChordFinder class

import {
    ChordFinder,
    createChordFinder,
    ChordIdentification,
    Note,
} from '@lukeus/music-tools';

export function createWebChordFinder(container: HTMLElement): ChordFinder {
    const chordFinder = createChordFinder(container);

    // Set up analytics and URL state management
    chordFinder.on('notesChange', (notes: Note[]) => {
        updateUrlState(notes);

        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'chord_finder_notes_change', {
                event_category: 'Music Tools',
                event_label: `${notes.length} notes selected`,
                value: notes.length,
            });
        }
    });

    chordFinder.on('chordIdentify', (chords: ChordIdentification[]) => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'chord_finder_identify', {
                event_category: 'Music Tools',
                event_label: `${chords.length} chords found`,
                value: chords.length,
            });
        }
    });

    chordFinder.on('chordSelect', (chord: ChordIdentification) => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'chord_finder_select', {
                event_category: 'Music Tools',
                event_label: chord.name,
                value: 1,
            });
        }
    });

    chordFinder.on('instrumentChange', (instrument: 'piano' | 'guitar') => {
        localStorage.setItem('chordFinderInstrument', instrument);

        if (typeof gtag !== 'undefined') {
            gtag('event', 'chord_finder_instrument_change', {
                event_category: 'Music Tools',
                event_label: instrument,
            });
        }
    });

    return chordFinder;
}

function updateUrlState(notes: Note[]): void {
    if (notes.length === 0) {
        const url = new URL(window.location.href);
        url.searchParams.delete('notes');
        window.history.replaceState({}, '', url.toString());
        return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('notes', notes.join(','));
    window.history.replaceState({}, '', url.toString());
}

class ChordFinderClient {
    private chordFinder: ChordFinder | null = null;
    private container: HTMLElement | null = null;
    private isInitialized: boolean = false;

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () =>
                this.initializeChordFinder()
            );
        } else {
            this.initializeChordFinder();
        }
    }

    private initializeChordFinder(): void {
        this.container = document.getElementById('chord-finder-container');

        if (!this.container) {
            console.warn(
                'ChordFinder: Container element #chord-finder-container not found'
            );
            return;
        }

        try {
            // Create ChordFinder instance
            this.chordFinder = createChordFinder(this.container);

            // Set up event callbacks
            this.setupEventCallbacks();

            // Initialize the UI
            this.chordFinder.init();

            // Store reference globally for debugging
            window.chordFinder = this.chordFinder;

            this.isInitialized = true;
            console.log('ChordFinder initialized successfully');

            // Dispatch initialization event
            this.container.dispatchEvent(
                new CustomEvent('chordFinderReady', {
                    detail: { chordFinder: this.chordFinder },
                })
            );
        } catch (error) {
            console.error('Failed to initialize ChordFinder:', error);
            this.showError(
                'Failed to load Chord Finder. Please refresh the page.'
            );
        }
    }

    private setupEventCallbacks(): void {
        if (!this.chordFinder) return;

        // Handle note selection changes
        this.chordFinder.on('notesChange', (notes: Note[]) => {
            this.handleNotesChange(notes);
        });

        // Handle chord identification
        this.chordFinder.on(
            'chordIdentify',
            (chords: ChordIdentification[]) => {
                this.handleChordIdentification(chords);
            }
        );

        // Handle chord selection
        this.chordFinder.on('chordSelect', (chord: ChordIdentification) => {
            this.handleChordSelection(chord);
        });

        // Handle instrument changes
        this.chordFinder.on(
            'instrumentChange',
            (instrument: 'piano' | 'guitar') => {
                this.handleInstrumentChange(instrument);
            }
        );
    }

    private handleNotesChange(notes: Note[]): void {
        // Update URL with selected notes for sharing
        this.updateUrlState(notes);

        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'chord_finder_notes_change', {
                event_category: 'Music Tools',
                event_label: `${notes.length} notes selected`,
                value: notes.length,
            });
        }

        // Dispatch custom event for potential integrations
        if (this.container) {
            this.container.dispatchEvent(
                new CustomEvent('notesChanged', {
                    detail: { notes },
                })
            );
        }
    }

    private handleChordIdentification(chords: ChordIdentification[]): void {
        // Track chord identification analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'chord_finder_identify', {
                event_category: 'Music Tools',
                event_label: `${chords.length} chords found`,
                value: chords.length,
            });
        }

        // Log identified chords for debugging
        console.log(
            'Chords identified:',
            chords.map(c => c.name)
        );

        // Dispatch custom event
        if (this.container) {
            this.container.dispatchEvent(
                new CustomEvent('chordsIdentified', {
                    detail: { chords },
                })
            );
        }
    }

    private handleChordSelection(chord: ChordIdentification): void {
        // Track chord selection analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'chord_finder_select', {
                event_category: 'Music Tools',
                event_label: chord.name,
                value: 1,
            });
        }

        console.log('Chord selected:', chord.name);

        // Dispatch custom event
        if (this.container) {
            this.container.dispatchEvent(
                new CustomEvent('chordSelected', {
                    detail: { chord },
                })
            );
        }
    }

    private handleInstrumentChange(instrument: 'piano' | 'guitar'): void {
        // Track instrument preference
        localStorage.setItem('chordFinderInstrument', instrument);

        if (typeof gtag !== 'undefined') {
            gtag('event', 'chord_finder_instrument_change', {
                event_category: 'Music Tools',
                event_label: instrument,
            });
        }

        console.log('Instrument changed to:', instrument);
    }

    private updateUrlState(notes: Note[]): void {
        if (notes.length === 0) {
            // Clear URL parameters when no notes selected
            const url = new URL(window.location.href);
            url.searchParams.delete('notes');
            window.history.replaceState({}, '', url.toString());
            return;
        }

        // Update URL with current notes for sharing
        const url = new URL(window.location.href);
        url.searchParams.set('notes', notes.join(','));
        window.history.replaceState({}, '', url.toString());
    }

    private loadFromUrlState(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const notesParam = urlParams.get('notes');

        if (notesParam && this.chordFinder) {
            const notes = notesParam
                .split(',')
                .filter(note =>
                    [
                        'C',
                        'C#',
                        'D',
                        'D#',
                        'E',
                        'F',
                        'F#',
                        'G',
                        'G#',
                        'A',
                        'A#',
                        'B',
                    ].includes(note)
                ) as Note[];

            // Set notes from URL
            notes.forEach(note => this.chordFinder?.toggleNote(note));

            console.log('Loaded notes from URL:', notes);
        }
    }

    private loadPreferences(): void {
        if (!this.chordFinder) return;

        // Load saved instrument preference
        const savedInstrument = localStorage.getItem(
            'chordFinderInstrument'
        ) as 'piano' | 'guitar';
        if (savedInstrument && ['piano', 'guitar'].includes(savedInstrument)) {
            this.chordFinder.setInstrument(savedInstrument);
        }
    }

    private showError(message: string): void {
        if (this.container) {
            this.container.innerHTML = `
        <div class="chord-finder-error">
          <div class="error-icon">⚠️</div>
          <h3>Chord Finder Error</h3>
          <p>${message}</p>
          <button onclick="location.reload()" class="retry-button">
            🔄 Retry
          </button>
        </div>
      `;
        }
    }

    // Public API methods
    public getChordFinder(): ChordFinder | null {
        return this.chordFinder;
    }

    public isReady(): boolean {
        return this.isInitialized && this.chordFinder !== null;
    }

    public reset(): void {
        if (this.chordFinder) {
            this.chordFinder.clearNotes();
        }
    }

    // Static methods for integration
    public static getInstance(): ChordFinderClient {
        if (!window.chordFinderClient) {
            window.chordFinderClient = new ChordFinderClient();
        }
        return window.chordFinderClient;
    }
}

// Global interface extension
declare global {
    interface Window {
        chordFinderClient?: ChordFinderClient;
    }
}

// Export for module usage
export default ChordFinderClient;
