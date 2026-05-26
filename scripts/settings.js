if (!window.PharmaNerdSettings) {
    const STORAGE_KEY = "pharmanerd-settings";
    const DEFAULT_SETTINGS = {
        // Appearance
        colorMode: "dark",
        fontSize: "medium",
        compactCards: false,
        colorAccent: "cyan",
        theme: "cyan",
        density: "comfortable",
        fx: "standard",
        ui: "glass",
        layout: "topbar",
        detailMode: "floating",
        // Browse & Search
        defaultSort: "name",
        defaultFilter: "",
        browseView: "cards",
        resultsPerPage: 50,
        // Drug Detail
        defaultDetailTab: "snapshot",
        showLegalStatus: true,
        showAliases: true,
        unitSystem: "mg",
        // Data & Content
        enableRxNorm: true,
        showResearchDrugs: false,
        interactionSensitivity: "all",
        // UX & Behavior
        tutorialOnStartup: false,
        confirmClearStash: true,
        surpriseExcludedClasses: [],
        keyboardShortcuts: true,
    };

    const COLOR_ACCENTS = {
        cyan: { name: "Cyan", color: "#57d7ff", accent2: "#7af8bf" },
        green: { name: "Green", color: "#6fffb0", accent2: "#a6ffcf" },
        purple: { name: "Purple", color: "#b692ff", accent2: "#d4b8ff" },
        ember: { name: "Ember", color: "#ff8b5c", accent2: "#ffd166" },
        forest: { name: "Forest", color: "#62f0a3", accent2: "#a6ffcf" },
        violet: { name: "Violet", color: "#c084fc", accent2: "#a78bfa" },
    };

    const THEMES = {
        cyan: { name: "Cyan Pulse", bgA: "#0a0f1a", bgB: "#071422", bgC: "#03202d" },
        ember: { name: "Ember Lab", bgA: "#160b0a", bgB: "#26110e", bgC: "#2f0f12" },
        violet: { name: "Violet Core", bgA: "#100b1c", bgB: "#17102a", bgC: "#26113d" },
        forest: { name: "Forest Glass", bgA: "#08130f", bgB: "#0d1e16", bgC: "#09261d" },
    };

    let state = loadSettings();
    let modal = null;
    let lastFocus = null;
    let toggleButton = null;
    let systemColorListener = null;

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
        applyAll();
    }

    function getSetting(key) {
        return state[key] !== undefined ? state[key] : DEFAULT_SETTINGS[key];
    }

    function getSettings() {
        return { ...state };
    }

    // --- Apply Functions ---

    function applyColorMode() {
        const mode = getSetting("colorMode");
        const root = document.documentElement;

        // Remove old system listener if re-applying
        if (systemColorListener) {
            try {
                window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", systemColorListener);
            } catch (e) { }
            systemColorListener = null;
        }

        let effective = mode;
        if (mode === "system") {
            effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            // Listen for OS changes
            systemColorListener = function () {
                const newEff = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                setEffectiveMode(newEff);
            };
            window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", systemColorListener);
        }

        setEffectiveMode(effective);
        root.dataset.colorMode = mode;
    }

    function setEffectiveMode(effective) {
        const root = document.documentElement;
        if (effective === "light") {
            root.style.setProperty("--bg-a", "#f4f8fc");
            root.style.setProperty("--bg-b", "#e8f0f8");
            root.style.setProperty("--bg-c", "#dce6f0");
            root.style.setProperty("--text", "#0a1526");
            root.style.setProperty("--muted", "#6b7e9e");
            root.style.setProperty("--surface", "rgba(255,255,255,0.82)");
            root.style.setProperty("--surface-2", "rgba(240,245,255,0.88)");
            root.style.setProperty("--border", "rgba(10,21,50,0.12)");
            root.style.colorScheme = "light";
            document.body.style.background = "#f4f8fc";
        } else {
            root.style.setProperty("--bg-a", "#0a0f1a");
            root.style.setProperty("--bg-b", "#071422");
            root.style.setProperty("--bg-c", "#03202d");
            root.style.setProperty("--text", "#e8f2ff");
            root.style.setProperty("--muted", "#95a9c4");
            root.style.setProperty("--surface", "rgba(12,20,34,0.74)");
            root.style.setProperty("--surface-2", "rgba(10,16,28,0.84)");
            root.style.setProperty("--border", "rgba(174,234,255,0.14)");
            root.style.colorScheme = "dark";
            document.body.style.background = "";
        }
        root.dataset.effectiveMode = effective;
    }

    function applyFontSize() {
        const size = getSetting("fontSize");
        const root = document.documentElement;
        const sizes = { small: "14px", medium: "16px", large: "18px" };
        root.style.fontSize = sizes[size] || "16px";
    }

    function applyCompactCards() {
        const body = document.body;
        if (!body) return;
        body.classList.toggle("pn-compact-cards", getSetting("compactCards") === true);
    }

    function applyBrowseView() {
        const body = document.body;
        if (!body) return;
        const view = getSetting("browseView");
        body.classList.remove("browse-cards", "browse-list");
        body.classList.add("browse-" + view);
    }

    function applyThemeVars() {
        const accent = getAccentPalette();
        const root = document.documentElement;
        root.style.setProperty("--accent", accent.color);
        root.style.setProperty("--accent-2", accent.accent2);
        root.dataset.accent = getSetting("colorAccent");

        // Apply dark theme backgrounds if we're in dark mode
        const mode = getSetting("colorMode");
        const effective = root.dataset.effectiveMode || "dark";
        if (mode !== "light" && effective !== "light") {
            const theme = THEMES[getSetting("colorAccent")] || THEMES.cyan;
            if (theme && theme.bgA) {
                root.style.setProperty("--bg-a", theme.bgA);
                root.style.setProperty("--bg-b", theme.bgB);
                root.style.setProperty("--bg-c", theme.bgC);
            }
        }
    }

    function applyLayout() {
        const body = document.body;
        if (!body) return;
        body.classList.remove("layout-sidebar", "layout-topbar", "layout-minimal");
        body.classList.add("layout-" + getSetting("layout"));
    }

    function applyResearchFilter() {
        // Hide/show research chemical drugs in the UI
        const showResearch = getSetting("showResearchDrugs");
        document.querySelectorAll('.drug-card').forEach(card => {
            const name = card.dataset.drugName;
            if (!name) return;
            const data = window.PharmaNerdData;
            if (!data || !data.DRUGS) return;
            const drug = data.DRUGS.find(d => d.name === name);
            if (drug && drug.type === "Research Chemical") {
                card.style.display = showResearch ? "" : "none";
            }
        });
    }

    function applyAliases() {
        const show = getSetting("showAliases");
        document.querySelectorAll('.hero-title .mono, [data-alias-area]').forEach(el => {
            el.style.display = show ? "" : "none";
        });
    }

    function applyLegalStatus() {
        const show = getSetting("showLegalStatus");
        document.querySelectorAll('[data-legal-area]').forEach(el => {
            el.style.display = show ? "" : "none";
        });
    }

    function applyRxNorm() {
        const enabled = getSetting("enableRxNorm");
        document.documentElement.dataset.rxnorm = enabled ? "enabled" : "disabled";
        if (!enabled && window.PharmaNerdRx) {
            // Disable RxNorm fetching by overriding its functions
            window.PharmaNerdRx.getInteractionsForDrug = function () {
                return Promise.resolve({ list: [] });
            };
        }
    }

    function applyInteractionSensitivity() {
        const level = getSetting("interactionSensitivity");
        document.documentElement.dataset.interactionLevel = level;
        // Filter visible interaction items
        document.querySelectorAll('.interaction-item, .severity').forEach(el => {
            const sev = el.classList.contains('severity-high') || el.textContent.toLowerCase().includes('severe') ? 'severe' :
                el.classList.contains('severity-medium') || el.textContent.toLowerCase().includes('moderate') ? 'moderate' : 'mild';
            if (level === 'major' && sev !== 'severe') {
                el.style.display = 'none';
            } else if (level === 'moderate' && sev === 'mild') {
                el.style.display = 'none';
            } else {
                el.style.display = '';
            }
        });
    }

    function applyConfirmStash() {
        const confirm = getSetting("confirmClearStash");
        document.documentElement.dataset.confirmStash = confirm ? "true" : "false";
    }

    function applyKeyboardShortcuts() {
        const enabled = getSetting("keyboardShortcuts");
        document.documentElement.dataset.shortcuts = enabled ? "enabled" : "disabled";
    }

    function applyDefaultSort() {
        // Apply default sort to sort select if it exists
        const sortSelect = document.querySelector("#sortSelect");
        if (sortSelect) {
            const sort = getSetting("defaultSort");
            if (sortSelect.value !== sort) {
                sortSelect.value = sort;
                sortSelect.dispatchEvent(new Event("change"));
            }
        }
    }

    function applyAll() {
        const body = document.body;
        if (!body) return;

        body.classList.toggle("pn-density-compact", getSetting("density") === "compact");
        body.classList.toggle("pn-fx-low", getSetting("fx") === "low");
        body.classList.toggle("pn-fx-minimal", getSetting("fx") === "minimal");
        body.classList.toggle("pn-ui-flat", getSetting("ui") === "flat");
        body.classList.toggle("pn-compact-cards", getSetting("compactCards") === true);

        document.documentElement.dataset.detailMode = getSetting("detailMode");

        applyColorMode();
        applyFontSize();
        applyBrowseView();
        applyThemeVars();
        applyLayout();
        applyRxNorm();
        applyInteractionSensitivity();
        applyConfirmStash();
        applyKeyboardShortcuts();

        // Notify other scripts
        window.dispatchEvent(new CustomEvent("pharmanerd:settings-changed", { detail: getSettings() }));

        // Apply default sort after a moment when the page is ready
        setTimeout(applyDefaultSort, 200);
    }

    // --- Public API ---

    function setSetting(key, value) {
        saveSettings({ ...state, [key]: value });
        syncControls();
    }

    function resetSettings() {
        if (confirm("Reset all settings to defaults?")) {
            localStorage.removeItem(STORAGE_KEY);
            state = { ...DEFAULT_SETTINGS };
            applyAll();
            syncControls();
            window.dispatchEvent(new CustomEvent("pharmanerd:settings-changed", { detail: getSettings() }));
        }
    }

    // --- Modal ---

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
            button.dataset.settingValue = String(option.value);
            button.innerHTML = `
                <strong>${option.label}</strong>
                <span>${option.description || ""}</span>
            `;
            button.addEventListener("click", () => {
                setSetting(key, option.value);
            });
            grid.appendChild(button);
        });
        const currentValue = String(state[key]);
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
                <p>Visual options, data, and behavior for the whole app.</p>
            </div>
            <button type="button" class="pn-settings-close" aria-label="Close settings">×</button>
        `;

        const content = document.createElement("div");
        content.className = "pn-settings-content";

        // === APPEARANCE ===
        content.appendChild(buildRadioGroup({
            key: "colorMode", label: "Color Mode",
            description: "Dark, light, or follow your system preference.",
            options: [
                { value: "dark", label: "Dark", description: "Dark background everywhere" },
                { value: "light", label: "Light", description: "Light background everywhere" },
                { value: "system", label: "System", description: "Follow OS preference" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "fontSize", label: "Font Size",
            description: "Adjust text size for accessibility.",
            options: [
                { value: "small", label: "Small", description: "14px base" },
                { value: "medium", label: "Medium", description: "16px base (default)" },
                { value: "large", label: "Large", description: "18px base" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "layout", label: "UI Layout",
            options: [
                { value: "topbar", label: "Top Bar (default)", description: "Current top navigation" },
                { value: "sidebar", label: "Sidebar", description: "Fixed left sidebar navigation" },
                { value: "minimal", label: "Minimal", description: "Clean minimal interface" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "colorAccent", label: "Color Accent",
            description: "Pick a highlight color for accents and buttons.",
            options: Object.entries(COLOR_ACCENTS).map(([value, a]) => ({
                value, label: a.name, description: "Preview: " + a.color,
            })),
        }));

        content.appendChild(buildRadioGroup({
            key: "density", label: "Spacing",
            options: [
                { value: "comfortable", label: "Comfortable", description: "Current roomy layout" },
                { value: "compact", label: "Compact", description: "Denser spacing and tighter cards" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "fx", label: "Visual Effects",
            description: "Tune the amount of glass, glow, and motion.",
            options: [
                { value: "standard", label: "Standard", description: "Balanced visual treatment" },
                { value: "low", label: "Low FX", description: "Reduced shadows and chrome" },
                { value: "minimal", label: "Minimal", description: "Lowest cost render style" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "ui", label: "UI Style",
            options: [
                { value: "glass", label: "Glass", description: "Translucent panels with blur" },
                { value: "flat", label: "Flat", description: "Solid color panels" },
            ],
        }));

        // === BROWSE & SEARCH ===
        content.appendChild(buildRadioGroup({
            key: "defaultSort", label: "Default Sort Order",
            options: [
                { value: "name", label: "Name A-Z", description: "Sort alphabetically" },
                { value: "potency", label: "Potency", description: "Highest potency first" },
                { value: "duration", label: "Duration", description: "Longest duration first" },
                { value: "halfLife", label: "Half-life", description: "Longest half-life first" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "browseView", label: "Browse View",
            description: "Cards or compact list on the browse page.",
            options: [
                { value: "cards", label: "Cards", description: "Grid card layout with icons" },
                { value: "list", label: "List", description: "Compact list layout" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "compactCards", label: "Compact Cards",
            description: "Tighter drug cards to fit more on screen.",
            options: [
                { value: false, label: "Off", description: "Normal card size" },
                { value: true, label: "On", description: "Compact card mode" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "resultsPerPage", label: "Results Per Page",
            description: "How many drugs to show at once.",
            options: [
                { value: 25, label: "25", description: "Fewer, cleaner pages" },
                { value: 50, label: "50", description: "Balanced (default)" },
                { value: 100, label: "100", description: "Show everything at once" },
            ],
        }));

        // === DRUG DETAIL ===
        content.appendChild(buildRadioGroup({
            key: "defaultDetailTab", label: "Default Detail Tab",
            description: "Which section to show first on drug pages.",
            options: [
                { value: "snapshot", label: "Clinical Snapshot", description: "Overview stats first" },
                { value: "mechanism", label: "Mechanism", description: "Mechanism of action first" },
                { value: "pk", label: "Pharmacokinetics", description: "PK data first" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "showLegalStatus", label: "Legal Status",
            description: "Show or hide legal/schedule information.",
            options: [
                { value: true, label: "Visible", description: "Show legal status on drug pages" },
                { value: false, label: "Hidden", description: "Hide legal status" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "showAliases", label: "Street Names / Aliases",
            description: "Some users may prefer not to see these.",
            options: [
                { value: true, label: "Visible", description: "Show aliases on drug pages" },
                { value: false, label: "Hidden", description: "Hide aliases" },
            ],
        }));

        // === DATA & CONTENT ===
        content.appendChild(buildRadioGroup({
            key: "enableRxNorm", label: "RxNorm API",
            description: "Toggle live data fetching from RxNorm on/off.",
            options: [
                { value: true, label: "Enabled", description: "Fetch live interaction data" },
                { value: false, label: "Disabled", description: "Use local data only" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "showResearchDrugs", label: "Research Drugs",
            description: "Show or hide drugs flagged as research-only.",
            options: [
                { value: false, label: "Hidden", description: "Hide research chemicals" },
                { value: true, label: "Visible", description: "Show research chemicals" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "interactionSensitivity", label: "Interaction Warnings",
            description: "Which interactions to highlight.",
            options: [
                { value: "major", label: "Major Only", description: "Only show major interactions" },
                { value: "moderate", label: "Major + Moderate", description: "Hide minor interactions" },
                { value: "all", label: "All", description: "Show all interaction levels" },
            ],
        }));

        // === UX & BEHAVIOR ===
        content.appendChild(buildRadioGroup({
            key: "confirmClearStash", label: "Confirm Clear Stash",
            description: "Prevent accidental wipe of saved drugs.",
            options: [
                { value: true, label: "Enabled", description: "Ask before clearing stash" },
                { value: false, label: "Disabled", description: "Clear without confirmation" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "tutorialOnStartup", label: "Tutorial on Startup",
            description: "Run the guided tour automatically.",
            options: [
                { value: false, label: "Off", description: "Don't show tutorial on load" },
                { value: true, label: "On", description: "Show tutorial on first load" },
            ],
        }));

        content.appendChild(buildRadioGroup({
            key: "keyboardShortcuts", label: "Keyboard Shortcuts",
            description: "/ to focus search, S to stash, etc.",
            options: [
                { value: true, label: "Enabled", description: "Keyboard shortcuts active" },
                { value: false, label: "Disabled", description: "No keyboard shortcuts" },
            ],
        }));

        panel.appendChild(header);
        panel.appendChild(content);

        // Reset button at bottom
        const footer = document.createElement("div");
        footer.className = "pn-settings-footer";
        const resetBtn = document.createElement("button");
        resetBtn.type = "button";
        resetBtn.className = "btn secondary";
        resetBtn.textContent = "Reset all settings to defaults";
        resetBtn.addEventListener("click", resetSettings);
        footer.appendChild(resetBtn);
        panel.appendChild(footer);

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
        if (e.key === "Escape") closeModal();
    }

    function syncControls() {
        if (!modal) return;
        const keys = Object.keys(DEFAULT_SETTINGS);
        keys.forEach(key => {
            const current = String(getSetting(key));
            modal.panel.querySelectorAll(`[data-setting-key="${key}"]`).forEach(el => {
                el.classList.toggle("active", String(el.dataset.settingValue) === current);
            });
        });
    }

    function init() {
        applyAll();
        document.querySelectorAll('[data-action="open-settings"]').forEach((el) => {
            el.addEventListener("click", openModal);
        });
        if (toggleButton) {
            toggleButton.addEventListener("click", openModal);
        }

        // Listen for settings-changed to re-apply on dynamic content
        window.addEventListener("pharmanerd:data-loaded", function () {
            applyDefaultSort();
        });
    }

    window.PharmaNerdSettings = {
        openModal,
        closeModal,
        setSetting,
        getSettings,
        getSetting,
        init,
        resetSettings,
        DEFAULT_SETTINGS,
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}