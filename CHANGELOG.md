# Changelog

Changes to the Altffour theme, its add-ons and the Altffour Tweaks plugin. The format follows
Keep a Changelog. Releases are tagged `theme-v<version>` or `tweaks-v<version>`.

## [Unreleased]

## [theme-v1.0.65] - 2026-10-06

- Jellyfin 12.2: the previous item's backdrop no longer shows through after moving to another item. 12.2 keeps two backdrop slots and leaves the old image in the one it stops using; the theme now hides that slot. No change on 12.1.
- v1.0.65 starts from the served v1.0.64, which had changes that were never committed: the login-page logo and title, readable subtitle cues with subtitle layers kept above the video, the selected item in player menus, settings hover, and app bar spacing.
- Build: the minifier keeps the space before `:`, so `.a :not(.b)` no longer turns into `.a:not(.b)` in `.min` files.

## [tweaks-v1.3.1.0] - 2026-10-06

- Tweaks 1.3.1.0: Jellyfin's web page no longer breaks when the browser asks for a compressed page (brotli or gzip).
  - Tweaks adds its loader to `index.html` as text, but it was handed the compressed bytes, so the browser got garbage still marked as compressed.
  - Tweaks now asks Jellyfin for the plain, whole page for that one request (it drops `Accept-Encoding`, the conditional headers and `Range`), and drops the file's `ETag` and `Last-Modified` from the edited page.
  - A page that still comes back compressed is passed on untouched instead of being broken.
  - New unit tests in `Plugin/Altffour.Tweaks.Tests`.
- Plugin catalogue images: `Theme/assets/img/plugin-images/tweaks.png` (the Tweaks plugin's card in Jellyfin's catalogue) and `theme.png` (the theme's card on the plugins.altffour.com landing page), 1280×720, rendered from the HTML cards next to them. The Tweaks and theme release steps in AGENTS.md now copy them to `plugins.altffour.com/images/` and set the Tweaks manifest's `imageUrl`.
