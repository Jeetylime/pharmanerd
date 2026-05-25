if (!window.PharmaNerdSearch) {
    const API_BASE = "/api";
    const externalCache = new Map();
    const components = window.PharmaNerdComponents || {};
    const createExternalDrugCard = components.createExternalDrugCardFactory
        ? components.createExternalDrugCardFactory({
            onSelect: (drug) => {
                if (window.PharmaNerdComponents && typeof window.PharmaNerdComponents.openDrugWindow === "function") {
                    window.PharmaNerdComponents.openDrugWindow(drug.name);
                    return;
                }
                window.location.href = `drug.html?drug=${encodeURIComponent(drug.name)}&external=true`;
            },
        })
        : null;

    async function searchExternalDrugs(query) {
        if (!query || query.trim().length < 2) return [];
        const key = query.trim().toLowerCase();
        if (externalCache.has(key)) return externalCache.get(key);

        try {
            const response = await fetch(
                `${API_BASE}/drug-search?name=${encodeURIComponent(query)}`,
                { headers: { Accept: "application/json" } }
            );
            if (!response.ok) return [];
            const data = await response.json();
            const results = data.results || [];
            externalCache.set(key, results);
            return results;
        } catch (error) {
            console.error("External drug search failed:", error);
            return [];
        }
    }

    function buildExternalCard(drug) {
        if (createExternalDrugCard) {
            return createExternalDrugCard(drug);
        }

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

    window.PharmaNerdSearch = {
        searchExternalDrugs,
        buildExternalCard,
    };
}