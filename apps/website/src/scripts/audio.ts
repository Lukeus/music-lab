let currentAudio: HTMLAudioElement | null = null;
let currentButton: HTMLElement | null = null;
let currentRAF = 0;
let activeCanvas: HTMLCanvasElement | null = null;
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let activeTitle = '';
// Draw waveform visualization for the currently playing audio
function stopWaveform() {
    if (currentRAF) cancelAnimationFrame(currentRAF);
    currentRAF = 0;
    if (activeCanvas) {
        const ctx2d = activeCanvas.getContext('2d');
        ctx2d?.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    }
    activeCanvas = null;
}

async function startWaveform(canvas: HTMLCanvasElement) {
    if (!canvas) return;
    activeCanvas = canvas;
    if (!audioCtx)
        audioCtx = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
    if (!analyser) {
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
    }
    if (!sourceNode) {
        sourceNode = audioCtx.createMediaElementSource(currentAudio!);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
    }
    const ctx2d = canvas.getContext('2d');
    const draw = () => {
        if (!analyser || !activeCanvas) return;
        const w = canvas.width,
            h = canvas.height;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        ctx2d!.clearRect(0, 0, w, h);
        ctx2d!.fillStyle = 'rgba(10, 20, 30, 0.85)';
        ctx2d!.fillRect(0, 0, w, h);
        // Draw bars (like old main.js)
        const barCount = 24;
        const step = Math.floor(data.length / barCount);
        const barWidth = Math.max(2, w / barCount - 1);
        for (let i = 0; i < barCount; i++) {
            const v = data[i * step] / 255;
            const barHeight = Math.max(2, v * h);
            const x = i * (barWidth + 1);
            const y = h - barHeight;
            ctx2d!.fillStyle = '#7CD2FF';
            ctx2d!.globalAlpha = 0.85;
            ctx2d!.fillRect(x, y, barWidth, barHeight);
        }
        ctx2d!.globalAlpha = 1;
        currentRAF = requestAnimationFrame(draw);
    };
    draw();
}

function iconPlaySVG() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
}
function iconPauseSVG() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
}
function showToast(msg: string) {
    // Always inject toast into the mini-player's #toast-host
    const mini = document.getElementById('mini-player');
    const host = mini
        ? mini.querySelector('#toast-host')
        : document.getElementById('toast-host');
    if (!host) return;
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText =
        'background:#111;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25);font-size:.9rem;max-width:80vw;';
    host.appendChild(t);
    setTimeout(() => {
        t.style.transition = 'opacity .25s';
        t.style.opacity = '0';
    }, 1600);
    setTimeout(() => {
        t.remove();
    }, 2000);
}

