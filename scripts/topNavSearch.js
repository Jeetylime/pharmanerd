(function () {
    function initTopNavSearch() {
        const topSearchInput = document.getElementById("topSearchInput");
        if (!topSearchInput) return;

        const path = window.location.pathname || "";
        const isSearchPage = path.endsWith("/search.html") || path.endsWith("search.html");
        const pageSearchInput = document.getElementById("globalSearchInput");
        const params = new URLSearchParams(window.location.search);
        const initialQuery = (params.get("q") || "").trim();

        if (initialQuery && !topSearchInput.value) {
            topSearchInput.value = initialQuery;
        }

        if (isSearchPage && pageSearchInput && initialQuery && !pageSearchInput.value) {
            pageSearchInput.value = initialQuery;
            pageSearchInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        if (isSearchPage && pageSearchInput) {
            topSearchInput.addEventListener("input", () => {
                if (pageSearchInput.value === topSearchInput.value) return;
                pageSearchInput.value = topSearchInput.value;
                pageSearchInput.dispatchEvent(new Event("input", { bubbles: true }));
            });
        }

        topSearchInput.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const query = topSearchInput.value.trim();

            if (isSearchPage && pageSearchInput) {
                if (pageSearchInput.value !== topSearchInput.value) {
                    pageSearchInput.value = topSearchInput.value;
                }
                pageSearchInput.dispatchEvent(new Event("input", { bubbles: true }));
                return;
            }

            const target = query
                ? `search.html?q=${encodeURIComponent(query)}`
                : "search.html";
            window.location.href = target;
        });

        if (window.PharmaNerdUI && typeof window.PharmaNerdUI.bindSearchShortcut === "function") {
            window.PharmaNerdUI.bindSearchShortcut(topSearchInput);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initTopNavSearch);
    } else {
        initTopNavSearch();
    }
})();
