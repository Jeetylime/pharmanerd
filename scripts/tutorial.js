if (!window.PharmaNerdTutorial) {
    const STEPS = [
        {
            title: "Welcome to PharmaNerd!",
            content: "This quick tour will show you how to explore drugs, compare them, and customize your experience.",
            position: "center",
        },
        {
            title: "Browse Drugs",
            content: "The home page shows all available drugs. Click any drug card to see detailed information about its effects, mechanism, and interactions.",
            selector: ".nav-link[href='index.html']",
            position: "bottom",
        },
        {
            title: "Search & Sort",
            content: "Use the search bar to find drugs by name or alias. The sort dropdown lets you order results by name, potency, duration, or half-life.",
            selector: "#topSearchInput",
            position: "bottom",
        },
        {
            title: "Compare Drugs",
            content: "Visit the Compare page to see drugs side-by-side. Add drugs to compare their effects, mechanisms, and pharmacokinetics.",
            selector: ".nav-link[href='compare.html']",
            position: "bottom",
        },
        {
            title: "Check Interactions",
            content: "The Interactions page shows potential interactions between different drugs. Always check before combining substances.",
            selector: ".nav-link[href='interactions.html']",
            position: "bottom",
        },
        {
            title: "Explore Receptors",
            content: "The Receptors page visualizes how different drugs target various receptors in the body. Click a receptor to learn more.",
            selector: ".nav-link[href='receptors.html']",
            position: "bottom",
        },
        {
            title: "Drug Classes",
            content: "The Classes page groups drugs by their pharmacological class. Compare class statistics and see which drugs belong to each class.",
            selector: ".nav-link[href='classes.html']",
            position: "bottom",
        },
        {
            title: "History Timeline",
            content: "The History page shows important milestones in pharmacology and drug discovery. Learn about the origins of the drugs you explore.",
            selector: ".nav-link[href='history.html']",
            position: "bottom",
        },
        {
            title: "Settings & Customization",
            content: "Click the gear icon to open Settings. Here you can change UI layouts, color themes, density, visual effects, and more.",
            selector: ".nav-settings-toggle",
            position: "bottom",
        },
        {
            title: "Stash Your Favorites",
            content: "Click the 'Stash' button on any drug card or detail page to save it to your favorites. Your stashed drugs appear at the top of the Browse page.",
            position: "center",
        },
        {
            title: "You're all set!",
            content: "Start exploring the pharmacopeia. Click a drug card to dive in, or visit the settings to customize your experience.",
            position: "center",
        },
    ];

    let currentStep = 0;
    let overlay = null;
    let tooltip = null;
    let highlight = null;

    function createOverlay() {
        overlay = document.createElement("div");
        overlay.className = "tutorial-overlay";
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        document.body.appendChild(overlay);
    }

    function createTooltip() {
        tooltip = document.createElement("div");
        tooltip.className = "tutorial-tooltip";
        tooltip.style.cssText = `
            position: fixed;
            z-index: 10000;
            max-width: 420px;
            padding: 24px;
            border-radius: 16px;
            background: linear-gradient(180deg, rgba(8,16,30,0.98), rgba(5,12,24,0.98));
            border: 1px solid rgba(87,215,255,0.3);
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            color: #e8f2ff;
        `;
        document.body.appendChild(tooltip);
    }

    function createHighlight(selector) {
        if (highlight) highlight.remove();
        const el = document.querySelector(selector);
        if (!el) return;
        highlight = document.createElement("div");
        highlight.style.cssText = `
            position: fixed;
            z-index: 9998;
            border-radius: 12px;
            box-shadow: 0 0 0 4px rgba(87,215,255,0.6), 0 0 0 9999px rgba(0,0,0,0.5);
            pointer-events: none;
            transition: all 0.3s ease;
        `;
        positionHighlight(el);
        document.body.appendChild(highlight);
    }

    function positionHighlight(el) {
        const rect = el.getBoundingClientRect();
        highlight.style.left = (rect.left - 8) + "px";
        highlight.style.top = (rect.top - 8) + "px";
        highlight.style.width = (rect.width + 16) + "px";
        highlight.style.height = (rect.height + 16) + "px";
    }

    function positionTooltip(step) {
        const el = step.selector ? document.querySelector(step.selector) : null;
        const tw = 420;
        const th = tooltip.offsetHeight || 200;

        if (!el || step.position === "center") {
            tooltip.style.left = "50%";
            tooltip.style.top = "50%";
            tooltip.style.transform = "translate(-50%, -50%)";
            return;
        }

        const rect = el.getBoundingClientRect();
        let left, top;

        if (step.position === "bottom") {
            left = rect.left + rect.width / 2 - tw / 2;
            top = rect.bottom + 16;
            // Keep within viewport
            if (left < 16) left = 16;
            if (left + tw > window.innerWidth - 16) left = window.innerWidth - tw - 16;
            if (top + th > window.innerHeight - 16) top = rect.top - th - 16;
        }

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
        tooltip.style.transform = "none";
    }

    function renderStep() {
        const step = STEPS[currentStep];
        if (!step) return;

        // Remove old highlight
        if (highlight) highlight.remove();
        highlight = null;

        // Create new highlight if selector exists
        if (step.selector) {
            createHighlight(step.selector);
        }

        // Build tooltip content
        const total = STEPS.length;
        let navLinks = "";
        if (step.selector) {
            const el = document.querySelector(step.selector);
            if (el && el.tagName === "A") {
                navLinks = `<p style="margin-top:12px;font-size:12px;color:var(--muted);">This button links to: <strong>${el.textContent.trim()}</strong></p>`;
            }
        }

        tooltip.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-size:12px;color:var(--accent);font-weight:600;">Step ${currentStep + 1} of ${total}</span>
                <button onclick="window.PharmaNerdTutorial.close()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;">×</button>
            </div>
            <h3 style="font-size:18px;margin-bottom:8px;">${step.title}</h3>
            <p style="font-size:14px;color:#b8c8e0;line-height:1.5;">${step.content}</p>
            ${navLinks}
            <div style="display:flex;justify-content:space-between;margin-top:16px;gap:8px;">
                <button onclick="window.PharmaNerdTutorial.prev()" style="padding:8px 16px;border-radius:8px;border:1px solid rgba(174,234,255,0.2);background:rgba(7,16,28,0.8);color:var(--text);cursor:pointer;${currentStep === 0 ? 'opacity:0.4;pointer-events:none;' : ''}">← Back</button>
                <div style="display:flex;gap:6px;align-items:center;">
                    ${STEPS.map((_, i) => `<span style="width:8px;height:8px;border-radius:50%;background:${i === currentStep ? 'var(--accent)' : 'rgba(174,234,255,0.2)'};display:inline-block;"></span>`).join('')}
                </div>
                <button onclick="window.PharmaNerdTutorial.next()" style="padding:8px 16px;border-radius:8px;border:1px solid rgba(87,215,255,0.4);background:rgba(87,215,255,0.2);color:var(--text);cursor:pointer;">${currentStep === total - 1 ? 'Finish ✓' : 'Next →'}</button>
            </div>
        `;

        positionTooltip(step);
    }

    function next() {
        if (currentStep < STEPS.length - 1) {
            currentStep++;
            renderStep();
        } else {
            close();
        }
    }

    function prev() {
        if (currentStep > 0) {
            currentStep--;
            renderStep();
        }
    }

    function start() {
        currentStep = 0;
        if (!overlay) createOverlay();
        if (!tooltip) createTooltip();
        renderStep();
    }

    function close() {
        if (overlay) { overlay.remove(); overlay = null; }
        if (tooltip) { tooltip.remove(); tooltip = null; }
        if (highlight) { highlight.remove(); highlight = null; }
    }

    window.PharmaNerdTutorial = {
        start,
        close,
        next,
        prev,
    };
}