function toTime(t: number) {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function ensureMiniPlayer() {
    let mp = document.getElementById('mini-player');
    if (mp) return mp;
    mp = document.createElement('div');
    mp.id = 'mini-player';
    mp.className = 'mini-player';
    mp.innerHTML = `
    <button class="mini-close" aria-label="Close player">✕</button>
    <button class="mini-play" aria-pressed="false" aria-label="Play audio" title="Play">${iconPlaySVG()}</button>
    <div class="mini-meta">
        <div class="mini-title" id="mini-title">—</div>
        <div class="audio-time"><span class="current">0:00</span> / <span class="duration">0:00</span></div>
        <div class="audio-progress" role="slider" aria-label="Seek" tabindex="0"><div class="audio-progress-fill"></div></div>
    </div>
    <div id="toast-host" aria-live="polite" style="position:fixed;bottom:72px;left:50%;transform:translateX(-50%);"></div>`;
    document.body.appendChild(mp);
    bindMiniPlayer();
    return mp;
}

function getMiniElements() {
    const mp = document.getElementById('mini-player');
    if (!mp) return {} as any;
    return {
        root: mp,
        play: mp.querySelector('.mini-play') as HTMLButtonElement,
        close: mp.querySelector('.mini-close') as HTMLButtonElement,
        title: mp.querySelector('.mini-title') as HTMLElement,
        timeCurrent: mp.querySelector('.audio-time .current') as HTMLElement,
        timeDuration: mp.querySelector('.audio-time .duration') as HTMLElement,
        progress: mp.querySelector('.audio-progress') as HTMLElement,
        progressFill: mp.querySelector('.audio-progress-fill') as HTMLElement,
    };
}

export function bindMiniPlayer() {
    const { play, close, progress, root } = getMiniElements();
    if (play && !(play as any).__bound) {
        (play as any).__bound = true;
        play.innerHTML = iconPlaySVG(); // Always show SVG only
        play.addEventListener('click', () => {
            if (!currentAudio) return;
            if (currentAudio.paused) {
                currentAudio.play();
                if (currentButton) {
                    currentButton.dataset.state = 'playing';
                    currentButton.textContent = '⏸';
                    currentButton.setAttribute('aria-pressed', 'true');
                    currentButton.setAttribute('aria-label', 'Pause audio');
                    // Start waveform visualization for the current card
                    const els = currentButton.closest(
                        '.project-card, .experiment-card'
                    );
                    const canvas = els
                        ? (els.querySelector(
                              'canvas.waveform-canvas'
                          ) as HTMLCanvasElement)
                        : null;
                    stopWaveform();
                    if (canvas) startWaveform(canvas);
                }
                play.innerHTML = iconPauseSVG();
                play.setAttribute('aria-pressed', 'true');
                if (root) root.classList.add('show'); // Always show mini-player when playing
            } else {
                currentAudio.pause();
                if (currentButton) {
                    currentButton.dataset.state = 'paused';
                    currentButton.textContent = '▶';
                    currentButton.setAttribute('aria-pressed', 'false');
                    currentButton.setAttribute('aria-label', 'Play audio');
                    stopWaveform();
                }
                play.innerHTML = iconPlaySVG();
                play.setAttribute('aria-pressed', 'false');
            }
        });
    }
    if (close && !(close as any).__bound) {
        (close as any).__bound = true;
        close.addEventListener('click', () => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            const { root } = getMiniElements();
            if (root) root.classList.remove('show');
            showToast('Player closed');
        });
    }
    if (progress && !(progress as any).__bound) {
        (progress as any).__bound = true;
        function seekFromClientX(clientX: number) {
            if (!currentAudio) return;
            const rect = progress.getBoundingClientRect();
            const pct = Math.max(
                0,
                Math.min(1, (clientX - rect.left) / rect.width)
            );
            if (isFinite(currentAudio.duration)) {
                currentAudio.currentTime = pct * currentAudio.duration;
            }
        }
        progress.addEventListener('pointerdown', (e: PointerEvent) => {
            seekFromClientX(e.clientX);
        });
        progress.addEventListener('click', (e: MouseEvent) =>
            seekFromClientX(e.clientX)
        );
        progress.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!currentAudio || !isFinite(currentAudio.duration)) return;
            if (e.key === 'ArrowLeft') {
                currentAudio.currentTime = Math.max(
                    0,
                    currentAudio.currentTime - 5
                );
            } else if (e.key === 'ArrowRight') {
                currentAudio.currentTime = Math.min(
                    currentAudio.duration,
                    currentAudio.currentTime + 5
                );
            }
        });
    }
}

function syncMiniTo(btn: HTMLElement) {
    ensureMiniPlayer();
    const mini = getMiniElements();
    // Only use data-title, or fallback to card heading, never button text (which may be ⏸/▶)
    let title = btn.getAttribute('data-title');
    if (!title) {
        const card = btn.closest('.project-card, .experiment-card');
        const heading = card?.querySelector('h3, h4');
        title =
            heading && typeof heading.textContent === 'string'
                ? heading.textContent.trim()
                : null;
    }
    activeTitle = title || 'Untitled';
    if (mini.title) {
        // Always set textContent, never SVG
        mini.title.textContent = activeTitle;
    }
    if (mini.root) mini.root.classList.add('show');
    // Only update play button with SVG
    if (mini.play) {
        mini.play.innerHTML =
            currentAudio && !currentAudio.paused
                ? iconPauseSVG()
                : iconPlaySVG();
    }
}

