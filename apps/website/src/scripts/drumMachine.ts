// src/scripts/drumMachine.ts
// Astro-compatible Drum Machine logic (clean implementation)

// Extend Window for custom properties
declare global {
    interface Window {
        drumMachine?: {
            start: () => void;
            stop: () => void;
            state: {
                playing: boolean;
                step: number;
                bpm: number;
                timer: number | null;
                samples: Record<string, AudioBuffer> | null;
            };
            randomize: () => void;
            clear: () => void;
        };
        audioCtx?: AudioContext;
        initializeDrumMachine?: typeof initializeDrumMachine;
    }
}

// ---- Public entry ----
export function initializeDrumMachine() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.log('Window or document undefined');
        return;
    }
    // Avoid double init
    if (window.drumMachine) {
        console.log('Drum machine already initialized');
        return;
    }

    console.log('Starting drum machine initialization...');

    // Ensure AudioContext exists (reuse site context if present)
    let audioCtx = window.audioCtx;
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
    } catch (e) {
        console.warn('AudioContext creation failed:', e);
    }
    window.audioCtx = audioCtx ? audioCtx : undefined;

    // Host & wrapper
    const host =
        document.querySelector('#drum-doodle') ||
        document.querySelector('.hero') ||
        document.body;

    console.log('Drum machine host element:', host);
    console.log(
        'Found #drum-doodle:',
        !!document.querySelector('#drum-doodle')
    );

    const wrap = document.createElement('section');
    wrap.className = 'drum-wrap';
    wrap.setAttribute('aria-label', 'Drum Machine');

    // Note: All drum machine styles are now in drumMachine.css

    // Controls UI
    wrap.innerHTML = `
    <div class="drum-head">
      <span class="drum-title">Drum Machine</span>
      <div class="drum-ctrls">
        <button class="drum-btn" id="drum-play"><span>▶ Play</span></button>
        <button class="drum-btn" id="drum-stop">■ Stop</button>
        <button class="drum-btn" id="drum-clear">🧹 Clear</button>
        <button class="drum-btn" id="drum-rand">🎲 Randomize</button>
        <label class="drum-bpm">BPM <input type="number" id="drum-bpm" value="120" min="60" max="220" /></label>
      </div>
    </div>
    <div class="drum-grid" id="drum-grid" role="grid" aria-label="Step sequencer"></div>
    <div class="drum-scroll-hint" id="drum-scroll-hint">← Scroll horizontally to see all steps →</div>
    <div id="drum-aria" class="sr-only" aria-live="polite"></div>
  `;

    // Create grid: 4 instruments x 16 steps
    const instruments: { key: string; synth: () => void }[] = [
        { key: 'Kick', synth: hitKick },
        { key: 'Snare', synth: hitSnare },
        { key: 'Hat', synth: hitHat },
        { key: 'Clap', synth: hitClap },
    ];
    const steps = 16;
    const pattern: boolean[][] = instruments.map(() =>
        Array.from({ length: steps }, () => false)
    );

    const grid = wrap.querySelector('#drum-grid') as HTMLElement;
    for (let r = 0; r < instruments.length; r++) {
        const label = document.createElement('div');
        label.className = 'drum-label';
        label.textContent = instruments[r].key;
        grid.appendChild(label);
        for (let c = 0; c < steps; c++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'drum-step';
            btn.setAttribute(
                'aria-label',
                `${instruments[r].key} step ${c + 1}`
            );
            btn.addEventListener('pointerdown', e => {
                e.preventDefault(); // Prevent scrolling on mobile
                pattern[r][c] = !pattern[r][c];
                btn.classList.toggle('on', pattern[r][c]);

                // Add haptic feedback on mobile if available
                if ('vibrate' in navigator && navigator.vibrate) {
                    navigator.vibrate(10);
                }
            });
            grid.appendChild(btn);
        }
    }

    // Controls wiring
    const playBtn = wrap.querySelector(
        '#drum-play'
    ) as HTMLButtonElement | null;
    const stopBtn = wrap.querySelector(
        '#drum-stop'
    ) as HTMLButtonElement | null;
    const clearBtn = wrap.querySelector(
        '#drum-clear'
    ) as HTMLButtonElement | null;
    const randBtn = wrap.querySelector(
        '#drum-rand'
    ) as HTMLButtonElement | null;
    const bpmInput = wrap.querySelector('#drum-bpm') as HTMLInputElement | null;
    const ariaLive = wrap.querySelector('#drum-aria') as HTMLElement | null;

    const state = {
        playing: false,
        step: 0,
        bpm: bpmInput ? parseInt(bpmInput.value, 10) : 120,
        timer: null as number | null,
        samples: null as Record<string, AudioBuffer> | null,
    };

    // Load embedded samples up-front (fallback to simple synths if no AudioContext)
    (async () => {
        if (audioCtx) {
            const loaded = await load808Samples();
            state.samples = loaded;
        }
    })();

    function baseStepMs() {
        return (60 / state.bpm / 4) * 1000;
    }

    function markPlayhead(col: number) {
        const cells = grid.querySelectorAll('.drum-step');
        cells.forEach((el, i) => {
            const c = i % steps;
            el.classList.toggle('playing', c === col);
        });
    }

    function loop() {
        instruments.forEach((inst, r) => {
            if (pattern[r][state.step]) playHit(inst);
        });
        state.step = (state.step + 1) % steps;
        markPlayhead(state.step);
        state.timer = window.setTimeout(loop, baseStepMs());
    }

    function start() {
        if (!audioCtx) {
            announce('Audio not available in this browser.');
            return;
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (state.timer) return; // already running
        state.playing = true;
        announce('Drum machine playing');
        markPlayhead(state.step);
        state.timer = window.setTimeout(loop, baseStepMs());
        if (playBtn) playBtn.querySelector('span')!.textContent = '⏸ Pause';
    }

    function stop() {
        state.playing = false;
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        announce('Drum machine stopped');
        if (playBtn) playBtn.querySelector('span')!.textContent = '▶ Play';
    }

    function announce(msg: string) {
        if (ariaLive) ariaLive.textContent = msg;
    }

    function randomize() {
        for (let r = 0; r < instruments.length; r++) {
            for (let c = 0; c < steps; c++) {
                const on = Math.random() < (r === 2 ? 0.3 : 0.2);
                pattern[r][c] = on;
                const idx = r * (steps + 1) + 1 + c; // +1 for the sticky label
                const cell = grid.children[idx] as HTMLElement;
                if (cell) cell.classList.toggle('on', on);
            }
        }
    }

    function clearAll() {
        for (let r = 0; r < instruments.length; r++) {
            for (let c = 0; c < steps; c++) {
                pattern[r][c] = false;
                const idx = r * (steps + 1) + 1 + c;
                const cell = grid.children[idx] as HTMLElement;
                if (cell) cell.classList.remove('on');
            }
        }
    }

    // Event listeners
    playBtn?.addEventListener('click', () =>
        state.playing ? stop() : start()
    );
    stopBtn?.addEventListener('click', stop);
    clearBtn?.addEventListener('click', clearAll);
    randBtn?.addEventListener('click', randomize);
    bpmInput?.addEventListener('input', () => {
        state.bpm = parseInt(bpmInput.value || '120', 10);
        if (state.playing) {
            if (state.timer) {
                clearTimeout(state.timer);
                state.timer = null;
            }
            state.timer = window.setTimeout(loop, baseStepMs());
        }
    });

    // Hide scroll hint on desktop or after interaction
    const scrollHint = wrap.querySelector('#drum-scroll-hint') as HTMLElement;
    if (scrollHint) {
        // Hide on desktop
        if (window.innerWidth > 700) {
            scrollHint.style.display = 'none';
        }

        // Hide after first grid interaction
        let interacted = false;
        grid.addEventListener(
            'scroll',
            () => {
                if (!interacted && scrollHint) {
                    scrollHint.style.opacity = '0';
                    setTimeout(() => (scrollHint.style.display = 'none'), 300);
                    interacted = true;
                }
            },
            { once: true }
        );

        // Also hide on any step click
        grid.addEventListener(
            'pointerdown',
            () => {
                if (!interacted && scrollHint) {
                    scrollHint.style.opacity = '0';
                    setTimeout(() => (scrollHint.style.display = 'none'), 300);
                    interacted = true;
                }
            },
            { once: true }
        );
    }

    // Mount into DOM - place inside the #drum-doodle container
    console.log('Mounting drum machine. Host found:', !!host, 'ID:', host?.id);

    if (host && host.id === 'drum-doodle') {
        console.log('Mounting inside #drum-doodle container');
        // Clear any existing content first
        host.innerHTML = '';
        host.appendChild(wrap);
        console.log('Drum machine successfully mounted in container');
    } else {
        console.warn(
            'Could not find #drum-doodle container, drum machine may not display properly'
        );
        // Fallback mounting
        if (host === document.body) {
            document.body.insertBefore(wrap, document.body.firstChild);
        } else if (host && host.parentNode) {
            host.parentNode.insertBefore(wrap, host.nextSibling);
        } else {
            document.body.appendChild(wrap);
        }
    }

    // Expose minimal API
    window.drumMachine = {
        start,
        stop,
        state,
        randomize,
        clear: clearAll,
    };

    // --- Synthesis & sample helpers ---

    function playHit(inst: { key: string; synth: () => void }) {
        if (!audioCtx) return;
        if (state.samples && state.samples[inst.key]) {
            const src = audioCtx.createBufferSource();
            src.buffer = state.samples[inst.key];
            const gain = audioCtx.createGain();
            gain.gain.value = 0.9;
            src.connect(gain).connect(audioCtx.destination);
            src.start();
            return;
        }
        inst.synth();
    }

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
        osc.start(t);
        osc.stop(t + 0.16);
    }
    function hitSnare() {
        if (!audioCtx) return;
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }
    function hitHat() {
        if (!audioCtx) return;
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(8000, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.04);
    }
    function hitClap() {
        if (!audioCtx) return;
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1000, t);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    function createBufferFromFn(
        seconds: number,
        renderFn: (i: number, sr: number, len: number) => number
    ): AudioBuffer | null {
        if (!audioCtx) return null;
        const sr = audioCtx.sampleRate;
        const len = Math.max(1, Math.floor(seconds * sr));
        const buf = audioCtx.createBuffer(1, len, sr);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = renderFn(i, sr, len);
        return buf;
    }
    function mkKick808() {
        const dur = 0.35;
        const f0 = 160,
            f1 = 50;
        const tau = 0.18;
        return createBufferFromFn(dur, (i, sr) => {
            const t = i / sr;
            const f = f0 * Math.pow(f1 / f0, t / dur);
            const env = Math.exp(-t / tau);
            return Math.sin(2 * Math.PI * f * t) * env * 0.95;
        });
    }
    function mkSnare808() {
        const dur = 0.22;
        const toneF = 180;
        const tauN = 0.12,
            tauT = 0.08;
        return createBufferFromFn(dur, (i, sr) => {
            const t = i / sr;
            const n = (Math.random() * 2 - 1) * Math.exp(-t / tauN);
            const tone =
                Math.sin(2 * Math.PI * toneF * t) * Math.exp(-t / tauT) * 0.35;
            return (n * 0.7 + tone) * 0.9;
        });
    }
    function mkHat808() {
        const dur = 0.07;
        const tau = 0.03;
        return createBufferFromFn(dur, (i, sr) => {
            const t = i / sr;
            const n = Math.random() * 2 - 1;
            const hp = n - 0.6 * (Math.random() * 2 - 1);
            const env = Math.exp(-t / tau);
            return hp * env * 0.5;
        });
    }
    function mkClap808() {
        const dur = 0.18;
        const taps = [0, 0.013, 0.026];
        const tau = 0.06;
        return createBufferFromFn(dur, (i, sr) => {
            const t = i / sr;
            let v = 0;
            for (const o of taps) {
                const tt = Math.max(0, t - o);
                const env = Math.exp(-tt / tau);
                const n = Math.random() * 2 - 1;
                v += n * env;
            }
            return (v / taps.length) * 0.6;
        });
    }
    function buildEmbedded808() {
        return {
            Kick: mkKick808(),
            Snare: mkSnare808(),
            Hat: mkHat808(),
            Clap: mkClap808(),
        };
    }
    async function load808Samples() {
        const embedded = buildEmbedded808();
        const out: Record<string, AudioBuffer> = {};
        (Object.keys(embedded) as (keyof typeof embedded)[]).forEach(k => {
            const b = embedded[k];
            if (b) out[k] = b;
        });
        return out;
    }
}

// Attach to window for browser usage (manual init only)
if (typeof window !== 'undefined') {
    window.initializeDrumMachine = initializeDrumMachine;
}
