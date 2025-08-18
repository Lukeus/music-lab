import { scroll, inView, animate } from "https://esm.sh/motion@10.18.0";

// Shared audio player so only one track plays at a time
let currentAudio = new Audio();
currentAudio.preload = 'metadata';
currentAudio.crossOrigin = 'anonymous';
let currentButton = null;
let currentRAF = 0;                // waveform animation frame id
let audioCtx = null;               // WebAudio context (lazy)
let analyser = null;               // shared analyser
let sourceNode = null;             // media element source (bound once to currentAudio)
let activeCanvas = null;           // canvas for the currently playing card
// --- Global helpers (icons + toast) ---
function iconPlaySVG() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
}
function iconPauseSVG() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
}
function showToast(msg) {
    const host = document.getElementById('toast-host');
    if (!host) return;
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'background:#111;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25);font-size:.9rem;max-width:80vw;';
    host.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .25s'; t.style.opacity = '0'; }, 1600);
    setTimeout(() => { t.remove(); }, 2000);
}
// Mobile audio unlock: resume WebAudio & nudge HTMLAudio once on first gesture
(function setupMobileAudioUnlock() {
    let unlocked = false;
    async function unlock() {
        if (unlocked) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state !== 'running') {
                try { await audioCtx.resume(); } catch { }
            }
            // Nudge WebAudio with a 1-frame silent buffer (iOS quirk)
            try {
                const sr = audioCtx.sampleRate || 44100;
                const buf = audioCtx.createBuffer(1, 1, sr);
                const src = audioCtx.createBufferSource();
                src.buffer = buf;
                src.connect(audioCtx.destination);
                src.start(0);
            } catch { }
            // Intentionally avoid touching currentAudio here to prevent double-tap-to-play races on first gesture.
            unlocked = true;
            ['touchstart', 'pointerdown', 'mousedown', 'keydown'].forEach(ev =>
                document.removeEventListener(ev, unlock, { passive: true })
            );
        } catch { }
    }
    ['touchstart', 'pointerdown', 'mousedown', 'keydown'].forEach(ev =>
        document.addEventListener(ev, unlock, { passive: true })
    );
})();

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
    <button class="mini-play" aria-pressed="false" aria-label="Play audio" title="Play">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
    </button>
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

    // --- Play/Pause toggle
    if (play && !play.__bound) {
        play.__bound = true;
        play.addEventListener('click', async () => {
            try {
                // If you use WebAudio, consider:
                // if (audioCtx && audioCtx.state === 'suspended') { await audioCtx.resume(); }
                if (currentAudio.paused) { await currentAudio.play(); }
                else { currentAudio.pause(); }
            } catch (e) {
                console.warn(e);
                if (typeof showToast === 'function') showToast('Tap to enable audio');
            }
        });
    }

    // --- Close player
    if (close && !close.__bound) {
        close.__bound = true;
        close.addEventListener('click', () => {
            currentAudio.pause();
            if (currentButton) setButtonState(currentButton, false);
            const { root } = getMiniElements();
            if (root) root.classList.remove('show');
        });
    }

    // --- Seek (pointer + keyboard) with slider semantics
    if (progress && !progress.__bound) {
        progress.__bound = true;

        // Give it basic slider semantics if not already present
        if (!progress.hasAttribute('role')) progress.setAttribute('role', 'slider');
        progress.setAttribute('aria-valuemin', '0');
        progress.setAttribute('aria-valuemax', '100');
        progress.setAttribute('tabindex', '0');

        function seekFromClientX(clientX) {
            const rect = progress.getBoundingClientRect();
            const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
            const ratio = rect.width ? x / rect.width : 0;
            if (isFinite(currentAudio.duration)) {
                currentAudio.currentTime = ratio * currentAudio.duration;
                progress.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
            }
        }

        // Pointer (mouse/pen/touch)
        progress.addEventListener('pointerdown', e => {
            progress.setPointerCapture?.(e.pointerId);
            seekFromClientX(e.clientX);
        });
        progress.addEventListener('pointermove', e => {
            if (e.buttons) seekFromClientX(e.clientX);
        });

        // Fallback click (still fine to keep)
        progress.addEventListener('click', e => seekFromClientX(e.clientX));

        // Keyboard (Left/Right/Home/End)
        progress.addEventListener('keydown', e => {
            if (!isFinite(currentAudio.duration)) return;
            const step = 5; // seconds
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const delta = e.key === 'ArrowLeft' ? -step : step;
                currentAudio.currentTime = Math.max(0, Math.min(currentAudio.duration, currentAudio.currentTime + delta));
            } else if (e.key === 'Home') {
                e.preventDefault();
                currentAudio.currentTime = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                currentAudio.currentTime = currentAudio.duration;
            }
            if (isFinite(currentAudio.duration)) {
                const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
                progress.setAttribute('aria-valuenow', String(Math.round(pct)));
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
        mini.progress.setAttribute('aria-valuenow', String(Math.round(pct2)));
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
    if (currentButton) setButtonState(currentButton, true);
    const { play } = getMiniElements();
    // in 'play' listener
    if (play) { play.innerHTML = iconPauseSVG(); play.setAttribute('aria-pressed', 'true'); play.setAttribute('aria-label', 'Pause audio'); }
});
currentAudio.addEventListener('playing', () => {
    // When playback is confirmed (after decoding/first frame), force UI sync
    if (currentButton) setButtonState(currentButton, true);
    const { play } = getMiniElements();
    if (play) { play.innerHTML = iconPauseSVG(); play.setAttribute('aria-pressed', 'true'); play.setAttribute('aria-label', 'Pause audio'); }
});
currentAudio.addEventListener('play', () => {
    if (typeof stopDrumMachine === 'function') {
        stopDrumMachine();
    }
});
currentAudio.addEventListener('pause', () => {
    const { play } = getMiniElements();
    // in 'pause' listener
    if (play) { play.innerHTML = iconPlaySVG(); play.setAttribute('aria-pressed', 'false'); play.setAttribute('aria-label', 'Play audio'); }
});


// Fix: ensure journal entry headers are not sticky
function disableStickyJournalHeaders() {
    // CSS override in case stylesheets set sticky positioning
    if (!document.getElementById('journal-sticky-fix')) {
        const s = document.createElement('style');
        s.id = 'journal-sticky-fix';
        s.textContent = `
            .journal-head { position: static !important; top: auto !important; }
        `;
        document.head.appendChild(s);
    }
    // Also clear any inline sticky styles that may have been applied dynamically
    document.querySelectorAll('.journal-head').forEach(h => {
        const cs = getComputedStyle(h);
        if (cs.position === 'sticky' || h.style.position === 'sticky') {
            h.style.position = 'static';
            h.style.top = 'auto';
        }
    });
}

window.addEventListener('load', function () {
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
        disableStickyJournalHeaders();
        initializeScrollAnimations();
        initializeParallax();
        initializeDrumMachine();
    });
});
// === Simple Doodle Drum Machine (self-contained) ===
let drumMachine = null;

