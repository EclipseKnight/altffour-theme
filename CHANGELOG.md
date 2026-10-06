# Changelog

Changes to the Altffour theme, its add-ons and the Altffour Tweaks plugin. The format follows
Keep a Changelog. Releases are tagged `theme-v<version>` or `tweaks-v<version>`.

## [Unreleased]

- Tweaks 1.3.1.0: Jellyfin's web page no longer breaks when the browser asks for a compressed page (brotli or gzip).
  - Tweaks adds its loader to `index.html` as text, but it was handed the compressed bytes, so the browser got garbage still marked as compressed.
  - Tweaks now asks Jellyfin for the plain, whole page for that one request (it drops `Accept-Encoding`, the conditional headers and `Range`), and drops the file's `ETag` and `Last-Modified` from the edited page.
  - A page that still comes back compressed is passed on untouched instead of being broken.
  - New unit tests in `Plugin/Altffour.Tweaks.Tests`.
- Plugin catalogue images: `Theme/assets/img/plugin-images/tweaks.png` (the Tweaks plugin's card in Jellyfin's catalogue) and `theme.png` (the theme's card on the plugins.altffour.com landing page), 1280×720, rendered from the HTML cards next to them. The Tweaks and theme release steps in AGENTS.md now copy them to `plugins.altffour.com/images/` and set the Tweaks manifest's `imageUrl`.
