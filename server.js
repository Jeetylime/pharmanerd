const http = require("node:http");
const https = require("node:https");
const path = require("node:path");
const { readFile, stat } = require("node:fs/promises");
const db = require("./server/db");

const ROOT = path.resolve(process.cwd());
const PORT = Number.parseInt(process.env.PORT || "5173", 10);

const MIME = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
};

function sendJson(res, status, payload) {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(payload));
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https : http;
        client.get(url, { headers: { Accept: "application/json" } }, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error("Invalid JSON response: " + data.slice(0, 100)));
                }
            });
        }).on("error", reject);
    });
}

async function handleApi(req, res, url) {
    if (url.pathname === "/api/data") {
        sendJson(res, 200, db);
        return;
    }

    // Return a single internal drug by name (case-insensitive match against name or aliases)
    if (url.pathname === "/api/drug") {
        const name = url.searchParams.get("name");
        if (!name) {
            sendJson(res, 400, { error: "Missing name" });
            return;
        }
        const normalized = name.trim().toLowerCase();
        const drug = (db.DRUGS || []).find((d) => d.name.toLowerCase() === normalized || (d.aliases || []).some(a => a.toLowerCase() === normalized));
        if (!drug) {
            sendJson(res, 404, { error: "Drug not found" });
            return;
        }
        sendJson(res, 200, { drug });
        return;
    }

    // Search drugs via openFDA
    if (url.pathname === "/api/drug-search") {
        const name = url.searchParams.get("name");
        if (!name) {
            sendJson(res, 400, { error: "Missing name" });
            return;
        }
        try {
            // Search both brand name and generic name
            const [brandResp, genericResp] = await Promise.all([
                fetchJson(`https://api.fda.gov/drug/ndc.json?search=brand_name:${encodeURIComponent(name)}&limit=10`),
                fetchJson(`https://api.fda.gov/drug/ndc.json?search=generic_name:${encodeURIComponent(name)}&limit=10`)
            ]);
            const seen = new Set();
            const results = [];
            const addResults = (data) => {
                (data.results || []).forEach((item) => {
                    const brand = item.brand_name || item.generic_name;
                    const generic = item.generic_name || brand;
                    const key = brand + "|" + generic;
                    if (!seen.has(key)) {
                        seen.add(key);
                        results.push({
                            name: brand,
                            genericName: generic,
                            rxcui: (item.openfda?.rxcui || [])[0] || "",
                            pharmClass: item.pharm_class || [],
                            route: item.route || [],
                            dosageForm: item.dosage_form || "",
                            productNdc: item.product_ndc || "",
                        });
                    }
                });
            };
            addResults(brandResp);
            addResults(genericResp);
            sendJson(res, 200, { results: results.slice(0, 20) });
        } catch (error) {
            sendJson(res, 502, { error: "openFDA search failed" });
        }
        return;
    }

    // Get drug label info from openFDA
    if (url.pathname === "/api/drug-label") {
        const name = url.searchParams.get("name");
        if (!name) {
            sendJson(res, 400, { error: "Missing name" });
            return;
        }
        try {
            // Try multiple search strategies to find the label
            // 1. Try brand name first (most specific)
            // 2. Try generic name (works for most prescription drugs)
            // 3. Try substance name
            // 4. Try active_ingredient (works for some OTC drugs)
            let label = null;
            const searchStrategies = [
                `openfda.brand_name:${encodeURIComponent(name)}`,
                `openfda.generic_name:${encodeURIComponent(name)}`,
                `openfda.substance_name:${encodeURIComponent(name)}`,
                `active_ingredient:${encodeURIComponent(name)}`,
            ];

            for (const search of searchStrategies) {
                try {
                    const resp = await fetchJson(`https://api.fda.gov/drug/label.json?search=${search}&limit=1`);
                    if (resp.results && resp.results.length > 0) {
                        label = resp.results[0];
                        break;
                    }
                } catch (e) {
                    // NOT_FOUND or other error, try next strategy
                    continue;
                }
            }

            // Also try NDC for product-level data (pharm_class, dosage_form, etc.)
            let ndc = {};
            try {
                const ndcResp = await fetchJson(`https://api.fda.gov/drug/ndc.json?search=generic_name:${encodeURIComponent(name)}&limit=1`);
                ndc = ndcResp.results?.[0] || {};
            } catch (e) {
                // NDC not found, that's okay
            }

            if (!label) {
                sendJson(res, 404, { error: "Drug not found in openFDA", label: null, ndc });
                return;
            }

            sendJson(res, 200, { label, ndc });
        } catch (error) {
            sendJson(res, 502, { error: "openFDA label request failed" });
        }
        return;
    }

    // Get drug interactions from openFDA adverse events
    if (url.pathname === "/api/drug-interactions") {
        const name = url.searchParams.get("name");
        if (!name) {
            sendJson(res, 400, { error: "Missing name" });
            return;
        }
        try {
            const eventResp = await fetchJson(`https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:${encodeURIComponent(name)}&count=patient.drug.openfda.generic_name.exact&limit=20`);
            const results = (eventResp.results || []).filter(r => {
                if (!r.term) return false;
                const term = r.term.toLowerCase();
                const drugName = name.toLowerCase();
                // Filter out results that are just the drug itself (different formulations/misspellings)
                // Check if the term is mostly the drug name (allow 1 char difference for misspellings)
                const drugNameClean = drugName.replace(/[^a-z]/g, '');
                const termClean = term.replace(/[^a-z]/g, '');
                const levenshteinDist = (a, b) => {
                    if (a.length === 0) return b.length;
                    if (b.length === 0) return a.length;
                    const matrix = [];
                    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
                    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
                    for (let i = 1; i <= b.length; i++) {
                        for (let j = 1; j <= a.length; j++) {
                            if (b[i - 1] === a[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
                            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                        }
                    }
                    return matrix[b.length][a.length];
                };
                const dist = levenshteinDist(termClean, drugNameClean);
                // If the term is very similar to the drug name, it's the same drug
                if (dist <= 2) return false;
                return !term.includes(drugName) && !drugName.includes(term);
            });
            sendJson(res, 200, { results });
        } catch (error) {
            sendJson(res, 502, { error: "openFDA events request failed" });
        }
        return;
    }

    // Proxy RxNorm: get rxcui by name
    if (url.pathname === "/api/rxcui") {
        const name = url.searchParams.get("name");
        if (!name) {
            sendJson(res, 400, { error: "Missing name" });
            return;
        }
        try {
            const resp = await fetchJson(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`);
            sendJson(res, 200, resp);
        } catch (e) {
            sendJson(res, 502, { error: "RxNorm rxcui request failed" });
        }
        return;
    }

    // Proxy RxNorm interaction list for one or more rxcuis
    if (url.pathname === "/api/interaction") {
        console.log(`/api/interaction called with: ${url.searchParams.toString()}`);
        const rxcuis = url.searchParams.get("rxcuis");
        if (!rxcuis) {
            sendJson(res, 400, { error: "Missing rxcuis" });
            return;
        }
        try {
            const resp = await fetchJson(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${encodeURIComponent(rxcuis)}`);
            sendJson(res, 200, resp);
            return;
        } catch (e) {
            console.error("/api/interaction: RxNav list request failed:", e && e.message ? e.message : e);
            // RxNav list endpoint failed — attempt a graceful fallback using local DB interactions
            try {
                const requested = (rxcuis || "").split(/[,\s]+/).filter(Boolean);
                // Map rxcui -> name via RxNav properties endpoint
                const rxcuiToName = {};
                for (const id of requested) {
                    try {
                        const p = await fetchJson(`https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(id)}/properties.json`);
                        rxcuiToName[id] = p?.properties?.name || null;
                    } catch (err) {
                        rxcuiToName[id] = null;
                    }
                }

                const pairs = [];
                const seen = new Set();
                const localDrugs = db.DRUGS || [];

                // For each requested name, gather interactions from local DB (both directions)
                for (const id of requested) {
                    const name = (rxcuiToName[id] || "").toLowerCase();
                    if (!name) continue;

                    // 1) Find the local drug entry for this name and include its interactions
                    const local = localDrugs.find(d => d.name.toLowerCase() === name || (d.aliases || []).some(a => a.toLowerCase() === name));
                    if (local && Array.isArray(local.interactions)) {
                        local.interactions.forEach((it) => {
                            const key = `${id}|${(it.drug || "").toLowerCase()}`;
                            if (seen.has(key)) return;
                            seen.add(key);
                            pairs.push({
                                rxcuiA: id,
                                rxcuiB: "",
                                nameA: local.name,
                                nameB: it.drug,
                                severity: it.severity || "moderate",
                                description: it.description || ""
                            });
                        });
                    }

                    // 2) Find other local drugs that list this name in their interactions (reverse)
                    localDrugs.forEach((d) => {
                        (d.interactions || []).forEach((it) => {
                            if (!it.drug) return;
                            if (it.drug.toLowerCase() === name) {
                                const key = `${id}|${d.name.toLowerCase()}`;
                                if (seen.has(key)) return;
                                seen.add(key);
                                pairs.push({
                                    rxcuiA: id,
                                    rxcuiB: "",
                                    nameA: rxcuiToName[id] || d.name,
                                    nameB: d.name,
                                    severity: it.severity || "moderate",
                                    description: it.description || ""
                                });
                            }
                        });
                    });
                }

                // Attempt to resolve rxcuiB for pairs where possible
                for (const pair of pairs) {
                    if (!pair.rxcuiB && pair.nameB) {
                        try {
                            const lookup = await fetchJson(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(pair.nameB)}`);
                            const id = lookup?.idGroup?.rxnormId?.[0] || "";
                            pair.rxcuiB = id;
                        } catch (err) {
                            pair.rxcuiB = "";
                        }
                    }
                }

                sendJson(res, 200, { fallback: true, pairs });
            } catch (err) {
                console.error("/api/interaction: fallback generation failed:", err && err.message ? err.message : err);
                // Return an empty fallback instead of failing so the client can handle gracefully
                sendJson(res, 200, { fallback: true, pairs: [] });
            }
        }
        return;
    }

    sendJson(res, 404, { error: "Not found" });
}

async function handleStatic(req, res, url) {
    const safePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const filePath = path.join(ROOT, safePath || "index.html");
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }
    try {
        const stats = await stat(filePath);
        if (stats.isDirectory()) {
            const indexPath = path.join(filePath, "index.html");
            const data = await readFile(indexPath);
            res.writeHead(200, { "Content-Type": MIME[".html"] });
            res.end(data);
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
    } catch (error) {
        res.writeHead(404);
        res.end("Not found");
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
        return;
    }
    await handleStatic(req, res, url);
});

server.listen(PORT, () => {
    console.log(`PharmaNerd server running at http://localhost:${PORT}`);
});