function initializeDrumMachine() {
    // Avoid double init
    if (drumMachine) return;

    // Ensure AudioContext exists (reuse site context)
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { }
    }

    // Inject styles once
    if (!document.getElementById('drum-style')) {
        const style = document.createElement('style');
        style.id = 'drum-style';
        style.textContent = `
        .drum-wrap{position:relative;margin:24px auto;max-width:960px;padding:16px;border-radius:12px;background:var(--card-bg,rgba(255,255,255,.06));backdrop-filter:saturate(1.2) blur(6px);box-shadow:0 6px 24px rgba(0,0,0,.12)}
        .drum-head{display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:12px}
        .drum-title{font-weight:700}
        .drum-ctrls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        .drum-grid{display:grid;grid-template-columns:72px repeat(16, var(--step,48px));gap:8px;user-select:none;overflow-x:auto;overflow-y:visible;-webkit-overflow-scrolling:touch;scrollbar-width:thin;padding:6px 8px 6px 10px;box-sizing:border-box}
        .drum-wrap{--step:min(48px,7.2vw)}
        .drum-scroll-hint{font-size:.75rem;opacity:.6;margin-top:6px}
        .drum-label{position:sticky;left:0;z-index:2;display:flex;align-items:center;justify-content:flex-end;padding:0 10px 0 12px;min-width:72px;box-sizing:border-box;font-size:.9rem;opacity:.9;background:var(--card-bg,rgba(20,20,20,.5));backdrop-filter:saturate(1.1) blur(2px);overflow:visible}
        .drum-step{width:var(--step,48px);aspect-ratio:1/1;border:1px solid rgba(255,255,255,.12);box-sizing:border-box;border-radius:6px;background:var(--surface-2,#222);cursor:pointer;-webkit-tap-highlight-color:rgba(0,0,0,0);transition:transform .06s ease}
        .drum-step:active{transform:scale(.96)}
        .drum-step:focus-visible{outline:2px solid var(--accent-secondary,#ff6);outline-offset:2px}
        .drum-step.on{background:var(--accent,#5ef);border-color:rgba(255,255,255,.22)}
        .drum-step.playing{box-shadow:inset 0 0 0 2px var(--accent-secondary,#ff6)}
        .drum-foot{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:12px}
        .drum-foot .left, .drum-foot .right{display:flex;gap:8px;align-items:center}
        .drum-wrap{contain:layout paint}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,1px,1px);white-space:nowrap;border:0}
        .drum-label-btn{display:flex;align-items:center;justify-content:flex-end;gap:6px}
        .drum-micro{font-size:.75rem;opacity:.75;background:transparent;border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:2px 6px;cursor:pointer}
        .drum-btn{display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border:0;border-radius:8px;background:var(--accent,#5ef);color:#000;font-weight:600;cursor:pointer;white-space:nowrap}
        .drum-btn.tog{width:120px}
        /* Show only text+icon on desktop (hide icon by default) */
        .drum-btn.tog svg{display:none}
        .drum-bpm{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;min-width:260px;flex:1 1 auto}
        .drum-swing{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;min-width:220px;flex:1 1 auto;margin-left:8px}
        .drum-bpm input{width:100%}
        .drum-swing input{width:100%}
        input[type="range"]{appearance:none;-webkit-appearance:none;height:28px;background:transparent}
        input[type="range"]::-webkit-slider-runnable-track{height:6px;border-radius:4px;background:rgba(255,255,255,.25)}
        input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:24px;height:24px;border-radius:50%;background:var(--accent,#5ef);border:0;margin-top:-9px;box-shadow:0 1px 3px rgba(0,0,0,.3)}
        input[type="range"]::-moz-range-track{height:6px;border-radius:4px;background:rgba(255,255,255,.25)}
        input[type="range"]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:var(--accent,#5ef);border:0;box-shadow:0 1px 3px rgba(0,0,0,.3)}
        @media (max-width:700px){
        .drum-grid{grid-template-columns:64px repeat(16, var(--step,44px));}
        .drum-wrap{--step:min(44px,10.5vw)}
        .drum-label{min-width:64px;font-size:.85rem;padding:0 8px 0 10px}
        .drum-btn{padding:10px 12px}
        .drum-btn.tog{width:108px}
        .drum-btn.tog svg{display:inline-block;width:20px;height:20px}
        .drum-btn.tog span{display:none !important}
        .drum-ctrls{gap:6px}
        .drum-bpm,.drum-swing{min-width:0;flex:1 1 100%;width:100%;grid-template-columns:auto 1fr auto}
        #drum-bpm,#drum-swing{width:100%}
        .drum-bpm label,.drum-swing label{font-size:.9rem}
        }
        .drum-mode{display:flex;gap:6px;align-items:center;margin-right:8px}
        .drum-mode .mode[aria-pressed="true"]{outline:2px solid var(--accent-secondary,#ff6)}
        `;
        document.head.appendChild(style);
    }

    // Build container near top of page
    const host = document.querySelector('#drum-doodle') || document.querySelector('.hero') || document.body;
    const wrap = document.createElement('section');
    wrap.className = 'drum-wrap';
    wrap.setAttribute('aria-label', 'Drum Machine');
    wrap.innerHTML = `
      <div class="drum-head">
        <div class="drum-title">Music Lab Doodle Drum</div>
        <div class="drum-ctrls">
          <div class="drum-mode" role="group" aria-label="Sound Mode">
            <button class="drum-btn mode" id="drum-mode-synth" aria-pressed="true">Synth</button>
            <button class="drum-btn mode" id="drum-mode-808" aria-pressed="false">808</button>
          </div>
          <button class="drum-btn tog" id="drum-play" aria-pressed="false">▶ Play</button>
          <div class="drum-bpm">
            <label for="drum-bpm" style="opacity:.8">BPM</label>
            <input id="drum-bpm" type="range" min="60" max="180" value="110"/>
            <span id="drum-bpm-val">110</span>
          </div>
          <div class="drum-swing">
            <label for="drum-swing" style="opacity:.8">Swing</label>
            <input id="drum-swing" type="range" min="0" max="60" value="0"/>
            <span id="drum-swing-val">0%</span>
          </div>
        </div>
      </div>
      <div class="drum-grid" id="drum-grid"></div>
      <div class="drum-foot">
        <div class="left">
          <button class="drum-btn" id="drum-clear">Clear</button>
          <button class="drum-btn" id="drum-rand">Randomize</button>
        </div>
        <div class="right" style="opacity:.7">Only one thing plays at a time — starting this will pause any track.</div>
      </div>
      <div id="drum-aria" class="sr-only" aria-live="polite"></div>
    `;
    if (window.matchMedia('(max-width: 700px)').matches) {
        const hint = document.createElement('div');
        hint.className = 'drum-scroll-hint';
        hint.textContent = 'Swipe sideways to see all steps →';
        wrap.appendChild(hint);
    }
    if (host === document.body) {
        document.body.insertBefore(wrap, document.body.firstChild);
    } else {
        host.parentNode.insertBefore(wrap, host.nextSibling);
    }

    // Model
    const instruments = [
        { key: 'Kick', synth: hitKick },
        { key: 'Snare', synth: hitSnare },
        { key: 'Hat', synth: hitHat },
        { key: 'Clap', synth: hitClap }
    ];
    const steps = 16;
    const pattern = instruments.map(() => Array.from({ length: steps }, () => false));

    // UI grid
    const grid = wrap.querySelector('#drum-grid');
    instruments.forEach((inst, r) => {
        const label = document.createElement('div');
        label.className = 'drum-label';
        const wrapLbl = document.createElement('div');
        wrapLbl.className = 'drum-label-btn';
        const txt = document.createElement('span');
        txt.textContent = inst.key;
        const audition = document.createElement('button');
        audition.className = 'drum-micro';
        audition.type = 'button';
        audition.textContent = '▶';
        audition.title = `Audition ${inst.key}`;
        audition.addEventListener('click', () => playHit(inst));
        // simple long-press on the label itself
        let pressT = 0, pressTimer = null;
        function clearPress() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }
        label.addEventListener('pointerdown', () => { pressT = Date.now(); clearPress(); pressTimer = setTimeout(() => { playHit(inst); }, 320); });
        label.addEventListener('pointerup', clearPress);
        label.addEventListener('pointerleave', clearPress);
        wrapLbl.appendChild(txt);
        wrapLbl.appendChild(audition);
        label.appendChild(wrapLbl);
        grid.appendChild(label);
        // drag-to-paint state (shared across grid)
        if (!initializeDrumMachine._paintState) { initializeDrumMachine._paintState = { painting: false, value: true }; }
        for (let c = 0; c < steps; c++) {
            const btn = document.createElement('button');
            btn.className = 'drum-step';
            btn.setAttribute('aria-label', `${inst.key} step ${c + 1}`);
            const apply = (val) => {
                pattern[r][c] = val;
                btn.classList.toggle('on', val);
                try { if (navigator.vibrate) navigator.vibrate(5); } catch { }
                persistPattern();
            };
            btn.addEventListener('pointerdown', (e) => {
                btn.setPointerCapture?.(e.pointerId);
                const targetVal = !pattern[r][c];
                initializeDrumMachine._paintState.painting = true;
                initializeDrumMachine._paintState.value = targetVal;
                apply(targetVal);
            });
            btn.addEventListener('pointerenter', () => {
                if (initializeDrumMachine._paintState.painting) {
                    apply(initializeDrumMachine._paintState.value);
                }
            });
            btn.addEventListener('pointerup', () => { initializeDrumMachine._paintState.painting = false; });
            btn.addEventListener('lostpointercapture', () => { initializeDrumMachine._paintState.painting = false; });
            btn.addEventListener('click', (e) => { e.preventDefault(); /* handled in pointerdown */ });
            grid.appendChild(btn);
        }
    });

    // Controls
    const playBtn = wrap.querySelector('#drum-play');
    // Replace Play button content to use span+svg for label/icon
    if (playBtn) {
        playBtn.innerHTML = '<span>▶ Play</span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    }
    const bpmSlider = wrap.querySelector('#drum-bpm');
    const bpmVal = wrap.querySelector('#drum-bpm-val');
    const clearBtn = wrap.querySelector('#drum-clear');
    const randBtn = wrap.querySelector('#drum-rand');

    const swingSlider = wrap.querySelector('#drum-swing');
    const swingVal = wrap.querySelector('#drum-swing-val');
    const modeSynthBtn = wrap.querySelector('#drum-mode-synth');
    const mode808Btn = wrap.querySelector('#drum-mode-808');

    const state = { playing: false, step: 0, bpm: parseInt(bpmSlider.value, 10) || 110, swing: parseInt(swingSlider.value, 10) || 0, timer: null, mode: 'synth', samples: null };

    // --- Persistence helpers ---
    const STORAGE_KEY = 'mlab_drum_v1';
    function persistPattern() {
        try {
            const data = { pattern, bpm: state.bpm, swing: state.swing, mode: state.mode };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch { }
    }
    function restorePattern() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const { pattern: p, bpm, swing, mode } = JSON.parse(raw);
            if (Array.isArray(p) && p.length === instruments.length && Array.isArray(p[0]) && p[0].length === steps) {
                for (let r = 0; r < instruments.length; r++) for (let c = 0; c < steps; c++) { pattern[r][c] = !!p[r][c]; }
            }
            if (typeof bpm === 'number') { state.bpm = bpm; bpmSlider.value = String(bpm); bpmVal.textContent = String(bpm); }
            if (typeof swing === 'number') { state.swing = swing; swingSlider.value = String(swing); swingVal.textContent = `${swing}%`; }
            if (mode === '808' || mode === 'synth') { setMode(mode); }
        } catch { }
    }
    restorePattern();

    bpmSlider.addEventListener('input', () => { state.bpm = parseInt(bpmSlider.value, 10); bpmVal.textContent = String(state.bpm); if (state.playing) restartLoop(); persistPattern(); });

    swingSlider.addEventListener('input', () => { state.swing = parseInt(swingSlider.value, 10); swingVal.textContent = `${state.swing}%`; if (state.playing) restartLoop(); persistPattern(); });

    function setMode(mode) {
        state.mode = mode;
        modeSynthBtn.setAttribute('aria-pressed', mode === 'synth' ? 'true' : 'false');
        mode808Btn.setAttribute('aria-pressed', mode === '808' ? 'true' : 'false');
        persistPattern();
    }

    modeSynthBtn.addEventListener('click', () => setMode('synth'));
    mode808Btn.addEventListener('click', async () => {
        setMode('808');
        if (!state.samples) { state.samples = await load808Samples(); }
    });

    function advance() {
        state.step = (state.step + 1) % steps;
        markPlayhead(state.step);
        ensurePlayheadVisible(state.step);
    }

    function markPlayhead(s) {
        const cells = grid.querySelectorAll('.drum-step');
        cells.forEach((el, i) => {
            const col = i % steps; // each row has 16 cells
            el.classList.toggle('playing', col === s);
        });
    }

    // keep current step in view on narrow screens
    function ensurePlayheadVisible(col) {
        if (!window.matchMedia('(max-width: 700px)').matches) return;
        const cell = grid.querySelectorAll('.drum-step')[col];
        if (cell) { cell.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }
    }

    function baseStepMs() { return (60 / state.bpm / 4) * 1000; }

    function nextDelayFor(step) {
        // Swing applies to off-beats (odd steps in 0-based indexing)
        const swingAmt = (state.swing / 100) * 0.5; // max shift 50% of 16th
        const base = baseStepMs();
        if (state.swing <= 0) return base;
        return (step % 2 === 1) ? base * (1 + swingAmt) : base * (1 - swingAmt);
    }

    function loop() {
        // schedule hits for this step
        instruments.forEach((inst, r) => {
            if (pattern[r][state.step]) playHit(inst);
        });
        advance();
        const delay = nextDelayFor(state.step);
        state.timer = setTimeout(loop, delay);
    }

    function restartLoop() {
        if (state.timer) { clearTimeout(state.timer); state.timer = null; }
        if (state.playing && wrap.style.display !== 'none') {
            state.timer = setTimeout(loop, nextDelayFor(state.step));
        }
    }

    function start() {
        try { if (currentAudio && !currentAudio.paused) currentAudio.pause(); } catch { }
        announce('Drum machine playing');
        if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume().catch(() => { }); }
        if (state.timer) return;
        state.playing = true;
        if (wrap.style.display === 'none') {
            state.playing = false;
            if (playBtn) playBtn.querySelector('span').textContent = '▶ Play';
            // Swap SVG to play icon for mobile
            const svgElEarly = playBtn.querySelector('svg');
            if (svgElEarly) { svgElEarly.outerHTML = iconPlaySVG(); }
            playBtn.setAttribute('aria-pressed', 'false');
            return;
        }
        if (playBtn) playBtn.querySelector('span').textContent = '⏸ Pause';
        playBtn.setAttribute('aria-pressed', 'true');
        // Swap SVG to pause icon for mobile
        const svgElStart = playBtn.querySelector('svg');
        if (svgElStart) { svgElStart.outerHTML = iconPauseSVG(); }
        markPlayhead(state.step);
        state.timer = setTimeout(loop, nextDelayFor(state.step));
    }

    function stop() {
        state.playing = false;
        if (playBtn) playBtn.querySelector('span').textContent = '▶ Play';
        // Swap SVG to play icon for mobile
        const svgElStop = playBtn.querySelector('svg');
        if (svgElStop) { svgElStop.outerHTML = iconPlaySVG(); }
        playBtn.setAttribute('aria-pressed', 'false');
        if (state.timer) { clearTimeout(state.timer); state.timer = null; }
        announce('Drum machine stopped');
    }

    playBtn.addEventListener('click', async () => {
        try { if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume(); } catch { }
        state.playing ? stop() : start();
    });

    clearBtn.addEventListener('click', () => {
        pattern.forEach(row => row.fill(false));
        grid.querySelectorAll('.drum-step').forEach(el => el.classList.remove('on'));
        persistPattern();
    });

    randBtn.addEventListener('click', () => {
        pattern.forEach((row, r) => {
            row.forEach((_, c) => {
                const on = Math.random() < (r === 2 ? 0.3 : 0.2); // slightly more hats
                row[c] = on;
            });
        });
        // reflect UI
        const cells = grid.querySelectorAll('.drum-step');
        cells.forEach((el, i) => {
            const r = Math.floor(i / steps);
            const c = i % steps;
            el.classList.toggle('on', pattern[r][c]);
        });
        persistPattern();
    });

    // Hidden by default; toggled by hero avatar image
    wrap.style.display = 'none';

    function findHeroAvatar() {
        return document.querySelector('#hero-avatar, .avatar-container img, .hero img');
    }
    function toggleDrumVisibility() {
        const willShow = (wrap.style.display === 'none');
        if (!willShow && state.playing) { stop(); }
        wrap.style.display = willShow ? 'block' : 'none';
    }
    const heroImg = findHeroAvatar();
    if (heroImg && !heroImg.__drumBound) {
        heroImg.__drumBound = true;
        heroImg.style.cursor = 'pointer';
        heroImg.addEventListener('click', toggleDrumVisibility);
        // Stop playing if doodle not visible on screen or tab hidden
        try {
            const obs = new IntersectionObserver((entries) => {
                const e = entries[0];
                if (!e || !e.isIntersecting) { if (state.playing) stop(); }
            }, { threshold: 0.0 });
            obs.observe(wrap);
        } catch { /* no IO support */ }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.playing) stop();
        });
    }

    // focusable wrapper for keyboard control
    wrap.tabIndex = 0;
    wrap.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { e.preventDefault(); state.playing ? stop() : start(); }
        else if ((e.key === 'r' || e.key === 'R')) { e.preventDefault(); randBtn.click(); }
        else if ((e.key === 'c' || e.key === 'C')) { e.preventDefault(); clearBtn.click(); }
        else if (e.key === '1') { playHit(instruments[0]); }
        else if (e.key === '2') { playHit(instruments[1]); }
        else if (e.key === '3') { playHit(instruments[2]); }
        else if (e.key === '4') { playHit(instruments[3]); }
    });

    function playHit(inst) {
        if (state.mode === '808' && state.samples && state.samples[inst.key]) {
            const src = audioCtx.createBufferSource();
            src.buffer = state.samples[inst.key];
            const gain = audioCtx.createGain();
            gain.gain.value = 0.9;
            src.connect(gain).connect(audioCtx.destination);
            src.start();
            return;
        }
        // default synth fallback
        inst.synth();
    }

    // --- Embedded 808 mini-kit (generated on the fly, zero assets) ---
    function createBufferFromFn(seconds, renderFn) {
        const sr = audioCtx.sampleRate;
        const len = Math.max(1, Math.floor(seconds * sr));
        const buf = audioCtx.createBuffer(1, len, sr);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = renderFn(i, sr, len);
        return buf;
    }

    function mkKick808() {
        // 808-style sine drop with exponential amp decay ~160Hz -> 50Hz
        const dur = 0.35;
        const f0 = 160, f1 = 50;
        const tau = 0.18; // amplitude decay seconds
        return createBufferFromFn(dur, (i, sr) => {
            const t = i / sr;
            const f = f0 * Math.pow(f1 / f0, t / dur);
            const env = Math.exp(-t / tau);
            return Math.sin(2 * Math.PI * f * t) * env * 0.95;
        });
    }

    function mkSnare808() {
        // noise + short body tone, fast decay
        const dur = 0.22;
        const toneF = 180;
        const tauN = 0.12, tauT = 0.08;
        return createBufferFromFn(dur, (i, sr) => {
            const t = i / sr;
            const n = (Math.random() * 2 - 1) * Math.exp(-t / tauN);
            const tone = Math.sin(2 * Math.PI * toneF * t) * Math.exp(-t / tauT) * 0.35;
            return (n * 0.7 + tone) * 0.9;
        });
    }

    function mkHat808() {
        // short bright noise burst
        const dur = 0.07;
        const tau = 0.03;
        return createBufferFromFn(dur, (i, sr) => {
            const t = i / sr;
            // emphasis of highs via simple HP-ish curve
            const n = (Math.random() * 2 - 1);
            const hp = n - 0.6 * (Math.random() * 2 - 1);
            const env = Math.exp(-t / tau);
            return hp * env * 0.5;
        });
    }

    function mkClap808() {
        // three quick noise bursts approximating an 808 clap
        const dur = 0.18;
        const taps = [0, 0.013, 0.026];
        const tau = 0.06;
        return createBufferFromFn(dur, (i, sr, len) => {
            const t = i / sr;
            let v = 0;
            for (const o of taps) {
                const tt = Math.max(0, t - o);
                const env = Math.exp(-tt / tau);
                const n = (Math.random() * 2 - 1);
                v += n * env;
            }
            return (v / taps.length) * 0.6;
        });
    }

    function buildEmbedded808() {
        return {
            'Kick': mkKick808(),
            'Snare': mkSnare808(),
            'Hat': mkHat808(),
            'Clap': mkClap808()
        };
    }

    async function load808Samples() {
        if (!audioCtx) return null;

        // If no explicit base path is provided, default to embedded kit to avoid 404s
        const requestedBase = window.DRUM_SAMPLE_BASE;
        if (requestedBase === 'embedded' || requestedBase === false || typeof requestedBase === 'undefined' || requestedBase === null) {
            return buildEmbedded808();
        }

        // Otherwise, try to load from the provided base path and fall back per-file
        const base = String(requestedBase).replace(/\/$/, '/');
        if (!load808Samples._logged && base) {
            console.info('[Drum]', 'Trying external 808 samples from', base, '(set window.DRUM_SAMPLE_BASE = "embedded" to force offline kit)');
            load808Samples._logged = true;
        }
        const names = { 'Kick': 'kick', 'Snare': 'snare', 'Hat': 'hihat', 'Clap': 'clap' };
        const tryExt = ['.wav', '.mp3', '.ogg'];

        async function fetchDecodeOne(stem) {
            for (const ext of tryExt) {
                const url = base + stem + ext;
                try {
                    const res = await fetch(url, { cache: 'force-cache' });
                    if (!res.ok) { continue; }
                    const arr = await res.arrayBuffer();
                    return await audioCtx.decodeAudioData(arr);
                } catch (e) { /* try next */ }
            }
            return null;
        }

        const out = {};
        await Promise.all(Object.entries(names).map(async ([label, stem]) => {
            out[label] = await fetchDecodeOne(stem);
        }));

        // Fill any missing with embedded kit
        const embedded = buildEmbedded808();
        for (const k of Object.keys(names)) {
            if (!out[k]) out[k] = embedded[k];
        }
        return out;
    }

    // ARIA live announcer
    const ariaLive = wrap.querySelector('#drum-aria');
    function announce(msg) { if (ariaLive) ariaLive.textContent = msg; }

    persistPattern();
    drumMachine = { start, stop, state };
    // expose stoppers for integration
    window.stopDrumMachine = stop;
}

