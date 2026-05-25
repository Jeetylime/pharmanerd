// Lightweight global search drawer — creates or reuses #navSearchDrawer and wires .nav-search-toggle triggers.
(function () {
    const TOGGLE_SELECTOR = '.nav-search-toggle, .nav-link[data-search-toggle]';

    function createDrawer() {
        if (document.getElementById('navSearchDrawer')) return document.getElementById('navSearchDrawer');
        const d = document.createElement('div');
        d.id = 'navSearchDrawer';
        d.className = 'nav-search-drawer';
        d.setAttribute('role', 'dialog');
        d.setAttribute('aria-label', 'Drug search');
        d.setAttribute('aria-hidden', 'true');
        d.innerHTML = `
            <button class="nav-search-close" type="button" aria-label="Close search" data-search-close>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
            <input id="navGlobalSearchInput" type="search" placeholder="Search by name or alias..." aria-label="Search drugs" />
            <select id="navGlobalSort" class="chip" aria-label="Sort">
                <option value="name">Name A-Z</option>
                <option value="potency">Potency</option>
                <option value="duration">Duration</option>
                <option value="halfLife">Half-life</option>
            </select>
            <div id="navSearchResults" class="nav-search-results" role="listbox" aria-label="Search results"></div>
        `;
        Object.assign(d.style, {
            position: 'fixed',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px',
            borderRadius: '18px',
            border: '1px solid rgba(174, 234, 255, 0.16)',
            background: 'rgba(5, 12, 22, 0.92)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.34)',
            opacity: 0,
            pointerEvents: 'none',
            transform: 'translate3d(0, -6px, 0) scale(0.985)',
            transition: 'transform 0.22s cubic-bezier(0.2,0.9,0.2,1), opacity 0.16s ease',
        });
        document.body.appendChild(d);
        return d;
    }

    function isOpen(drawer) {
        return drawer && drawer.classList.contains('open');
    }

    function positionDrawer(drawer) {
        const nav = document.querySelector('.nav');
        const rect = nav ? nav.getBoundingClientRect() : { right: window.innerWidth - 24, bottom: 48, left: 0 };
        const vw = window.innerWidth;
        const width = Math.max(320, Math.min(Math.round(vw * 0.33), 520));
        drawer.style.width = width + 'px';
        // If the drawer is placed inside a .nav-search-wrap, position it absolutely there
        const wrap = drawer.closest('.nav-search-wrap');
        if (wrap) {
            drawer.style.position = 'absolute';
            drawer.style.right = '0px';
            drawer.style.top = 'calc(100% + 8px)';
        } else {
            drawer.style.position = 'fixed';
            const right = Math.max(12, vw - rect.right + 12);
            drawer.style.right = right + 'px';
            drawer.style.top = (rect.bottom + 8 + window.scrollY) + 'px';
        }
    }

    function openDrawer(drawer) {
        if (!drawer) drawer = createDrawer();
        positionDrawer(drawer);
        drawer.classList.add('open');
        drawer.style.opacity = '1';
        drawer.style.pointerEvents = 'auto';
        drawer.style.transform = 'translate3d(0,0,0) scale(1)';
        drawer.setAttribute('aria-hidden', 'false');
        const input = drawer.querySelector('input');
        setTimeout(() => input && input.focus(), 60);
        document.body.classList.add('pn-search-open');
        // mirror state on the main nav container and toggles for consistency with filters.js
        const nav = document.querySelector('.nav');
        if (nav) nav.classList.add('search-open');
        document.querySelectorAll(TOGGLE_SELECTOR).forEach((t) => {
            try { t.setAttribute('aria-expanded', 'true'); t.setAttribute('aria-pressed', 'true'); } catch (e) { }
        });
    }

    function closeDrawer(drawer) {
        if (!drawer) drawer = document.getElementById('navSearchDrawer');
        if (!drawer) return;
        drawer.classList.remove('open');
        drawer.style.opacity = '0';
        drawer.style.pointerEvents = 'none';
        drawer.style.transform = 'translate3d(0, -6px, 0) scale(0.985)';
        drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('pn-search-open');
        const nav = document.querySelector('.nav');
        if (nav) nav.classList.remove('search-open');
        document.querySelectorAll(TOGGLE_SELECTOR).forEach((t) => {
            try { t.setAttribute('aria-expanded', 'false'); t.setAttribute('aria-pressed', 'false'); } catch (e) { }
        });
    }

    function openToggle(drawer) {
        const d = drawer || createDrawer();
        if (isOpen(d)) closeDrawer(d); else openDrawer(d);
    }

    function init() {
        const drawer = createDrawer();

        // Wire explicit close button and stop propagation
        const closeBtn = drawer.querySelector('[data-search-close]');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.debug('[navSearch] close button clicked');
                closeDrawer(drawer);
            });
        }

        drawer.addEventListener('click', (e) => {
            // clicks inside drawer should not bubble to document handler
            e.stopPropagation();
        });

        document.addEventListener('click', (e) => {
            const open = isOpen(drawer);
            if (!open) return;
            const toggle = e.target.closest(TOGGLE_SELECTOR);
            if (toggle) return;
            if (!drawer.contains(e.target)) {
                console.debug('[navSearch] outside click — closing');
                closeDrawer(drawer);
            }
        }, true);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDrawer(drawer);
            }
        });

        function wireToggles() {
            document.querySelectorAll(TOGGLE_SELECTOR).forEach((btn) => {
                if (btn.__navSearchWired) return;
                btn.__navSearchWired = true;
                btn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    console.debug('[navSearch] toggle clicked');
                    openDrawer(drawer);
                });
            });

            // Prevent full-page anchors like href="index.html#search" from navigating
            document.querySelectorAll('a[href*="#search"]').forEach(a => {
                if (a.__navSearchAnchorWired) return;
                a.__navSearchAnchorWired = true;
                a.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    console.debug('[navSearch] intercepted anchor to #search');
                    openDrawer(drawer);
                });
            });
        }
        wireToggles();
        const mo = new MutationObserver(() => wireToggles());
        mo.observe(document.body, { childList: true, subtree: true });

        window.addEventListener('resize', () => {
            if (isOpen(drawer)) positionDrawer(drawer);
        });

        // small on-page debug badge so users can confirm the script loaded
        // remove any existing badge to avoid stale copies from cached scripts
        let existing = document.getElementById('navSearchDebug');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const dbg = document.createElement('div');
        dbg.id = 'navSearchDebug';
        dbg.title = `navSearch.js loaded: ${new Date().toISOString()}`;
        dbg.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;background:linear-gradient(180deg,#052236,#0b1a2a);color:#e8f2ff;padding:8px 10px;border-radius:8px;font-size:12px;font-family:sans-serif;pointer-events:auto;opacity:0.94;border:1px solid rgba(87,215,255,0.08)';
        dbg.innerHTML = '<strong style="font-weight:700;margin-right:6px;">navSearch</strong><span id="navSearchDebugState">loaded</span>';
        document.body.appendChild(dbg);

        const dbgState = document.getElementById('navSearchDebugState');
        function setDbg(state) {
            try { dbgState.textContent = state; } catch (e) { }
        }

        // reflect open/close state (initial + mutation observer)
        const origOpen = drawer.classList.contains('open');
        setDbg(origOpen ? 'open' : 'closed');
        const obs = new MutationObserver(() => setDbg(drawer.classList.contains('open') ? 'open' : 'closed'));
        obs.observe(drawer, { attributes: true, attributeFilter: ['class'] });

        // Local search wiring: perform simple client-side search across DRUGS allNames
        const inputEl = drawer.querySelector('#navGlobalSearchInput');
        const resultsEl = drawer.querySelector('#navSearchResults');
        let localSearchTimer = null;

        function renderLocalResults(hits, q) {
            if (!resultsEl) return;
            resultsEl.innerHTML = '';
            if (!hits || hits.length === 0) {
                const no = document.createElement('div');
                no.className = 'nav-search-noresults';
                no.textContent = 'No local matches';
                resultsEl.appendChild(no);
                return;
            }
            hits.forEach((d) => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'nav-search-item';
                item.setAttribute('role', 'option');
                const title = document.createElement('div');
                title.className = 'nav-search-item-title';
                title.textContent = d.name;
                const sub = document.createElement('div');
                sub.className = 'nav-search-item-sub';
                const matched = (d.allNames || []).find(n => n.toLowerCase() !== d.name.toLowerCase() && n.toLowerCase().includes(q));
                sub.textContent = matched ? matched : '';
                item.appendChild(title);
                if (sub.textContent) item.appendChild(sub);
                item.addEventListener('click', () => {
                    window.location.href = `drug.html?drug=${encodeURIComponent(d.name)}`;
                });
                resultsEl.appendChild(item);
            });
        }

        function performLocalSearch(q) {
            const trimmed = (q || '').trim();
            if (!trimmed) {
                if (resultsEl) resultsEl.innerHTML = '';
                return;
            }
            const ql = trimmed.toLowerCase();
            const DRUGS = (window.PharmaNerdData && window.PharmaNerdData.DRUGS) || [];
            const hits = DRUGS.filter(d => (d.allNames || []).some(n => n.toLowerCase().includes(ql))).slice(0, 8);
            renderLocalResults(hits, ql);
        }

        if (inputEl) {
            inputEl.addEventListener('input', (e) => {
                const q = e.target.value || '';
                if (localSearchTimer) clearTimeout(localSearchTimer);
                localSearchTimer = setTimeout(() => performLocalSearch(q), 180);
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
