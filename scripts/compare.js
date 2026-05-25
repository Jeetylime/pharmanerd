if (!window.PharmaNerdCompareInit) {
    window.PharmaNerdCompareInit = true;

    function initCompareApp() {
        const { DRUGS } = window.PharmaNerdData;
        const { riskColor, wireDrugLinks } = window.PharmaNerdUI;
        const { getInteractionCount } = window.PharmaNerdRx || {};

        const input = document.querySelector("#compareInput");
        const addBtn = document.querySelector("#addCompare");
        const clearBtn = document.querySelector("#clearCompare");
        const selectedWrap = document.querySelector("#compareSelected");
        const tableWrap = document.querySelector("#compareTable");

        const selected = [];

        function normalizeName(name) {
            return name.trim().toLowerCase();
        }

        function findDrug(name) {
            return DRUGS.find((drug) => drug.name.toLowerCase() === normalizeName(name));
        }

        function renderSelected() {
            if (!selectedWrap) return;
            selectedWrap.innerHTML = "";
            selected.forEach((drug) => {
                const card = (window.PharmaNerdUI && window.PharmaNerdUI.createDrugCard)
                    ? window.PharmaNerdUI.createDrugCard(drug)
                    : document.createElement("div");

                // add a remove button to the right area of the card
                try {
                    const fav = card.querySelector && card.querySelector('.fav-btn');
                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'chip';
                    remove.textContent = 'Remove';
                    remove.addEventListener('click', (e) => {
                        e.stopPropagation();
                        removeDrug(drug.name);
                    });
                    if (fav && fav.parentElement) fav.parentElement.appendChild(remove);
                    else card.appendChild(remove);
                } catch (err) {
                    // ignore
                }

                selectedWrap.appendChild(card);
            });
        }

        function renderTable() {
            if (!tableWrap) return;
            if (!selected.length) {
                tableWrap.innerHTML =
                    "<div class=\"glass\">Add up to four drugs to compare key pharmacology metrics.</div>";
                return;
            }

            const rows = [
                {
                    label: "Class",
                    value: (drug) => drug.class,
                },
                {
                    label: "Mechanism",
                    value: (drug) => drug.mechanism,
                },
                {
                    label: "Onset",
                    value: (drug) => drug.effects.onset,
                },
                {
                    label: "Peak",
                    value: (drug) => drug.effects.peak,
                },
                {
                    label: "Duration",
                    value: (drug) => drug.effects.duration,
                },
                {
                    label: "Half-life",
                    value: (drug) => drug.pharmacokinetics.halfLife,
                },
                {
                    label: "Dependence risk",
                    value: (drug) => `${drug.dependenceRisk}%`,
                    style: (drug) => `color: ${riskColor(drug.dependenceRisk)}`,
                },
                {
                    label: "Legal status",
                    value: (drug) => `${drug.legalStatus.US} | ${drug.legalStatus.UK}`,
                },
                {
                    label: "Key effects",
                    value: (drug) => drug.effects.positive.slice(0, 3).join(", "),
                },
                {
                    label: "Interactions count",
                    value: () => "Loading...",
                    isLive: true,
                },
            ];

            const table = document.createElement("table");
            table.className = "compare-table";

            const headRow = document.createElement("tr");
            headRow.innerHTML = `<th>Metric</th>`;
            selected.forEach((drug) => {
                const th = document.createElement("th");
                th.innerHTML = `
          <strong class="drug-link" data-drug-link="${drug.name}">${drug.name}</strong>
          <button type="button" class="chip" data-remove="${drug.name}">Remove</button>
        `;
                headRow.appendChild(th);
            });
            table.appendChild(headRow);

            rows.forEach((row) => {
                const tr = document.createElement("tr");
                const th = document.createElement("th");
                th.textContent = row.label;
                tr.appendChild(th);

                selected.forEach((drug) => {
                    const td = document.createElement("td");
                    td.textContent = row.value(drug);
                    if (row.isLive) {
                        td.dataset.interactionsName = drug.name;
                    }
                    if (row.style) td.setAttribute("style", row.style(drug));
                    tr.appendChild(td);
                });

                table.appendChild(tr);
            });

            tableWrap.innerHTML = "";
            tableWrap.appendChild(table);

            tableWrap.querySelectorAll("[data-remove]").forEach((button) => {
                button.addEventListener("click", (event) => {
                    event.stopPropagation();
                    removeDrug(button.dataset.remove);
                });
            });

            if (getInteractionCount) {
                hydrateInteractionCounts();
            }
        }

        async function hydrateInteractionCounts() {
            const cells = tableWrap.querySelectorAll("[data-interactions-name]");
            await Promise.all(
                [...cells].map(async (cell) => {
                    const name = cell.dataset.interactionsName;
                    const drug = DRUGS.find((item) => item.name === name);
                    if (!drug) return;
                    try {
                        const count = await getInteractionCount(drug);
                        cell.textContent = Number.isFinite(count) ? String(count) : "—";
                    } catch (error) {
                        cell.textContent = "—";
                    }
                })
            );
        }

        function addDrug(name) {
            const drug = findDrug(name);
            if (!drug) return;
            if (selected.some((item) => item.name === drug.name)) return;
            if (selected.length >= 4) return;
            selected.push(drug);
            renderSelected();
            renderTable();
        }

        function removeDrug(name) {
            const index = selected.findIndex((drug) => drug.name === name);
            if (index === -1) return;
            selected.splice(index, 1);
            renderSelected();
            renderTable();
        }

        function clearAll() {
            selected.length = 0;
            renderSelected();
            renderTable();
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

        function setupClear() {
            if (!clearBtn) return;
            clearBtn.addEventListener("click", clearAll);
        }

        function setupOptions() {
            const datalist = document.querySelector("#compareOptions");
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
            setupClear();
            renderSelected();
            renderTable();
        }

        init();
    }

    if (window.PharmaNerdData && window.PharmaNerdData.DRUGS && window.PharmaNerdData.DRUGS.length) {
        initCompareApp();
    } else {
        window.addEventListener("pharmanerd:data-loaded", initCompareApp);
    }
}
