# Altffour Theme for Jellyfin

Altffour is a custom Jellyfin theme maintained in this repository.

## Source of truth

- Main source CSS: `Theme/altffour-theme-v1.0.64.css`
- Nightly source CSS: `Theme/altffour-theme-nightly.css`
- Build script: `scripts/build-theme.mjs`
- Build output: `Theme/dist/`

## Build

```bash
node scripts/build-theme.mjs \
  --source Theme/altffour-theme-v1.0.64.css \
  --fork-version 1.0.64 \
  --theme-slug altffour-theme \
  --brand-name "Altffour Theme"
```

## Jellyfin Custom CSS import

Latest build (recommended):

```css
@import url("https://stream.altffour.com/web/assets/altffour-theme-latest.min.css");
```

Pinned release (fallback):

```css
@import url("https://stream.altffour.com/web/assets/altffour-theme-v1.0.64.min.css");
```

## Optional add-ons

```css
@import url("https://stream.altffour.com/web/assets/add-ons/media-bar-plugin-support-latest-min.css");
@import url("https://stream.altffour.com/web/assets/add-ons/custom-media-covers-latest-min.css");
@import url("https://stream.altffour.com/web/assets/add-ons/altffour-in-player-episode-preview-support-latest-min.css");
```

## Playback/OSD maintenance notes

- See `docs/playback-layout-notes.md` before changing Media Bar support CSS.

## Recommended runtime setup (Altffour Tweaks Plugin)

If you install and enable the **Altffour Tweaks Plugin**, it automatically manages the required JavaScript Injector entries on startup/config save.

Use this path as the default setup.

## Manual JavaScript fallback (only if plugin auto-sync is unavailable)

Use this only when plugin-managed injector sync is unavailable and you need to add the runtime loader manually.

1. Open `Dashboard -> Plugins -> JavaScript Injector`.
2. Add a new script and name it `Altffour Tweaks Plugin`.
3. Paste this loader script:

```js
(() => {
  const id = "altffour-tweaks-plugin-loader";
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = "https://altffour.com/jellyfin-theme/add-ons/altffour-tweaks-plugin-latest-min.js";
  script.defer = true;
  document.head.appendChild(script);
})();
```

4. Keep `Enabled` checked. Leave `Requires Authentication` unchecked.
