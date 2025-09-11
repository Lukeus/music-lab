// ===== CINEMATIC BACKGROUND PARTICLE SYSTEM =====

interface ParticleType {
    type: string;
    weight: number;
}

class CinematicParticleSystem {
    private container: HTMLElement | null;
    private cinematicBg: HTMLElement | null;
    private spotlight: HTMLElement | null;
    private particles: HTMLElement[] = [];
    private isActive: boolean = false;
    private audioIntensity: number = 0;
    private lastSpawnTime: number = 0;
    private animationId: number | null = null;
    private audioAnalysisSetup: boolean = false;
    private analyser: AnalyserNode | null = null;

    // Particle types with weights
    private particleTypes: ParticleType[] = [
        { type: 'musical-note', weight: 0.4 },
        { type: 'waveform', weight: 0.3 },
        { type: 'frequency-bar', weight: 0.2 },
        { type: 'dot', weight: 0.1 },
    ];

    constructor() {
        this.container = document.getElementById('particle-field');
        this.cinematicBg = document.getElementById('cinematic-bg');
        this.spotlight = document.getElementById('cinematic-spotlight');
        this.init();
    }

    private init(): void {
        if (!this.container) return;

        // Start the particle system
        this.isActive = true;
        this.startParticleGeneration();

        // Connect to existing audio analysis if available
        this.connectAudioAnalysis();

        // Handle page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Adjust intensity based on scroll position for cinematic effect
        this.setupScrollEffects();

        // Random dramatic moments
        this.scheduleRandomDramaticMoments();
    }

    private connectAudioAnalysis(): void {
        // Try to connect to the shared audio system from audio.ts
        // We'll check for the global audio instance periodically
        const checkForAudio = () => {
            // Look for the shared audio element (created in audio.ts)
            const audioElements = document.querySelectorAll('audio');
            if (audioElements.length > 0) {
                audioElements.forEach(audio => {
                    // Avoid double-binding
                    if (!((audio as HTMLAudioElement & { __cinematicBound?: boolean }).__cinematicBound)) {
                        (audio as HTMLAudioElement & { __cinematicBound?: boolean }).__cinematicBound = true;
                        audio.addEventListener('play', () =>
                            this.setAudioPlaying(true)
                        );
                        audio.addEventListener('pause', () =>
                            this.setAudioPlaying(false)
                        );
                        audio.addEventListener('ended', () =>
                            this.setAudioPlaying(false)
                        );

                        // Connect to audio analysis if available
                        audio.addEventListener('timeupdate', () =>
                            this.onAudioTimeUpdate(audio)
                        );
                    }
                });
            }

            // Try to access Web Audio API context from the global scope
            if (typeof window !== 'undefined' && (window as { audioCtx?: AudioContext }).audioCtx) {
                this.setupWebAudioAnalysis((window as { audioCtx?: AudioContext }).audioCtx!);
            }
        };

        // Check immediately and periodically
        checkForAudio();
        setInterval(checkForAudio, 2000); // Check every 2 seconds for new audio elements

        // Also listen for custom audio events that might be dispatched
        document.addEventListener('audioPlay', () =>
            this.setAudioPlaying(true)
        );
        document.addEventListener('audioPause', () =>
            this.setAudioPlaying(false)
        );
        document.addEventListener('audioStop', () =>
            this.setAudioPlaying(false)
        );
    }

    private setupWebAudioAnalysis(audioCtx: AudioContext): void {
        // This will be called if we can access the Web Audio context
        if (this.audioAnalysisSetup) return;
        this.audioAnalysisSetup = true;

        try {
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            this.analyser = analyser;
        } catch (e) {
            console.warn('Could not setup audio analysis:', e);
        }
    }

