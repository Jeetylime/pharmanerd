function initReceptorsApp() {
    const { DRUGS } = window.PharmaNerdData;
    const { getReceptorTooltip, goToDrug } = window.PharmaNerdUI;

    const brainMap = document.querySelector("#brainMap");
    const receptorTitle = document.querySelector("#receptorTitle");
    const receptorDesc = document.querySelector("#receptorDesc");
    const receptorDrugs = document.querySelector("#receptorDrugs");

    const receptorNodes = [
        { id: "mu-opioid receptor", label: "mu-opioid", x: 140, y: 120 },
        { id: "kappa-opioid receptor", label: "kappa-opioid", x: 220, y: 110 },
        { id: "GABA-A receptor", label: "GABA-A", x: 110, y: 180 },
        { id: "GABA-B receptor", label: "GABA-B", x: 250, y: 190 },
        { id: "NMDA receptor", label: "NMDA", x: 180, y: 150 },
        { id: "5-HT2A receptor", label: "5-HT2A", x: 190, y: 80 },
        { id: "5-HT1A receptor", label: "5-HT1A", x: 250, y: 140 },
        { id: "D2 receptor", label: "D2", x: 120, y: 90 },
        { id: "dopamine transporter", label: "DAT", x: 210, y: 220 },
        { id: "serotonin transporter", label: "SERT", x: 150, y: 230 },
        { id: "norepinephrine transporter", label: "NET", x: 240, y: 230 },
        { id: "CB1 receptor", label: "CB1", x: 100, y: 140 },
        { id: "CB2 receptor", label: "CB2", x: 260, y: 150 },
        { id: "orexin system", label: "Orexin", x: 180, y: 250 },
        { id: "AMPA receptor", label: "AMPA", x: 135, y: 200 },
        { id: "TAAR1", label: "TAAR1", x: 225, y: 170 },
        { id: "cholinergic system", label: "Cholinergic", x: 165, y: 110 },
    ];

    function buildReceptorIndex() {
        const index = new Map();
        DRUGS.forEach((drug) => {
            (drug.receptors || []).forEach((receptor) => {
                if (!index.has(receptor)) {
                    index.set(receptor, []);
                }
                index.get(receptor).push(drug);
            });
        });
        return index;
    }

    function renderNode(node) {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("class", "receptor-node");
        group.setAttribute("data-receptor", node.id);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", node.x);
        circle.setAttribute("cy", node.y);
        circle.setAttribute("r", 18);
        circle.setAttribute("fill", "rgba(244, 114, 182, 0.2)");
        circle.setAttribute("stroke", "rgba(244, 114, 182, 0.6)");
        circle.setAttribute("stroke-width", "2");

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", node.x);
        label.setAttribute("y", node.y + 4);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("fill", "#e6e9ef");
        label.setAttribute("font-size", "9");
        label.textContent = node.label;

        group.appendChild(circle);
        group.appendChild(label);

        return group;
    }

    function renderDetails(receptor, drugList) {
        receptorTitle.textContent = receptor;
        receptorDesc.textContent = getReceptorTooltip(receptor);
        receptorDrugs.innerHTML = "";

        if (!drugList?.length) {
            receptorDrugs.innerHTML = "<span class=\"chip\">No matches</span>";
            return;
        }

        drugList.forEach((drug) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "link-chip";
            chip.textContent = drug.name;
            chip.addEventListener("click", () => goToDrug(drug.name));
            receptorDrugs.appendChild(chip);
        });
    }

    function init() {
        if (!brainMap) return;
        const index = buildReceptorIndex();
        receptorNodes.forEach((node) => {
            const element = renderNode(node);
            element.addEventListener("click", () => {
                renderDetails(node.id, index.get(node.id));
            });
            brainMap.appendChild(element);
        });
    }

    init();
}

if (window.PharmaNerdData && window.PharmaNerdData.DRUGS && window.PharmaNerdData.DRUGS.length) {
    initReceptorsApp();
} else {
    window.addEventListener("pharmanerd:data-loaded", initReceptorsApp);
}
