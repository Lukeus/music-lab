/**
 * Music-themed animated tooltip system
 * Provides intelligent positioning, music theory content, and smooth animations
 */

export interface TooltipConfig {
    content: string;
    type?:
        | 'musical'
        | 'chord'
        | 'scale'
        | 'note'
        | 'nav'
        | 'audio'
        | 'drum'
        | 'wave';
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    delay?: number;
    duration?: number;
    multiLine?: boolean;
    frequency?: string; // For note tooltips
    shortcut?: string; // For keyboard shortcuts
}

export interface MusicTooltipData {
    title?: string;
    description?: string;
    frequency?: string;
    shortcut?: string;
    chordTones?: string[];
    scaleNotes?: string[];
}

class TooltipManager {
    private tooltips: Map<HTMLElement, HTMLElement> = new Map();
    private currentTooltip: HTMLElement | null = null;
    private showTimeout: number | null = null;
    private hideTimeout: number | null = null;
    private audioContext: AudioContext | null = null;
    private audioEnabled = false; // Disabled to prevent beep sounds

    constructor() {
        this.bindEvents();
        this.initAudio();
    }

    /**
     * Initialize tooltip system
     */
    init(): void {
        // Clean up any existing tooltips
        this.cleanup();

        // Auto-detect tooltip triggers
        this.autoDetectTooltips();
    }

    /**
     * Add tooltip to an element
     */
    addTooltip(element: HTMLElement, config: TooltipConfig): void {
        // Remove existing tooltip if present
        this.removeTooltip(element);

        // Create tooltip element
        const tooltip = this.createTooltip(config);
        this.tooltips.set(element, tooltip);

        // Add event listeners
        element.addEventListener('mouseenter', () =>
            this.showTooltip(element, tooltip)
        );
        element.addEventListener('mouseleave', () => this.hideTooltip(tooltip));
        element.addEventListener('focus', () =>
            this.showTooltip(element, tooltip)
        );
        element.addEventListener('blur', () => this.hideTooltip(tooltip));
    }

    /**
     * Remove tooltip from element
     */
    removeTooltip(element: HTMLElement): void {
        const tooltip = this.tooltips.get(element);
        if (tooltip) {
            tooltip.remove();
            this.tooltips.delete(element);
        }
    }

