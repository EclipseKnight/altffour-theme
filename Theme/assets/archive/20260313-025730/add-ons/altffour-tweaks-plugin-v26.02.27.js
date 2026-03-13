/* Add-on: Altffour Tweaks Plugin v26.03.01.3 for Jellyfin */
/* Runtime UI hotfixes loaded via JavaScript Injector. */

(function () {
    "use strict";

    if (window.__altffourTweaksPluginLoaded) {
        return;
    }
    window.__altffourTweaksPluginLoaded = true;

    var rawConfig = window.AltffourTweaksConfig || {};

    function normalizeThemePalette(value) {
        var normalized = String(value || "").trim().toLowerCase();

        if (normalized === "graphite"
            || normalized === "emerald"
            || normalized === "sunset"
            || normalized === "crimson") {
            return normalized;
        }

        return "ocean";
    }

    var config = {
        enableSectionHeadingLinkFixes: false,
        enableDynamicHomeSpacer: rawConfig.enableDynamicHomeSpacer !== false,
        enableExtraCardButtonsVisibility: rawConfig.enableExtraCardButtonsVisibility === true,
        themePalette: normalizeThemePalette(rawConfig.themePalette),
        enableHomeRowDeduplication: false
    };

    var themePalettes = {
        ocean: {
            "--darkerGradientPoint": "#111827",
            "--darkerGradientPointAlpha": "rgba(17, 24, 39, 0.85)",
            "--lighterGradientPoint": "#1d2635",
            "--lighterGradientPointAlpha": "rgba(29, 38, 53, 0.85)",
            "--gradientPointAlpha": "rgba(29, 38, 53, 0.3)",
            "--headerColor": "rgba(30, 40, 54, 0.8)",
            "--drawerColor": "rgba(30, 40, 54, 0.9)",
            "--selectorBackgroundColor": "rgb(55, 65, 81)",
            "--selectorBackgroundColorAlpha": "rgba(55, 65, 81, 0.5)",
            "--activeColor": "rgb(119, 91, 244)",
            "--activeColorAlpha": "rgba(119, 91, 244, 0.9)",
            "--uiAccentColor": "rgb(117 111 226)",
            "--btnSubmitColor": "rgb(61, 54, 178)",
            "--btnSubmitBorderColor": "rgb(117 111 226)",
            "--checkboxCheckedBgColor": "rgb(79, 70, 229)",
            "--highlightOutlineColor": "rgb(37, 99, 235)",
            "--glassSurface": "rgba(24, 34, 52, 0.56)",
            "--glassSurfaceStrong": "rgba(17, 24, 39, 0.66)",
            "--glassSurfaceSoft": "rgba(35, 48, 72, 0.44)",
            "--menuGlassSurface": "rgba(23, 34, 54, 0.36)",
            "--menuGlassSurfaceActive": "rgba(82, 116, 176, 0.26)",
            "--glassEdgeOuter": "rgba(162, 197, 255, 0.24)",
            "--glassGlow": "0 0 0 1px rgba(146, 184, 255, 0.08), 0 18px 44px rgba(5, 10, 28, 0.6)"
        },
        graphite: {
            "--darkerGradientPoint": "#14181f",
            "--darkerGradientPointAlpha": "rgba(20, 24, 31, 0.86)",
            "--lighterGradientPoint": "#2b313a",
            "--lighterGradientPointAlpha": "rgba(43, 49, 58, 0.84)",
            "--gradientPointAlpha": "rgba(43, 49, 58, 0.3)",
            "--headerColor": "rgba(34, 40, 50, 0.82)",
            "--drawerColor": "rgba(34, 40, 50, 0.9)",
            "--selectorBackgroundColor": "rgb(78, 87, 101)",
            "--selectorBackgroundColorAlpha": "rgba(78, 87, 101, 0.5)",
            "--activeColor": "rgb(154, 163, 179)",
            "--activeColorAlpha": "rgba(154, 163, 179, 0.88)",
            "--uiAccentColor": "rgb(160, 169, 186)",
            "--btnSubmitColor": "rgb(82, 90, 109)",
            "--btnSubmitBorderColor": "rgb(140, 151, 171)",
            "--checkboxCheckedBgColor": "rgb(94, 105, 124)",
            "--highlightOutlineColor": "rgb(115, 126, 147)",
            "--glassSurface": "rgba(35, 41, 51, 0.56)",
            "--glassSurfaceStrong": "rgba(25, 30, 37, 0.66)",
            "--glassSurfaceSoft": "rgba(49, 57, 70, 0.44)",
            "--menuGlassSurface": "rgba(33, 39, 50, 0.36)",
            "--menuGlassSurfaceActive": "rgba(95, 107, 132, 0.26)",
            "--glassEdgeOuter": "rgba(189, 200, 221, 0.2)",
            "--glassGlow": "0 0 0 1px rgba(178, 189, 210, 0.08), 0 18px 44px rgba(8, 10, 16, 0.62)"
        },
        emerald: {
            "--darkerGradientPoint": "#0f1f1e",
            "--darkerGradientPointAlpha": "rgba(15, 31, 30, 0.86)",
            "--lighterGradientPoint": "#1d3a37",
            "--lighterGradientPointAlpha": "rgba(29, 58, 55, 0.84)",
            "--gradientPointAlpha": "rgba(29, 58, 55, 0.3)",
            "--headerColor": "rgba(25, 52, 49, 0.82)",
            "--drawerColor": "rgba(25, 52, 49, 0.9)",
            "--selectorBackgroundColor": "rgb(40, 86, 81)",
            "--selectorBackgroundColorAlpha": "rgba(40, 86, 81, 0.5)",
            "--activeColor": "rgb(36, 186, 156)",
            "--activeColorAlpha": "rgba(36, 186, 156, 0.9)",
            "--uiAccentColor": "rgb(52, 211, 182)",
            "--btnSubmitColor": "rgb(24, 133, 116)",
            "--btnSubmitBorderColor": "rgb(48, 183, 160)",
            "--checkboxCheckedBgColor": "rgb(21, 128, 112)",
            "--highlightOutlineColor": "rgb(45, 180, 157)",
            "--glassSurface": "rgba(20, 45, 44, 0.56)",
            "--glassSurfaceStrong": "rgba(14, 33, 32, 0.66)",
            "--glassSurfaceSoft": "rgba(30, 64, 60, 0.44)",
            "--menuGlassSurface": "rgba(20, 43, 42, 0.36)",
            "--menuGlassSurfaceActive": "rgba(38, 122, 108, 0.28)",
            "--glassEdgeOuter": "rgba(111, 224, 201, 0.24)",
            "--glassGlow": "0 0 0 1px rgba(117, 233, 208, 0.09), 0 18px 44px rgba(3, 20, 18, 0.6)"
        },
        sunset: {
            "--darkerGradientPoint": "#25160f",
            "--darkerGradientPointAlpha": "rgba(37, 22, 15, 0.86)",
            "--lighterGradientPoint": "#463228",
            "--lighterGradientPointAlpha": "rgba(70, 50, 40, 0.84)",
            "--gradientPointAlpha": "rgba(70, 50, 40, 0.3)",
            "--headerColor": "rgba(56, 39, 30, 0.82)",
            "--drawerColor": "rgba(56, 39, 30, 0.9)",
            "--selectorBackgroundColor": "rgb(106, 76, 58)",
            "--selectorBackgroundColorAlpha": "rgba(106, 76, 58, 0.5)",
            "--activeColor": "rgb(235, 143, 74)",
            "--activeColorAlpha": "rgba(235, 143, 74, 0.9)",
            "--uiAccentColor": "rgb(246, 161, 91)",
            "--btnSubmitColor": "rgb(174, 96, 43)",
            "--btnSubmitBorderColor": "rgb(229, 141, 71)",
            "--checkboxCheckedBgColor": "rgb(192, 104, 50)",
            "--highlightOutlineColor": "rgb(239, 155, 85)",
            "--glassSurface": "rgba(52, 35, 27, 0.56)",
            "--glassSurfaceStrong": "rgba(37, 24, 18, 0.66)",
            "--glassSurfaceSoft": "rgba(74, 52, 40, 0.44)",
            "--menuGlassSurface": "rgba(48, 33, 25, 0.36)",
            "--menuGlassSurfaceActive": "rgba(144, 92, 55, 0.28)",
            "--glassEdgeOuter": "rgba(252, 199, 146, 0.24)",
            "--glassGlow": "0 0 0 1px rgba(252, 198, 143, 0.09), 0 18px 44px rgba(24, 12, 8, 0.6)"
        },
        crimson: {
            "--darkerGradientPoint": "#1f1318",
            "--darkerGradientPointAlpha": "rgba(31, 19, 24, 0.86)",
            "--lighterGradientPoint": "#3e2230",
            "--lighterGradientPointAlpha": "rgba(62, 34, 48, 0.84)",
            "--gradientPointAlpha": "rgba(62, 34, 48, 0.3)",
            "--headerColor": "rgba(50, 28, 39, 0.82)",
            "--drawerColor": "rgba(50, 28, 39, 0.9)",
            "--selectorBackgroundColor": "rgb(96, 53, 74)",
            "--selectorBackgroundColorAlpha": "rgba(96, 53, 74, 0.5)",
            "--activeColor": "rgb(219, 73, 116)",
            "--activeColorAlpha": "rgba(219, 73, 116, 0.9)",
            "--uiAccentColor": "rgb(229, 84, 126)",
            "--btnSubmitColor": "rgb(162, 46, 84)",
            "--btnSubmitBorderColor": "rgb(216, 78, 118)",
            "--checkboxCheckedBgColor": "rgb(181, 53, 95)",
            "--highlightOutlineColor": "rgb(224, 87, 128)",
            "--glassSurface": "rgba(45, 24, 34, 0.56)",
            "--glassSurfaceStrong": "rgba(31, 16, 24, 0.66)",
            "--glassSurfaceSoft": "rgba(63, 35, 48, 0.44)",
            "--menuGlassSurface": "rgba(44, 23, 33, 0.36)",
            "--menuGlassSurfaceActive": "rgba(128, 53, 81, 0.28)",
            "--glassEdgeOuter": "rgba(248, 151, 183, 0.24)",
            "--glassGlow": "0 0 0 1px rgba(245, 142, 175, 0.09), 0 18px 44px rgba(20, 7, 12, 0.6)"
        }
    };

    var runtimeState = {
        version: "26.03.01.3",
        loadedAtUtc: new Date().toISOString(),
        config: {
            enableSectionHeadingLinkFixes: !!config.enableSectionHeadingLinkFixes,
            enableDynamicHomeSpacer: !!config.enableDynamicHomeSpacer,
            enableExtraCardButtonsVisibility: !!config.enableExtraCardButtonsVisibility,
            themePalette: config.themePalette,
            enableHomeRowDeduplication: !!config.enableHomeRowDeduplication
        },
        sectionLinks: {
            enabled: !!config.enableSectionHeadingLinkFixes,
            patchedCount: 0,
            lastRunUtc: "",
            lastError: ""
        },
        dynamicSpacer: {
            enabled: !!config.enableDynamicHomeSpacer,
            appliedOffsetPx: 0,
            targetSectionTitle: "",
            lastRunUtc: "",
            lastError: ""
        },
        extraCardButtonsVisibility: {
            enabled: !!config.enableExtraCardButtonsVisibility,
            cssValue: "",
            lastRunUtc: "",
            lastError: ""
        },
        themePalette: {
            selected: config.themePalette,
            applied: "",
            lastRunUtc: "",
            lastError: ""
        },
        rowDeduplication: {
            enabled: !!config.enableHomeRowDeduplication,
            removedCount: 0,
            rowsTouched: 0,
            lastRunUtc: "",
            lastError: ""
        },
        lastRunUtc: ""
    };

    window.__altffourTweaksRuntimeState = runtimeState;

    var SECTION_LINK_ADDON_CLASS = "altffour-section-link-addon";
    var PALETTE_STYLESHEET_ID = "altffour-theme-palette-override";
    var PALETTE_STYLESHEET_BASE_URL = "https://altffour.com/jellyfin-theme/colors";
    var sectionHrefCache = {};
    var userViewsCache = null;
    var userViewsPromise = null;

    var runQueued = false;
    var runInProgress = false;
    var rerunRequested = false;
    var paletteReapplyTimer = null;

    function normalizeText(value) {
        return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
    }

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

    function getHomeTab() {
        return document.querySelector("#homeTab");
    }

    function applyExtraCardButtonsVisibility() {
        try {
            var cssValue = config.enableExtraCardButtonsVisibility ? "block" : "none";
            document.documentElement.style.setProperty("--extraCardButtonsVisibility", cssValue);
            runtimeState.extraCardButtonsVisibility.cssValue = cssValue;
            runtimeState.extraCardButtonsVisibility.lastRunUtc = new Date().toISOString();
            runtimeState.extraCardButtonsVisibility.lastError = "";
        } catch (error) {
            runtimeState.extraCardButtonsVisibility.lastRunUtc = new Date().toISOString();
            runtimeState.extraCardButtonsVisibility.lastError = error && error.message ? error.message : "Failed to apply visibility variable";
        }
    }

    function applyThemePalette() {
        try {
            var paletteName = normalizeThemePalette(config.themePalette);
            var palette = themePalettes[paletteName] || themePalettes.ocean;
            var rootStyle = document.documentElement.style;
            var paletteHref = PALETTE_STYLESHEET_BASE_URL + "/" + paletteName + ".css?v=20260309-1";
            var link = document.getElementById(PALETTE_STYLESHEET_ID);
            var head = document.head || document.documentElement;

            Object.keys(palette).forEach(function (variableName) {
                rootStyle.setProperty(variableName, palette[variableName]);
            });

            if (!link) {
                link = document.createElement("link");
                link.id = PALETTE_STYLESHEET_ID;
                link.rel = "stylesheet";
                head.appendChild(link);
            }

            if (link.getAttribute("href") !== paletteHref) {
                link.setAttribute("href", paletteHref);
            }

            var darker = palette["--darkerGradientPoint"] || "#111827";
            var lighter = palette["--lighterGradientPoint"] || "#1d2635";
            var header = palette["--headerColor"] || "rgba(30, 40, 54, 0.9)";
            var darkerAlpha = palette["--darkerGradientPointAlpha"] || "rgba(17, 24, 39, 0.85)";
            var lighterAlpha = palette["--lighterGradientPointAlpha"] || "rgba(29, 38, 53, 0.85)";

            // Force major theme surfaces to use the selected palette so changes are clearly visible.
            rootStyle.setProperty("--backgroundGradient", "linear-gradient(0deg, " + darker + " 35%, " + lighter + ")");
            rootStyle.setProperty("--cardBackgroundGradient", "linear-gradient(0deg, " + darker + ", 25%, " + lighter + ")");
            rootStyle.setProperty("--headerColorGradient", "linear-gradient(180deg, " + header + " 30%, 55%, transparent 90%)");
            rootStyle.setProperty("--headerColorGradientAlt", "linear-gradient(180deg, " + header + ", 70%, transparent)");
            rootStyle.setProperty("--headerBackground", "var(--headerColorGradient)");
            rootStyle.setProperty("--topOSDGradient", "linear-gradient(180deg, " + darkerAlpha + ", 45%, hsla(0, 0%, 0%, 0))");
            rootStyle.setProperty("--bottomOSDGradient", "linear-gradient(0deg, " + darkerAlpha + ", 45%, hsla(0, 0%, 0%, 0))");
            rootStyle.setProperty("--pageLiftOverlay", "linear-gradient(180deg, " + lighterAlpha + ", rgba(255, 255, 255, 0.015))");
            document.documentElement.setAttribute("data-altffour-palette", paletteName);

            runtimeState.themePalette.selected = paletteName;
            runtimeState.themePalette.applied = paletteName;
            runtimeState.themePalette.lastRunUtc = new Date().toISOString();
            runtimeState.themePalette.lastError = "";
        } catch (error) {
            runtimeState.themePalette.lastRunUtc = new Date().toISOString();
            runtimeState.themePalette.lastError = error && error.message ? error.message : "Failed to apply theme palette";
        }
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

    function isVisibleElement(node) {
        return !!(node && node.getBoundingClientRect && node.offsetParent !== null);
    }

    function getHomeSections(homeTab) {
        if (!homeTab) {
            return [];
        }

        var sectionsRoot = homeTab.querySelector(".sections");
        if (!sectionsRoot) {
            return [];
        }

        return Array.prototype.filter.call(sectionsRoot.children, function (child) {
            return child && isVisibleElement(child);
        });
    }

    function findSectionTitleText(section) {
        if (!section) {
            return "";
        }

        var titleNode = section.querySelector("h2.sectionTitle.sectionTitle-cards");
        if (titleNode && titleNode.textContent) {
            return titleNode.textContent;
        }

        var linkTitleNode = section.querySelector(".sectionTitleTextButton h2.sectionTitle.sectionTitle-cards");
        if (linkTitleNode && linkTitleNode.textContent) {
            return linkTitleNode.textContent;
        }

        return "";
    }

    function classifySectionHeading(textValue) {
        var text = normalizeText(textValue);
        if (!text) {
            return "";
        }

        if ((text.indexOf("latest") !== -1 || text.indexOf("new") !== -1)
            && (text.indexOf("show") !== -1 || text.indexOf("series") !== -1 || text.indexOf("tv") !== -1)) {
            return "latest-tv";
        }

        if ((text.indexOf("latest") !== -1 || text.indexOf("new") !== -1)
            && (text.indexOf("movie") !== -1 || text.indexOf("film") !== -1)) {
            return "latest-movies";
        }

        if (text === "shows" || text === "show" || text === "tv" || text === "tv shows" || text === "series") {
            return "tv-root";
        }

        if (text === "movies" || text === "movie" || text === "films") {
            return "movies-root";
        }

        return "";
    }

    function getCollectionTypeForHeadingKind(kind) {
        if (kind === "latest-tv" || kind === "tv-root") {
            return "tvshows";
        }

        if (kind === "latest-movies" || kind === "movies-root") {
            return "movies";
        }

        return "";
    }

    function loadUserViews() {
        if (Array.isArray(userViewsCache)) {
            return Promise.resolve(userViewsCache);
        }

        if (userViewsPromise) {
            return userViewsPromise;
        }

        userViewsPromise = new Promise(function (resolve) {
            var apiClient = getApiClient();
            if (!apiClient || typeof apiClient.getCurrentUserId !== "function" || typeof apiClient.getUserViews !== "function") {
                userViewsCache = [];
                resolve(userViewsCache);
                return;
            }

            var userId = "";
            try {
                userId = apiClient.getCurrentUserId();
            } catch (error) {
                userId = "";
            }

            function finalizeViews(response) {
                if (response && Array.isArray(response.Items)) {
                    userViewsCache = response.Items;
                } else if (Array.isArray(response)) {
                    userViewsCache = response;
                } else {
                    userViewsCache = [];
                }

                resolve(userViewsCache);
            }

            Promise.resolve()
                .then(function () {
                    return apiClient.getUserViews(userId);
                })
                .catch(function () {
                    return apiClient.getUserViews({ userId: userId });
                })
                .then(function (response) {
                    finalizeViews(response);
                })
                .catch(function () {
                    userViewsCache = [];
                    resolve(userViewsCache);
                });
        }).finally(function () {
            userViewsPromise = null;
        });

        return userViewsPromise;
    }

    function resolveCollectionView(collectionType) {
        return loadUserViews().then(function (views) {
            return views.find(function (view) {
                return normalizeText(view && view.CollectionType) === collectionType;
            }) || null;
        });
    }

    function buildFallbackSectionHref(view, kind) {
        var viewId = view && view.Id ? String(view.Id) : "";

        if (kind === "latest-tv") {
            return "#/tv?topParentId=" + encodeURIComponent(viewId) + "&collectionType=tvshows&tab=1";
        }

        if (kind === "latest-movies") {
            return "#/movies?topParentId=" + encodeURIComponent(viewId) + "&collectionType=movies";
        }

        if (kind === "tv-root") {
            return "#/tv?topParentId=" + encodeURIComponent(viewId) + "&collectionType=tvshows";
        }

        if (kind === "movies-root") {
            return "#/movies?topParentId=" + encodeURIComponent(viewId) + "&collectionType=movies";
        }

        return "";
    }

    function resolveSectionHref(kind) {
        if (!kind) {
            return Promise.resolve("");
        }

        if (sectionHrefCache[kind]) {
            return Promise.resolve(sectionHrefCache[kind]);
        }

        var collectionType = getCollectionTypeForHeadingKind(kind);
        if (!collectionType) {
            return Promise.resolve("");
        }

        return resolveCollectionView(collectionType).then(function (view) {
            if (!view) {
                if (kind === "latest-tv" || kind === "tv-root") {
                    return "#/tv";
                }

                if (kind === "latest-movies" || kind === "movies-root") {
                    return "#/movies";
                }

                return "";
            }

            if (window.appRouter && typeof window.appRouter.getRouteUrl === "function") {
                try {
                    var routeOptions = kind.indexOf("latest-") === 0
                        ? { section: "latest" }
                        : undefined;
                    var route = routeOptions
                        ? window.appRouter.getRouteUrl(view, routeOptions)
                        : window.appRouter.getRouteUrl(view);

                    if (route) {
                        sectionHrefCache[kind] = route;
                        return route;
                    }
                } catch (error) {
                    /* fall through to fallback */
                }
            }

            var fallback = buildFallbackSectionHref(view, kind);
            sectionHrefCache[kind] = fallback;
            return fallback;
        });
    }

    function wrapHeadingWithLink(heading, href, kind) {
        if (!heading || !href) {
            return false;
        }

        var container = heading.parentElement;
        if (!container) {
            return false;
        }

        var existingAddonLink = container.querySelector("." + SECTION_LINK_ADDON_CLASS);
        if (existingAddonLink) {
            if (existingAddonLink.getAttribute("href") !== href) {
                existingAddonLink.setAttribute("href", href);
            }
            return false;
        }

        if (heading.closest(".sectionTitleTextButton")) {
            return false;
        }

        var link = document.createElement("a");
        link.setAttribute("is", "emby-linkbutton");
        link.className = "more button-flat button-flat-mini sectionTitleTextButton " + SECTION_LINK_ADDON_CLASS;
        link.setAttribute("href", href);
        link.setAttribute("data-altffour-kind", kind || "");

        heading.remove();
        link.appendChild(heading);

        var chevron = document.createElement("span");
        chevron.className = "material-icons chevron_right";
        chevron.setAttribute("aria-hidden", "true");
        link.appendChild(chevron);

        container.appendChild(link);
        return true;
    }

    function patchSectionHeadingLinks() {
        if (!config.enableSectionHeadingLinkFixes) {
            return Promise.resolve();
        }

        var homeTab = getHomeTab();
        if (!homeTab) {
            return Promise.resolve();
        }

        var headingNodes = homeTab.querySelectorAll(".sectionTitleContainer-cards > h2.sectionTitle.sectionTitle-cards");
        if (!headingNodes || !headingNodes.length) {
            return Promise.resolve();
        }

        var candidates = [];
        Array.prototype.forEach.call(headingNodes, function (heading) {
            if (!heading || !heading.textContent) {
                return;
            }

            if (heading.closest(".sectionTitleTextButton")) {
                return;
            }

            var kind = classifySectionHeading(heading.textContent);
            if (!kind) {
                return;
            }

            candidates.push({
                heading: heading,
                kind: kind
            });
        });

        if (!candidates.length) {
            runtimeState.sectionLinks.lastRunUtc = new Date().toISOString();
            runtimeState.sectionLinks.lastError = "";
            return Promise.resolve();
        }

        return Promise.all(candidates.map(function (entry) {
            return resolveSectionHref(entry.kind).then(function (href) {
                return {
                    heading: entry.heading,
                    kind: entry.kind,
                    href: href
                };
            });
        })).then(function (resolvedEntries) {
            var patched = 0;
            resolvedEntries.forEach(function (entry) {
                if (wrapHeadingWithLink(entry.heading, entry.href, entry.kind)) {
                    patched += 1;
                }
            });

            runtimeState.sectionLinks.patchedCount += patched;
            runtimeState.sectionLinks.lastRunUtc = new Date().toISOString();
            runtimeState.sectionLinks.lastError = "";
        }).catch(function (error) {
            runtimeState.sectionLinks.lastRunUtc = new Date().toISOString();
            runtimeState.sectionLinks.lastError = error && error.message ? error.message : "Section heading patch failed";
        });
    }

    function parsePixelValue(value) {
        if (!value) {
            return 0;
        }

        var parsed = parseFloat(String(value));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function clearDynamicSectionMargins(homeTab) {
        if (!homeTab) {
            return;
        }

        var adjustedSections = homeTab.querySelectorAll('[data-altffour-dynamic-spacing-applied="true"]');
        Array.prototype.forEach.call(adjustedSections, function (section) {
            var baseMargin = parsePixelValue(section.getAttribute("data-altffour-base-margin-top"));
            section.style.marginTop = baseMargin + "px";
            section.setAttribute("data-altffour-dynamic-spacing-applied", "false");
        });
    }

    function applySectionSpacingAdjustment(section, extraMarginPx) {
        if (!section) {
            return;
        }

        if (!section.hasAttribute("data-altffour-base-margin-top")) {
            var computed = window.getComputedStyle(section);
            section.setAttribute("data-altffour-base-margin-top", String(parsePixelValue(computed.marginTop)));
        }

        var baseMargin = parsePixelValue(section.getAttribute("data-altffour-base-margin-top"));
        var finalMargin = Math.max(0, baseMargin + Math.max(0, extraMarginPx));
        section.style.marginTop = finalMargin + "px";
        section.setAttribute("data-altffour-dynamic-spacing-applied", "true");
    }

    function findMediaBarSection(homeSections) {
        for (var i = 0; i < homeSections.length; i += 1) {
            var section = homeSections[i];
            var title = normalizeText(findSectionTitleText(section));
            if (title === "my media") {
                return section;
            }
        }

        return null;
    }

    function findNextVisibleSection(homeSections, section) {
        var found = false;

        for (var i = 0; i < homeSections.length; i += 1) {
            if (!found) {
                if (homeSections[i] === section) {
                    found = true;
                }
                continue;
            }

            if (isVisibleElement(homeSections[i])) {
                return homeSections[i];
            }
        }

        return null;
    }

    function applyDynamicHomeSpacer() {
        if (!config.enableDynamicHomeSpacer) {
            return;
        }

        var homeTab = getHomeTab();
        if (!homeTab) {
            return;
        }

        var sections = getHomeSections(homeTab);
        if (!sections.length) {
            return;
        }

        clearDynamicSectionMargins(homeTab);

        var mediaBarSection = findMediaBarSection(sections);
        var targetSection = mediaBarSection ? findNextVisibleSection(sections, mediaBarSection) : null;

        if (!targetSection) {
            runtimeState.dynamicSpacer.appliedOffsetPx = 0;
            runtimeState.dynamicSpacer.targetSectionTitle = "";
            runtimeState.dynamicSpacer.lastRunUtc = new Date().toISOString();
            runtimeState.dynamicSpacer.lastError = "";
            return;
        }

        var mediaBottom = mediaBarSection.getBoundingClientRect().bottom;
        var slidesContainer = document.querySelector("#slides-container");
        if (slidesContainer && isVisibleElement(slidesContainer)) {
            mediaBottom = Math.max(mediaBottom, slidesContainer.getBoundingClientRect().bottom);
        }

        var targetTop = targetSection.getBoundingClientRect().top;
        var desiredGapPx = 24;
        var neededOffset = Math.ceil((mediaBottom + desiredGapPx) - targetTop);
        if (neededOffset < 0) {
            neededOffset = 0;
        }

        applySectionSpacingAdjustment(targetSection, neededOffset);

        runtimeState.dynamicSpacer.appliedOffsetPx = neededOffset;
        runtimeState.dynamicSpacer.targetSectionTitle = findSectionTitleText(targetSection) || "(untitled section)";
        runtimeState.dynamicSpacer.lastRunUtc = new Date().toISOString();
        runtimeState.dynamicSpacer.lastError = "";
    }

    function extractCardText(node, selector) {
        if (!node) {
            return "";
        }

        var element = node.querySelector(selector);
        if (!element || !element.textContent) {
            return "";
        }

        return normalizeText(element.textContent);
    }

    function extractYearText(node) {
        var value = extractCardText(node, ".cardText-secondary, .itemMiscInfo");
        if (!value) {
            return "";
        }

        var match = value.match(/\b(19|20)\d{2}\b/);
        return match ? match[0] : "";
    }

    function extractImdbIdFromPath(pathValue) {
        if (!pathValue) {
            return "";
        }

        var value = String(pathValue);
        var decodedValue = value;
        try {
            decodedValue = decodeURIComponent(value);
        } catch (error) {
            decodedValue = value;
        }

        var match = decodedValue.match(/tt\d{5,10}/i) || value.match(/tt\d{5,10}/i);
        return match ? match[0].toLowerCase() : "";
    }

    function extractCardIdentity(card) {
        if (!card) {
            return "";
        }

        var imdbId = extractImdbIdFromPath(card.getAttribute("data-path"));
        if (imdbId) {
            return "imdb:" + imdbId;
        }

        var title = extractCardText(card, ".cardText-first, .cardText.cardTextCentered");
        if (!title) {
            return "";
        }

        var year = extractYearText(card);
        if (year) {
            return "title-year:" + title + "|" + year;
        }

        return "";
    }

    function getCardQualityScore(card) {
        if (!card) {
            return 0;
        }

        var score = 0;
        var pathValue = String(card.getAttribute("data-path") || "");
        var lowerPath = pathValue.toLowerCase();

        if (lowerPath.indexOf("gelato://stub/") === 0) {
            score += 120;
        } else if (lowerPath.indexOf("gelato://") === 0) {
            score += 70;
        }

        if (extractYearText(card)) {
            score += 12;
        }

        var imageContainer = card.querySelector(".cardImageContainer.cardContent");
        if (imageContainer) {
            var className = String(imageContainer.className || "");
            if (className.indexOf("defaultCardBackground") === -1) {
                score += 25;
            }

            var styleValue = String(imageContainer.getAttribute("style") || "");
            if (styleValue.indexOf("background-image") !== -1) {
                score += 20;
            }
        }

        if (card.querySelector("canvas.blurhash-canvas")) {
            score += 5;
        }

        return score;
    }

    function dedupeHomeRows() {
        if (!config.enableHomeRowDeduplication) {
            return;
        }

        var homeTab = getHomeTab();
        if (!homeTab) {
            return;
        }

        var rows = homeTab.querySelectorAll(".itemsContainer");
        if (!rows || !rows.length) {
            return;
        }

        var removedTotal = 0;
        var rowsTouched = 0;

        Array.prototype.forEach.call(rows, function (row) {
            var cards = Array.prototype.filter.call(row.querySelectorAll(".card"), function (card) {
                if (!card || !card.closest) {
                    return false;
                }

                if (card.closest(".itemsContainer") !== row) {
                    return false;
                }

                return isVisibleElement(card);
            });

            if (!cards.length) {
                return;
            }

            var seenByIdentity = new Map();
            var removedInRow = 0;

            cards.forEach(function (card) {
                var identityKey = extractCardIdentity(card);
                if (!identityKey) {
                    return;
                }

                var currentScore = getCardQualityScore(card);
                var existing = seenByIdentity.get(identityKey);

                if (!existing) {
                    seenByIdentity.set(identityKey, {
                        card: card,
                        score: currentScore
                    });
                    return;
                }

                if (currentScore > existing.score) {
                    existing.card.remove();
                    seenByIdentity.set(identityKey, {
                        card: card,
                        score: currentScore
                    });
                    removedInRow += 1;
                    return;
                }

                if (currentScore <= existing.score) {
                    card.remove();
                    removedInRow += 1;
                }
            });

            if (removedInRow > 0) {
                rowsTouched += 1;
                removedTotal += removedInRow;
            }
        });

        runtimeState.rowDeduplication.removedCount += removedTotal;
        runtimeState.rowDeduplication.rowsTouched = rowsTouched;
        runtimeState.rowDeduplication.lastRunUtc = new Date().toISOString();
        runtimeState.rowDeduplication.lastError = "";
    }

    function runHomeFixes() {
        if (!isHomeRoute()) {
            return;
        }

        if (runInProgress) {
            rerunRequested = true;
            return;
        }

        runInProgress = true;
        rerunRequested = false;

        patchSectionHeadingLinks()
            .then(function () {
                applyDynamicHomeSpacer();
                dedupeHomeRows();
            })
            .catch(function (error) {
                var message = error && error.message ? error.message : "Unknown runtime failure";
                runtimeState.sectionLinks.lastError = runtimeState.sectionLinks.lastError || message;
                runtimeState.dynamicSpacer.lastError = runtimeState.dynamicSpacer.lastError || message;
                runtimeState.rowDeduplication.lastError = runtimeState.rowDeduplication.lastError || message;
            })
            .finally(function () {
                runtimeState.lastRunUtc = new Date().toISOString();
                runInProgress = false;

                if (rerunRequested) {
                    queueRun(120);
                }
            });
    }

    function queueRun(delayMs) {
        if (runQueued) {
            return;
        }

        runQueued = true;
        setTimeout(function () {
            runQueued = false;
            runHomeFixes();
        }, Math.max(0, delayMs || 0));
    }

    function ensurePaletteReapplyLoop() {
        if (paletteReapplyTimer) {
            return;
        }

        // Some theme/runtime layers can overwrite CSS vars after navigation.
        // Reapply the selected palette periodically to keep it sticky.
        paletteReapplyTimer = window.setInterval(function () {
            applyThemePalette();
        }, 2000);
    }

    function attachObserver() {
        var observer = new MutationObserver(function () {
            if (!isHomeRoute()) {
                return;
            }
            queueRun(140);
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    window.addEventListener("hashchange", function () {
        applyThemePalette();
        queueRun(120);
    }, { passive: true });

    window.addEventListener("popstate", function () {
        applyThemePalette();
        queueRun(120);
    }, { passive: true });

    window.addEventListener("resize", function () {
        queueRun(160);
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            applyThemePalette();
        }
    }, { passive: true });

    document.addEventListener("DOMContentLoaded", function () {
        applyThemePalette();
        applyExtraCardButtonsVisibility();
        queueRun(100);
    }, { passive: true });

    applyThemePalette();
    ensurePaletteReapplyLoop();
    applyExtraCardButtonsVisibility();
    attachObserver();
    queueRun(90);
})();
