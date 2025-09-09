// Shared Help Panel System
// Provides consistent help panel functionality across all music tools

export interface HelpPanelConfig {
    toggleId: string;
    panelId: string;
    overlayId: string;
    closeId: string;
}

export class HelpPanelManager {
    private config: HelpPanelConfig;
    private helpToggle: HTMLElement | null = null;
    private helpPanel: HTMLElement | null = null;
    private helpOverlay: HTMLElement | null = null;
    private helpClose: HTMLElement | null = null;
    private isOpen: boolean = false;

    constructor(config: HelpPanelConfig) {
        this.config = config;
    }

    public init(): void {
        this.findElements();
        this.attachEventListeners();
        console.log('Help panel initialized for tool');
    }

    private findElements(): void {
        this.helpToggle = document.getElementById(this.config.toggleId);
        this.helpPanel = document.getElementById(this.config.panelId);
        this.helpOverlay = document.getElementById(this.config.overlayId);
        this.helpClose = document.getElementById(this.config.closeId);

        if (
            !this.helpToggle ||
            !this.helpPanel ||
            !this.helpOverlay ||
            !this.helpClose
        ) {
            console.warn(
                'Help panel elements not found. Check IDs:',
                this.config
            );
        }
    }

    private attachEventListeners(): void {
        // Toggle button click
        this.helpToggle?.addEventListener('click', e => {
            e.preventDefault();
            this.openPanel();
        });

        // Close button click
        this.helpClose?.addEventListener('click', e => {
            e.preventDefault();
            this.closePanel();
        });

        // Overlay click to close
        this.helpOverlay?.addEventListener('click', () => {
            this.closePanel();
        });

        // Escape key to close
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closePanel();
            }
        });

        // Prevent panel clicks from closing
        this.helpPanel?.addEventListener('click', e => {
            e.stopPropagation();
        });
    }

    public openPanel(): void {
        if (this.isOpen) return;

        this.helpPanel?.classList.add('active');
        this.helpOverlay?.classList.add('active');
        this.helpToggle?.setAttribute('aria-expanded', 'true');

        // Prevent body scroll when panel is open
        document.body.style.overflow = 'hidden';

        this.isOpen = true;

        // Track analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'help_panel_open', {
                event_category: 'User Interface',
                event_label: 'Help Panel Opened',
            });
        }

        console.log('Help panel opened');
    }

    public closePanel(): void {
        if (!this.isOpen) return;

        this.helpPanel?.classList.remove('active');
        this.helpOverlay?.classList.remove('active');
        this.helpToggle?.setAttribute('aria-expanded', 'false');

        // Restore body scroll
        document.body.style.overflow = '';

        this.isOpen = false;

        console.log('Help panel closed');
    }

    public toggle(): void {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    public isVisible(): boolean {
        return this.isOpen;
    }

    // Method to update help content dynamically if needed
    public updateContent(content: string): void {
        const contentEl = this.helpPanel?.querySelector('.help-panel-content');
        if (contentEl) {
            contentEl.innerHTML = content;
        }
    }

    // Cleanup method for proper disposal
    public destroy(): void {
        // Remove all event listeners
        this.helpToggle?.removeEventListener('click', this.openPanel);
        this.helpClose?.removeEventListener('click', this.closePanel);
        this.helpOverlay?.removeEventListener('click', this.closePanel);

        // Reset body overflow if panel was open
        if (this.isOpen) {
            document.body.style.overflow = '';
        }

        console.log('Help panel destroyed');
    }
}

// Factory function for easy initialization
export function createHelpPanel(
    config?: Partial<HelpPanelConfig>
): HelpPanelManager {
    const defaultConfig: HelpPanelConfig = {
        toggleId: 'help-toggle',
        panelId: 'help-panel',
        overlayId: 'help-overlay',
        closeId: 'help-close',
    };

    const finalConfig = { ...defaultConfig, ...config };
    return new HelpPanelManager(finalConfig);
}

// Auto-initialize if elements are found on page load
export function autoInitHelpPanel(): void {
    document.addEventListener('DOMContentLoaded', () => {
        const helpToggle = document.getElementById('help-toggle');
        if (helpToggle) {
            const helpPanel = createHelpPanel();
            helpPanel.init();

            // Store reference globally for debugging
            (window as any).helpPanel = helpPanel;
        }
    });
}

// Global type declarations
declare global {
    interface Window {
        helpPanel?: HelpPanelManager;
        gtag?: (...args: any[]) => void;
    }
}
