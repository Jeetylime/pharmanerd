if (!window.PharmaNerdData) {
    const API_BASE = "/api";

    async function fetchData() {
        try {
            const response = await fetch(`${API_BASE}/data`);
            if (!response.ok) {
                throw new Error(`Data API request failed: ${response.status}`);
            }
            const json = await response.json();

            const {
                CLASS_COLORS = {},
                CLASS_ICONS = {},
                TYPES = [],
                LEGAL_STATUS_FILTERS = [],
                EFFECT_PROFILES = [],
                RECEPTOR_INFO = {},
                PHARMACOKINETIC_INFO = {},
                DRUGS = [],
            } = json;

            // Normalize drug names: ensure aliases exist and build an `allNames` lookup
            (DRUGS || []).forEach((d) => {
                if (!Array.isArray(d.aliases)) d.aliases = [];
                if (!Array.isArray(d.otherNames)) d.otherNames = [];
                // allNames includes primary name, aliases, and any other common names
                d.allNames = Array.from(new Set([d.name, ...d.aliases, ...d.otherNames].filter(Boolean)));
            });

            function findDrugByName(name) {
                if (!name) return null;
                const normalized = name.trim().toLowerCase();
                return (
                    DRUGS.find((drug) =>
                        drug.name.toLowerCase() === normalized || (drug.allNames || []).some(n => n.toLowerCase() === normalized)
                    ) || null
                );
            }

            function matchDrugByAlias(query) {
                if (!query) return null;
                const normalized = query.trim().toLowerCase();
                return (
                    DRUGS.find((drug) =>
                        (drug.allNames || []).some((n) => n.toLowerCase() === normalized)
                    ) || null
                );
            }

            window.PharmaNerdData = {
                CLASS_COLORS,
                CLASS_ICONS,
                TYPES,
                LEGAL_STATUS_FILTERS,
                EFFECT_PROFILES,
                RECEPTOR_INFO,
                PHARMACOKINETIC_INFO,
                DRUGS,
                findDrugByName,
                matchDrugByAlias,
            };

            window.dispatchEvent(new CustomEvent("pharmanerd:data-loaded"));
        } catch (error) {
            console.error("Failed to load PharmaNerd data from API:", error);
        }
    }

    fetchData();
}