    /**
     * Create tooltip element with music-themed styling
     */
    private createTooltip(config: TooltipConfig): HTMLElement {
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip ${config.type || 'musical'}`;

        if (config.multiLine) {
            tooltip.classList.add('multi-line');
        }

        // Parse content for structured data
        const data = this.parseTooltipContent(config.content);

        let html = '';

        if (data.title) {
            html += `<div class="tooltip-title">${data.title}</div>`;
        }

        if (data.description) {
            html += `<div class="tooltip-description">${data.description}</div>`;
        }

        if (data.frequency) {
            html += `<div class="tooltip-frequency">${data.frequency}</div>`;
        }

        if (data.shortcut) {
            html += `<div class="tooltip-shortcut">Press ${data.shortcut}</div>`;
        }

        if (data.chordTones && data.chordTones.length > 0) {
            html += `<div class="tooltip-description">Notes: ${data.chordTones.join(', ')}</div>`;
        }

        if (data.scaleNotes && data.scaleNotes.length > 0) {
            html += `<div class="tooltip-description">Scale: ${data.scaleNotes.join(' - ')}</div>`;
        }

        // If no structured content, use raw content
        if (!html) {
            html = config.content;
        }

        tooltip.innerHTML = html;

        // Ensure clean initial state
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '10000';
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.display = 'block';

        document.body.appendChild(tooltip);

        return tooltip;
    }

    /**
     * Parse tooltip content for structured music data
     */
    private parseTooltipContent(content: string): MusicTooltipData {
        const data: MusicTooltipData = {};

        // Try to parse JSON-like content
        try {
            const parsed = JSON.parse(content);
            return { ...data, ...parsed };
        } catch {
            // Not JSON, parse as plain text with special markers
        }

        // Parse special markers in content
        const lines = content.split('\n');

        lines.forEach(line => {
            if (line.startsWith('TITLE:')) {
                data.title = line.replace('TITLE:', '').trim();
            } else if (line.startsWith('DESC:')) {
                data.description = line.replace('DESC:', '').trim();
            } else if (line.startsWith('FREQ:')) {
                data.frequency = line.replace('FREQ:', '').trim();
            } else if (line.startsWith('KEY:')) {
                data.shortcut = line.replace('KEY:', '').trim();
            } else if (line.startsWith('CHORD:')) {
                data.chordTones = line
                    .replace('CHORD:', '')
                    .trim()
                    .split(',')
                    .map(s => s.trim());
            } else if (line.startsWith('SCALE:')) {
                data.scaleNotes = line
                    .replace('SCALE:', '')
                    .trim()
                    .split(',')
                    .map(s => s.trim());
            } else if (!data.description && line.trim()) {
                // Use first line as description if no explicit description
                data.description = line.trim();
            }
        });

        return data;
    }

    /**
     * Show tooltip with intelligent positioning
     */
    private showTooltip(trigger: HTMLElement, tooltip: HTMLElement): void {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        this.showTimeout = window.setTimeout(() => {
            // IMPORTANT: Hide ALL existing tooltips first to prevent overlap
            this.hideAllTooltips();

            // Position tooltip first
            this.positionTooltip(trigger, tooltip);

            // Force show with inline styles to override any CSS issues
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
            tooltip.style.display = 'block';
            tooltip.style.pointerEvents = 'none';

            // Also add the show class
            tooltip.classList.add('show');
            this.currentTooltip = tooltip;

            // Play subtle audio feedback
            const tooltipType =
                tooltip.className.match(/tooltip\s+(\w+)/)?.[1] || 'musical';
            this.playTooltipSound(tooltipType);
        }, 100); // Reduced delay for testing
    }

    /**
     * Hide tooltip
     */
    private hideTooltip(tooltip: HTMLElement): void {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }

        this.hideTimeout = window.setTimeout(() => {
            tooltip.classList.remove('show');
            if (this.currentTooltip === tooltip) {
                this.currentTooltip = null;
            }

            // Ensure tooltip is fully hidden after transition
            setTimeout(() => {
                if (!tooltip.classList.contains('show')) {
                    tooltip.style.visibility = 'hidden';
                }
            }, 300);
        }, 100);
    }

    /**
     * Hide all visible tooltips to prevent overlap
     */
    private hideAllTooltips(): void {
        // Clear any existing timeouts
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Hide current tooltip if exists
        if (this.currentTooltip) {
            this.currentTooltip.classList.remove('show');
            this.currentTooltip.style.visibility = 'hidden';
            this.currentTooltip.style.opacity = '0';
            this.currentTooltip = null;
        }

        // Hide all tooltips in the DOM as a safety measure
        document.querySelectorAll('.tooltip').forEach(tooltip => {
            if (tooltip instanceof HTMLElement) {
                tooltip.classList.remove('show');
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            }
        });
    }

    /**
     * Position tooltip intelligently based on viewport
     */
    private positionTooltip(trigger: HTMLElement, tooltip: HTMLElement): void {
        // Get trigger element position relative to viewport
        const rect = trigger.getBoundingClientRect();

        // Ensure tooltip has proper base styles
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '99999';
        tooltip.style.pointerEvents = 'none';

        // Calculate position - place above the trigger
        let x = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
        let y = rect.top - tooltip.offsetHeight - 10;
        let position = 'top';

        // If no room above, place below
        if (y < 10) {
            y = rect.bottom + 10;
            position = 'bottom';
        }

        // Keep within viewport horizontally
        if (x < 10) {
            x = 10;
        } else if (x + tooltip.offsetWidth > window.innerWidth - 10) {
            x = window.innerWidth - tooltip.offsetWidth - 10;
        }

        // Apply position
        tooltip.style.left = `${Math.round(x)}px`;
        tooltip.style.top = `${Math.round(y)}px`;

        // Add position class for arrow
        tooltip.className = tooltip.className.replace(
            /\b(top|bottom|left|right)\b/g,
            ''
        );
        tooltip.classList.add(position);
    }

    /**
     * Auto-detect elements that should have tooltips
     */
    private autoDetectTooltips(): void {
        // Piano keys with note tooltips
        document.querySelectorAll('.key[data-note]').forEach(key => {
            const note = key.getAttribute('data-note');
            if (note && key instanceof HTMLElement) {
                const isBlackKey = key.classList.contains('black-key');
                const frequency = this.getNoteFrequency(note);

                this.addTooltip(key, {
                    content: `TITLE:${note}\nDESC:${isBlackKey ? 'Sharp/Flat' : 'Natural'} note\nFREQ:${frequency}`,
                    type: 'note',
                    position: 'top',
                });
            }
        });

        // Navigation links
        document.querySelectorAll('a[href^="/tools"]').forEach(link => {
            if (link instanceof HTMLElement) {
                const text = link.textContent?.trim() || '';
                const href = link.getAttribute('href') || '';

                let description = '';
                if (href.includes('key-friend')) {
                    description =
                        'Explore chord progressions and key relationships';
                } else if (href.includes('scale-explorer')) {
                    description = 'Discover scales and their patterns';
                } else if (href.includes('chord-finder')) {
                    description = 'Identify chords from selected notes';
                } else if (href === '/tools') {
                    description = 'Browse all music tools and utilities';
                }

                if (description) {
                    this.addTooltip(link, {
                        content: `TITLE:${text}\nDESC:${description}`,
                        type: 'nav',
                        position: 'bottom',
                    });
                }
            }
        });

        // Play buttons
        document
            .querySelectorAll('.play-button, [data-audio]')
            .forEach(button => {
                if (button instanceof HTMLElement) {
                    const title =
                        button.getAttribute('title') || 'Audio Player';

                    this.addTooltip(button, {
                        content: `TITLE:${title}\nDESC:Click to play/pause audio\nKEY:Space`,
                        type: 'audio',
                        position: 'top',
                    });
                }
            });

        // Help buttons
        document
            .querySelectorAll('#help-toggle, .help-toggle')
            .forEach(button => {
                if (button instanceof HTMLElement) {
                    this.addTooltip(button, {
                        content: `TITLE:Help & Guide\nDESC:Get instructions and examples\nKEY:?`,
                        type: 'musical',
                        position: 'left',
                    });
                }
            });

        // Example buttons
        document
            .querySelectorAll('.example-chord, .example-progression')
            .forEach(button => {
                if (button instanceof HTMLElement) {
                    const text = button.textContent?.trim() || '';
                    const notes = button.getAttribute('data-notes') || '';

                    this.addTooltip(button, {
                        content: `TITLE:Try ${text}\nDESC:Click to load this example\nCHORD:${notes.split(',').join(', ')}`,
                        type: 'chord',
                        position: 'top',
                    });
                }
            });

        // Logo/brand elements
        document.querySelectorAll('.logo, #logo-text').forEach(logo => {
            if (logo instanceof HTMLElement) {
                this.addTooltip(logo, {
                    content: `TITLE:Music Lab\nDESC:Interactive music theory tools and audio experiments`,
                    type: 'musical',
                    position: 'bottom',
                });
            }
        });
    }

    /**
     * Get approximate frequency for a note
     */
    private getNoteFrequency(note: string): string {
        const frequencies: Record<string, number> = {
            C: 261.63,
            'C#': 277.18,
            D: 293.66,
            'D#': 311.13,
            E: 329.63,
            F: 349.23,
            'F#': 369.99,
            G: 392.0,
            'G#': 415.3,
            A: 440.0,
            'A#': 466.16,
            B: 493.88,
        };

        const freq = frequencies[note];
        return freq ? `${freq.toFixed(1)} Hz` : 'Unknown';
    }

    /**
     * Bind global events
     */
    private bindEvents(): void {
        // Hide tooltips on scroll
        window.addEventListener(
            'scroll',
            () => {
                this.hideAllTooltips();
            },
            { passive: true }
        );

        // Hide tooltips on window resize
        window.addEventListener('resize', () => {
            this.hideAllTooltips();
        });

        // Hide tooltips on escape key
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.hideAllTooltips();
            }
        });
    }

    /**
     * Initialize optional audio feedback
     */
    private initAudio(): void {
        // Audio feedback is disabled for tooltips to prevent beeping
        // Users can still get visual feedback from tooltips
        return;
    }

    /**
     * Play subtle audio feedback for tooltip interactions
     */
    private playTooltipSound(type: string): void {
        // Audio feedback is disabled for tooltips to prevent beeping sounds
        // Visual feedback is sufficient for tooltip interactions
        console.debug(`Tooltip sound disabled for type: ${type}`);
        return;
    }

    /**
     * Cleanup all tooltips
     */
    cleanup(): void {
        this.tooltips.forEach(tooltip => {
            tooltip.remove();
        });
        this.tooltips.clear();

        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        // Close audio context if it exists
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }

    /**
     * Update tooltip content dynamically
     */
    updateTooltip(
        element: HTMLElement,
        newConfig: Partial<TooltipConfig>
    ): void {
        const tooltip = this.tooltips.get(element);
        if (tooltip && newConfig.content) {
            const data = this.parseTooltipContent(newConfig.content);

            // Update content
            let html = '';
            if (data.title)
                html += `<div class="tooltip-title">${data.title}</div>`;
            if (data.description)
                html += `<div class="tooltip-description">${data.description}</div>`;
            if (data.frequency)
                html += `<div class="tooltip-frequency">${data.frequency}</div>`;
            if (data.shortcut)
                html += `<div class="tooltip-shortcut">Press ${data.shortcut}</div>`;

            if (!html) html = newConfig.content;
            tooltip.innerHTML = html;

            // Update type if provided
            if (newConfig.type) {
                tooltip.className = tooltip.className.replace(
                    /\b(musical|chord|scale|note|nav|audio|drum|wave)\b/g,
                    ''
                );
                tooltip.classList.add(newConfig.type);
            }
        }
    }
}

// Global instance
let tooltipManager: TooltipManager | null = null;

/**
 * Initialize the tooltip system
 */
export function initTooltips(): TooltipManager {
    if (!tooltipManager) {
        tooltipManager = new TooltipManager();
    }
    tooltipManager.init();
    return tooltipManager;
}

/**
 * Get the current tooltip manager instance
 */
export function getTooltipManager(): TooltipManager | null {
    return tooltipManager;
}

/**
 * Add a tooltip to an element (convenience function)
 */
export function addTooltip(element: HTMLElement, config: TooltipConfig): void {
    if (!tooltipManager) {
        tooltipManager = new TooltipManager();
    }
    tooltipManager.addTooltip(element, config);
}

/**
 * Music theory specific tooltip helpers
 */
export const MusicTooltips = {
    /**
     * Create chord tooltip content
     */
    chord(name: string, notes: string[], quality?: string): string {
        return `TITLE:${name}\nDESC:${quality || 'Chord'}\nCHORD:${notes.join(', ')}`;
    },

    /**
     * Create scale tooltip content
     */
    scale(name: string, notes: string[], description?: string): string {
        return `TITLE:${name} Scale\nDESC:${description || 'Musical scale'}\nSCALE:${notes.join(', ')}`;
    },

    /**
     * Create note tooltip content
     */
    note(note: string, frequency?: number, role?: string): string {
        const freq = frequency ? `FREQ:${frequency.toFixed(1)} Hz\n` : '';
        const desc = role ? `DESC:${role}` : `DESC:Musical note`;
        return `TITLE:${note}\n${desc}\n${freq}`.trim();
    },

    /**
     * Create navigation tooltip content
     */
    nav(title: string, description: string, shortcut?: string): string {
        const key = shortcut ? `KEY:${shortcut}\n` : '';
        return `TITLE:${title}\nDESC:${description}\n${key}`.trim();
    },
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Delay initialization to allow other scripts to set up first
    setTimeout(() => {
        initTooltips();
    }, 100);
});
