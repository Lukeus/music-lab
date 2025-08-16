import { scroll, inView, animate } from "https://esm.sh/motion@10.18.0";

// Shared audio player so only one track plays at a time
let currentAudio = new Audio();
currentAudio.preload = 'metadata';
let currentButton = null;
let currentRAF = 0;                // waveform animation frame id
let audioCtx = null;               // WebAudio context (lazy)
let analyser = null;               // shared analyser
let sourceNode = null;             // media element source (bound once to currentAudio)
let activeCanvas = null;           // canvas for the currently playing card

function toTime(t) {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function setButtonState(button, isPlaying) {
    if (!button) return;
    if (isPlaying) {
        button.textContent = '⏸';
        button.classList.add('playing');
        button.style.background = 'var(--accent-secondary)';
        button.setAttribute('aria-pressed', 'true');
        button.setAttribute('aria-label', 'Pause audio');
    } else {
        button.textContent = '▶';
        button.classList.remove('playing');
        button.style.background = 'var(--accent)';
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', 'Play audio');
    }
}

function getCardElementsFromButton(btn) {
    const card = btn.closest('.project-card, .experiment-card');
    if (!card) return {};
    return {
        card,
        timeCurrent: card.querySelector('.audio-time .current'),
        timeDuration: card.querySelector('.audio-time .duration'),
        progress: card.querySelector('.audio-progress'),
        progressFill: card.querySelector('.audio-progress-fill'),
        canvas: card.querySelector('canvas.waveform-canvas')
    };
}

function ensureMiniPlayer() {
    let mp = document.getElementById('mini-player');
    if (mp) return mp;
    mp = document.createElement('div');
    mp.id = 'mini-player';
    mp.className = 'mini-player';
    mp.innerHTML = `
        <button class="mini-close" aria-label="Close player">✕</button>
        <button class="mini-play" aria-pressed="false" aria-label="Play audio">▶</button>
        <div class="mini-meta">
            <div class="mini-title" id="mini-title">—</div>
            <div class="audio-time"><span class="current">0:00</span> / <span class="duration">0:00</span></div>
            <div class="audio-progress" role="slider" aria-label="Seek" tabindex="0"><div class="audio-progress-fill"></div></div>
        </div>`;
    document.body.appendChild(mp);
    bindMiniPlayer();
    return mp;
}

function getMiniElements() {
    const mp = document.getElementById('mini-player');
    if (!mp) return {};
    return {
        root: mp,
        play: mp.querySelector('.mini-play'),
        close: mp.querySelector('.mini-close'),
        title: mp.querySelector('.mini-title'),
        timeCurrent: mp.querySelector('.audio-time .current'),
        timeDuration: mp.querySelector('.audio-time .duration'),
        progress: mp.querySelector('.audio-progress'),
        progressFill: mp.querySelector('.audio-progress-fill')
    };
}

function bindMiniPlayer() {
    const { play, close, progress } = getMiniElements();
    if (play && !play.__bound) {
        play.__bound = true;
        play.addEventListener('click', async () => {
            try { if (currentAudio.paused) { await currentAudio.play(); } else { currentAudio.pause(); } }
            catch (e) { console.warn(e); }
        });
    }
    if (close && !close.__bound) {
        close.__bound = true;
        close.addEventListener('click', () => {
            currentAudio.pause();
            if (currentButton) setButtonState(currentButton, false);
            const { root } = getMiniElements();
            if (root) root.classList.remove('show');
        });
    }
    if (progress && !progress.__bound) {
        progress.__bound = true;
        progress.addEventListener('click', (e) => {
            const rect = progress.getBoundingClientRect();
            const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
            const ratio = x / rect.width;
            if (isFinite(currentAudio.duration)) {
                currentAudio.currentTime = ratio * currentAudio.duration;
            }
        });
    }
}

function syncMiniTo(button) {
    ensureMiniPlayer();
    const mini = getMiniElements();
    const title = button.getAttribute('data-title')
        || button.closest('.project-card, .experiment-card')?.querySelector('h3, h4')?.textContent
        || 'Untitled';
    if (mini.title) mini.title.textContent = title;
    if (mini.root) mini.root.classList.add('show');
}

function stopWaveform() {
    if (currentRAF) cancelAnimationFrame(currentRAF);
    currentRAF = 0;
    if (activeCanvas) {
        const ctx2d = activeCanvas.getContext('2d');
        ctx2d.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    }
    activeCanvas = null;
}

async function startWaveform(canvas) {
    if (!canvas) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (!sourceNode) {
            sourceNode = audioCtx.createMediaElementSource(currentAudio);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            const gain = audioCtx.createGain();
            gain.gain.value = 1;
            sourceNode.connect(analyser);
            analyser.connect(gain);
            gain.connect(audioCtx.destination);
        }
        activeCanvas = canvas;
        const ctx2d = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            currentRAF = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            const W = canvas.width;
            const H = canvas.height;
            ctx2d.clearRect(0, 0, W, H);
            const barCount = Math.min(64, bufferLength);
            const step = Math.floor(bufferLength / barCount);
            const barWidth = W / barCount;
            for (let i = 0; i < barCount; i++) {
                const v = dataArray[i * step] / 255; // 0..1
                const h = Math.max(2, v * H);
                const x = i * barWidth;
                const y = H - h;
                ctx2d.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#0f0';
                ctx2d.fillRect(x, y, barWidth * 0.8, h);
            }
        }
        draw();
    } catch (e) {
        // CORS or autoplay policy can block; fail silently
        console.warn('Waveform unavailable:', e);
        stopWaveform();
    }
}

