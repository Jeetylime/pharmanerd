if (!window.PharmaNerdSettings) {
    const STORAGE_KEY = "pharmanerd-settings";
    const DEFAULT_SETTINGS = {
        theme: "cyan",
        density: "comfortable",
        detailMode: "floating",
        fx: "standard",
        ui: "glass",
        layout: "topbar",
    };

    const THEMES = {
        cyan: {
            name: "Cyan Pulse",
            accent: "#57d7ff",
            accent2: "#7af8bf",
            bgA: "#0a0f1a",
            bgB: "#071422",
            bgC: "#03202d",
        },
        ember: {
            name: "Ember Lab",
            accent: "#ff8b5c",
            accent2: "#ffd166",
            bgA: "#160b0a",
            bgB: "#26110e",
            bgC: "#2f0f12",
        },
        violet: {
            name: "Violet Core",
            accent: "#b692ff",
            accent2: "#7af8bf",
            bgA: "#100b1c",
            bgB: "#17102a",
            bgC: "#26113d",
        },
        forest: {
            name: "Forest Glass",
            accent: "#62f0a3",
            accent2: "#a6ffcf",
            bgA: "#08130f",
            bgB: "#0d1e16",
            bgC: "#09261d",
        },
    };

    const LAYOUTS = {
        topbar: { name: "Top Bar (default)", desc: "Current top navigation" },
        sidebar: { name: "Sidebar", desc: "Fixed left sidebar navigation" },
        minimal: { name: "Minimal", desc: "Clean minimal interface" },
    };

    let state = loadSettings();
    let modal = null;
    let lastFocus = null;
    let toggleButton = null;

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULT_SETTINGS };
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        } catch (error) {
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings(nextState) {
        state = { ...DEFAULT_SETTINGS, ...nextState };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        applySettings();
    }

    function getSetting(key) {
        return state[key] ?? DEFAULT_SETTINGS[key];
    }

    function getSettings() {
        return { ...state };
    }

    function getThemePalette() {
        return THEMES[getSetting("theme")] || THEMES.cyan;
    }

    function applyThemeVars() {
        const palette = getThemePalette();
        const root = document.documentElement;
        root.style.setProperty("--accent", palette.accent);
        root.style.setProperty("--accent-2", palette.accent2);
        root.style.setProperty("--bg-a", palette.bgA);
        root.style.setProperty("--bg-b", palette.bgB);
        root.style.setProperty("--bg-c", palette.bgC);
        root.dataset.theme = getSetting("theme");
    }

    function applyLayout() {
        const body = document.body;
        if (!body) return;
        body.classList.remove("layout-sidebar", "layout-topbar", "layout-minimal");
        body.classList.add("layout-" + getSetting("layout"));
    }

    function applySettings() {
        const body = document.body;
        if (!body) return;

        body.classList.toggle("pn-density-compact", getSetting("density") === "compact");
        body.classList.toggle("pn-fx-low", getSetting("fx") === "low");
        body.classList.toggle("pn-fx-minimal", getSetting("fx") === "minimal");
        body.classList.toggle("pn-ui-flat", getSetting("ui") === "flat");
        document.documentElement.dataset.detailMode = getSetting("detailMode");
        applyThemeVars();
        applyLayout();
    }

    function setSetting(key, value) {
        saveSettings({ ...state, [key]: value });
        syncControls();
    }

    function buildRadioGroup({ key, label, options, description }) {
        const fieldset = document.createElement("fieldset");
        fieldset.className = "settings-group";

        const legend = document.createElement("legend");
        legend.textContent = label;
        fieldset.appendChild(legend);

        if (description) {
            const desc = document.createElement("p");
            desc.className = "settings-desc";
            desc.textContent = description;
            fieldset.appendChild(desc);
        }

        const grid = document.createElement("div");
        grid.className = "settings-option-grid";

        options.forEach((option) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "settings-option";
            button.dataset.settingKey = key;
            button.dataset.settingValue = option.value;
            button.innerHTML = `
                <strong>${option.label}</strong>
                <span>${option.description || ""}</span>
            `;
            button.addEventListener("click", () => {
                setSetting(key, option.value);
            });
            grid.appendChild(button);
        });
        // Mark the initially active option
        const currentValue = state[key];
        if (currentValue) {
            const activeBtn = grid.querySelector(`[data-setting-value="${currentValue}"]`);
            if (activeBtn) activeBtn.classList.add("active");
        }

        fieldset.appendChild(grid);
        return fieldset;
    }

    function createModal() {
        if (modal) return modal;

        const overlay = document.createElement("div");
        overlay.className = "pn-settings-overlay";
        overlay.setAttribute("aria-hidden", "true");

        const panel = document.createElement("div");
        panel.className = "pn-settings-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-labelledby", "pharmanerd-settings-title");

        const header = document.createElement("div");
        header.className = "pn-settings-header";
        header.innerHTML = `
            <div>
                <div class="pn-settings-kicker">Official controls</div>
                <h2 id="pharmanerd-settings-title">Settings</h2>
                <p>Visual options, alternate UIs, and detail behavior for the whole app.</p>
            </div>
            <button type="button" class="pn-settings-close" aria-label="Close settings">×</button>
        `;

        const content = document.createElement("div");
        content.className = "pn-settings-content";

        const layoutGroup = buildRadioGroup({
            key: "layout",
            label: "UI Layout",
            description: "Choose between sidebar, top bar, or minimal layout.",
            options: Object.entries(LAYOUTS).map(([value, layout]) => ({
                value,
                label: layout.name,
                description: layout.desc,
            })),
        });

        const themeGroup = buildRadioGroup({
            key: "theme",
            label: "Color theme",
            description: "Change the accent palette and background tone.",
            options: Object.entries(THEMES).map(([value, theme]) => ({
                value,
                label: theme.name,
                description: value === "cyan" ? "Default high-energy lab look" : "Alternate palette",
            })),
        });

        const densityGroup = buildRadioGroup({
            key: "density",
            label: "Density",
            description: "Tighten or relax spacing across cards and panels.",
            options: [
                { value: "comfortable", label: "Comfortable", description: "Current roomy layout" },
                { value: "compact", label: "Compact", description: "Denser spacing and tighter cards" },
            ],
        });

        const fxGroup = buildRadioGroup({
            key: "fx",
            label: "Visual effects",
            description: "Tune the amount of glass, glow, and motion.",
            options: [
                { value: "standard", label: "Standard", description: "Balanced visual treatment" },
                { value: "low", label: "Low FX", description: "Reduced shadows and chrome" },
                { value: "minimal", label: "Minimal", description: "Lowest cost render style" },
            ],
        });

        const uiGroup = buildRadioGroup({
            key: "ui",
            label: "UI style",
            description: "Choose between glass and flat interface.",
            options: [
                { value: "glass", label: "Glass", description: "Translucent panels with blur" },
                { value: "flat", label: "Flat", description: "Solid color panels" },
            ],
        });

        content.appendChild(layoutGroup);
        content.appendChild(themeGroup);
        content.appendChild(densityGroup);
        content.appendChild(fxGroup);
        content.appendChild(uiGroup);

        panel.appendChild(header);
        panel.appendChild(content);
        overlay.appendChild(panel);

        document.body.appendChild(overlay);
        modal = { overlay, panel };

        const closeBtn = panel.querySelector(".pn-settings-close");
        closeBtn.addEventListener("click", closeModal);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeModal();
        });

        return modal;
    }

    function openModal() {
        const m = createModal();
        m.overlay.classList.add("open");
        m.overlay.setAttribute("aria-hidden", "false");
        m.panel.focus();
        lastFocus = document.activeElement;
        document.addEventListener("keydown", trapFocus);
    }

    function closeModal() {
        if (!modal) return;
        modal.overlay.classList.remove("open");
        modal.overlay.setAttribute("aria-hidden", "true");
        document.removeEventListener("keydown", trapFocus);
        if (lastFocus) lastFocus.focus();
    }

    function trapFocus(e) {
        if (e.key === "Escape") {
            closeModal();
        }
    }

    function syncControls() {
        if (!modal) return;
        // For each setting key, remove active from all then add to the selected one
        ['layout', 'theme', 'density', 'fx', 'ui'].forEach(key => {
            const current = getSetting(key);
            modal.panel.querySelectorAll(`[data-setting-key="${key}"]`).forEach(el => {
                el.classList.toggle("active", el.dataset.settingValue === current);
            });
        });
    }

    function init() {
        applySettings();
        // Wire up any element with data-action="open-settings"
        document.querySelectorAll('[data-action="open-settings"]').forEach((el) => {
            el.addEventListener("click", openModal);
        });
        // Also wire the old toggleButton reference if set
        if (toggleButton) {
            toggleButton.addEventListener("click", openModal);
        }
    }

    window.PharmaNerdSettings = {
        openModal,
        closeModal,
        setSetting,
        getSettings,
        getSetting,
        init,
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}