if (!window.PharmaNerdUI) {
    const data = window.PharmaNerdData || {};
    const {
        CLASS_COLORS = {},
        CLASS_ICONS = {},
        RECEPTOR_INFO = {},
        PHARMACOKINETIC_INFO = {},
    } = data;

    const RECENT_KEY = "pharmanerd-recents";
    const FAVORITES_KEY = "pharmanerd-favorites";

    function getFavorites() {
        try {
            const raw = localStorage.getItem(FAVORITES_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    function setFavorites(list) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    }

    function isFavorite(name) {
        return getFavorites().includes(name);
    }

    function updateFavoriteButton(button, name) {
        if (!button) return;
        const active = isFavorite(name);
        button.dataset.active = active ? "true" : "false";
        button.textContent = active ? "Stashed" : "Stash";
        button.setAttribute("aria-pressed", active ? "true" : "false");
    }

    function toggleFavorite(name) {
        const current = getFavorites();
        const updated = current.includes(name)
            ? current.filter((item) => item !== name)
            : [name, ...current];
        setFavorites(updated);
        window.dispatchEvent(new CustomEvent("pharmanerd:stash"));
        return updated.includes(name);
    }

    function createFavoriteButton(name) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "fav-btn";
        button.setAttribute("aria-label", `Toggle stash for ${name}`);
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleFavorite(name);
            updateFavoriteButton(button, name);
        });
        updateFavoriteButton(button, name);
        return button;
    }

    function goToDrug(name) {
        if (!name) return;
        addRecent(name);
        if (window.PharmaNerdComponents && typeof window.PharmaNerdComponents.openDrugWindow === "function") {
            window.PharmaNerdComponents.openDrugWindow(name);
            return;
        }
        window.location.href = `drug.html?drug=${encodeURIComponent(name)}`;
    }

    const components = window.PharmaNerdComponents || {};

    const getClassColor = components.getClassColor || ((className) => CLASS_COLORS[className] || "#94a3b8");
    const getTypeColor = components.getTypeColor || ((typeName) => ({
        Prescription: "#06b6d4",
        OTC: "#10b981",
        Controlled: "#ef4444",
        "Research Chemical": "#f97316",
        Supplement: "#8b5cf6",
    }[typeName] || "#64748b"));
    const getClassIcon = components.getClassIcon || ((className) => CLASS_ICONS[className] || "");
    const buildBadge = components.buildBadge || ((className, label) => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.style.setProperty("--badge-color", getClassColor(className));
        badge.innerHTML = `<span class="dot"></span>${label}`;
        return badge;
    });
    const createDrugCard = components.createDrugCardFactory
        ? components.createDrugCardFactory({
            getClassColor,
            getTypeColor,
            getClassIcon,
            createFavoriteButton,
            goToDrug,
        })
        : null;
    const createSkeletonCard = components.createSkeletonCard || (() => {
        const s = document.createElement("article");
        s.className = "drug-card";
        s.style.opacity = "0.7";
        s.innerHTML = `
            <div class="drug-card__icon drug-card__skeleton-icon"></div>
            <div class="drug-card__body">
                <div class="drug-card__title-row">
                    <div style="height:16px;width:42%;background:rgba(255,255,255,0.03);border-radius:6px"></div>
                    <div style="height:20px;width:76px;background:rgba(255,255,255,0.03);border-radius:999px"></div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                    <div style="height:26px;width:82px;background:rgba(255,255,255,0.03);border-radius:999px"></div>
                    <div style="height:26px;width:94px;background:rgba(255,255,255,0.03);border-radius:999px"></div>
                </div>
                <div style="height:76px;background:rgba(255,255,255,0.02);border-radius:14px;margin-top:12px"></div>
            </div>
            <div class="drug-card__actions"></div>
        `;
        return s;
    });

    function addRecent(name) {
        if (!name) return;
        const current = getRecents();
        const updated = [name, ...current.filter((item) => item !== name)].slice(0, 6);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    }

    function getRecents() {
        try {
            const raw = localStorage.getItem(RECENT_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    function bindSearchShortcut(input) {
        if (!input) return;
        document.addEventListener("keydown", (event) => {
            if (event.key === "/" && document.activeElement !== input) {
                event.preventDefault();
                input.focus();
            }
        });
    }

    function getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    function getReceptorTooltip(receptor) {
        return RECEPTOR_INFO[receptor] || "Pharmacology target";
    }

    function getPkTooltip(key) {
        return PHARMACOKINETIC_INFO[key] || "Pharmacokinetic term";
    }

    function severityClass(severity) {
        return severity ? severity.toLowerCase() : "none";
    }

    function severityLabel(severity) {
        return severity ? severity.toUpperCase() : "NONE";
    }

    function riskColor(score) {
        if (score >= 75) return "#ef4444";
        if (score >= 50) return "#f97316";
        if (score >= 25) return "#f59e0b";
        return "#22c55e";
    }

    function wireDrugLinks() {
        document.addEventListener("click", (event) => {
            const link = event.target.closest("[data-drug-link]");
            if (!link) return;
            event.preventDefault();
            goToDrug(link.dataset.drugLink);
        });
    }

    function initMobileNav() {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;

        const mobileQuery = window.matchMedia("(max-width: 860px)");
        let dismissedOnMobile = false;
        let scrollTicking = false;

        const backdrop = document.createElement("button");
        backdrop.type = "button";
        backdrop.className = "mobile-nav-backdrop";
        backdrop.setAttribute("aria-label", "Close navigation");

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "mobile-nav-toggle";
        toggle.setAttribute("aria-label", "Open navigation");
        toggle.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Menu</span>
        `;

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "mobile-nav-close";
        closeButton.setAttribute("aria-label", "Close navigation");
        closeButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
            </svg>
        `;

        if (!document.querySelector(".mobile-nav-backdrop")) {
            document.body.appendChild(backdrop);
        }

        if (!document.querySelector(".mobile-nav-toggle")) {
            document.body.appendChild(toggle);
        }

        if (!sidebar.querySelector(".mobile-nav-close")) {
            sidebar.insertBefore(closeButton, sidebar.firstChild);
        }

        function isMobile() {
            return mobileQuery.matches;
        }

        function setOpen(open, fromDismiss) {
            document.body.classList.toggle("mobile-nav-open", open);
            backdrop.classList.toggle("is-open", open);
            toggle.classList.toggle("is-hidden", open);
            if (open) {
                dismissedOnMobile = false;
            } else if (fromDismiss) {
                dismissedOnMobile = true;
            }
        }

        function syncMobileNav() {
            if (!isMobile()) {
                dismissedOnMobile = false;
                setOpen(false, false);
                document.body.classList.remove("mobile-nav-collapsed");
                return;
            }

            if (!dismissedOnMobile) {
                setOpen(true, false);
            }

            updateCollapsedState();
        }

        function updateCollapsedState() {
            if (!isMobile()) return;
            const shouldCollapse = window.scrollY > 36;
            document.body.classList.toggle("mobile-nav-collapsed", shouldCollapse);
        }

        function onScroll() {
            if (!isMobile()) return;
            if (scrollTicking) return;
            scrollTicking = true;
            window.requestAnimationFrame(() => {
                updateCollapsedState();
                scrollTicking = false;
            });
        }

        backdrop.addEventListener("click", () => setOpen(false, true));
        closeButton.addEventListener("click", () => setOpen(false, true));
        toggle.addEventListener("click", () => setOpen(true, false));

        if (typeof mobileQuery.addEventListener === "function") {
            mobileQuery.addEventListener("change", syncMobileNav);
        } else if (typeof mobileQuery.addListener === "function") {
            mobileQuery.addListener(syncMobileNav);
        }

        window.addEventListener("scroll", onScroll, { passive: true });

        syncMobileNav();
    }

    window.PharmaNerdUI = {
        RECENT_KEY,
        FAVORITES_KEY,
        getClassColor,
        getClassIcon,
        buildBadge,
        createDrugCard,
        goToDrug,
        addRecent,
        getRecents,
        getFavorites,
        isFavorite,
        toggleFavorite,
        updateFavoriteButton,
        createFavoriteButton,
        createSkeletonCard,
        bindSearchShortcut,
        getQueryParam,
        getReceptorTooltip,
        getPkTooltip,
        severityClass,
        severityLabel,
        riskColor,
        wireDrugLinks,
    };

    initMobileNav();
}