// Reset UI when audio stops/ends
currentAudio.addEventListener('ended', () => {
    if (currentButton) setButtonState(currentButton, false);
    const { root } = getMiniElements();
    if (root) root.classList.remove('show');
});
currentAudio.addEventListener('pause', () => {
    if (currentButton && currentAudio.currentTime > 0 && !currentAudio.ended) {
        setButtonState(currentButton, false);
    }
});

// Update time/progress UI for the active card
currentAudio.addEventListener('timeupdate', () => {
    if (!currentButton) return;
    const { progressFill, timeCurrent } = getCardElementsFromButton(currentButton);
    if (timeCurrent) timeCurrent.textContent = toTime(currentAudio.currentTime);
    if (progressFill && isFinite(currentAudio.duration) && currentAudio.duration > 0) {
        const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
        progressFill.style.width = `${pct}%`;
    }
    const mini = getMiniElements();
    if (mini.timeCurrent) mini.timeCurrent.textContent = toTime(currentAudio.currentTime);
    if (mini.progressFill && isFinite(currentAudio.duration) && currentAudio.duration > 0) {
        const pct2 = (currentAudio.currentTime / currentAudio.duration) * 100;
        mini.progressFill.style.width = `${pct2}%`;
    }
});

currentAudio.addEventListener('loadedmetadata', () => {
    if (!currentButton) return;
    const { timeDuration } = getCardElementsFromButton(currentButton);
    if (timeDuration) timeDuration.textContent = toTime(currentAudio.duration);
    const mini = getMiniElements();
    if (mini.timeDuration) mini.timeDuration.textContent = toTime(currentAudio.duration);
});

currentAudio.addEventListener('play', () => {
    const { play } = getMiniElements();
    if (play) { play.textContent = '⏸'; play.setAttribute('aria-pressed', 'true'); play.setAttribute('aria-label', 'Pause audio'); }
});
currentAudio.addEventListener('pause', () => {
    const { play } = getMiniElements();
    if (play) { play.textContent = '▶'; play.setAttribute('aria-pressed', 'false'); play.setAttribute('aria-label', 'Play audio'); }
});


window.addEventListener('load', function() {
    if (sessionStorage.getItem('welcomeGateShown')) {
        const welcomeGate = document.querySelector('.welcome-gate');
        if (welcomeGate) {
            welcomeGate.style.display = 'none';
        }
        document.body.classList.remove('scroll-lock');
    }

    initializeWelcomeGate();
    initializeHeaderLink();
    initializePlayButtons();
    loadContent().then(() => {
        initializeScrollAnimations();
        initializeParallax();
    });
});

function initializeWelcomeGate() {
    const welcomeGate = document.querySelector('.welcome-gate');
    const enterButton = document.querySelector('.enter-button');

    if (enterButton) {
        enterButton.addEventListener('click', () => {
            if (welcomeGate) {
                welcomeGate.style.opacity = '0';
                setTimeout(() => {
                    welcomeGate.style.display = 'none';
                }, 500);
            }
            document.body.classList.remove('scroll-lock');
            sessionStorage.setItem('welcomeGateShown', 'true');
        });
    }
}