// ——— Simple drum synths (no samples) ———
function hitKick() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.16);
}
function hitSnare() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) { data[i] = (Math.random() * 2 - 1) * (1 - i / data.length); }
    noise.buffer = buffer;
    const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.5;
    const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.7, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    noise.connect(bp).connect(gain).connect(audioCtx.destination);
    noise.start(t); noise.stop(t + 0.2);
}
function hitHat() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) { data[i] = Math.random() * 2 - 1; }
    noise.buffer = buffer;
    const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000; hp.Q.value = 0.7;
    const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    noise.connect(hp).connect(gain).connect(audioCtx.destination);
    noise.start(t); noise.stop(t + 0.06);
}
function hitClap() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    // cluster of short noise bursts
    [0, 0.012, 0.025].forEach(offset => {
        const n = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.06, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) { data[i] = Math.random() * 2 - 1; }
        n.buffer = buffer;
        const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200; hp.Q.value = 0.8;
        const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.5, t + offset); gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.08);
        n.connect(hp).connect(gain).connect(audioCtx.destination);
        n.start(t + offset); n.stop(t + offset + 0.09);
    });
}
// === End Drum Machine ===

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

        button.addEventListener('click', async function () {
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
                setButtonState(this, true);
                syncMiniTo(this);

                if (currentAudio.src !== src) {
                    // Ensure CORS is enabled before setting a new HTTPS source
                    if (!currentAudio.crossOrigin) currentAudio.crossOrigin = 'anonymous';
                    currentAudio.src = src;
                    // Hint Safari to create a new decoder pipeline before play
                    if (currentAudio.readyState < 2) { try { currentAudio.load(); } catch { /* no-op */ } }
                    const type = this.getAttribute('data-type');
                    // Optionally set type via canPlayType hint
                    if (type && !currentAudio.canPlayType(type)) {
                        console.warn('Browser may not support audio type:', type);
                    }
                }

                currentAudio.currentTime = 0; // start fresh
                // Ensure WebAudio context is running before play (fixes iOS/Safari resume)
                if (audioCtx && audioCtx.state === 'suspended') { try { await audioCtx.resume(); } catch { /* ignore */ } }
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
                // Ensure last-write-wins after async events
                requestAnimationFrame(() => setButtonState(this, true));
                syncMiniTo(this);
            } catch (err) {
                console.error('Audio play failed:', err);
                showToast('Tap to enable audio');
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

    // Helper: make a short teaser + remainder
    function splitSnippet(text, max = 180) {
        if (!text) return { snippet: '', rest: '' };
        const t = String(text).trim();
        if (t.length <= max) return { snippet: t, rest: '' };
        const cut = t.indexOf(' ', max);
        return { snippet: t.slice(0, cut === -1 ? max : cut) + '…', rest: cut === -1 ? '' : t.slice(cut + 1) };
    }

    journalEntriesContainer.innerHTML = '';
    entries.forEach((entry, i) => {
        const { snippet, rest } = splitSnippet(entry.content || '', 200);
        const tags = Array.isArray(entry.tags) ? entry.tags : [];
        const tagList = tags.join(' ');
        const pill = tags.includes('song-idea') ? '🎶 Song Idea' :
                     tags.includes('lyric-sketch') ? '✍️ Lyric Sketch' :
                     tags.includes('studio-note') ? '🧪 Studio Note' : '🗒️ Note';

        const card = document.createElement('article');
        card.className = 'journal-card';
        card.setAttribute('data-tags', tagList);
        card.innerHTML = `
          <header class="journal-head">
            <time class="journal-date">${entry.date ?? ''}</time>
            <h3 class="journal-title">${entry.title ?? ''}</h3>
            <div class="journal-pill">${pill}</div>
          </header>
          <div class="journal-body">
            <p class="journal-snippet">${snippet}</p>
            <div class="journal-more" hidden>${rest ? `<p>${rest}</p>` : ''}</div>
            <button class="read-more" aria-expanded="false" ${rest ? '' : 'hidden'}>Read more</button>
          </div>`;
        journalEntriesContainer.appendChild(card);
    });

    // Let filter logic know items are ready
    journalEntriesContainer.dispatchEvent(new CustomEvent('journal:rendered'));
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

// —— Creative Journal UX ——
(function () {
    const root = document;
    const entriesWrap = root.getElementById('creative-journal-entries');
    if (!entriesWrap) return;
    // Ensure sticky is disabled even if cards render later
    disableStickyJournalHeaders();

    const search = root.getElementById('journal-search');
    const tagButtons = Array.from(root.querySelectorAll('.tag-filter'));

    function entryMatches(entry, q, tag) {
        const text = entry.innerText.toLowerCase();
        const tags = (entry.getAttribute('data-tags') || '').split(/\s+/);
        const qOk = !q || text.includes(q);
        const tagOk = !tag || tag === 'all' || tags.includes(tag);
        return qOk && tagOk;
    }

    function applyFilter() {
        const q = (search?.value || '').trim().toLowerCase();
        const activeBtn = tagButtons.find(b => b.classList.contains('is-active'));
        const tag = activeBtn ? activeBtn.getAttribute('data-tag') : 'all';
        const items = Array.from(entriesWrap.querySelectorAll('.journal-card'));
        entriesWrap.setAttribute('aria-busy', 'true');
        for (const el of items) {
            const show = entryMatches(el, q, tag);
            el.style.display = show ? '' : 'none';
        }
        entriesWrap.setAttribute('aria-busy', 'false');
    }

    // Read-more toggles
    entriesWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('.read-more');
        if (!btn) return;
        const card = btn.closest('.journal-card');
        const more = card?.querySelector('.journal-more');
        if (!more) return;
        const isOpen = !more.hasAttribute('hidden');
        if (isOpen) {
            more.setAttribute('hidden', '');
            btn.setAttribute('aria-expanded', 'false');
            btn.textContent = 'Read more';
        } else {
            more.removeAttribute('hidden');
            btn.setAttribute('aria-expanded', 'true');
            btn.textContent = 'Show less';
        }
    });

    // Tag filters
    tagButtons.forEach(b => b.addEventListener('click', () => {
        tagButtons.forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('is-active');
        b.setAttribute('aria-pressed', 'true');
        applyFilter();
    }));

    // Search
    search?.addEventListener('input', applyFilter);

    if (entriesWrap.querySelector('.journal-card')) {
        applyFilter();
    } else {
        entriesWrap.addEventListener('journal:rendered', () => { applyFilter(); disableStickyJournalHeaders(); }, { once: true });
    }
})();