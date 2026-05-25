// Drug discovery history timeline
if (!window.PharmaNerdHistory) {
    const HISTORY_DATA = [
        { year: "1804", event: "Morphine isolated from opium by Friedrich Sertürner" },
        { year: "1828", event: "Caffeine isolated from coffee beans" },
        { year: "1860", event: "Cocaine isolated from coca leaves" },
        { year: "1884", event: "Cocaine used as a local anesthetic by Carl Koller" },
        { year: "1897", event: "Aspirin synthesized by Felix Hoffmann at Bayer" },
        { year: "1898", event: "Heroin synthesized by Bayer; marketed as cough suppressant" },
        { year: "1912", event: "MDMA first synthesized by Merck chemist Anton Köllisch" },
        { year: "1938", event: "LSD synthesized by Albert Hofmann at Sandoz" },
        { year: "1943", event: "Albert Hofmann accidentally discovers LSD's psychedelic effects" },
        { year: "1951", event: "First MAO inhibitor (iproniazid) discovered as antidepressant" },
        { year: "1955", event: "Chlorpromazine (Thorazine) introduced as first antipsychotic" },
        { year: "1957", event: "Methylphenidate (Ritalin) introduced for ADHD" },
        { year: "1960", event: "Chlordiazepoxide (Librium) — first benzodiazepine" },
        { year: "1963", event: "Diazepam (Valium) introduced by Roche" },
        { year: "1964", event: "Ketamine synthesized by Calvin Stevens at Parke-Davis" },
        { year: "1971", event: "US Controlled Substances Act establishes scheduling system" },
        { year: "1974", event: "THC first isolated in pure form" },
        { year: "1987", event: "Fluoxetine (Prozac) introduced — first SSRI" },
        { year: "1995", event: "MDMA resurfaces as a psychotherapeutic tool" },
        { year: "1996", event: "California passes Prop 215 — first medical cannabis law" },
        { year: "2006", event: "Psilocybin research resumes at Johns Hopkins" },
        { year: "2010", event: "First intranasal naloxone (Narcan) approved" },
        { year: "2019", event: "Esketamine (Spravato) approved for depression" },
        { year: "2024", event: "MDMA-assisted therapy reviewed by FDA" },
    ];

    function renderHistoryTimeline(container) {
        if (!container) return;
        container.innerHTML = "";
        const sorted = [...HISTORY_DATA].sort((a, b) => a.year - b.year);
        sorted.forEach(item => {
            const row = document.createElement("div");
            row.className = "history-row";
            row.innerHTML = `<span class="history-year">${item.year}</span><span class="history-event">${item.event}</span>`;
            container.appendChild(row);
        });
    }

    window.PharmaNerdHistory = { HISTORY_DATA, renderHistoryTimeline };
}