function de() {
    if (window.drumMachine) return;
    let r = window.audioCtx;
    try {
        r || (r = new window.AudioContext());
    } catch {}
    if (
        ((window.audioCtx = r || void 0),
        !document.getElementById('drum-style'))
    ) {
        const e = document.createElement('style');
        ((e.id = 'drum-style'),
            (e.textContent = `
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
        `),
            document.head.appendChild(e));
    }
    const T =
            document.querySelector('#drum-doodle') ||
            document.querySelector('.hero') ||
            document.body,
        l = document.createElement('section');
    if (
        ((l.className = 'drum-wrap'),
        l.setAttribute('aria-label', 'Drum Machine'),
        (l.innerHTML = `
            <div class="drum-head">
                <span class="drum-title">Drum Machine</span>
                <div class="drum-ctrls">
                    <button class="drum-btn" id="drum-play">Play</button>
                    <button class="drum-btn" id="drum-stop">Stop</button>
                    <label class="drum-bpm">BPM: <input type="number" id="drum-bpm" value="120" min="60" max="200" /></label>
                </div>
            </div>
            <div class="drum-grid">
                <div class="drum-label">Kick</div>
                ${Array.from({ length: 16 })
                    .map(
                        (e, t) =>
                            `<div class="drum-step" data-sound="kick" data-step="${t}"></div>`
                    )
                    .join('')}
                <div class="drum-label">Snare</div>
                ${Array.from({ length: 16 })
                    .map(
                        (e, t) =>
                            `<div class="drum-step" data-sound="snare" data-step="${t}"></div>`
                    )
                    .join('')}
                <div class="drum-label">HiHat</div>
                ${Array.from({ length: 16 })
                    .map(
                        (e, t) =>
                            `<div class="drum-step" data-sound="hihat" data-step="${t}"></div>`
                    )
                    .join('')}
            </div>
            <div class="drum-foot">
                <div class="left">Modern Drum Machine UI</div>
                <div class="right">Powered by Lukeus Music Lab</div>
            </div>
        `),
        window.matchMedia('(max-width: 700px)').matches)
    ) {
        const e = document.createElement('div');
        ((e.className = 'drum-scroll-hint'),
            (e.textContent = 'Swipe sideways to see all steps →'),
            l.appendChild(e));
    }
    T === document.body
        ? document.body.insertBefore(l, document.body.firstChild)
        : T.parentNode && T.parentNode.insertBefore(l, T.nextSibling);
    function J() {
        if (!r) return;
        const e = r.currentTime,
            t = r.createOscillator(),
            n = r.createGain();
        ((t.type = 'sine'),
            t.frequency.setValueAtTime(150, e),
            t.frequency.exponentialRampToValueAtTime(50, e + 0.12),
            n.gain.setValueAtTime(0.9, e),
            n.gain.exponentialRampToValueAtTime(0.001, e + 0.15),
            t.connect(n).connect(r.destination),
            t.start(e),
            t.stop(e + 0.16));
    }
    function U() {
        if (!r) return;
        const e = r.currentTime,
            t = r.createBufferSource(),
            n = r.createBuffer(1, r.sampleRate * 0.2, r.sampleRate),
            c = n.getChannelData(0);
        for (let i = 0; i < c.length; i++)
            c[i] = (Math.random() * 2 - 1) * (1 - i / c.length);
        t.buffer = n;
        const o = r.createBiquadFilter();
        ((o.type = 'bandpass'), (o.frequency.value = 1800), (o.Q.value = 0.5));
        const s = r.createGain();
        (s.gain.setValueAtTime(0.7, e),
            s.gain.exponentialRampToValueAtTime(0.001, e + 0.18),
            t.connect(o).connect(s).connect(r.destination),
            t.start(e),
            t.stop(e + 0.2));
    }
    function Y() {
        if (!r) return;
        const e = r.currentTime,
            t = r.createBufferSource(),
            n = r.createBuffer(1, r.sampleRate * 0.05, r.sampleRate),
            c = n.getChannelData(0);
        for (let i = 0; i < c.length; i++) c[i] = Math.random() * 2 - 1;
        t.buffer = n;
        const o = r.createBiquadFilter();
        ((o.type = 'highpass'), (o.frequency.value = 6e3), (o.Q.value = 0.7));
        const s = r.createGain();
        (s.gain.setValueAtTime(0.4, e),
            s.gain.exponentialRampToValueAtTime(0.001, e + 0.05),
            t.connect(o).connect(s).connect(r.destination),
            t.start(e),
            t.stop(e + 0.06));
    }
    function W() {
        if (!r) return;
        const e = r.currentTime;
        [0, 0.012, 0.025].forEach(t => {
            const n = r.createBufferSource(),
                c = r.createBuffer(1, r.sampleRate * 0.06, r.sampleRate),
                o = c.getChannelData(0);
            for (let d = 0; d < o.length; d++) o[d] = Math.random() * 2 - 1;
            n.buffer = c;
            const s = r.createBiquadFilter();
            ((s.type = 'highpass'),
                (s.frequency.value = 1200),
                (s.Q.value = 0.8));
            const i = r.createGain();
            (i.gain.setValueAtTime(0.5, e + t),
                i.gain.exponentialRampToValueAtTime(0.001, e + t + 0.08),
                n.connect(s).connect(i).connect(r.destination),
                n.start(e + t),
                n.stop(e + t + 0.09));
        });
    }
    const M = [
            { key: 'Kick', synth: J },
            { key: 'Snare', synth: U },
            { key: 'Hat', synth: Y },
            { key: 'Clap', synth: W },
        ],
        h = 16,
        b = M.map(() => Array.from({ length: h }, () => !1)),
        f = l.querySelector('#drum-grid'),
        k = { painting: !1, value: !0 };
    M.forEach((e, t) => {
        const n = document.createElement('div');
        n.className = 'drum-label';
        const c = document.createElement('div');
        c.className = 'drum-label-btn';
        const o = document.createElement('span');
        o.textContent = e.key;
        const s = document.createElement('button');
        ((s.className = 'drum-micro'),
            (s.type = 'button'),
            (s.textContent = '▶'),
            (s.title = `Audition ${e.key}`),
            s.addEventListener('click', () => R(e)));
        let i = null;
        function d() {
            i !== null && (clearTimeout(i), (i = null));
        }
        (n.addEventListener('pointerdown', () => {
            (d(),
                (i = window.setTimeout(() => {
                    R(e);
                }, 320)));
        }),
            n.addEventListener('pointerup', d),
            n.addEventListener('pointerleave', d),
            c.appendChild(o),
            c.appendChild(s),
            n.appendChild(c),
            f && f.appendChild(n));
        for (let m = 0; m < h; m++) {
            const p = document.createElement('button');
            ((p.className = 'drum-step'),
                p.setAttribute('aria-label', `${e.key} step ${m + 1}`));
            const y = g => {
                ((b[t][m] = g), p.classList.toggle('on', g));
                try {
                    navigator.vibrate && navigator.vibrate(10);
                } catch {}
                w();
            };
            (p.addEventListener('pointerdown', g => {
                var Q;
                (Q = p.setPointerCapture) == null || Q.call(p, g.pointerId);
                const K = !b[t][m];
                ((k.painting = !0), (k.value = K), y(K));
            }),
                p.addEventListener('pointerenter', () => {
                    k.painting && y(k.value);
                }),
                p.addEventListener('pointerup', () => {
                    k.painting = !1;
                }),
                p.addEventListener('lostpointercapture', () => {
                    k.painting = !1;
                }),
                p.addEventListener('click', g => {
                    g.preventDefault();
                }),
                f && f.appendChild(p));
        }
    });
    const u = l.querySelector('#drum-play');
    u &&
        (u.innerHTML =
            '<span>▶ Play</span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>');
    const x = l.querySelector('#drum-bpm'),
        L = l.querySelector('#drum-bpm-val'),
        C = l.querySelector('#drum-clear'),
        A = l.querySelector('#drum-rand'),
        v = l.querySelector('#drum-swing'),
        q = l.querySelector('#drum-swing-val'),
        B = l.querySelector('#drum-mode-synth'),
        D = l.querySelector('#drum-mode-808'),
        a = {
            playing: !1,
            step: 0,
            bpm: (x && parseInt(x.value, 10)) || 110,
            swing: (v && parseInt(v.value, 10)) || 0,
            timer: null,
            mode: 'synth',
            samples: null,
        },
        _ = 'mlab_drum_v1';
    function w() {
        try {
            const e = { pattern: b, bpm: a.bpm, swing: a.swing, mode: a.mode };
            localStorage.setItem(_, JSON.stringify(e));
        } catch {}
    }
    function X() {
        try {
            const e = localStorage.getItem(_);
            if (!e) return;
            const { pattern: t, bpm: n, swing: c, mode: o } = JSON.parse(e);
            if (
                Array.isArray(t) &&
                t.length === M.length &&
                Array.isArray(t[0]) &&
                t[0].length === h
            )
                for (let s = 0; s < M.length; s++)
                    for (let i = 0; i < h; i++) b[s][i] = t[s][i];
            (typeof n == 'number' &&
                x &&
                L &&
                ((a.bpm = n),
                (x.value = String(n)),
                (L.textContent = String(n))),
                typeof c == 'number' &&
                    v &&
                    q &&
                    ((a.swing = c),
                    (v.value = `${c}`),
                    (q.textContent = `${c}%`)),
                (o === '808' || o === 'synth') && V(o));
        } catch {}
    }
    X();
    function V(e) {
        ((a.mode = e),
            B &&
                B.setAttribute(
                    'aria-pressed',
                    e === 'synth' ? 'true' : 'false'
                ),
            D && D.setAttribute('aria-pressed', e === '808' ? 'true' : 'false'),
            w());
    }
    (B && B.addEventListener('click', () => V('synth')),
        D &&
            D.addEventListener('click', async () => {
                if ((V('808'), !a.samples)) {
                    const e = await le();
                    a.samples = e
                        ? Object.fromEntries(
                              Object.entries(e).filter(([t, n]) => n !== null)
                          )
                        : null;
                }
            }),
        x &&
            L &&
            x.addEventListener('input', () => {
                ((a.bpm = parseInt(x.value, 10)),
                    (L.textContent = String(a.bpm)),
                    a.playing && j(),
                    w());
            }),
        v &&
            q &&
            v.addEventListener('input', () => {
                ((a.swing = parseInt(v.value, 10)),
                    (q.textContent = `${a.swing}%`),
                    a.playing && j(),
                    w());
            }));
    function Z() {
        ((a.step = (a.step + 1) % h), $(a.step), ee(a.step));
    }
    function $(e) {
        if (!f) return;
        f.querySelectorAll('.drum-step').forEach((n, c) => {
            const o = c % h;
            n.classList.toggle('playing', o === e);
        });
    }
    function ee(e) {
        if (!window.matchMedia('(max-width: 700px)').matches || !f) return;
        const t = f.querySelectorAll('.drum-step')[e];
        t &&
            t.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
    }
    function te() {
        return (60 / a.bpm / 4) * 1e3;
    }
    function z(e) {
        const t = (a.swing / 100) * 0.5,
            n = te();
        return a.swing <= 0 ? n : e % 2 === 1 ? n * (1 + t) : n * (1 - t);
    }
    function I() {
        (M.forEach((t, n) => {
            b[n][a.step] && R(t);
        }),
            Z());
        const e = z(a.step);
        a.timer = setTimeout(I, e);
    }
    function j() {
        (a.timer && (clearTimeout(a.timer), (a.timer = null)),
            a.playing &&
                l.style.display !== 'none' &&
                (a.timer = setTimeout(I, z(a.step))));
    }
    function H() {
        if (
            (G('Drum machine playing'),
            r && r.state === 'suspended' && r.resume().catch(() => {}),
            !a.timer)
        ) {
            if (((a.playing = !0), l.style.display === 'none')) {
                if (((a.playing = !1), u)) {
                    const e = u.querySelector('span');
                    e && (e.textContent = '▶ Play');
                    const t = u.querySelector('svg');
                    (t && (t.outerHTML = N()),
                        u.setAttribute('aria-pressed', 'false'));
                }
                return;
            }
            if (u) {
                const e = u.querySelector('span');
                (e && (e.textContent = '⏸ Pause'),
                    u.setAttribute('aria-pressed', 'true'));
                const t = u.querySelector('svg');
                t && (t.outerHTML = ne());
            }
            ($(a.step), (a.timer = setTimeout(I, z(a.step))));
        }
    }
    function S() {
        if (((a.playing = !1), u)) {
            const e = u.querySelector('span');
            e && (e.textContent = '▶ Play');
            const t = u.querySelector('svg');
            (t && (t.outerHTML = N()), u.setAttribute('aria-pressed', 'false'));
        }
        (a.timer && (clearTimeout(a.timer), (a.timer = null)),
            G('Drum machine stopped'));
    }
    function N() {
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    }
    function ne() {
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
    }
    (u &&
        u.addEventListener('click', async () => {
            try {
                r && r.state === 'suspended' && (await r.resume());
            } catch {}
            a.playing ? S() : H();
        }),
        C &&
            C.addEventListener('click', () => {
                (b.forEach(e => e.fill(!1)),
                    f &&
                        f
                            .querySelectorAll('.drum-step')
                            .forEach(e => e.classList.remove('on')),
                    w());
            }),
        A &&
            A.addEventListener('click', () => {
                (b.forEach((e, t) => {
                    e.forEach((n, c) => {
                        const o = Math.random() < (t === 2 ? 0.3 : 0.2);
                        e[c] = o;
                    });
                }),
                    f &&
                        f.querySelectorAll('.drum-step').forEach((t, n) => {
                            const c = Math.floor(n / h),
                                o = n % h;
                            t.classList.toggle('on', b[c][o]);
                        }),
                    w());
            }),
        (l.style.display = 'none'));
    function re() {
        return document.querySelector(
            '#hero-avatar, .avatar-container img, .hero img'
        );
    }
    function ae() {
        const e = l.style.display === 'none';
        (!e && a.playing && S(), (l.style.display = e ? 'block' : 'none'));
    }
    const E = re();
    if (E && !E.__drumBound) {
        ((E.__drumBound = !0),
            'style' in E && (E.style.cursor = 'pointer'),
            E.addEventListener('click', ae));
        try {
            new IntersectionObserver(
                t => {
                    const n = t[0];
                    (!n || !n.isIntersecting) && a.playing && S();
                },
                { threshold: 0 }
            ).observe(l);
        } catch {}
        document.addEventListener('visibilitychange', () => {
            document.hidden && a.playing && S();
        });
    }
    ((l.tabIndex = 0),
        l.addEventListener('keydown', e => {
            e.code === 'Space'
                ? (e.preventDefault(), a.playing ? S() : H())
                : e.key === 'r' || e.key === 'R'
                  ? (e.preventDefault(), A == null || A.click())
                  : (e.key === 'c' || e.key === 'C') &&
                    (e.preventDefault(), C == null || C.click());
        }));
    function R(e) {
        if (r) {
            if (a.mode === '808' && a.samples && a.samples[e.key]) {
                const t = r.createBufferSource();
                t.buffer = a.samples[e.key];
                const n = r.createGain();
                ((n.gain.value = 0.9),
                    t.connect(n).connect(r.destination),
                    t.start());
                return;
            }
            e.synth();
        }
    }
    function P(e, t) {
        if (!r) return null;
        const n = r.sampleRate,
            c = Math.max(1, Math.floor(e * n)),
            o = r.createBuffer(1, c, n),
            s = o.getChannelData(0);
        for (let i = 0; i < c; i++) s[i] = t(i, n, c);
        return o;
    }
    function ie() {
        return P(0.35, (o, s) => {
            const i = o / s,
                d = 160 * Math.pow(50 / 160, i / 0.35),
                m = Math.exp(-i / 0.18);
            return Math.sin(2 * Math.PI * d * i) * m * 0.95;
        });
    }
    function oe() {
        return P(0.22, (o, s) => {
            const i = o / s,
                d = (Math.random() * 2 - 1) * Math.exp(-i / 0.12),
                m =
                    Math.sin(2 * Math.PI * 180 * i) *
                    Math.exp(-i / 0.08) *
                    0.35;
            return (d * 0.7 + m) * 0.9;
        });
    }
    function se() {
        return P(0.07, (n, c) => {
            const o = n / c,
                i = Math.random() * 2 - 1 - 0.6 * (Math.random() * 2 - 1),
                d = Math.exp(-o / 0.03);
            return i * d * 0.5;
        });
    }
    function ce() {
        const t = [0, 0.013, 0.026],
            n = 0.06;
        return P(0.18, (c, o, s) => {
            const i = c / o;
            let d = 0;
            for (const m of t) {
                const p = Math.max(0, i - m),
                    y = Math.exp(-p / n),
                    g = Math.random() * 2 - 1;
                d += g * y;
            }
            return (d / t.length) * 0.6;
        });
    }
    function O() {
        return { Kick: ie(), Snare: oe(), Hat: se(), Clap: ce() };
    }
    async function le() {
        if (!r) return null;
        const e = window.DRUM_SAMPLE_BASE;
        if (e === 'embedded' || e === !1 || typeof e > 'u' || e === null)
            return O();
        const t = String(e).replace(/\/$/, '/'),
            n = { Kick: 'kick', Snare: 'snare', Hat: 'hihat', Clap: 'clap' },
            c = ['.wav', '.mp3', '.ogg'];
        async function o(d) {
            if (!r) return null;
            for (const m of c) {
                const p = t + d + m;
                try {
                    const y = await fetch(p, { cache: 'force-cache' });
                    if (!y.ok) continue;
                    const g = await y.arrayBuffer();
                    return await r.decodeAudioData(g);
                } catch {}
            }
            return null;
        }
        const s = {};
        await Promise.all(
            Object.entries(n).map(async ([d, m]) => {
                s[d] = await o(m);
            })
        );
        const i = O();
        for (const d of Object.keys(n)) (!(d in s) || !s[d]) && (s[d] = i[d]);
        return s;
    }
    const F = l.querySelector('#drum-aria');
    function G(e) {
        F && (F.textContent = e);
    }
    (w(),
        (window.drumMachine = !0),
        (window.drumMachineControls = { start: H, stop: S, state: a }));
}
typeof window < 'u' && (window.initializeDrumMachine = de);
//# sourceMappingURL=drumMachine.js.map
