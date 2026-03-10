# Contributing to Altffour Theme

## Scope

Keep changes focused on Jellyfin theme behavior, visual consistency, and cross-device stability.

## Rules

- Validate on desktop and mobile layouts.
- Avoid hardcoded hostnames when relative paths are possible.
- Keep add-ons optional and isolated under `Theme/assets/add-ons/`.
- Do not introduce upstream project branding in source files.

## Build check

```bash
node scripts/build-theme.mjs --source Theme/altffour-theme-v1.0.52.css --fork-version 1.0.52 --theme-slug altffour-theme --brand-name "Altffour Theme"
```
