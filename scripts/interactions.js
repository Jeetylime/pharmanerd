if (!window.PharmaNerdInteractionsInit) {
    window.PharmaNerdInteractionsInit = true;

    function initInteractionsApp() {
        const { DRUGS } = window.PharmaNerdData;
        const { severityClass, severityLabel, wireDrugLinks } = window.PharmaNerdUI;
        const { getInteractionsForDrugs } = window.PharmaNerdRx || {};

        const input = document.querySelector("#interactionInput");
        const addBtn = document.querySelector("#addInteraction");
        const checkBtn = document.querySelector("#checkInteractions");
        const selectedWrap = document.querySelector("#interactionSelected");
        const matrixWrap = document.querySelector("#interactionMatrix");
        const detailWrap = document.querySelector("#interactionDetails");

        const selected = [];

        function normalizeName(name) {
            return name.trim().toLowerCase();
        }

        function findDrug(name) {
            return DRUGS.find((drug) => drug.name.toLowerCase() === normalizeName(name));
        }

        function addDrug(name) {
            const drug = findDrug(name);
            if (!drug) return;
            if (selected.some((item) => item.name === drug.name)) return;
            selected.push(drug);
            renderSelected();
        }

        function removeDrug(name) {
            const index = selected.findIndex((drug) => drug.name === name);
            if (index === -1) return;
            selected.splice(index, 1);
            renderSelected();
        }

        function renderSelected() {
            if (!selectedWrap) return;
            selectedWrap.innerHTML = "";
            selected.forEach((drug) => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "chip active";
                chip.textContent = drug.name;
                chip.addEventListener("click", () => removeDrug(drug.name));
                selectedWrap.appendChild(chip);
            });
        }

        function findInteraction(a, b) {
            const fromA = a.interactions.find((item) => item.drug === b.name);
            const fromB = b.interactions.find((item) => item.drug === a.name);
            return fromA || fromB || null;
        }

        function renderMatrix(pairMap, missing) {
            if (!matrixWrap) return;
            if (selected.length < 2) {
                matrixWrap.innerHTML =
                    "<div class=\"glass\">Select at least two drugs to build the interaction matrix.</div>";
                return;
            }

            const size = selected.length + 1;
            matrixWrap.innerHTML = "";
            matrixWrap.style.gridTemplateColumns = `repeat(${size}, minmax(120px, 1fr))`;

            matrixWrap.appendChild(createCell("", "header"));
            selected.forEach((drug) => matrixWrap.appendChild(createCell(drug.name, "header")));

            selected.forEach((rowDrug) => {
                matrixWrap.appendChild(createCell(rowDrug.name, "header"));
                selected.forEach((colDrug) => {
                    if (rowDrug.name === colDrug.name) {
                        matrixWrap.appendChild(createCell("—", "none"));
                        return;
                    }
                    const key = pairKey(rowDrug.name, colDrug.name);
                    const sev = pairMap?.get(key)?.severity || "none";
                    matrixWrap.appendChild(createCell(sev === "none" ? "NONE" : severityLabel(sev), sev));
                });
            });

            if (missing?.length) {
                const note = document.createElement("div");
                note.className = "glass";
                note.textContent = `No RxNorm match for: ${missing.join(", ")}`;
                matrixWrap.appendChild(note);
            }
        }

        function createCell(text, className) {
            const cell = document.createElement("div");
            cell.className = `matrix-cell ${className}`;
            cell.textContent = text;
            return cell;
        }

        function renderDetails(pairs, missing) {
            if (!detailWrap) return;
            detailWrap.innerHTML = "";
            if (selected.length < 2) return;

            if (!pairs?.length) {
                detailWrap.innerHTML =
                    "<div class=\"glass\">No documented RxNorm interactions found between the selected drugs.</div>";
                if (missing?.length) {
                    const note = document.createElement("div");
                    note.className = "glass";
                    note.textContent = `No RxNorm match for: ${missing.join(", ")}`;
                    detailWrap.appendChild(note);
                }
                return;
            }

            pairs.forEach(({ drugA, drugB, severity, description }) => {
                const container = document.createElement('div');
                container.className = 'glass interaction-pair';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.gap = '12px';

                const drugObjA = DRUGS.find((d) => d.name === drugA);
                const drugObjB = DRUGS.find((d) => d.name === drugB);

                const aCard = (window.PharmaNerdUI && window.PharmaNerdUI.createDrugCard && drugObjA)
                    ? window.PharmaNerdUI.createDrugCard(drugObjA)
                    : (function () { const el = document.createElement('div'); el.textContent = drugA; return el; })();

                const bCard = (window.PharmaNerdUI && window.PharmaNerdUI.createDrugCard && drugObjB)
                    ? window.PharmaNerdUI.createDrugCard(drugObjB)
                    : (function () { const el = document.createElement('div'); el.textContent = drugB; return el; })();

                // compact the cards for interaction display
                [aCard, bCard].forEach((c) => {
                    if (c && c.style) {
                        c.style.width = '220px';
                        c.style.flex = '0 0 220px';
                    }
                });

                const meta = document.createElement('div');
                meta.style.flex = '1';
                const title = document.createElement('div');
                title.innerHTML = `<strong>${drugA}</strong> + <strong>${drugB}</strong>`;
                const desc = document.createElement('p');
                desc.style.marginTop = '6px';
                desc.textContent = description || 'Interaction documented in RxNorm.';
                meta.appendChild(title);
                meta.appendChild(desc);

                const sev = document.createElement('span');
                sev.className = `severity ${severityClass(severity)}`;
                sev.textContent = severity;

                container.appendChild(aCard);
                container.appendChild(bCard);
                container.appendChild(meta);
                container.appendChild(sev);

                detailWrap.appendChild(container);
            });
        }

        function pairKey(a, b) {
            return [a, b].sort().join("|");
        }

        async function runCheck() {
            if (!getInteractionsForDrugs) return;
            if (selected.length < 2) {
                renderMatrix();
                renderDetails();
                return;
            }
            // show skeletons while loading
            matrixWrap.innerHTML = "";
            detailWrap.innerHTML = "";
            if (window.PharmaNerdUI && window.PharmaNerdUI.createSkeletonCard) {
                for (let i = 0; i < 3; i++) {
                    const s1 = window.PharmaNerdUI.createSkeletonCard();
                    const s2 = window.PharmaNerdUI.createSkeletonCard();
                    s1.style.margin = '8px';
                    s2.style.margin = '8px';
                    matrixWrap.appendChild(s1);
                    detailWrap.appendChild(s2);
                }
            } else {
                matrixWrap.innerHTML = "<div class=\"glass\">Loading RxNorm interactions...</div>";
                detailWrap.innerHTML = "<div class=\"glass\">Loading RxNorm interactions...</div>";
            }
            try {
                const result = await getInteractionsForDrugs(selected);
                const pairMap = new Map();
                result.pairs.forEach((pair) => {
                    pairMap.set(pairKey(pair.drugA, pair.drugB), pair);
                });
                renderMatrix(pairMap, result.missing);
                renderDetails(result.pairs, result.missing);
            } catch (error) {
                matrixWrap.innerHTML = "<div class=\"glass\">Unable to load RxNorm interactions.</div>";
                detailWrap.innerHTML = "<div class=\"glass\">Unable to load RxNorm interactions.</div>";
            }
        }

        function setupInput() {
            if (!input || !addBtn) return;
            addBtn.addEventListener("click", () => {
                addDrug(input.value);
                input.value = "";
            });
            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    addDrug(input.value);
                    input.value = "";
                }
            });
        }

        function setupOptions() {
            const datalist = document.querySelector("#interactionOptions");
            if (!datalist) return;
            datalist.innerHTML = "";
            DRUGS.forEach((drug) => {
                const option = document.createElement("option");
                option.value = drug.name;
                datalist.appendChild(option);
            });
        }

        function init() {
            wireDrugLinks();
            setupOptions();
            setupInput();
            if (checkBtn) checkBtn.addEventListener("click", runCheck);
            renderSelected();
        }

        init();
    }

    if (window.PharmaNerdData && window.PharmaNerdData.DRUGS && window.PharmaNerdData.DRUGS.length) {
        initInteractionsApp();
    } else {
        window.addEventListener("pharmanerd:data-loaded", initInteractionsApp);
    }
}
