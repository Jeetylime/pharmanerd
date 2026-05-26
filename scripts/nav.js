// Shared sidebar navigation — renders once, used across all pages
(function () {
    const NAV_ITEMS = [
        {
            href: "index.html",
            label: "Browse",
            icon: '<path d="M4 10L12 4l8 6v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />',
        },
        {
            href: "compare.html",
            label: "Compare",
            icon: '<path d="M4 4h6v16H4zM14 8h6v12h-6z" />',
        },
        {
            href: "interactions.html",
            label: "Interactions",
            icon: '<path d="M7 7h10v10H7z" /><path d="M3 12h4M17 12h4M12 3v4M12 17v4" />',
        },
        {
            href: "receptors.html",
            label: "Receptors",
            icon: '<path d="M12 3c4 0 7 3 7 7 0 3-2 5-4 6v3H9v-3c-2-1-4-3-4-6 0-4 3-7 7-7z" /><path d="M9 21h6" />',
        },
        {
            href: "classes.html",
            label: "Classes",
            icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />',
        },
        {
            href: "history.html",
            label: "History",
            icon: '<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />',
        },
        {
            href: "stash.html",
            label: "Stash",
            icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />',
        },
    ];

    function getCurrentPage() {
        const path = window.location.pathname.split("/").pop() || "index.html";
        return path;
    }

    function renderNav() {
        const currentPage = getCurrentPage();

        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;

        // Clear sidebar
        sidebar.innerHTML = "";

        // Brand
        const brand = document.createElement("div");
        brand.className = "brand";
        brand.innerHTML = `
            <div class="brand-mark">PN</div>
            <div>
                <h1>PharmaNerd</h1>
                <p>Pharmacology Encyclopedia</p>
            </div>
        `;
        sidebar.appendChild(brand);

        // Nav
        const nav = document.createElement("nav");
        nav.className = "nav";

        // Left section (page links)
        const navLeft = document.createElement("div");
        navLeft.className = "nav-left";

        NAV_ITEMS.forEach((item) => {
            const link = document.createElement("a");
            link.className = "nav-link" + (currentPage === item.href ? " active" : "");
            link.href = item.href;
            link.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${item.icon}
                </svg>
                ${item.label}
            `;
            navLeft.appendChild(link);
        });

        nav.appendChild(navLeft);

        // Right section (search, sort, settings)
        const navRight = document.createElement("div");
        navRight.className = "nav-right";
        navRight.style.cssText = "display:flex;align-items:center;gap:12px;";

        navRight.innerHTML = `
            <input id="topSearchInput" class="top-search" type="search" placeholder="Search by name or alias..."
                aria-label="Search drugs" />
            <select id="sortSelect" class="chip" aria-label="Sort" style="display:none;">
                <option value="name">Name A-Z</option>
                <option value="potency">Potency</option>
                <option value="duration">Duration</option>
                <option value="halfLife">Half-life</option>
            </select>
            <button class="nav-link" id="helpTourBtn" title="Help / Tour" aria-label="Help">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                </svg>
            </button>
            <button class="nav-link nav-settings-toggle" id="settingsToggle" title="Open settings" aria-label="Settings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16">
                    <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </button>
        `;

        // Show sort only if a #sortSelect exists in the page already or if we're on browse page
        if (currentPage === "index.html") {
            const sortSelect = navRight.querySelector("#sortSelect");
            if (sortSelect) sortSelect.style.display = "";
        }

        nav.appendChild(navRight);
        sidebar.appendChild(nav);
    }

    // Initialize nav after DOM is ready
    function init() {
        renderNav();

        // Wire up help tour button
        const helpBtn = document.getElementById("helpTourBtn");
        if (helpBtn) {
            helpBtn.addEventListener("click", () => {
                if (window.PharmaNerdTutorial && typeof window.PharmaNerdTutorial.start === "function") {
                    window.PharmaNerdTutorial.start();
                }
            });
        }

        // Wire up settings button
        const settingsBtn = document.getElementById("settingsToggle");
        if (settingsBtn) {
            settingsBtn.addEventListener("click", () => {
                const s = window.PharmaNerdSettings;
                if (s && s.openModal) {
                    s.openModal();
                } else {
                    alert("Settings loading...");
                }
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();