if (!window.PharmaNerdRx) {
    const API_BASE = "/api";
    const nameCache = new Map();
    const rxcuiCache = new Map();
    const interactionCache = new Map();

    async function fetchJson(url) {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) {
            throw new Error(`RxNorm request failed: ${response.status}`);
        }
        return response.json();
    }

    function normalizeSeverity(severity) {
        const value = String(severity || "").toLowerCase();
        if (value === "contraindicated") return "contraindicated";
        if (value === "high") return "severe";
        if (value === "moderate") return "moderate";
        if (value === "low") return "mild";
        return "moderate";
    }

    async function getRxcuiByName(name) {
        if (!name) return null;
        const key = name.trim().toLowerCase();
        if (nameCache.has(key)) return nameCache.get(key);
        const url = `${API_BASE}/rxcui?name=${encodeURIComponent(name)}`;
        const json = await fetchJson(url);
        const rxcui = json?.idGroup?.rxnormId?.[0] || null;
        nameCache.set(key, rxcui);
        return rxcui;
    }

    async function getRxcuiForDrug(drug) {
        if (!drug) return null;
        if (rxcuiCache.has(drug.name)) return rxcuiCache.get(drug.name);
        const candidates = [drug.rxnormName, drug.name, ...(drug.aliases || [])].filter(Boolean);
        for (const candidate of candidates) {
            const rxcui = await getRxcuiByName(candidate);
            if (rxcui) {
                rxcuiCache.set(drug.name, rxcui);
                return rxcui;
            }
        }
        rxcuiCache.set(drug.name, null);
        return null;
    }

    function parseInteractions(json) {
        // Support two formats: RxNav interactionTypeGroup or our server fallback { fallback: true, pairs: [...] }
        if (json && json.fallback && Array.isArray(json.pairs)) {
            return json.pairs.map((p) => ({
                rxcuiA: p.rxcuiA || "",
                rxcuiB: p.rxcuiB || "",
                nameA: p.nameA || "",
                nameB: p.nameB || "",
                severity: normalizeSeverity(p.severity),
                description: p.description || "",
            }));
        }

        const pairs = [];
        const groups = json?.interactionTypeGroup || [];
        groups.forEach((group) => {
            (group.interactionType || []).forEach((type) => {
                (type.interactionPair || []).forEach((pair) => {
                    const concepts = pair.interactionConcept || [];
                    if (concepts.length < 2) return;
                    const a = concepts[0].sourceConceptItem || {};
                    const b = concepts[1].sourceConceptItem || {};
                    pairs.push({
                        rxcuiA: a.rxcui,
                        rxcuiB: b.rxcui,
                        nameA: a.name,
                        nameB: b.name,
                        severity: normalizeSeverity(pair.severity),
                        description: pair.description || "",
                    });
                });
            });
        });
        return pairs;
    }

    async function getInteractionsForRxcuis(rxcuis) {
        const unique = [...new Set(rxcuis)].filter(Boolean);
        if (!unique.length) return [];
        const key = unique.slice().sort().join("|");
        if (interactionCache.has(key)) return interactionCache.get(key);
        const url = `${API_BASE}/interaction?rxcuis=${encodeURIComponent(unique.join(","))}`;
        const json = await fetchJson(url);
        const pairs = parseInteractions(json);
        interactionCache.set(key, pairs);
        return pairs;
    }

    async function getInteractionsForDrugs(drugs) {
        const resolved = await Promise.all(drugs.map(getRxcuiForDrug));
        const rxcuiToDrug = new Map();
        const missing = [];
        resolved.forEach((rxcui, index) => {
            const name = drugs[index]?.name;
            if (rxcui) {
                rxcuiToDrug.set(rxcui, name);
            } else if (name) {
                missing.push(name);
            }
        });

        const rxcuis = [...rxcuiToDrug.keys()];
        if (!rxcuis.length) {
            return { pairs: [], missing };
        }

        const pairs = await getInteractionsForRxcuis(rxcuis);
        const filtered = pairs.filter(
            (pair) => rxcuiToDrug.has(pair.rxcuiA) && rxcuiToDrug.has(pair.rxcuiB)
        );

        const mapped = filtered.map((pair) => ({
            drugA: rxcuiToDrug.get(pair.rxcuiA),
            drugB: rxcuiToDrug.get(pair.rxcuiB),
            severity: pair.severity,
            description: pair.description,
        }));

        return { pairs: mapped, missing };
    }

    async function getInteractionsForDrug(drug) {
        const rxcui = await getRxcuiForDrug(drug);
        if (!rxcui) {
            return { list: [], missing: [drug?.name].filter(Boolean) };
        }
        const pairs = await getInteractionsForRxcuis([rxcui]);
        const list = pairs
            .filter((pair) => pair.rxcuiA === rxcui || pair.rxcuiB === rxcui)
            .map((pair) => {
                const isA = pair.rxcuiA === rxcui;
                return {
                    otherName: isA ? pair.nameB : pair.nameA,
                    severity: pair.severity,
                    description: pair.description,
                };
            });

        return { list, missing: [] };
    }

    async function getInteractionCount(drug) {
        const result = await getInteractionsForDrug(drug);
        return result.list.length;
    }

    window.PharmaNerdRx = {
        getRxcuiByName,
        getRxcuiForDrug,
        getInteractionsForRxcuis,
        getInteractionsForDrugs,
        getInteractionsForDrug,
        getInteractionCount,
    };
}
