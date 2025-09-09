// Journal filtering and read-more logic
export function bindJournalFeatures() {
    const root = document;
    const entriesWrap = root.querySelector('.journal-entries');
    if (!entriesWrap) return;

    // Ensure sticky is disabled even if cards render later
    disableStickyJournalHeaders();

    const search = root.getElementById('journal-search');
    const tagButtons = Array.from(root.querySelectorAll('.tag-filter'));

    function entryMatches(entry: HTMLElement, q: string, tag: string): boolean {
        const title =
            entry.querySelector('.journal-title')?.textContent?.toLowerCase() ||
            '';
        const snippet =
            entry
                .querySelector('.journal-snippet')
                ?.textContent?.toLowerCase() || '';
        const tags = (entry.getAttribute('data-tags') || '').toLowerCase();
        const matchesQuery = !q || title.includes(q) || snippet.includes(q);
        const matchesTag = tag === 'all' || tags.includes(tag);
        return matchesQuery && matchesTag;
    }

    function applyFilter() {
        const q = (
            search && 'value' in search
                ? (search as HTMLInputElement).value
                : ''
        ).toLowerCase();
        const activeTagBtn = tagButtons.find(b =>
            b.classList.contains('is-active')
        );
        const tag = activeTagBtn
            ? activeTagBtn.getAttribute('data-tag') || 'all'
            : 'all';
        if (!entriesWrap) return;
        const items = Array.from(
            entriesWrap.querySelectorAll('.journal-card')
        ) as HTMLElement[];
        entriesWrap.setAttribute('aria-busy', 'true');
        for (const el of items) {
            const show = entryMatches(el, q, tag);
            el.style.display = show ? '' : 'none';
        }
        entriesWrap.setAttribute('aria-busy', 'false');
    }

    // Read-more toggles
    entriesWrap.addEventListener('click', e => {
        const btn = (e.target as HTMLElement).closest('.read-more');
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
    tagButtons.forEach(b =>
        b.addEventListener('click', () => {
            tagButtons.forEach(x => {
                x.classList.remove('is-active');
                x.setAttribute('aria-pressed', 'false');
            });
            b.classList.add('is-active');
            b.setAttribute('aria-pressed', 'true');
            applyFilter();
        })
    );

    // Search
    search?.addEventListener('input', applyFilter);

    if (entriesWrap.querySelector('.journal-card')) {
        applyFilter();
    } else {
        entriesWrap.addEventListener(
            'journal:rendered',
            () => {
                applyFilter();
                disableStickyJournalHeaders();
            },
            { once: true }
        );
    }
}

function disableStickyJournalHeaders() {
    // CSS override in case stylesheets set sticky positioning
    if (!document.getElementById('journal-sticky-fix')) {
        const s = document.createElement('style');
        s.id = 'journal-sticky-fix';
        s.textContent = `.journal-head { position: static !important; top: auto !important; }`;
        document.head.appendChild(s);
    }
    document.querySelectorAll('.journal-head').forEach(h => {
        const cs = getComputedStyle(h as HTMLElement);
        if (
            cs.position === 'sticky' ||
            (h as HTMLElement).style.position === 'sticky'
        ) {
            (h as HTMLElement).style.position = 'static';
            (h as HTMLElement).style.top = 'auto';
        }
    });
}