export function initSharedAudio() {
    if (!currentAudio) {
        currentAudio = new Audio();
        currentAudio.preload = 'metadata';
        currentAudio.addEventListener('ended', () => {
            if (currentButton) {
                currentButton.dataset.state = 'paused';
                currentButton = null;
            }
            const { play, root } = getMiniElements();
            if (play) {
                play.innerHTML = iconPlaySVG();
                play.setAttribute('aria-pressed', 'false');
            }
            if (root) root.classList.remove('show');
        });
        currentAudio.addEventListener('pause', () => {
            if (currentButton) {
                currentButton.dataset.state = 'paused';
            }
            const { play } = getMiniElements();
            if (play) {
                play.innerHTML = iconPlaySVG();
                play.setAttribute('aria-pressed', 'false');
            }
        });
        currentAudio.addEventListener('play', () => {
            const { play, root } = getMiniElements();
            if (play) {
                play.innerHTML = iconPauseSVG();
                play.setAttribute('aria-pressed', 'true');
            }
            if (root) root.classList.add('show');
        });
        currentAudio.addEventListener('timeupdate', () => {
            const { timeCurrent, timeDuration, progressFill } =
                getMiniElements();
            if (timeCurrent)
                timeCurrent.textContent = toTime(currentAudio!.currentTime);
            if (timeDuration)
                timeDuration.textContent = toTime(currentAudio!.duration);
            if (
                progressFill &&
                isFinite(currentAudio!.duration) &&
                currentAudio!.duration > 0
            ) {
                progressFill.style.width = `${(currentAudio!.currentTime / currentAudio!.duration) * 100}%`;
            }
        });
        currentAudio.addEventListener('loadedmetadata', () => {
            const { timeDuration } = getMiniElements();
            if (timeDuration)
                timeDuration.textContent = toTime(currentAudio!.duration);
        });
    }
    return currentAudio!;
}

export function bindPlayButtons(selector = '[data-audio]') {
    const audio = initSharedAudio();
    document.querySelectorAll<HTMLElement>(selector).forEach(btn => {
        if ((btn as any).__bound) return;
        (btn as any).__bound = true;
        btn.addEventListener('click', async () => {
            const src = btn.dataset.audio!;
            if (!src) return;
            // swap source if this is a different track
            if (audio.src !== new URL(src, location.origin).href) {
                audio.pause();
                audio.src = src;
            }
            // toggle
            if (audio.paused || currentButton !== btn) {
                try {
                    await audio.play();
                    if (currentButton && currentButton !== btn) {
                        currentButton.dataset.state = 'paused';
                        currentButton.textContent = '▶';
                        currentButton.setAttribute('aria-pressed', 'false');
                        currentButton.setAttribute('aria-label', 'Play audio');
                    }
                    btn.dataset.state = 'playing';
                    btn.textContent = '⏸';
                    btn.setAttribute('aria-pressed', 'true');
                    btn.setAttribute('aria-label', 'Pause audio');
                    currentButton = btn;
                    syncMiniTo(btn);
                    // Start waveform visualization for this card
                    const card = btn.closest('.audio-ui');
                    const canvas = card?.querySelector(
                        '.waveform-canvas'
                    ) as HTMLCanvasElement;
                    stopWaveform();
                    if (canvas) startWaveform(canvas);
                } catch (e) {
                    console.warn(e);
                    showToast('Tap to enable audio');
                }
            } else {
                audio.pause();
                btn.dataset.state = 'paused';
                btn.textContent = '▶';
                btn.setAttribute('aria-pressed', 'false');
                btn.setAttribute('aria-label', 'Play audio');
                stopWaveform();
            }
        });
    });
}

// Bind waveform canvas to resize and clear on pause/end
export function bindWaveform() {
    if (!window) return;
    function resizeWaveforms() {
        document
            .querySelectorAll<HTMLCanvasElement>('.waveform-canvas')
            .forEach(cv => {
                // Set canvas width to match its rendered width
                const rect = cv.getBoundingClientRect();
                if (rect.width) cv.width = Math.floor(rect.width);
                cv.height = 32;
                const ctx2d = cv.getContext('2d');
                ctx2d?.clearRect(0, 0, cv.width, cv.height);
            });
    }
    window.addEventListener('resize', resizeWaveforms);
    // Initial sizing
    resizeWaveforms();
    // Clear waveform on audio end
    if (currentAudio) {
        currentAudio.addEventListener('ended', stopWaveform);
        currentAudio.addEventListener('pause', stopWaveform);
    }
}