    private onAudioTimeUpdate(audio: HTMLAudioElement): void {
        if (!audio || audio.paused) {
            this.audioIntensity = 0;
            return;
        }

        // Try to get real audio analysis if available
        if (this.analyser) {
            try {
                const dataArray = new Uint8Array(
                    this.analyser.frequencyBinCount
                );
                this.analyser.getByteFrequencyData(dataArray);

                // Calculate average intensity from frequency data
                const sum = dataArray.reduce((acc, val) => acc + val, 0);
                const avgIntensity = sum / dataArray.length / 255; // normalize to 0-1

                this.audioIntensity = avgIntensity;
            } catch (_e) {
                // Fall back to fake intensity based on current time
                this.audioIntensity = this.calculateFakeIntensity(audio);
            }
        } else {
            // Fake intensity calculation based on audio playback
            this.audioIntensity = this.calculateFakeIntensity(audio);
        }

        this.updateIntensityClasses();

        // More particles during intense audio moments
        if (this.audioIntensity > 0.3) {
            this.spawnExtraParticles(Math.floor(this.audioIntensity * 3));
        }
    }

    private calculateFakeIntensity(audio: HTMLAudioElement): number {
        // Create fake intensity based on time progression
        // This creates a pseudo-random but consistent intensity pattern
        const time = audio.currentTime;
        const base = 0.2; // Minimum intensity
        const variation = 0.6; // Maximum additional intensity

        // Use sine waves of different frequencies to create realistic intensity
        const slow = Math.sin(time * 0.5) * 0.3;
        const medium = Math.sin(time * 1.2) * 0.2;
        const fast = Math.sin(time * 3) * 0.1;

        return Math.max(
            0,
            Math.min(1, base + variation * (slow + medium + fast))
        );
    }

    private updateIntensityClasses(): void {
        if (!this.cinematicBg) return;

        this.cinematicBg.classList.remove(
            'intensity-low',
            'intensity-medium',
            'intensity-high'
        );

        if (this.audioIntensity < 0.2) {
            this.cinematicBg.classList.add('intensity-low');
        } else if (this.audioIntensity < 0.6) {
            this.cinematicBg.classList.add('intensity-medium');
        } else {
            this.cinematicBg.classList.add('intensity-high');
        }
    }

    private setAudioPlaying(isPlaying: boolean): void {
        if (!this.cinematicBg) return;

        if (isPlaying) {
            this.cinematicBg.classList.add('audio-playing');
            this.increaseParticleRate();
        } else {
            this.cinematicBg.classList.remove('audio-playing');
            this.normalParticleRate();
        }
    }

    private setupScrollEffects(): void {
        // Use scroll position to vary background intensity
        const updateScrollEffect = () => {
            const scrollPercent =
                window.scrollY /
                (document.documentElement.scrollHeight - window.innerHeight);

            if (this.cinematicBg) {
                // Subtle intensity variation based on scroll
                const intensity =
                    0.5 + Math.sin(scrollPercent * Math.PI * 2) * 0.3;
                this.cinematicBg.style.setProperty(
                    '--scroll-intensity',
                    intensity.toString()
                );
            }
        };

        document.addEventListener('scroll', updateScrollEffect, {
            passive: true,
        });
    }

    private scheduleRandomDramaticMoments(): void {
        const scheduleNext = () => {
            // Random dramatic spotlight every 2-5 minutes
            const delay = (2 + Math.random() * 3) * 60 * 1000;
            setTimeout(() => {
                this.triggerDramaticMoment();
                scheduleNext();
            }, delay);
        };

        scheduleNext();
    }

    public triggerDramaticMoment(): void {
        if (!this.cinematicBg) return;

        this.cinematicBg.classList.add('dramatic');

        // Spawn burst of particles
        this.spawnParticleBurst(15);

        setTimeout(() => {
            if (this.cinematicBg) {
                this.cinematicBg.classList.remove('dramatic');
            }
        }, 8000);
    }

    private getWeightedRandomType(): string {
        const random = Math.random();
        let weightSum = 0;

        for (const { type, weight } of this.particleTypes) {
            weightSum += weight;
            if (random <= weightSum) {
                return type;
            }
        }

        return 'musical-note'; // fallback
    }