function initializeHeaderLink() {
    const logoLink = document.querySelector('header .logo');
    const welcomeGate = document.querySelector('.welcome-gate');

    if (logoLink && welcomeGate) {
        logoLink.addEventListener('click', (event) => {
            event.preventDefault();
            welcomeGate.style.display = 'flex';
            setTimeout(() => {
                welcomeGate.style.opacity = '1';
            }, 10);
            document.body.classList.add('scroll-lock');
            sessionStorage.removeItem('welcomeGateShown');
        });
    }
}

async function loadContent() {
    try {
        const response = await fetch('/content.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.json();

        if (content.welcomeGate) {
            const h = document.getElementById('welcome-heading');
            const m = document.getElementById('welcome-message');
            if (h) h.textContent = content.welcomeGate.heading || '';
            if (m) m.textContent = content.welcomeGate.message || '';
        }

        document.title = content.pageTitle || document.title;
        const statusEl = document.getElementById('status-message');
        if (statusEl) statusEl.textContent = content.statusMessage || '';
        const logoTextEl = document.getElementById('logo-text');
        if (logoTextEl) logoTextEl.textContent = content.logoText || '';
        const heroHeadingEl = document.getElementById('hero-heading');
        if (heroHeadingEl) heroHeadingEl.textContent = (content.heroSection && content.heroSection.heading) || '';
        const heroParagraphEl = document.getElementById('hero-paragraph');
        if (heroParagraphEl) heroParagraphEl.textContent = (content.heroSection && content.heroSection.paragraph) || '';

        populateProjects(content.currentProjects || []);
        populateExperiments(content.soundExperiments || []);
        populateJournalEntries(content.creativeJournal || []);
    } catch (error) {
        console.error('Failed to load content:', error);
    }
}

function initializePlayButtons() {
    const playButtons = document.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        // Avoid double-binding
        if (button.__hasListener) return;
        button.__hasListener = true;

        // Accessibility defaults
        if (!button.hasAttribute('aria-pressed')) button.setAttribute('aria-pressed', 'false');
        if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', 'Play audio');

        // Disable if no audio URL
        const url = button.getAttribute('data-audio');
        if (!url) {
            button.disabled = false; // keep functional for future features
        }

        button.addEventListener('click', async function() {
            const src = this.getAttribute('data-audio');

            // If no audio bound, fall back to old visual toggle only
            if (!src) {
                togglePlayButton(this);
                return;
            }

            try {
                // If clicking the same button currently playing, toggle pause/play
                if (currentButton === this) {
                    if (!currentAudio.paused) {
                        currentAudio.pause();
                        setButtonState(this, false);
                    } else {
                        await currentAudio.play();
                        setButtonState(this, true);
                        syncMiniTo(this);
                    }
                    return;
                }

                // Switching tracks: reset previous button, set new source
                if (currentButton) setButtonState(currentButton, false);
                currentButton = this;

                if (currentAudio.src !== src) {
                    currentAudio.src = src;
                    const type = this.getAttribute('data-type');
                    // Optionally set type via canPlayType hint
                    if (type && !currentAudio.canPlayType(type)) {
                        console.warn('Browser may not support audio type:', type);
                    }
                }

                currentAudio.currentTime = 0; // start fresh
                await currentAudio.play();
                const els = getCardElementsFromButton(this);
                if (els.timeDuration && isFinite(currentAudio.duration)) {
                    els.timeDuration.textContent = toTime(currentAudio.duration);
                }
                if (els.progress) {
                    // make progress bar seekable
                    if (!els.progress.__bound) {
                        els.progress.__bound = true;
                        els.progress.addEventListener('click', (e) => {
                            const rect = els.progress.getBoundingClientRect();
                            const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
                            const ratio = x / rect.width;
                            if (isFinite(currentAudio.duration)) {
                                currentAudio.currentTime = ratio * currentAudio.duration;
                            }
                        });
                    }
                }
                stopWaveform();
                startWaveform(els.canvas);
                setButtonState(this, true);
                syncMiniTo(this);
            } catch (err) {
                console.error('Audio play failed:', err);
                setButtonState(this, false);
                stopWaveform();
            }
        });
    });
}

function togglePlayButton(button) {
    const isPlay = button.textContent === '▶';
    setButtonState(button, isPlay);
}

