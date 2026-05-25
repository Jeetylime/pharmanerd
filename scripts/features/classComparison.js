// Drug class comparison dashboard
if (!window.PharmaNerdClassComparison) {
    function renderClassComparison(container) {
        if (!container) return;
        const { DRUGS, CLASS_COLORS } = window.PharmaNerdData;
        if (!DRUGS) return;

        // Group drugs by class
        const byClass = {};
        DRUGS.forEach(d => {
            if (!byClass[d.class]) byClass[d.class] = [];
            byClass[d.class].push(d);
        });

        container.innerHTML = "";
        const sortedClasses = Object.keys(byClass).sort();

        sortedClasses.forEach(cls => {
            const drugs = byClass[cls];
            const avgPotency = (drugs.reduce((s, d) => s + d.potency, 0) / drugs.length).toFixed(1);
            const avgDuration = (drugs.reduce((s, d) => s + d.durationHours, 0) / drugs.length).toFixed(1);
            const avgDependence = (drugs.reduce((s, d) => s + d.dependenceRisk, 0) / drugs.length).toFixed(0);
            const count = drugs.length;

            const card = document.createElement("div");
            card.className = "glass class-card";
            card.style.borderLeft = "4px solid " + (CLASS_COLORS[cls] || "#57d7ff");
            card.innerHTML = `
                <div class="class-card-header">
                    <h3>${cls}</h3>
                    <span class="chip">${count} drugs</span>
                </div>
                <div class="class-card-stats">
                    <div class="class-stat">
                        <span class="class-stat-label">Avg Potency</span>
                        <div class="class-stat-bar"><span style="width:${(avgPotency / 5) * 100}%;background:${CLASS_COLORS[cls] || '#57d7ff'}"></span></div>
                        <span class="class-stat-value">${avgPotency}/5</span>
                    </div>
                    <div class="class-stat">
                        <span class="class-stat-label">Avg Duration</span>
                        <span class="class-stat-value">${avgDuration} h</span>
                    </div>
                    <div class="class-stat">
                        <span class="class-stat-label">Avg Dependence</span>
                        <div class="class-stat-bar"><span style="width:${avgDependence}%;background:${parseInt(avgDependence) > 60 ? '#ff6f7c' : parseInt(avgDependence) > 30 ? '#ffd166' : '#6fffb0'}"></span></div>
                        <span class="class-stat-value">${avgDependence}%</span>
                    </div>
                </div>
                <div class="class-card-drugs">
                    ${drugs.slice(0, 5).map(d => `<span class="link-chip drug-link" data-drug-link="${d.name}">${d.name}</span>`).join("")}
                    ${drugs.length > 5 ? `<span class="chip">+${drugs.length - 5} more</span>` : ""}
                </div>
            `;
            container.appendChild(card);
        });

        if (window.PharmaNerdUI && window.PharmaNerdUI.wireDrugLinks) {
            window.PharmaNerdUI.wireDrugLinks();
        }
    }

    window.PharmaNerdClassComparison = { renderClassComparison };
}