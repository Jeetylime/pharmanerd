const doseInput = document.querySelector("#doseInput");
const routeSelect = document.querySelector("#routeSelect");
const weightInput = document.querySelector("#weightInput");
const halfLifeInput = document.querySelector("#halfLifeInput");
const vdInput = document.querySelector("#vdInput");
const bioInput = document.querySelector("#bioInput");
const kaInput = document.querySelector("#kaInput");
const durationInput = document.querySelector("#durationInput");
const plotTarget = document.querySelector("#pkPlot");
const drugSelect = document.querySelector("#drugSelect");
const drugPreview = document.querySelector("#drugPreview");
let selectedDrug = null;

function toNumber(input, fallback) {
    const value = Number.parseFloat(input.value);
    return Number.isFinite(value) ? value : fallback;
}

function buildSeries() {
    const dose = toNumber(doseInput, 0);
    const weight = toNumber(weightInput, 70);
    const halfLife = Math.max(toNumber(halfLifeInput, 6), 0.1);
    const vd = Math.max(toNumber(vdInput, 0.7), 0.1);
    const bio = Math.min(Math.max(toNumber(bioInput, 0.6), 0), 1);
    const ka = Math.max(toNumber(kaInput, 1.2), 0.01);
    const duration = Math.max(toNumber(durationInput, 24), 1);
    const route = routeSelect.value;

    const k = Math.log(2) / halfLife;
    const volume = vd * weight;
    const steps = Math.min(320, Math.max(60, Math.round(duration * 10)));
    const times = [];
    const concentrations = [];

    for (let i = 0; i <= steps; i += 1) {
        const t = (duration / steps) * i;
        let concentration = 0;
        if (route === "iv") {
            concentration = (dose / volume) * Math.exp(-k * t);
        } else {
            const denom = ka - k;
            if (Math.abs(denom) < 0.0001) {
                concentration = (bio * dose / volume) * t * Math.exp(-k * t);
            } else {
                concentration =
                    (bio * dose * ka / (volume * denom)) *
                    (Math.exp(-k * t) - Math.exp(-ka * t));
            }
        }
        times.push(Number(t.toFixed(2)));
        concentrations.push(Math.max(concentration, 0));
    }

    return { times, concentrations };
}

function renderPlot() {
    if (!plotTarget || !window.Plotly) return;
    const series = buildSeries();
    const data = [
        {
            x: series.times,
            y: series.concentrations,
            type: "scatter",
            mode: "lines",
            line: { color: selectedDrug && window.PharmaNerdUI ? window.PharmaNerdUI.getClassColor(selectedDrug.class) : "#38bdf8", width: 3 },
            hovertemplate: "Time: %{x} h<br>Conc: %{y:.3f} mg/L<extra></extra>",
        },
    ];
    const layout = {
        margin: { t: 20, r: 20, b: 40, l: 50 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(15,18,28,0.4)",
        xaxis: { title: "Time (hours)", color: "#cbd5f5" },
        yaxis: { title: "Concentration (mg/L)", color: "#cbd5f5" },
        font: { color: "#e6e9ef", family: "Inter, system-ui" },
    };
    Plotly.react(plotTarget, data, layout, { displayModeBar: false, responsive: true });
}

function parseHalfLife(drug) {
    if (!drug) return null;
    if (Number.isFinite(drug.halfLifeHours)) return drug.halfLifeHours;
    const pk = drug.pharmacokinetics || {};
    const hf = pk.halfLife || pk.halfLifeHours || "";
    const m = String(hf).match(/([0-9]+\.?[0-9]*)/);
    return m ? Number(m[1]) : null;
}

function populateDrugSelect() {
    if (!drugSelect || !window.PharmaNerdData) return;
    const drugs = window.PharmaNerdData.DRUGS || [];
    drugSelect.innerHTML = "<option value=''>-- pick a drug --</option>" +
        drugs
            .map((d) => `<option value="${encodeURIComponent(d.name)}">${d.name}</option>`)
            .join("");
}

function showDrugPreview(drug) {
    if (!drugPreview) return;
    drugPreview.innerHTML = "";
    if (!drug || !window.PharmaNerdUI) return;
    const card = window.PharmaNerdUI.createDrugCard(drug);
    card.style.width = "100%";
    card.style.boxShadow = "none";
    card.style.padding = "8px";
    card.style.display = "block";
    drugPreview.appendChild(card);
}

function setInputsFromDrug(drug) {
    if (!drug) return;
    selectedDrug = drug;
    // Dose heuristic: base dose = 50 * potency if available
    if (Number.isFinite(drug.potency)) doseInput.value = Math.max(1, Math.round(50 * drug.potency));
    // half-life
    const hl = parseHalfLife(drug);
    if (hl) halfLifeInput.value = hl;
    // duration
    if (Number.isFinite(drug.durationHours)) durationInput.value = drug.durationHours;
    else if (Number.isFinite(drug.duration)) durationInput.value = drug.duration;
    // route
    const routes = (drug.pharmacokinetics && drug.pharmacokinetics.routes) || [];
    if (routes.includes("oral") || routes.includes("Oral")) routeSelect.value = "oral";
    else if (routes.some((r) => /iv/i.test(r))) routeSelect.value = "iv";
    // bio
    const bioStr = drug.pharmacokinetics && drug.pharmacokinetics.bioavailability;
    if (bioStr && typeof bioStr === "string") {
        const m = bioStr.match(/([0-9]{1,3})%/);
        if (m) bioInput.value = Math.min(1, Number(m[1]) / 100);
    }
    // vd heuristic
    if (Number.isFinite(drug.vd) && drug.vd > 0) vdInput.value = drug.vd;
    // show preview and re-render
    showDrugPreview(drug);
    renderPlot();
}

function onDrugSelectionChange() {
    if (!drugSelect) return;
    const val = decodeURIComponent(drugSelect.value || "");
    if (!val) {
        selectedDrug = null;
        showDrugPreview(null);
        renderPlot();
        return;
    }
    const drug = window.PharmaNerdData.DRUGS.find((d) => d.name === val);
    if (drug) setInputsFromDrug(drug);
}

function syncRouteDefaults() {
    if (routeSelect.value === "iv") {
        bioInput.value = "1";
        bioInput.setAttribute("disabled", "true");
        kaInput.value = "4";
        kaInput.setAttribute("disabled", "true");
    } else {
        bioInput.removeAttribute("disabled");
        kaInput.removeAttribute("disabled");
    }
}

function init() {
    if (!plotTarget) return;
    syncRouteDefaults();
    renderPlot();

    // populate drug list when data loads
    if (window.PharmaNerdData) {
        populateDrugSelect();
    } else {
        window.addEventListener("pharmanerd:data-loaded", () => {
            populateDrugSelect();
        });
    }

    if (drugSelect) {
        drugSelect.addEventListener("change", onDrugSelectionChange);
    }

    [doseInput, weightInput, halfLifeInput, vdInput, bioInput, kaInput, durationInput].forEach(
        (input) => input.addEventListener("input", renderPlot)
    );
    routeSelect.addEventListener("change", () => {
        syncRouteDefaults();
        renderPlot();
    });
}

init();