    private createParticle(): HTMLElement | null {
        if (!this.container) return null;

        const particle = document.createElement('div');
        particle.className = `particle ${this.getWeightedRandomType()}`;

        // Random starting position (bottom of screen)
        const startX = Math.random() * window.innerWidth;
        particle.style.left = `${startX}px`;
        particle.style.top = `${window.innerHeight + 20}px`;

        // Random animation delay and duration variation
        const delay = Math.random() * 2; // 0-2s delay
        const duration = 15 + Math.random() * 10; // 15-25s duration

        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;

        // Audio-reactive properties
        if (this.audioIntensity > 0.4) {
            particle.style.animationDuration = `${duration * 0.7}s`; // Faster during intense audio
            particle.style.filter = `brightness(${1 + this.audioIntensity})`;
        }

        // Random horizontal drift
        const drift = (Math.random() - 0.5) * 200; // -100 to +100px drift
        particle.style.setProperty('--drift', `${drift}px`);

        this.container.appendChild(particle);
        this.particles.push(particle);

        // Clean up after animation
        setTimeout(
            () => {
                if (particle && particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                    const index = this.particles.indexOf(particle);
                    if (index > -1) {
                        this.particles.splice(index, 1);
                    }
                }
            },
            (duration + delay) * 1000
        );

        return particle;
    }

    private spawnExtraParticles(count: number = 1): void {
        for (let i = 0; i < count; i++) {
            setTimeout(() => this.createParticle(), i * 100);
        }
    }

    public spawnParticleBurst(count: number = 10): void {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = this.createParticle();
                if (particle) {
                    // Make burst particles more dramatic
                    particle.style.filter =
                        'brightness(1.5) drop-shadow(0 0 6px currentColor)';
                    particle.style.animationDuration = '8s';
                }
            }, i * 50);
        }
    }

    private startParticleGeneration(): void {
        if (!this.isActive) return;

        const spawnParticle = () => {
            if (!this.isActive || document.hidden) {
                this.animationId = requestAnimationFrame(() => {
                    setTimeout(spawnParticle, 2000); // Check again in 2s
                });
                return;
            }

            // Base spawn rate: 1 particle every 1-3 seconds
            let baseDelay = 1000 + Math.random() * 2000;

            // Increase rate during audio playback
            if (
                this.cinematicBg &&
                this.cinematicBg.classList.contains('audio-playing')
            ) {
                baseDelay *= 0.4; // Much faster during audio

                // Even faster during high intensity
                if (this.audioIntensity > 0.5) {
                    baseDelay *= 0.6;
                }
            }

            this.createParticle();

            this.animationId = requestAnimationFrame(() => {
                setTimeout(spawnParticle, baseDelay);
            });
        };

        // Start spawning
        this.animationId = requestAnimationFrame(() => {
            setTimeout(spawnParticle, 1000);
        });
    }

    private increaseParticleRate(): void {
        // Called when audio starts - spawn immediate burst
        this.spawnParticleBurst(8);
    }

    private normalParticleRate(): void {
        // Return to normal rate when audio stops
        this.audioIntensity = 0;
        this.updateIntensityClasses();
    }

    public pause(): void {
        this.isActive = false;
        if (this.cinematicBg) {
            this.cinematicBg.style.animationPlayState = 'paused';
        }
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    public resume(): void {
        this.isActive = true;
        if (this.cinematicBg) {
            this.cinematicBg.style.animationPlayState = 'running';
        }
        this.startParticleGeneration();
    }

    public destroy(): void {
        this.isActive = false;
        if (this.container) {
            this.container.innerHTML = '';
        }
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.particles = [];
    }
}

// Global particle system instance
let cinematicSystem: CinematicParticleSystem | null = null;

export function initCinematicBackground(): void {
    if (cinematicSystem) return; // Avoid double initialization

    // Only initialize if elements exist
    const container = document.getElementById('particle-field');
    if (!container) return;

    cinematicSystem = new CinematicParticleSystem();

    // Expose for debugging
    if (typeof window !== 'undefined') {
        (window as any).cinematicSystem = cinematicSystem;
    }
}

export function getCinematicSystem(): CinematicParticleSystem | null {
    return cinematicSystem;
}
