if (!window.PharmaNerdComponents) {
    const DEFAULT_CLASS_COLOR = "#94a3b8";
    const DEFAULT_TYPE_COLOR = "#64748b";
    const TYPE_COLORS = {
        Prescription: "#06b6d4",
        OTC: "#10b981",
        Controlled: "#ef4444",
        "Research Chemical": "#f97316",
        Supplement: "#8b5cf6",
    };

    function getData() {
        return window.PharmaNerdData || {};
    }

    function getClassColor(className) {
        const { CLASS_COLORS = {} } = getData();
        return CLASS_COLORS[className] || DEFAULT_CLASS_COLOR;
    }

    function getTypeColor(typeName) {
        return TYPE_COLORS[typeName] || DEFAULT_TYPE_COLOR;
    }

    function getClassIcon(className) {
        const { CLASS_ICONS = {} } = getData();
        return CLASS_ICONS[className] || "";
    }

    function buildBadge(className, label) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.style.setProperty("--badge-color", getClassColor(className));
        badge.innerHTML = `<span class="dot"></span>${label}`;
        return badge;
    }

    function createDrugCardFactory(helpers = {}) {
        const getClassColorFn = helpers.getClassColor || getClassColor;
        const getTypeColorFn = helpers.getTypeColor || getTypeColor;
        const getClassIconFn = helpers.getClassIcon || getClassIcon;
        const createFavoriteButtonFn = helpers.createFavoriteButton;
        const goToDrugFn = helpers.goToDrug || (() => { });

        return function createDrugCard(drug) {
            const card = document.createElement("article");
            card.className = "drug-card";
            card.dataset.drugName = drug.name;
            card.tabIndex = 0;
            card.setAttribute("role", "link");
            card.setAttribute("aria-label", `${drug.name} card`);
            card.style.setProperty("--card-accent", getClassColorFn(drug.class));

            const iconWrap = document.createElement("div");
            iconWrap.className = "drug-card__icon";
            iconWrap.style.setProperty("--icon-accent", getClassColorFn(drug.class));

            const iconSrc = getClassIconFn(drug.class);
            if (iconSrc) {
                const icon = document.createElement("img");
                icon.className = "drug-card__icon-image";
                icon.src = `assets/icons/${iconSrc}`;
                icon.alt = "";
                iconWrap.appendChild(icon);
            } else {
                const fallback = document.createElement("span");
                fallback.className = "drug-card__icon-fallback";
                fallback.textContent = drug.class?.[0] || "D";
                iconWrap.appendChild(fallback);
            }

            const body = document.createElement("div");
            body.className = "drug-card__body";
            body.style.minWidth = "0";

            const titleWrap = document.createElement("div");
            titleWrap.className = "drug-card__title-row";

            const title = document.createElement("h3");
            title.textContent = drug.name;
            title.className = "drug-link";
            title.dataset.drugLink = drug.name;

            const meta = document.createElement("div");
            meta.className = "drug-card__meta";
            meta.append(title, buildBadge(drug.class, drug.class));

            if (drug.type) {
                const typePill = document.createElement("span");
                typePill.className = "type-pill";
                typePill.textContent = drug.type;
                typePill.style.background = getTypeColorFn(drug.type);
                meta.append(typePill);
            }

            titleWrap.append(meta);

            const tags = document.createElement("div");
            tags.className = "tags";
            const effects = (drug.effects?.positive || []).slice(0, 2);
            effects.forEach((effect) => {
                const tag = document.createElement("span");
                tag.className = "tag";
                tag.textContent = effect;
                tags.appendChild(tag);
            });

            const stats = document.createElement("div");
            stats.className = "stats-bar";
            stats.innerHTML = `
                <div><strong>Onset</strong><div>${drug.effects.onset}</div></div>
                <div><strong>Duration</strong><div>${drug.effects.duration}</div></div>
                <div><strong>Half-life</strong><div>${drug.pharmacokinetics.halfLife}</div></div>
            `;

            body.append(titleWrap, tags, stats);

            const right = document.createElement("div");
            right.className = "drug-card__actions";
            if (createFavoriteButtonFn) {
                right.appendChild(createFavoriteButtonFn(drug.name));
            }

            card.append(iconWrap, body, right);

            card.addEventListener("click", (event) => {
                if (event.target.closest("button")) return;
                goToDrugFn(drug.name);
            });

            card.addEventListener("keydown", (event) => {
                if (event.target.closest("button")) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    goToDrugFn(drug.name);
                }
            });

            return card;
        };
    }

    function createSkeletonCard() {
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
    }

    function createExternalDrugCardFactory(helpers = {}) {
        const getClassColorFn = helpers.getClassColor || getClassColor;
        const getClassIconFn = helpers.getClassIcon || getClassIcon;
        const onSelect = helpers.onSelect || ((drug) => {
            if (window.PharmaNerdComponents && typeof window.PharmaNerdComponents.openDrugWindow === "function") {
                window.PharmaNerdComponents.openDrugWindow(drug.name);
                return;
            }
            window.location.href = `drug.html?drug=${encodeURIComponent(drug.name)}&external=true`;
        });

        return function createExternalDrugCard(drug) {
            const card = document.createElement("article");
            card.className = "drug-card external-drug";
            card.dataset.externalName = drug.name;
            card.style.setProperty("--card-accent", getClassColorFn("Stimulant"));

            const iconWrap = document.createElement("div");
            iconWrap.className = "drug-card__icon";
            iconWrap.style.setProperty("--icon-accent", "#22c55e");

            const iconSrc = getClassIconFn(drug.pharmClass?.[0]) || "";
            if (iconSrc) {
                const icon = document.createElement("img");
                icon.className = "drug-card__icon-image";
                icon.src = `assets/icons/${iconSrc}`;
                icon.alt = "";
                iconWrap.appendChild(icon);
            } else {
                const fallback = document.createElement("span");
                fallback.className = "drug-card__icon-fallback";
                fallback.textContent = "FDA";
                iconWrap.appendChild(fallback);
            }

            const body = document.createElement("div");
            body.className = "drug-card__body";
            body.style.minWidth = "0";

            const titleWrap = document.createElement("div");
            titleWrap.className = "drug-card__title-row";

            const title = document.createElement("h3");
            title.textContent = drug.name;
            title.className = "drug-link";
            title.dataset.externalLink = drug.name;

            const meta = document.createElement("div");
            meta.className = "drug-card__meta";
            meta.append(title);

            titleWrap.append(meta);

            const info = document.createElement("div");
            info.className = "stats-bar";
            const classInfo = drug.pharmClass && drug.pharmClass.length > 0
                ? drug.pharmClass.slice(0, 2).join(", ")
                : "N/A";
            info.innerHTML = `
                <div><strong>Source</strong><div>openFDA</div></div>
                <div><strong>Generic</strong><div>${drug.genericName || "N/A"}</div></div>
                <div><strong>Class</strong><div>${classInfo}</div></div>
            `;

            body.append(titleWrap, info);

            const right = document.createElement("div");
            right.className = "drug-card__actions";
            const fdaBadge = document.createElement("span");
            fdaBadge.className = "badge";
            fdaBadge.style.setProperty("--badge-color", "#22c55e");
            fdaBadge.innerHTML = `<span class="dot"></span>FDA`;
            right.appendChild(fdaBadge);

            card.append(iconWrap, body, right);
            card.addEventListener("click", (event) => {
                if (event.target.closest("button")) return;
                onSelect(drug);
            });
            title.addEventListener("click", (event) => {
                event.stopPropagation();
                onSelect(drug);
            });

            return card;
        };
    }

    let activeWindow = null;

    function getDrugWindowDrug(name) {
        const data = getData();
        const drugs = data.DRUGS || [];
        const matcher = data.matchDrugByAlias;
        if (typeof matcher === "function") {
            const matched = matcher(name);
            if (matched) return matched;
        }
        return drugs.find((drug) => drug.name.toLowerCase() === String(name || "").trim().toLowerCase()) || null;
    }

    function ensureDrugWindow() {
        if (activeWindow && document.body.contains(activeWindow.overlay)) {
            return activeWindow;
        }

        const overlay = document.createElement("div");
        overlay.className = "pn-window-overlay";
        overlay.id = "pharmanerd-drug-window-overlay";
        overlay.setAttribute("aria-hidden", "true");

        const frame = document.createElement("div");
        frame.className = "pn-floating-window";
        frame.setAttribute("role", "dialog");
        frame.setAttribute("aria-modal", "true");

        const titlebar = document.createElement("div");
        titlebar.className = "pn-window-titlebar";

        const titleWrap = document.createElement("div");
        titleWrap.className = "pn-window-titlewrap";

        const title = document.createElement("div");
        title.className = "pn-window-title";
        title.textContent = "PharmaNerd";

        const subtitle = document.createElement("div");
        subtitle.className = "pn-window-subtitle";
        subtitle.textContent = "Drug detail";

        titleWrap.append(title, subtitle);

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "pn-window-btn danger";
        closeBtn.setAttribute("aria-label", "Close window");
        closeBtn.textContent = "×";

        const controls = document.createElement("div");
        controls.className = "pn-window-controls";
        controls.append(closeBtn);
        titlebar.append(titleWrap, controls);

        const content = document.createElement("div");
        content.className = "pn-window-content";

        const iframe = document.createElement("iframe");
        iframe.title = "Drug details";
        iframe.loading = "eager";
        content.appendChild(iframe);

        frame.append(titlebar, content);
        overlay.appendChild(frame);
        document.body.appendChild(overlay);

        const state = {
            overlay,
            frame,
            title,
            subtitle,
            iframe,
            content,
        };

        function syncWindowBounds() {
            frame.style.left = "24px";
            frame.style.top = "24px";
            frame.style.width = "calc(100vw - 48px)";
            frame.style.height = "calc(100vh - 48px)";
            frame.style.right = "auto";
            frame.style.bottom = "auto";
            frame.style.transform = "none";
        }

        function openModal() {
            overlay.classList.add("open");
            overlay.setAttribute("aria-hidden", "false");
            document.body.classList.add("pn-window-open");
        }

        function closeModal() {
            overlay.classList.remove("open");
            overlay.setAttribute("aria-hidden", "true");
            document.body.classList.remove("pn-window-open");
        }

        function loadDrug(name) {
            const drug = getDrugWindowDrug(name);
            const resolvedName = drug?.name || name;
            title.textContent = resolvedName;
            subtitle.textContent = drug?.class ? `${drug.class} • Floating detail view` : "Floating detail view";
            frame.style.setProperty("--window-accent", drug ? getClassColor(drug.class) : "#57d7ff");
            iframe.src = `drug.html?drug=${encodeURIComponent(resolvedName)}&popup=1`;
            openModal();
            syncWindowBounds();
        }

        closeBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            closeModal();
        });

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                closeModal();
            }
        });

        window.addEventListener("resize", () => {
            if (!overlay.classList.contains("open")) return;
            syncWindowBounds();
        });

        document.addEventListener("keydown", (event) => {
            if (!overlay.classList.contains("open")) return;
            if (event.key === "Escape") {
                closeModal();
            }
        });

        activeWindow = {
            overlay,
            frame,
            title,
            subtitle,
            iframe,
            content,
            loadDrug,
            closeModal,
            syncWindowBounds,
        };

        return activeWindow;
    }

    function openDrugWindow(name) {
        if (!name) return;
        const detailMode = window.PharmaNerdSettings && typeof window.PharmaNerdSettings.getSetting === "function"
            ? window.PharmaNerdSettings.getSetting("detailMode")
            : "floating";
        if (detailMode === "page") {
            window.location.href = `drug.html?drug=${encodeURIComponent(name)}`;
            return;
        }
        const isPopupPage = document.documentElement.classList.contains("popup-mode") || window.self !== window.top;
        if (isPopupPage) {
            window.location.href = `drug.html?drug=${encodeURIComponent(name)}&popup=1`;
            return;
        }
        const modal = ensureDrugWindow();
        modal.loadDrug(name);
    }

    window.PharmaNerdComponents = {
        getClassColor,
        getTypeColor,
        getClassIcon,
        buildBadge,
        createDrugCardFactory,
        createSkeletonCard,
        createExternalDrugCardFactory,
        openDrugWindow,
    };
}