function populateProjects(projects) {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    projects.forEach(project => {
        const projectCard = `
            <div class="project-card">
                <div class="project-header">
                    <div>
                        <div class="project-icon">${project.icon ?? ''}</div>
                        <h3 class="project-title">${project.title ?? ''}</h3>
                    </div>
                    <span class="project-status ${String(project.status || '').toLowerCase().replace(' ', '-')}">${project.status ?? ''}</span>
                </div>
                <p class="project-description">${project.description ?? ''}</p>
                <div class="progress-bar"><div class="progress-fill" style="width: ${project.progress ?? 0}%"></div></div>
                <div class="project-meta">
                    <span>${project.meta ?? ''}</span>
                    <div class="audio-ui">
                        <button class="play-button" data-audio="${project.audioUrl ?? ''}" data-type="${project.audioType ?? ''}" data-title="${(project.title ?? '').replace(/\"/g, '&quot;')}">▶</button>
                        <div class="audio-time"><span class="current">0:00</span> / <span class="duration">0:00</span></div>
                        <div class="audio-progress" role="slider" aria-label="Seek" tabindex="0"><div class="audio-progress-fill"></div></div>
                        <canvas class="waveform-canvas" height="48"></canvas>
                    </div>
                </div>
            </div>
        `;
        projectsGrid.insertAdjacentHTML('beforeend', projectCard);
    });
    initializePlayButtons();
}

function populateExperiments(experiments) {
    const experimentsGrid = document.querySelector('.experiments-grid');
    if (!experimentsGrid) return;
    experimentsGrid.innerHTML = '';
    experiments.forEach(experiment => {
        const experimentCard = `
            <div class="experiment-card">
                <div class="experiment-header">
                    <span class="experiment-type">${experiment.type ?? ''}</span>
                    <h4>${experiment.title ?? ''}</h4>
                </div>
                <div class="waveform"></div>
                <p>${experiment.description ?? ''}</p>
                <div class="project-meta">
                    <span>${experiment.meta ?? ''}</span>
                    <div class="audio-ui">
                        <button class="play-button" data-audio="${experiment.audioUrl ?? ''}" data-type="${experiment.audioType ?? ''}" data-title="${(experiment.title ?? '').replace(/\"/g, '&quot;')}">▶</button>
                        <div class="audio-time"><span class="current">0:00</span> / <span class="duration">0:00</span></div>
                        <div class="audio-progress" role="slider" aria-label="Seek" tabindex="0"><div class="audio-progress-fill"></div></div>
                        <canvas class="waveform-canvas" height="48"></canvas>
                    </div>
                </div>
            </div>
        `;
        experimentsGrid.insertAdjacentHTML('beforeend', experimentCard);
    });
    initializePlayButtons();
}

function populateJournalEntries(entries) {
    const journalEntriesContainer = document.getElementById('creative-journal-entries');
    if (!journalEntriesContainer) return;
    journalEntriesContainer.innerHTML = '';
    entries.forEach(entry => {
        const journalEntryCard = `
            <div class="journal-entry">
                <div class="journal-date">${entry.date ?? ''}</div>
                <h4 class="journal-title">${entry.title ?? ''}</h4>
                <p class="journal-content">${entry.content ?? ''}</p>
            </div>
        `;
        journalEntriesContainer.insertAdjacentHTML('beforeend', journalEntryCard);
    });
}

function initializeScrollAnimations() {
    const hero = document.querySelector('.hero');
    if (hero) {
        scroll(
            ({ y }) => {
                hero.style.backgroundPositionY = `${y.progress * 50}%`;
            },
            { target: hero }
        );
    }

    const progressFills = document.querySelectorAll('.progress-fill');
    progressFills.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        inView(bar, () => {
            animate(bar, { width }, { duration: 1 });
        });
    });

    const cards = document.querySelectorAll('.project-card, .experiment-card, .journal-entry');
    cards.forEach(card => {
        // Ensure initial state in case CSS wasn't loaded yet
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        inView(card,
            () => {
                animate(card, { opacity: 1, transform: 'translateY(0)' }, { duration: 0.5, delay: 0.1 });
            },
            { amount: 0.2 }
        );
    });
}

function initializeParallax() {
    const icons = document.querySelectorAll('.parallax-icon');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        icons.forEach(icon => {
            const speed = parseFloat(icon.dataset.speed || '1');
            const yPos = -(scrollY * speed / 10);
            icon.style.transform = `translateY(${yPos}px)`;
        });
    });
}

window.addEventListener('resize', () => {
    document.querySelectorAll('canvas.waveform-canvas').forEach(cv => {
        const rect = cv.getBoundingClientRect();
        if (rect.width) cv.width = Math.floor(rect.width);
    });
});
// Initialize canvas sizes on load
window.dispatchEvent(new Event('resize'));