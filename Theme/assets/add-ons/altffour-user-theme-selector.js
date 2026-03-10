(function () {
    "use strict";

    if (window.__altffourThemeSelectorStandaloneLoaded) {
        return;
    }
    window.__altffourThemeSelectorStandaloneLoaded = true;

    var SELECTOR_ID = "altffour-theme-selector";
    var SELECTOR_STYLE_ID = "altffour-theme-selector-style";
    var LIVE_PALETTE_LINK_ID = "altffour-live-palette";
    var THEME_NAME_SUFFIX = "-altffourThemePalette";
    var BLOCK_START = "/* altffour-palette:start */";
    var BLOCK_END = "/* altffour-palette:end */";
    var PALETTE_VERSION = "20260310-25";
    var RETRY_MAX = 30;
    var retryCount = 0;
    var observerTickQueued = false;
    var observerLastRunAt = 0;
    var OBSERVER_MIN_INTERVAL_MS = 1000;

    var themes = {
        Default: "",
        Ocean: '@import url("https://altffour.com/jellyfin-theme/colors/ocean.css?v=' + PALETTE_VERSION + '");',
        Graphite: '@import url("https://altffour.com/jellyfin-theme/colors/graphite.css?v=' + PALETTE_VERSION + '");',
        Emerald: '@import url("https://altffour.com/jellyfin-theme/colors/emerald.css?v=' + PALETTE_VERSION + '");',
        Sunset: '@import url("https://altffour.com/jellyfin-theme/colors/sunset.css?v=' + PALETTE_VERSION + '");',
        Crimson: '@import url("https://altffour.com/jellyfin-theme/colors/crimson.css?v=' + PALETTE_VERSION + '");'
    };
    var themeUrls = {
        Default: "",
        Ocean: "https://altffour.com/jellyfin-theme/colors/ocean.css?v=" + PALETTE_VERSION,
        Graphite: "https://altffour.com/jellyfin-theme/colors/graphite.css?v=" + PALETTE_VERSION,
        Emerald: "https://altffour.com/jellyfin-theme/colors/emerald.css?v=" + PALETTE_VERSION,
        Sunset: "https://altffour.com/jellyfin-theme/colors/sunset.css?v=" + PALETTE_VERSION,
        Crimson: "https://altffour.com/jellyfin-theme/colors/crimson.css?v=" + PALETTE_VERSION
    };

    function log(message) {
        try {
            console.log("[Altffour Theme Selector]", message);
        } catch (error) {
            // no-op
        }
    }

    function extractUserId() {
        try {
            if (window.ApiClient && typeof window.ApiClient.getCurrentUserId === "function") {
                var userId = window.ApiClient.getCurrentUserId();
                if (userId) {
                    return String(userId);
                }
            }
        } catch (error) {
            // ignore
        }

        var hash = String(window.location.hash || "").replace(/^#/, "");
        var queryIndex = hash.indexOf("?");
        if (queryIndex !== -1) {
            var params = new URLSearchParams(hash.slice(queryIndex + 1));
            var fromHash = params.get("userId");
            if (fromHash) {
                return String(fromHash);
            }
        }

        return "";
    }

    function extractUserIdFromProfileLink(profileLink) {
        if (!profileLink) {
            return "";
        }

        var href = String(profileLink.getAttribute("href") || "");
        if (!href) {
            return "";
        }

        var match = href.match(/#\/userprofile\/([^/?#]+)/i);
        return match && match[1] ? String(match[1]) : "";
    }

    function extractPaletteNameFromCss(css) {
        var text = String(css || "").toLowerCase();
        if (text.indexOf("/colors/crimson.css") !== -1) return "Crimson";
        if (text.indexOf("/colors/sunset.css") !== -1) return "Sunset";
        if (text.indexOf("/colors/emerald.css") !== -1) return "Emerald";
        if (text.indexOf("/colors/graphite.css") !== -1) return "Graphite";
        if (text.indexOf("/colors/ocean.css") !== -1) return "Ocean";
        return "Default";
    }

    function getThemeNameStorageKey(userId) {
        return String(userId || "") + THEME_NAME_SUFFIX;
    }

    function getStoredThemeName(userId) {
        if (!userId) {
            return "";
        }
        var stored = localStorage.getItem(getThemeNameStorageKey(userId)) || "";
        return Object.prototype.hasOwnProperty.call(themes, stored) ? stored : "";
    }

    function setStoredThemeName(userId, themeName) {
        if (!userId) {
            return;
        }
        if (!Object.prototype.hasOwnProperty.call(themes, themeName)) {
            localStorage.removeItem(getThemeNameStorageKey(userId));
            return;
        }
        localStorage.setItem(getThemeNameStorageKey(userId), themeName);
    }

    function applyLivePalette(themeName) {
        var href = themeUrls[themeName] || "";
        var link = document.getElementById(LIVE_PALETTE_LINK_ID);

        if (!href) {
            if (link && link.parentNode) {
                link.parentNode.removeChild(link);
            }
            return;
        }

        if (!link) {
            link = document.createElement("link");
            link.id = LIVE_PALETTE_LINK_ID;
            link.rel = "stylesheet";
            (document.head || document.documentElement).appendChild(link);
        }

        if (link.getAttribute("href") !== href) {
            link.setAttribute("href", href);
        }
    }

    function getCurrentTheme(userId) {
        if (!userId) {
            return "Default";
        }

        var storedName = getStoredThemeName(userId);
        if (storedName) {
            return storedName;
        }

        var current = localStorage.getItem(userId + "-customCss") || "";
        return extractPaletteNameFromCss(current);
    }

    function normalizePaletteVersionInStoredCss(userId) {
        if (!userId) {
            return false;
        }

        var key = userId + "-customCss";
        var existing = localStorage.getItem(key) || "";
        if (!existing) {
            return false;
        }

        var updated = existing.replace(
            /(\/jellyfin-theme\/colors\/(?:ocean|graphite|emerald|sunset|crimson)\.css)\?v=[0-9-]+/gi,
            "$1?v=" + PALETTE_VERSION
        );

        if (updated === existing) {
            return false;
        }

        localStorage.setItem(key, updated);
        return true;
    }

    function ensurePaletteBlockAtTop(userId) {
        if (!userId) {
            return false;
        }

        var key = userId + "-customCss";
        var existing = localStorage.getItem(key) || "";
        if (!existing) {
            return false;
        }

        var start = existing.indexOf(BLOCK_START);
        var end = existing.indexOf(BLOCK_END);
        if (start === -1 || end === -1 || end < start) {
            return false;
        }

        var prefix = existing.slice(0, start);
        if (!prefix.trim()) {
            return false;
        }

        var blockBody = existing.slice(start + BLOCK_START.length, end).trim();
        var paletteImport = blockBody
            .split("\n")
            .map(function (line) { return line.trim(); })
            .find(function (line) { return line.indexOf("@import") === 0; }) || "";

        if (!paletteImport) {
            return false;
        }

        var updated = upsertPaletteBlock(existing, paletteImport);
        if (updated === existing) {
            return false;
        }

        localStorage.setItem(key, updated);
        return true;
    }

    function upsertPaletteBlock(existingCss, paletteImport) {
        var existing = String(existingCss || "").trim();
        var start = existing.indexOf(BLOCK_START);
        var end = existing.indexOf(BLOCK_END);

        if (start !== -1 && end !== -1 && end >= start) {
            var before = existing.slice(0, start).trimEnd();
            var after = existing.slice(end + BLOCK_END.length).trimStart();
            existing = [before, after].filter(Boolean).join("\n\n").trim();
        }

        if (!paletteImport) {
            return existing;
        }

        // Keep the @import block at the very top. CSS ignores @import after normal rules.
        var block = BLOCK_START + "\n" + paletteImport + "\n" + BLOCK_END;
        return [block, existing].filter(Boolean).join("\n\n").trim();
    }

    function setTheme(userId, themeName) {
        if (!userId) {
            return;
        }

        var key = userId + "-customCss";
        var existing = localStorage.getItem(key) || "";
        var updated = upsertPaletteBlock(existing, themes[themeName] || "");
        setStoredThemeName(userId, themeName);
        applyLivePalette(themeName);

        if (updated) {
            localStorage.setItem(key, updated);
        } else {
            localStorage.removeItem(key);
        }
    }

    function ensureSelectorStyles() {
        if (document.getElementById(SELECTOR_STYLE_ID)) {
            return;
        }

        var style = document.createElement("style");
        style.id = SELECTOR_STYLE_ID;
        style.textContent = [
            "#" + SELECTOR_ID + ".theme-selector-container{margin:0;}",
            "#" + SELECTOR_ID + " .themeSelectorBody{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:.75rem;width:100%;}",
            "#" + SELECTOR_ID + " .themeSelectorLabel{white-space:nowrap;text-align:left!important;}",
            "#" + SELECTOR_ID + " .themeSelectorControl,#" + SELECTOR_ID + " select.emby-select,#" + SELECTOR_ID + " .emby-select-withcolor{margin-left:auto;min-width:170px;max-width:210px;background:linear-gradient(135deg,var(--menuGlassSurface),var(--glassSurfaceSoft))!important;background-color:var(--lighterGradientPointAlpha)!important;border:1px solid var(--glassEdgeOuter)!important;color:var(--textColor)!important;border-radius:.6rem!important;}",
            "#" + SELECTOR_ID + " .themeSelectorControl:focus,#" + SELECTOR_ID + " select:focus{outline:none!important;border-color:var(--activeColor)!important;box-shadow:0 0 0 1px var(--activeColorAlpha)!important;}",
            "#" + SELECTOR_ID + " .themeSelectorControl option,#" + SELECTOR_ID + " select option{background-color:var(--darkerGradientPoint)!important;color:var(--textColor)!important;}",
            "#" + SELECTOR_ID + " .listItem,#" + SELECTOR_ID + ".theme-selector-container .listItem{padding-right:.75em;background:var(--menuGlassSurface)!important;border:1px solid var(--glassEdgeOuter)!important;}",
            "#" + SELECTOR_ID + " .listItem:hover{background:var(--menuGlassSurfaceActive)!important;border-color:var(--activeColor)!important;}",
            ".headerTabs.sectionTabs .emby-tab-button{background:var(--menuGlassSurface)!important;border:1px solid var(--glassEdgeOuter)!important;color:var(--textColor)!important;}",
            ".headerTabs.sectionTabs .emby-tab-button-active,.headerTabs.sectionTabs .emby-tab-button[aria-selected='true']{background:var(--menuGlassSurfaceActive)!important;border-color:var(--activeColor)!important;color:var(--textColor)!important;}",
            ".dashboardDocument .navMenuOption,#myPreferencesMenuPage .navMenuOption,.mainDrawer .navMenuOption,.mainDrawer .listItem{background:var(--menuGlassSurface)!important;border:1px solid var(--glassEdgeOuter)!important;box-shadow:none!important;}",
            ".dashboardDocument .navMenuOption:hover,#myPreferencesMenuPage .navMenuOption:hover,.mainDrawer .navMenuOption:hover,.mainDrawer .listItem:hover{background:var(--menuGlassSurfaceActive)!important;border-color:var(--activeColor)!important;}",
            "#homeTab .sections,#homeTab .homeSectionsContainer,#homeTab .verticalSection,#homeTab .verticalSection.section2,#homeTab .verticalSection.ContinueWatching.section2,#homeTab .verticalSection.emby-scroller-container,#homeTab .emby-scroller-container,#homeTab .emby-scroller,#homeTab .scrollX,#homeTab .verticalSection::before,#homeTab .verticalSection::after{background:transparent!important;background-color:transparent!important;background-image:none!important;border-color:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}",
            "html.layout-desktop,html.preload.layout-desktop,html.layout-desktop body,html.preload.layout-desktop body,html.layout-desktop .backgroundContainer:not(.withBackdrop),html.preload.layout-desktop .backgroundContainer:not(.withBackdrop),html.layout-desktop .backgroundContainer:not(.withBackdrop):not(.backgroundContainer-transparent),html.preload.layout-desktop .backgroundContainer:not(.withBackdrop):not(.backgroundContainer-transparent){background:var(--darkerGradientPoint)!important;background-image:none!important;}"
        ].join("");
        (document.head || document.documentElement).appendChild(style);
    }

    function isHomeRoute() {
        var hash = String(window.location.hash || "").toLowerCase();
        if (!hash) {
            return true;
        }

        return hash === "#/home"
            || hash.indexOf("#/home?") === 0
            || hash.indexOf("#/?") === 0
            || hash === "#/";
    }

    function updateHomeRouteClass() {
        var root = document.documentElement;
        if (!root || !root.classList) {
            return;
        }
        root.classList.toggle("altffour-home-route", isHomeRoute());
    }

    function createThemeSelector(userId) {
        var container = document.createElement("div");
        container.className = "theme-selector-container";
        container.id = SELECTOR_ID;

        var listItem = document.createElement("div");
        listItem.className = "listItem listItem-border";

        var icon = document.createElement("span");
        icon.className = "material-icons listItemIcon listItemIcon-transparent";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "palette";

        var body = document.createElement("div");
        body.className = "listItemBody themeSelectorBody";

        var label = document.createElement("div");
        label.className = "listItemBodyText themeSelectorLabel";
        label.textContent = "Theme Palette";

        var select = document.createElement("select");
        select.setAttribute("is", "emby-select");
        select.className = "emby-select-withcolor emby-select themeSelectorControl";

        var currentTheme = getCurrentTheme(userId);
        Object.keys(themes).forEach(function (themeName) {
            var option = document.createElement("option");
            option.value = themeName;
            option.textContent = themeName;
            if (themeName === currentTheme) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.addEventListener("change", function () {
            var nextTheme = select.value;
            setTheme(userId, nextTheme);
            window.location.reload();
        });

        body.appendChild(label);
        body.appendChild(select);
        listItem.appendChild(icon);
        listItem.appendChild(body);
        container.appendChild(listItem);
        return container;
    }

    function injectThemeSelector() {
        ensureSelectorStyles();

        var targetDiv = document.querySelector(".verticalSection .headerUsername");
        if (!targetDiv) {
            log("No headerUsername target");
            return false;
        }

        var parentSection = targetDiv.closest(".verticalSection");
        if (!parentSection) {
            return false;
        }

        if (parentSection.querySelector("#" + SELECTOR_ID)) {
            return true;
        }

        var profileLink = parentSection.querySelector(".lnkUserProfile") || parentSection.querySelector("a[href^='#/userprofile']");
        var userId = extractUserId() || extractUserIdFromProfileLink(profileLink);
        if (!userId) {
            log("No userId available yet");
            return false;
        }

        applyLivePalette(getCurrentTheme(userId));

        if (normalizePaletteVersionInStoredCss(userId) || ensurePaletteBlockAtTop(userId)) {
            window.location.reload();
            return false;
        }

        var selector = createThemeSelector(userId);

        if (profileLink && profileLink.nextSibling) {
            parentSection.insertBefore(selector, profileLink.nextSibling);
        } else if (profileLink) {
            parentSection.insertBefore(selector, profileLink);
        } else {
            parentSection.appendChild(selector);
        }

        log("Selector injected");
        return true;
    }

    function scheduleRetryInject() {
        if (injectThemeSelector()) {
            retryCount = 0;
            return;
        }

        if (retryCount >= RETRY_MAX) {
            return;
        }

        retryCount += 1;
        window.setTimeout(scheduleRetryInject, 300);
    }

    function applyPaletteForCurrentUser() {
        var userId = extractUserId();
        if (!userId) {
            return false;
        }
        applyLivePalette(getCurrentTheme(userId));
        return true;
    }

    function schedulePaletteApply(attempt) {
        if (applyPaletteForCurrentUser()) {
            return;
        }
        if ((attempt || 0) >= RETRY_MAX) {
            return;
        }
        window.setTimeout(function () {
            schedulePaletteApply((attempt || 0) + 1);
        }, 300);
    }

    function initialize() {
        log("Loaded");

        schedulePaletteApply(0);
        scheduleRetryInject();
        updateHomeRouteClass();

        window.addEventListener("hashchange", function () {
            applyPaletteForCurrentUser();
            scheduleRetryInject();
            updateHomeRouteClass();
        }, { passive: true });

        window.addEventListener("popstate", function () {
            applyPaletteForCurrentUser();
            scheduleRetryInject();
            updateHomeRouteClass();
        }, { passive: true });

        var observer = new MutationObserver(function () {
            if (observerTickQueued) {
                return;
            }

            observerTickQueued = true;
            window.setTimeout(function () {
                observerTickQueued = false;

                var now = Date.now();
                if ((now - observerLastRunAt) < OBSERVER_MIN_INTERVAL_MS) {
                    return;
                }
                observerLastRunAt = now;

                var onPreferencesPage = document.querySelector(".headerUsername");
                var selectorExists = document.getElementById(SELECTOR_ID);
                if (onPreferencesPage && !selectorExists) {
                    scheduleRetryInject();
                }
            }, 120);
        });

        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });

        // Backup watchdog for SPA re-renders that may not trigger our observer path in time.
        window.setInterval(function () {
            var hash = String(window.location.hash || "").toLowerCase();
            var onPrefsRoute = hash.indexOf("#/mypreferences") === 0 || hash.indexOf("#/userpreferences") === 0;
            var hasPrefsMarker = !!document.querySelector(".verticalSection .headerUsername");
            if ((onPrefsRoute || hasPrefsMarker) && !document.getElementById(SELECTOR_ID)) {
                scheduleRetryInject();
            }
        }, 2000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { passive: true });
    } else {
        initialize();
    }
})();
