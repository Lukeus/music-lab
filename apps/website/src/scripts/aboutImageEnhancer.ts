// aboutImageEnhancer.ts - Enhanced image effects for about page hero section
// Following project pattern of TypeScript-first development

interface MousePosition {
    x: number;
    y: number;
    normalizedX: number;
    normalizedY: number;
}

interface ParticleOptions {
    count: number;
    symbols: string[];
    speedRange: [number, number];
    opacityRange: [number, number];
    sizeRange: [number, number];
}

interface ImageEnhancerConfig {
    parallaxStrength: number;
    glowIntensity: number;
    particleOptions: ParticleOptions;
    enableMouseTracking: boolean;
    enable3DEffect: boolean;
    enableParticles: boolean;
}

class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    symbol: string;
    opacity: number;
    size: number;
    element: HTMLElement;
    baseOpacity: number;
    life: number;
    maxLife: number;

    constructor(
        container: HTMLElement,
        symbol: string,
        x: number = 0,
        y: number = 0,
        options: ParticleOptions
    ) {
        this.x = x || Math.random() * container.offsetWidth;
        this.y = y || Math.random() * container.offsetHeight;
        this.vx =
            (Math.random() - 0.5) *
                (options.speedRange[1] - options.speedRange[0]) +
            options.speedRange[0];
        this.vy =
            (Math.random() - 0.5) *
                (options.speedRange[1] - options.speedRange[0]) +
            options.speedRange[0];
        this.symbol = symbol;
        this.baseOpacity =
            Math.random() *
                (options.opacityRange[1] - options.opacityRange[0]) +
            options.opacityRange[0];
        this.opacity = this.baseOpacity;
        this.size =
            Math.random() * (options.sizeRange[1] - options.sizeRange[0]) +
            options.sizeRange[0];
        this.life = 0;
        this.maxLife = 300 + Math.random() * 200; // 5-8 seconds at 60fps

        this.createElement(container);
    }

    private createElement(container: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.className = 'floating-particle';
        this.element.textContent = this.symbol;
        this.element.style.cssText = `
      position: absolute;
      font-size: ${this.size}rem;
      color: var(--accent);
      opacity: ${this.opacity};
      pointer-events: none;
      user-select: none;
      z-index: 1;
      transform: translate(${this.x}px, ${this.y}px);
      transition: opacity 0.3s ease;
    `;
        container.appendChild(this.element);
    }

    update(
        containerWidth: number,
        containerHeight: number,
        mousePos?: MousePosition
    ): boolean {
        this.life++;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Mouse interaction
        if (mousePos) {
            const dx = mousePos.x - this.x;
            const dy = mousePos.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                const force = (100 - distance) / 100;
                this.vx -= dx * force * 0.001;
                this.vy -= dy * force * 0.001;
                this.opacity = Math.min(this.baseOpacity * 2, 1);
            } else {
                this.opacity = this.baseOpacity;
            }
        }

        // Boundary wrapping
        if (this.x < -50) this.x = containerWidth + 50;
        if (this.x > containerWidth + 50) this.x = -50;
        if (this.y < -50) this.y = containerHeight + 50;
        if (this.y > containerHeight + 50) this.y = -50;

        // Life cycle
        const lifeFactor = this.life / this.maxLife;
        if (lifeFactor > 0.8) {
            this.opacity = this.baseOpacity * (1 - (lifeFactor - 0.8) / 0.2);
        }

        // Apply updates to DOM
        this.element.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.life * 0.5}deg)`;
        this.element.style.opacity = this.opacity.toString();

        return this.life < this.maxLife;
    }

    destroy(): void {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

class AboutImageEnhancer {
    private container: HTMLElement | null = null;
    private imageContainer: HTMLElement | null = null;
    private image: HTMLImageElement | null = null;
    private particleContainer: HTMLElement | null = null;
    private particles: Particle[] = [];
    private mousePos: MousePosition = {
        x: 0,
        y: 0,
        normalizedX: 0,
        normalizedY: 0,
    };
    private animationId: number = 0;
    private isInitialized: boolean = false;
    private config: ImageEnhancerConfig;

    constructor(config: Partial<ImageEnhancerConfig> = {}) {
        this.config = {
            parallaxStrength: 0.05,
            glowIntensity: 1,
            particleOptions: {
                count: 15,
                symbols: ['♪', '♫', '♬', '♩', '♭', '♯', '𝅘𝅥𝅮', '𝅘𝅥', '𝆏', '𝆐'],
                speedRange: [0.2, 0.8],
                opacityRange: [0.1, 0.3],
                sizeRange: [1.2, 2.5],
            },
            enableMouseTracking: true,
            enable3DEffect: true,
            enableParticles: true,
            ...config,
        };
    }

    public init(): boolean {
        try {
            this.container = document.querySelector('.about-hero');
            this.imageContainer = document.querySelector(
                '.hero-image-container'
            );
            this.image = document.querySelector('.hero-image');

            if (!this.container || !this.imageContainer || !this.image) {
                console.warn('AboutImageEnhancer: Required elements not found');
                return false;
            }

            this.setupEnhancedStructure();
            this.setupEventListeners();
            this.initializeParticles();
            this.startAnimationLoop();

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('AboutImageEnhancer initialization failed:', error);
            return false;
        }
    }

    private setupEnhancedStructure(): void {
        if (!this.container || !this.imageContainer) return;

        // Create particle container
        this.particleContainer = document.createElement('div');
        this.particleContainer.className = 'particle-container';
        this.particleContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2;
      overflow: hidden;
    `;
        this.container.appendChild(this.particleContainer);

        // Add enhanced classes for CSS targeting
        this.imageContainer.classList.add('enhanced-image-container');
        if (this.image) {
            this.image.classList.add('enhanced-hero-image');
        }
    }

    private setupEventListeners(): void {
        if (!this.container) return;

        // Mouse tracking for parallax and interactions
        if (this.config.enableMouseTracking) {
            this.container.addEventListener(
                'mousemove',
                this.handleMouseMove.bind(this)
            );
            this.container.addEventListener(
                'mouseleave',
                this.handleMouseLeave.bind(this)
            );
        }

        // Scroll-based effects
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Resize handling
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    private handleMouseMove(event: MouseEvent): void {
        if (!this.container) return;

        const rect = this.container.getBoundingClientRect();
        this.mousePos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            normalizedX:
                (event.clientX - rect.left - rect.width / 2) / (rect.width / 2),
            normalizedY:
                (event.clientY - rect.top - rect.height / 2) /
                (rect.height / 2),
        };

        if (this.config.enable3DEffect && this.imageContainer) {
            const rotateX = this.mousePos.normalizedY * -5; // Subtle 3D rotation
            const rotateY = this.mousePos.normalizedX * 5;

            this.imageContainer.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateZ(10px)
      `;
        }
    }

    private handleMouseLeave(): void {
        if (this.config.enable3DEffect && this.imageContainer) {
            this.imageContainer.style.transform =
                'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        }
    }

    private handleScroll(): void {
        if (!this.container || !this.image) return;

        const scrollY = window.scrollY;
        const containerTop = this.container.offsetTop;
        const parallaxY =
            (scrollY - containerTop) * this.config.parallaxStrength;

        // Apply parallax to image
        this.image.style.transform = `translateY(${parallaxY}px) scale(1.1)`;

        // Dynamic glow based on scroll
        const scrollProgress = Math.max(
            0,
            Math.min(
                1,
                (scrollY - containerTop + window.innerHeight) /
                    window.innerHeight
            )
        );
        const glowOpacity = scrollProgress * this.config.glowIntensity;

        if (this.imageContainer) {
            this.imageContainer.style.setProperty(
                '--dynamic-glow-opacity',
                glowOpacity.toString()
            );
        }
    }

    private handleResize(): void {
        if (this.config.enableParticles && this.particleContainer) {
            // Recreate particles on resize to maintain proper distribution
            this.destroyParticles();
            this.initializeParticles();
        }
    }

    private initializeParticles(): void {
        if (!this.config.enableParticles || !this.particleContainer) return;

        const { count, symbols } = this.config.particleOptions;

        for (let i = 0; i < count; i++) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const particle = new Particle(
                this.particleContainer,
                symbol,
                0,
                0,
                this.config.particleOptions
            );
            this.particles.push(particle);
        }
    }

    private updateParticles(): void {
        if (!this.config.enableParticles || !this.particleContainer) return;

        const containerWidth = this.particleContainer.offsetWidth;
        const containerHeight = this.particleContainer.offsetHeight;

        // Update existing particles
        this.particles = this.particles.filter(particle => {
            const isAlive = particle.update(
                containerWidth,
                containerHeight,
                this.mousePos
            );
            if (!isAlive) {
                particle.destroy();
            }
            return isAlive;
        });

        // Maintain particle count
        while (this.particles.length < this.config.particleOptions.count) {
            const symbol =
                this.config.particleOptions.symbols[
                    Math.floor(
                        Math.random() *
                            this.config.particleOptions.symbols.length
                    )
                ];
            const particle = new Particle(
                this.particleContainer,
                symbol,
                0,
                0,
                this.config.particleOptions
            );
            this.particles.push(particle);
        }
    }

    private startAnimationLoop(): void {
        const animate = () => {
            if (this.isInitialized) {
                this.updateParticles();
                this.animationId = requestAnimationFrame(animate);
            }
        };
        animate();
    }

    private destroyParticles(): void {
        this.particles.forEach(particle => particle.destroy());
        this.particles = [];
    }

    public destroy(): void {
        this.isInitialized = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.destroyParticles();

        if (this.particleContainer && this.particleContainer.parentNode) {
            this.particleContainer.parentNode.removeChild(
                this.particleContainer
            );
        }

        // Remove event listeners
        window.removeEventListener('scroll', this.handleScroll.bind(this));
        window.removeEventListener('resize', this.handleResize.bind(this));
    }
}

// Factory function following project patterns
export function createAboutImageEnhancer(
    config?: Partial<ImageEnhancerConfig>
): AboutImageEnhancer {
    return new AboutImageEnhancer(config);
}

// Default export for easy importing
export default AboutImageEnhancer;

// Type exports for external usage
export type { ImageEnhancerConfig, ParticleOptions, MousePosition };
