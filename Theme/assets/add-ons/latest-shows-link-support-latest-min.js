/* Add-on: Latest Shows link support v26.02.27 for the Altffour Theme for Jellyfin */
/* Converts non-clickable "Latest Shows" home headings into real navigation links. */

(function () {
    "use strict";

    if (window.__altffourLatestShowsLinkAddonLoaded) {
        return;
    }
    window.__altffourLatestShowsLinkAddonLoaded = true;

    var ADDON_CLASS = "altffour-latest-shows-link-addon";
    var cachedLatestTvHref = null;
    var pendingHrefPromise = null;
    var patchQueued = false;

    function getApiClient() {
        if (window.ApiClient) {
            return window.ApiClient;
        }

        if (window.Dashboard && typeof window.Dashboard.getCurrentApiClient === "function") {
            try {
                return window.Dashboard.getCurrentApiClient();
            } catch (error) {
                return null;
            }
        }

        return null;
    }

    function normalizeText(value) {
        return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
    }

    function isLatestShowsHeading(node) {
        if (!node || !node.textContent) {
            return false;
        }

        var text = normalizeText(node.textContent);
        if (!text || !text.includes("latest") || !text.includes("show")) {
            return false;
        }

        var section = node.closest(".verticalSection");
        if (!section) {
            return false;
        }

        return true;
    }

    async function resolveLatestTvHref() {
        if (cachedLatestTvHref) {
            return cachedLatestTvHref;
        }

        if (pendingHrefPromise) {
            return pendingHrefPromise;
        }

        pendingHrefPromise = (async function () {
            var fallbackHref = "#/tv";
            var apiClient = getApiClient();

            if (!apiClient || typeof apiClient.getCurrentUserId !== "function" || typeof apiClient.getUserViews !== "function") {
                cachedLatestTvHref = fallbackHref;
                return cachedLatestTvHref;
            }

            var userId = apiClient.getCurrentUserId();
            var viewsResponse = null;

            try {
                viewsResponse = await apiClient.getUserViews(userId);
            } catch (firstError) {
                try {
                    viewsResponse = await apiClient.getUserViews({ userId: userId });
                } catch (secondError) {
                    cachedLatestTvHref = fallbackHref;
                    return cachedLatestTvHref;
                }
            }

            var views = Array.isArray(viewsResponse && viewsResponse.Items)
                ? viewsResponse.Items
                : Array.isArray(viewsResponse)
                    ? viewsResponse
                    : [];

            var tvView = views.find(function (view) {
                return normalizeText(view && view.CollectionType) === "tvshows";
            });

            if (!tvView || !tvView.Id) {
                cachedLatestTvHref = fallbackHref;
                return cachedLatestTvHref;
            }

            if (window.appRouter && typeof window.appRouter.getRouteUrl === "function") {
                try {
                    var routedHref = window.appRouter.getRouteUrl(tvView, { section: "latest" });
                    if (routedHref) {
                        cachedLatestTvHref = routedHref;
                        return cachedLatestTvHref;
                    }
                } catch (routeError) {
                    /* fall through to manual URL */
                }
            }

            cachedLatestTvHref = "#/tv?topParentId=" + encodeURIComponent(tvView.Id) + "&collectionType=tvshows&tab=1";
            return cachedLatestTvHref;
        })();

        try {
            return await pendingHrefPromise;
        } finally {
            pendingHrefPromise = null;
        }
    }

    async function patchLatestShowsHeadings() {
        var homeTab = document.querySelector("#homeTab");
        if (!homeTab) {
            return;
        }

        var headingNodes = homeTab.querySelectorAll(".sectionTitleContainer-cards > h2.sectionTitle.sectionTitle-cards");
        if (!headingNodes || !headingNodes.length) {
            return;
        }

        var candidates = [];
        Array.prototype.forEach.call(headingNodes, function (heading) {
            if (heading.closest(".sectionTitleTextButton")) {
                return;
            }

            if (!isLatestShowsHeading(heading)) {
                return;
            }

            candidates.push(heading);
        });

        if (!candidates.length) {
            return;
        }

        var href = await resolveLatestTvHref();

        candidates.forEach(function (heading) {
            var container = heading.parentElement;
            if (!container || container.querySelector("." + ADDON_CLASS)) {
                return;
            }

            var link = document.createElement("a");
            link.setAttribute("is", "emby-linkbutton");
            link.className = "more button-flat button-flat-mini sectionTitleTextButton " + ADDON_CLASS;
            link.setAttribute("href", href);

            heading.remove();
            link.appendChild(heading);

            var chevron = document.createElement("span");
            chevron.className = "material-icons chevron_right";
            chevron.setAttribute("aria-hidden", "true");
            link.appendChild(chevron);

            container.appendChild(link);
        });
    }

    function queuePatch() {
        if (patchQueued) {
            return;
        }

        patchQueued = true;
        setTimeout(function () {
            patchQueued = false;
            patchLatestShowsHeadings().catch(function () {
                /* keep UI stable even if API/DOM probing fails */
            });
        }, 140);
    }

    function attachObserver() {
        var observer = new MutationObserver(function () {
            queuePatch();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    window.addEventListener("hashchange", queuePatch, { passive: true });
    window.addEventListener("popstate", queuePatch, { passive: true });
    document.addEventListener("DOMContentLoaded", queuePatch, { passive: true });

    attachObserver();
    queuePatch();
})();
