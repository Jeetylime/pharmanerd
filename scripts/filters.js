if (!window.PharmaNerdFiltersInit) {
    window.PharmaNerdFiltersInit = true;

    function initFiltersApp() {
        const { DRUGS } = window.PharmaNerdData;
        const {
            bindSearchShortcut,
            createDrugCard,
            getRecents,
            getFavorites,
            goToDrug,
            wireDrugLinks,
        } = window.PharmaNerdUI;

        const searchInput = document.querySelector("#searchInput");
        const topSearchInput = document.querySelector("#topSearchInput");
        const resultCount = document.querySelector("#resultCount");
        const drugGrid = document.querySelector("#drugGrid");
        const recentGrid = document.querySelector("#recentGrid");
        const recentSection = recentGrid ? recentGrid.closest('.section') : null;
        const stashGrid = document.querySelector("#stashGrid");
        const stashEmpty = document.querySelector("#stashEmpty");
        const surpriseBtn = document.querySelector("#surpriseBtn");
        const sortSelect = document.querySelector("#sortSelect");
        const createExternalDrugCard = window.PharmaNerdComponents && window.PharmaNerdComponents.createExternalDrugCardFactory
            ? window.PharmaNerdComponents.createExternalDrugCardFactory({
                onSelect: (drug) => {
                    if (window.PharmaNerdComponents && typeof window.PharmaNerdComponents.openDrugWindow === "function") {
                        window.PharmaNerdComponents.openDrugWindow(drug.name);
                        return;
                    }
                    window.location.href = `drug.html?drug=${encodeURIComponent(drug.name)}&external=true`;
                },
            })
            : null;

        let externalResults = [];
        let externalSearchTimeout = null;
        let isSearchingExternal = false;

        const API_BASE = "/api";
        const externalCache = new Map();

        const state = {
            query: "",
            sort: "name",
            classFilter: "",
            typeFilter: "",
            effectFilter: "",
        };

        function uniqueSorted(values) {
            return [...new Set(values)].sort((a, b) => a.localeCompare(b));
        }

        function renderFilterChips() {
            const classContainer = document.getElementById('classFilterChips');
            const typeContainer = document.getElementById('typeFilterChips');
            const effectContainer = document.getElementById('effectFilterChips');
            if (!classContainer) return;

            // Build unique class list
            const classes = uniqueSorted(DRUGS.map(d => d.class));
            classContainer.innerHTML = '';
            const allClassChip = document.createElement('span');
            allClassChip.className = 'chip' + (state.classFilter === '' ? ' active' : '');
            allClassChip.textContent = 'All';
            allClassChip.addEventListener('click', () => { state.classFilter = ''; syncFilterChips(); render(); });
            classContainer.appendChild(allClassChip);
            classes.forEach(cls => {
                const chip = document.createElement('span');
                chip.className = 'chip' + (state.classFilter === cls ? ' active' : '');
                chip.textContent = cls;
                chip.addEventListener('click', () => { state.classFilter = cls; syncFilterChips(); render(); });
                classContainer.appendChild(chip);
            });

            // Type filter
            const types = uniqueSorted(DRUGS.map(d => d.type).filter(Boolean));
            typeContainer.innerHTML = '';
            const allTypeChip = document.createElement('span');
            allTypeChip.className = 'chip' + (state.typeFilter === '' ? ' active' : '');
            allTypeChip.textContent = 'All';
            allTypeChip.addEventListener('click', () => { state.typeFilter = ''; syncFilterChips(); render(); });
            typeContainer.appendChild(allTypeChip);
            types.forEach(type => {
                const chip = document.createElement('span');
                chip.className = 'chip' + (state.typeFilter === type ? ' active' : '');
                chip.textContent = type;
                chip.addEventListener('click', () => { state.typeFilter = type; syncFilterChips(); render(); });
                typeContainer.appendChild(chip);
            });

            // Effect filter
            const effects = uniqueSorted(DRUGS.flatMap(d => d.effectProfile || []));
            effectContainer.innerHTML = '';
            const allEffectChip = document.createElement('span');
            allEffectChip.className = 'chip' + (state.effectFilter === '' ? ' active' : '');
            allEffectChip.textContent = 'All';
            allEffectChip.addEventListener('click', () => { state.effectFilter = ''; syncFilterChips(); render(); });
            effectContainer.appendChild(allEffectChip);
            effects.forEach(effect => {
                const chip = document.createElement('span');
                chip.className = 'chip' + (state.effectFilter === effect ? ' active' : '');
                chip.textContent = effect;
                chip.addEventListener('click', () => { state.effectFilter = effect; syncFilterChips(); render(); });
                effectContainer.appendChild(chip);
            });
        }

        function syncFilterChips() {
            document.querySelectorAll('.filter-chips .chip').forEach(chip => {
                chip.classList.remove('active');
            });
            // Mark active class
            if (state.classFilter) {
                const clsChips = document.querySelectorAll('#classFilterChips .chip');
                clsChips.forEach(c => { if (c.textContent === state.classFilter) c.classList.add('active'); });
            } else {
                const first = document.querySelector('#classFilterChips .chip:first-child');
                if (first) first.classList.add('active');
            }
            if (state.typeFilter) {
                const typeChips = document.querySelectorAll('#typeFilterChips .chip');
                typeChips.forEach(c => { if (c.textContent === state.typeFilter) c.classList.add('active'); });
            } else {
                const first = document.querySelector('#typeFilterChips .chip:first-child');
                if (first) first.classList.add('active');
            }
            if (state.effectFilter) {
                const effChips = document.querySelectorAll('#effectFilterChips .chip');
                effChips.forEach(c => { if (c.textContent === state.effectFilter) c.classList.add('active'); });
            } else {
                const first = document.querySelector('#effectFilterChips .chip:first-child');
                if (first) first.classList.add('active');
            }
        }

        function filterDrugs() {
            const query = state.query.trim().toLowerCase();
            return DRUGS.filter((drug) => {
                const matchQuery =
                    !query ||
                    (drug.allNames || []).some((n) => n.toLowerCase().includes(query));
                const matchClass = !state.classFilter || drug.class === state.classFilter;
                const matchType = !state.typeFilter || drug.type === state.typeFilter;
                const matchEffect = !state.effectFilter || (drug.effectProfile || []).includes(state.effectFilter);
                return matchQuery && matchClass && matchType && matchEffect;
            });
        }

        function sortDrugs(list) {
            const sorted = [...list];
            switch (state.sort) {
                case "potency":
                    return sorted.sort((a, b) => b.potency - a.potency);
                case "duration":
                    return sorted.sort((a, b) => b.durationHours - a.durationHours);
                case "halfLife":
                    return sorted.sort((a, b) => b.halfLifeHours - a.halfLifeHours);
                default:
                    return sorted.sort((a, b) => a.name.localeCompare(b.name));
            }
        }

        function buildExternalCard(drug) {
            if (createExternalDrugCard) {
                return createExternalDrugCard(drug);
            }
            if (window.PharmaNerdSearch && window.PharmaNerdSearch.buildExternalCard) {
                return window.PharmaNerdSearch.buildExternalCard(drug);
            }
            // Fallback minimal card
            const card = document.createElement("article");
            card.className = "drug-card external-drug";
            card.dataset.externalName = drug.name;
            card.style.setProperty("--card-accent", "#22c55e");
            const title = document.createElement("h3");
            title.textContent = drug.name;
            title.className = "drug-link";
            const info = document.createElement("div");
            info.className = "stats-bar";
            info.innerHTML = `<div><strong>Source</strong><div>openFDA</div></div>`;
            card.append(title, info);
            card.addEventListener("click", () => {
                window.location.href = `drug.html?drug=${encodeURIComponent(drug.name)}&external=true`;
            });
            return card;
        }

        async function searchExternalDrugs(query) {
            if (!query || query.trim().length < 2) return [];
            const key = query.trim().toLowerCase();
            if (externalCache.has(key)) {
                console.log("[PharmaNerd] Using cached openFDA results for:", key);
                return externalCache.get(key);
            }

            console.log("[PharmaNerd] Searching openFDA for:", query);
            try {
                const url = `${API_BASE}/drug-search?name=${encodeURIComponent(query)}&_=${Date.now()}`;
                const response = await fetch(url, {
                    headers: { Accept: "application/json", "Cache-Control": "no-cache" }
                });
                if (!response.ok) {
                    console.error("[PharmaNerd] openFDA search status:", response.status);
                    return [];
                }
                const data = await response.json();
                const results = data.results || [];
                console.log("[PharmaNerd] openFDA results count:", results.length);
                externalCache.set(key, results);
                return results;
            } catch (error) {
                console.error("[PharmaNerd] openFDA search error:", error);
                return [];
            }
        }

        async function fetchExternalResults(query) {
            if (!query || query.trim().length < 2) {
                externalResults = [];
                isSearchingExternal = false;
                return;
            }
            console.log("[PharmaNerd] fetchExternalResults called for:", query);
            isSearchingExternal = true;
            render(); // Show loading state
            try {
                externalResults = await searchExternalDrugs(query);
            } catch (error) {
                console.error("[PharmaNerd] fetchExternalResults error:", error);
                externalResults = [];
            }
            isSearchingExternal = false;
            render();
        }

        function render() {
            if (!drugGrid) return;
            const filtered = sortDrugs(filterDrugs());
            drugGrid.innerHTML = "";

            // Hide recent section while user is actively querying
            const q = state.query.trim();
            if (recentSection) {
                recentSection.style.display = q ? 'none' : '';
            }

            // Show local results first
            filtered.forEach((drug) => drugGrid.appendChild(createDrugCard(drug)));

            // Show loading skeletons for external search
            const query = state.query.trim();
            if (isSearchingExternal && query.length >= 2) {
                const skeletonCount = 4;
                for (let i = 0; i < skeletonCount; i++) {
                    const skeleton = (window.PharmaNerdUI && window.PharmaNerdUI.createSkeletonCard)
                        ? window.PharmaNerdUI.createSkeletonCard()
                        : document.createElement("div");
                    skeleton.style.gridColumn = "auto";
                    drugGrid.appendChild(skeleton);
                }
            }

            // If we have external results, show them
            if (query.length >= 2 && externalResults.length > 0 && !isSearchingExternal) {
                // Add a separator
                const separator = document.createElement("div");
                separator.style.cssText = "grid-column: 1 / -1; padding: 8px 0; font-size: 12px; color: var(--muted); border-top: 1px solid var(--border); margin-top: 8px; display: flex; align-items: center; gap: 6px;";
                separator.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;"></span> FDA external results:`;
                drugGrid.appendChild(separator);

                // Add external cards (limit to first 8)
                externalResults.slice(0, 8).forEach((drug) => {
                    drugGrid.appendChild(buildExternalCard(drug));
                });
            }

            if (resultCount) {
                if (isSearchingExternal) {
                    resultCount.textContent = "Searching openFDA...";
                } else if (filtered.length === 0 && externalResults.length === 0 && query.length >= 2) {
                    resultCount.textContent = "No local results — searching openFDA...";
                } else if (filtered.length > 0 && externalResults.length > 0) {
                    resultCount.textContent = `${filtered.length} local + ${externalResults.length} external`;
                } else if (externalResults.length > 0) {
                    resultCount.textContent = `${externalResults.length} external results from FDA`;
                } else {
                    resultCount.textContent = `${filtered.length} results`;
                }
            }
        }

        function renderRecents() {
            if (!recentGrid) return;
            const recents = getRecents();
            recentGrid.innerHTML = "";
            recents
                .map((name) => DRUGS.find((drug) => drug.name === name))
                .filter(Boolean)
                .forEach((drug) => recentGrid.appendChild(createDrugCard(drug)));
        }

        function renderStash() {
            if (!stashGrid) return;
            const favorites = getFavorites();
            stashGrid.innerHTML = "";
            favorites
                .map((name) => DRUGS.find((drug) => drug.name === name))
                .filter(Boolean)
                .forEach((drug) => stashGrid.appendChild(createDrugCard(drug)));

            if (stashEmpty) {
                stashEmpty.style.display = favorites.length ? "none" : "block";
            }
        }

        function setupSort() {
            const select = document.querySelector("#sortSelect");
            if (!select) return;
            select.addEventListener("change", (event) => {
                state.sort = event.target.value;
                render();
            });
        }

        function setupSearch() {
            if (!searchInput && !topSearchInput) return;

            const handleInput = (value) => {
                state.query = value;
                // keep both inputs in sync
                if (searchInput && searchInput.value !== value) searchInput.value = value;
                if (topSearchInput && topSearchInput.value !== value) topSearchInput.value = value;
                render();

                // Debounce external search
                if (externalSearchTimeout) clearTimeout(externalSearchTimeout);
                if (state.query.trim().length >= 2) {
                    externalSearchTimeout = setTimeout(() => {
                        fetchExternalResults(state.query);
                    }, 400);
                } else {
                    externalResults = [];
                    isSearchingExternal = false;
                }
            };

            if (searchInput) {
                searchInput.addEventListener("input", (event) => handleInput(event.target.value));
                bindSearchShortcut(searchInput);
            }
            if (topSearchInput) {
                topSearchInput.addEventListener("input", (event) => handleInput(event.target.value));
                // ensure keyboard shortcut focuses the top input too
                bindSearchShortcut(topSearchInput);
            }
        }

        function setupSurprise() {
            if (!surpriseBtn) return;
            surpriseBtn.addEventListener("click", () => {
                const pick = DRUGS[Math.floor(Math.random() * DRUGS.length)];
                if (pick) {
                    goToDrug(pick.name);
                }
            });
        }

        function init() {
            wireDrugLinks();
            renderFilterChips();
            syncFilterChips();
            setupSort();
            setupSearch();
            setupSurprise();
            renderRecents();
            renderStash();
            render();

            window.addEventListener("pharmanerd:stash", () => {
                renderStash();
                render();
            });
        }

        init();
    }

    if (window.PharmaNerdData && window.PharmaNerdData.DRUGS) {
        initFiltersApp();
    } else {
        window.addEventListener("pharmanerd:data-loaded", initFiltersApp);
    }
}