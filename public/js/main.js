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
currentAudio.addEventListener('play', () => {
    if (typeof stopDrumMachine === 'function') {
        stopDrumMachine();
    }
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
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }

    // Inject styles once
    if (!document.getElementById('drum-style')) {
        const style = document.createElement('style');
        style.id = 'drum-style';
        style.textContent = `
        .drum-wrap{position:relative;margin:24px auto;max-width:960px;padding:16px;border-radius:12px;background:var(--card-bg,rgba(255,255,255,.06));backdrop-filter:saturate(1.2) blur(6px);box-shadow:0 6px 24px rgba(0,0,0,.12)}
        .drum-head{display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:12px}
        .drum-title{font-weight:700}
        .drum-ctrls{display:flex;gap:8px;align-items:center}
        .drum-grid{display:grid;grid-template-columns:56px repeat(16, minmax(0,1fr));gap:6px;user-select:none}
        .drum-label{display:flex;align-items:center;justify-content:flex-end;padding-right:6px;font-size:.9rem;opacity:.8}
        .drum-step{width:100%;aspect-ratio:1/1;border:0;border-radius:6px;background:var(--surface-2,#222);cursor:pointer}
        .drum-step.on{background:var(--accent,#5ef)}
        .drum-step.playing{outline:2px solid var(--accent-secondary,#ff6)}
        .drum-foot{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:12px}
        .drum-foot .left, .drum-foot .right{display:flex;gap:8px;align-items:center}
        .drum-btn{padding:8px 12px;border:0;border-radius:8px;background:var(--accent,#5ef);color:#000;font-weight:600;cursor:pointer}
        .drum-btn.tog{min-width:72px}
        .drum-bpm{display:flex;gap:8px;align-items:center}
        .drum-bpm input{width:160px}
        @media (max-width:700px){.drum-grid{grid-template-columns:40px repeat(16, minmax(0,1fr));}.drum-label{font-size:.8rem}}
        .drum-mode{display:flex;gap:6px;align-items:center;margin-right:8px}
        .drum-mode .mode[aria-pressed="true"]{outline:2px solid var(--accent-secondary,#ff6)}
        .drum-swing{display:flex;gap:8px;align-items:center;margin-left:8px}
        `;
        document.head.appendChild(style);
    }

    // Build container near top of page
    const host = document.querySelector('#drum-doodle') || document.querySelector('.hero') || document.body;
    const wrap = document.createElement('section');
    wrap.className = 'drum-wrap';
    wrap.setAttribute('aria-label','Drum Machine');
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
    `;
    if (host === document.body) {
        document.body.insertBefore(wrap, document.body.firstChild);
    } else {
        host.parentNode.insertBefore(wrap, host.nextSibling);
    }

    // Model
    const instruments = [
        { key:'Kick', synth: hitKick },
        { key:'Snare', synth: hitSnare },
        { key:'Hat',   synth: hitHat },
        { key:'Clap',  synth: hitClap }
    ];
    const steps = 16;
    const pattern = instruments.map(()=>Array.from({length:steps},()=>false));

    // UI grid
    const grid = wrap.querySelector('#drum-grid');
    instruments.forEach((inst, r)=>{
        const label = document.createElement('div');
        label.className = 'drum-label';
        label.textContent = inst.key;
        grid.appendChild(label);
        for (let c=0;c<steps;c++){
            const btn = document.createElement('button');
            btn.className = 'drum-step';
            btn.setAttribute('aria-label', `${inst.key} step ${c+1}`);
            btn.addEventListener('click', ()=>{
                pattern[r][c] = !pattern[r][c];
                btn.classList.toggle('on', pattern[r][c]);
            });
            grid.appendChild(btn);
        }
    });

    // Controls
    const playBtn = wrap.querySelector('#drum-play');
    const bpmSlider = wrap.querySelector('#drum-bpm');
    const bpmVal = wrap.querySelector('#drum-bpm-val');
    const clearBtn = wrap.querySelector('#drum-clear');
    const randBtn = wrap.querySelector('#drum-rand');

    const swingSlider = wrap.querySelector('#drum-swing');
    const swingVal = wrap.querySelector('#drum-swing-val');
    const modeSynthBtn = wrap.querySelector('#drum-mode-synth');
    const mode808Btn = wrap.querySelector('#drum-mode-808');

    const state = { playing:false, step:0, bpm:parseInt(bpmSlider.value,10)||110, swing:parseInt(swingSlider.value,10)||0, timer:null, mode:'synth', samples:null };

    bpmSlider.addEventListener('input', ()=>{ state.bpm = parseInt(bpmSlider.value,10); bpmVal.textContent = String(state.bpm); if (state.playing) restartLoop(); });

    swingSlider.addEventListener('input', ()=>{ state.swing = parseInt(swingSlider.value,10); swingVal.textContent = `${state.swing}%`; if (state.playing) restartLoop(); });

    function setMode(mode){
        state.mode = mode;
        modeSynthBtn.setAttribute('aria-pressed', mode==='synth' ? 'true' : 'false');
        mode808Btn.setAttribute('aria-pressed', mode==='808' ? 'true' : 'false');
    }

    modeSynthBtn.addEventListener('click', ()=> setMode('synth'));
    mode808Btn.addEventListener('click', async ()=>{
        setMode('808');
        if (!state.samples) { state.samples = await load808Samples(); }
    });

    function advance(){ state.step = (state.step+1)%steps; markPlayhead(state.step); }

    function markPlayhead(s){
        const cells = grid.querySelectorAll('.drum-step');
        cells.forEach((el,i)=>{
            const col = i % steps; // each row has 16 cells
            el.classList.toggle('playing', col===s);
        });
    }

    function baseStepMs(){ return (60/state.bpm/4)*1000; }

    function nextDelayFor(step){
        // Swing applies to off-beats (odd steps in 0-based indexing)
        const swingAmt = (state.swing/100)*0.5; // max shift 50% of 16th
        const base = baseStepMs();
        if (state.swing<=0) return base;
        return (step % 2 === 1) ? base*(1 + swingAmt) : base*(1 - swingAmt);
    }

    function loop(){
        // schedule hits for this step
        instruments.forEach((inst, r)=>{
            if (pattern[r][state.step]) playHit(inst);
        });
        advance();
        const delay = nextDelayFor(state.step);
        state.timer = setTimeout(loop, delay);
    }

    function restartLoop(){
        if (state.timer){ clearTimeout(state.timer); state.timer=null; }
        if (state.playing){ state.timer = setTimeout(loop, nextDelayFor(state.step)); }
    }

    function start(){
        try{ if (currentAudio && !currentAudio.paused) currentAudio.pause(); }catch{}
        if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume().catch(()=>{}); }
        if (state.timer) return;
        state.playing = true;
        playBtn.textContent = '⏸ Pause';
        playBtn.setAttribute('aria-pressed','true');
        markPlayhead(state.step);
        state.timer = setTimeout(loop, nextDelayFor(state.step));
    }

    function stop(){
        state.playing = false;
        playBtn.textContent = '▶ Play';
        playBtn.setAttribute('aria-pressed','false');
        if (state.timer){ clearTimeout(state.timer); state.timer=null; }
    }

    playBtn.addEventListener('click', ()=>{ state.playing ? stop() : start(); });

    clearBtn.addEventListener('click', ()=>{
        pattern.forEach(row=>row.fill(false));
        grid.querySelectorAll('.drum-step').forEach(el=>el.classList.remove('on'));
    });

    randBtn.addEventListener('click', ()=>{
        pattern.forEach((row,r)=>{
            row.forEach((_,c)=>{
                const on = Math.random() < (r===2?0.3:0.2); // slightly more hats
                row[c]=on;
            });
        });
        // reflect UI
        const cells = grid.querySelectorAll('.drum-step');
        cells.forEach((el,i)=>{
            const r = Math.floor(i/steps);
            const c = i%steps;
            el.classList.toggle('on', pattern[r][c]);
        });
    });

    // Hidden by default; toggled by hero avatar image
    wrap.style.display = 'none';

    function findHeroAvatar(){
        return document.querySelector('#hero-avatar, .avatar-container img, .hero img');
    }
    function toggleDrumVisibility(){
        wrap.style.display = (wrap.style.display === 'none') ? 'block' : 'none';
    }
    const heroImg = findHeroAvatar();
    if (heroImg && !heroImg.__drumBound){
        heroImg.__drumBound = true;
        heroImg.style.cursor = 'pointer';
        heroImg.addEventListener('click', toggleDrumVisibility);
    }

    function playHit(inst){
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
    function createBufferFromFn(seconds, renderFn){
        const sr = audioCtx.sampleRate;
        const len = Math.max(1, Math.floor(seconds * sr));
        const buf = audioCtx.createBuffer(1, len, sr);
        const ch = buf.getChannelData(0);
        for (let i=0; i<len; i++) ch[i] = renderFn(i, sr, len);
        return buf;
    }

    function mkKick808(){
        // 808-style sine drop with exponential amp decay ~160Hz -> 50Hz
        const dur = 0.35;
        const f0 = 160, f1 = 50;
        const tau = 0.18; // amplitude decay seconds
        return createBufferFromFn(dur, (i, sr)=>{
            const t = i/sr;
            const f = f0 * Math.pow(f1/f0, t/dur);
            const env = Math.exp(-t/tau);
            return Math.sin(2*Math.PI*f*t) * env * 0.95;
        });
    }

    function mkSnare808(){
        // noise + short body tone, fast decay
        const dur = 0.22;
        const toneF = 180;
        const tauN = 0.12, tauT = 0.08;
        return createBufferFromFn(dur, (i, sr)=>{
            const t = i/sr;
            const n = (Math.random()*2-1) * Math.exp(-t/tauN);
            const tone = Math.sin(2*Math.PI*toneF*t) * Math.exp(-t/tauT) * 0.35;
            return (n*0.7 + tone) * 0.9;
        });
    }

    function mkHat808(){
        // short bright noise burst
        const dur = 0.07;
        const tau = 0.03;
        return createBufferFromFn(dur, (i, sr)=>{
            const t = i/sr;
            // emphasis of highs via simple HP-ish curve
            const n = (Math.random()*2-1);
            const hp = n - 0.6*(Math.random()*2-1);
            const env = Math.exp(-t/tau);
            return hp * env * 0.5;
        });
    }

    function mkClap808(){
        // three quick noise bursts approximating an 808 clap
        const dur = 0.18;
        const taps = [0, 0.013, 0.026];
        const tau = 0.06;
        return createBufferFromFn(dur, (i, sr, len)=>{
            const t = i/sr;
            let v = 0;
            for (const o of taps){
                const tt = Math.max(0, t - o);
                const env = Math.exp(-tt/tau);
                const n = (Math.random()*2-1);
                v += n * env;
            }
            return (v/ taps.length) * 0.6;
        });
    }

    function buildEmbedded808(){
        return {
            'Kick': mkKick808(),
            'Snare': mkSnare808(),
            'Hat': mkHat808(),
            'Clap': mkClap808()
        };
    }

    async function load808Samples(){
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
        const names = { 'Kick':'kick','Snare':'snare','Hat':'hihat','Clap':'clap' };
        const tryExt = ['.wav', '.mp3', '.ogg'];

        async function fetchDecodeOne(stem){
            for (const ext of tryExt){
                const url = base + stem + ext;
                try {
                    const res = await fetch(url, { cache: 'force-cache' });
                    if (!res.ok) { continue; }
                    const arr = await res.arrayBuffer();
                    return await audioCtx.decodeAudioData(arr);
                } catch(e){ /* try next */ }
            }
            return null;
        }

        const out = {};
        await Promise.all(Object.entries(names).map(async ([label, stem])=>{
            out[label] = await fetchDecodeOne(stem);
        }));

        // Fill any missing with embedded kit
        const embedded = buildEmbedded808();
        for (const k of Object.keys(names)){
            if (!out[k]) out[k] = embedded[k];
        }
        return out;
    }

    drumMachine = { start, stop, state };
    // expose stoppers for integration
    window.stopDrumMachine = stop;
}

// ——— Simple drum synths (no samples) ———
function hitKick(){
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t+0.12);
    gain.gain.setValueAtTime(0.9,t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t); osc.stop(t+0.16);
}
function hitSnare(){
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.2, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){ data[i] = (Math.random()*2-1) * (1 - i/data.length); }
    noise.buffer = buffer;
    const bp = audioCtx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1800; bp.Q.value=0.5;
    const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.7,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.18);
    noise.connect(bp).connect(gain).connect(audioCtx.destination);
    noise.start(t); noise.stop(t+0.2);
}
function hitHat(){
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.05, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){ data[i] = Math.random()*2-1; }
    noise.buffer = buffer;
    const hp = audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=6000; hp.Q.value=0.7;
    const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.4,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.05);
    noise.connect(hp).connect(gain).connect(audioCtx.destination);
    noise.start(t); noise.stop(t+0.06);
}
function hitClap(){
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    // cluster of short noise bursts
    [0,0.012,0.025].forEach(offset=>{
        const n = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.06, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0;i<data.length;i++){ data[i] = Math.random()*2-1; }
        n.buffer = buffer;
        const hp = audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1200; hp.Q.value=0.8;
        const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.5,t+offset); gain.gain.exponentialRampToValueAtTime(0.001, t+offset+0.08);
        n.connect(hp).connect(gain).connect(audioCtx.destination);
        n.start(t+offset); n.stop(t+offset+0.09);
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