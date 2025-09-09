let i = null,
    r = null,
    c = '';
function d() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
}
function p() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
}
function f(e) {
    const a = document.getElementById('toast-host');
    if (!a) return;
    const t = document.createElement('div');
    ((t.textContent = e),
        (t.style.cssText =
            'background:#111;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25);font-size:.9rem;max-width:80vw;'),
        a.appendChild(t),
        setTimeout(() => {
            ((t.style.transition = 'opacity .25s'), (t.style.opacity = '0'));
        }, 1600),
        setTimeout(() => {
            t.remove();
        }, 2e3));
}
function l(e) {
    (!isFinite(e) || e < 0) && (e = 0);
    const a = Math.floor(e / 60),
        t = Math.floor(e % 60);
    return `${a}:${t.toString().padStart(2, '0')}`;
}
function y() {
    let e = document.getElementById('mini-player');
    return (
        e ||
        ((e = document.createElement('div')),
        (e.id = 'mini-player'),
        (e.className = 'mini-player'),
        (e.innerHTML = `
    <button class="mini-close" aria-label="Close player">✕</button>
    <button class="mini-play" aria-pressed="false" aria-label="Play audio" title="Play">${d()}</button>
    <div class="mini-meta">
        <div class="mini-title" id="mini-title">—</div>
        <div class="audio-time"><span class="current">0:00</span> / <span class="duration">0:00</span></div>
        <div class="audio-progress" role="slider" aria-label="Seek" tabindex="0"><div class="audio-progress-fill"></div></div>
    </div>
    <div id="toast-host" aria-live="polite" style="position:fixed;bottom:72px;left:50%;transform:translateX(-50%);"></div>`),
        document.body.appendChild(e),
        v(),
        e)
    );
}
function o() {
    const e = document.getElementById('mini-player');
    return e
        ? {
              root: e,
              play: e.querySelector('.mini-play'),
              close: e.querySelector('.mini-close'),
              title: e.querySelector('.mini-title'),
              timeCurrent: e.querySelector('.audio-time .current'),
              timeDuration: e.querySelector('.audio-time .duration'),
              progress: e.querySelector('.audio-progress'),
              progressFill: e.querySelector('.audio-progress-fill'),
          }
        : {};
}
function v() {
    const { play: e, close: a, progress: t } = o();
    if (
        (e &&
            !e.__bound &&
            ((e.__bound = !0),
            (e.innerHTML = d()),
            e.addEventListener('click', () => {
                i &&
                    (i.paused
                        ? (i.play(),
                          r &&
                              ((r.dataset.state = 'playing'),
                              (r.textContent = '⏸'),
                              r.setAttribute('aria-pressed', 'true'),
                              r.setAttribute('aria-label', 'Pause audio')),
                          (e.innerHTML = p()),
                          e.setAttribute('aria-pressed', 'true'))
                        : (i.pause(),
                          r &&
                              ((r.dataset.state = 'paused'),
                              (r.textContent = '▶'),
                              r.setAttribute('aria-pressed', 'false'),
                              r.setAttribute('aria-label', 'Play audio')),
                          (e.innerHTML = d()),
                          e.setAttribute('aria-pressed', 'false')));
            })),
        a &&
            !a.__bound &&
            ((a.__bound = !0),
            a.addEventListener('click', () => {
                i && (i.pause(), (i.currentTime = 0));
                const { root: s } = o();
                (s && (s.style.display = 'none'), f('Player closed'));
            })),
        t && !t.__bound)
    ) {
        let s = function (n) {
            if (!i) return;
            const u = t.getBoundingClientRect(),
                m = Math.max(0, Math.min(1, (n - u.left) / u.width));
            isFinite(i.duration) && (i.currentTime = m * i.duration);
        };
        ((t.__bound = !0),
            t.addEventListener('pointerdown', n => {
                s(n.clientX);
            }),
            t.addEventListener('click', n => s(n.clientX)),
            t.addEventListener('keydown', n => {
                !i ||
                    !isFinite(i.duration) ||
                    (n.key === 'ArrowLeft'
                        ? (i.currentTime = Math.max(0, i.currentTime - 5))
                        : n.key === 'ArrowRight' &&
                          (i.currentTime = Math.min(
                              i.duration,
                              i.currentTime + 5
                          )));
            }));
    }
}
function h(e) {
    y();
    const a = o();
    ((c = e.getAttribute('data-title') || e.textContent || 'Untitled'),
        a.title && (a.title.textContent = c),
        a.root && a.root.classList.add('show'));
}
function b() {
    return (
        i ||
            ((i = new Audio()),
            (i.preload = 'metadata'),
            i.addEventListener('ended', () => {
                r && ((r.dataset.state = 'paused'), (r = null));
                const { play: e, root: a } = o();
                (e &&
                    ((e.innerHTML = d()),
                    e.setAttribute('aria-pressed', 'false')),
                    a && a.classList.remove('show'));
            }),
            i.addEventListener('pause', () => {
                r && (r.dataset.state = 'paused');
                const { play: e } = o();
                e &&
                    ((e.innerHTML = d()),
                    e.setAttribute('aria-pressed', 'false'));
            }),
            i.addEventListener('play', () => {
                const { play: e, root: a } = o();
                (e &&
                    ((e.innerHTML = p()),
                    e.setAttribute('aria-pressed', 'true')),
                    a && a.classList.add('show'));
            }),
            i.addEventListener('timeupdate', () => {
                const {
                    timeCurrent: e,
                    timeDuration: a,
                    progressFill: t,
                } = o();
                (e && (e.textContent = l(i.currentTime)),
                    a && (a.textContent = l(i.duration)),
                    t &&
                        isFinite(i.duration) &&
                        i.duration > 0 &&
                        (t.style.width = `${(i.currentTime / i.duration) * 100}%`));
            }),
            i.addEventListener('loadedmetadata', () => {
                const { timeDuration: e } = o();
                e && (e.textContent = l(i.duration));
            })),
        i
    );
}
function g(e = '[data-audio]') {
    const a = b();
    document.querySelectorAll(e).forEach(t => {
        t.__bound ||
            ((t.__bound = !0),
            t.addEventListener('click', async () => {
                const s = t.dataset.audio;
                if (s)
                    if (
                        (a.src !== new URL(s, location.origin).href &&
                            (a.pause(), (a.src = s)),
                        a.paused || r !== t)
                    )
                        try {
                            (await a.play(),
                                r &&
                                    r !== t &&
                                    ((r.dataset.state = 'paused'),
                                    (r.textContent = '▶'),
                                    r.setAttribute('aria-pressed', 'false'),
                                    r.setAttribute('aria-label', 'Play audio')),
                                (t.dataset.state = 'playing'),
                                (t.textContent = '⏸'),
                                t.setAttribute('aria-pressed', 'true'),
                                t.setAttribute('aria-label', 'Pause audio'),
                                (r = t),
                                h(t));
                        } catch (n) {
                            (console.warn(n), f('Tap to enable audio'));
                        }
                    else
                        (a.pause(),
                            (t.dataset.state = 'paused'),
                            (t.textContent = '▶'),
                            t.setAttribute('aria-pressed', 'false'),
                            t.setAttribute('aria-label', 'Play audio'));
            }));
    });
}
export { v as a, g as b };
//# sourceMappingURL=audio.js.map
