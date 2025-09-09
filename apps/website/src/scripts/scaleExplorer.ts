// Scale Explorer - Client-side implementation
// Imports the ScaleExplorer from the music-tools package

import {
    createScaleExplorer,
    Scale,
    Note,
    ScaleCategory,
} from '@lukeus/music-tools';

// Initialize Scale Explorer when DOM is loaded (auto-init if container exists)
export function initScaleExplorer(): void {
    document.addEventListener('DOMContentLoaded', () => {
        const containers = document.querySelectorAll('[data-scale-explorer]');
        containers.forEach(container => {
            if (container instanceof HTMLElement) {
                const scaleExplorer = createScaleExplorer(container);
                scaleExplorer.init();

                // Add any website-specific event handling here
                setupScaleExplorerCallbacks(scaleExplorer);
            }
        });
    });
}

// Factory function for manual initialization
export function createWebScaleExplorer(container: HTMLElement) {
    const scaleExplorer = createScaleExplorer(container);
    setupScaleExplorerCallbacks(scaleExplorer);
    return scaleExplorer;
}

// Set up website-specific callbacks and interactions
function setupScaleExplorerCallbacks(scaleExplorer: any) {
    // Scale change callback - add visual effects or logging
    scaleExplorer.on('scaleChange', (scale: Scale) => {
        console.log('🎼 Scale changed to:', scale.name);

        // Add subtle page animation when scale changes
        const body = document.body;
        body.style.transform = 'scale(1.001)';
        setTimeout(() => {
            body.style.transform = 'scale(1)';
        }, 200);

        // Update page title if we want to show current scale
        const currentTitle = document.title;
        if (!currentTitle.includes(' | ')) return;
        const baseTitle = currentTitle.split(' | ')[0];
        document.title = `${baseTitle} - ${scale.name} | ${currentTitle.split(' | ')[1]}`;
    });

    // Note selection callback
    scaleExplorer.on('noteSelect', (note: Note) => {
        console.log('🎵 Note selected:', note);

        // Could trigger audio playback here in the future
        // playNote(note);
    });

    // Category change callback
    scaleExplorer.on('categoryChange', (category: ScaleCategory | 'all') => {
        console.log('📁 Category changed to:', category);
    });

    // Visual mode change callback
    scaleExplorer.on(
        'visualModeChange',
        (mode: 'keyboard' | 'fretboard' | 'circle') => {
            console.log('👀 Visual mode changed to:', mode);

            // Add transition effects specific to the website
            const visualContainer = document.querySelector(
                '.scale-visual-display'
            );
            if (visualContainer) {
                visualContainer.classList.add('transitioning');
                setTimeout(() => {
                    visualContainer.classList.remove('transitioning');
                }, 300);
            }
        }
    );
}

// Auto-initialize if this script is loaded directly
initScaleExplorer();
