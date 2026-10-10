# Altffour theme repo: guide for coding agents

For any coding agent (Claude Code, Codex, others) working in this repo. Read it before changing anything.
Last updated: 2026-10-09.

**If an `AGENTS.local.md` file sits next to this one, read it too.** It's kept out of git and has the steps for the server you're working on (where files are published, what runs in production).

## What this repo is

- **Altffour Theme:** a CSS theme for Jellyfin's web client, plus optional add-on CSS and scripts.
- **Altffour Tweaks Plugin** (`Plugin/Altffour.Tweaks`): a small Jellyfin server plugin in C#.
  - On startup and on every settings save, it writes the theme's script entries into the JavaScript Injector plugin's config (`Jellyfin.Plugin.JavaScriptInjector.xml`).
  - It then checks that those add-on files load, and shows the results on its settings page (Status, Tweaks, Health and Diagnostics tabs).
  - It also adds a fallback to `/web/index.html` that loads JavaScript Injector's `public.js`.
- GitHub: `EclipseKnight/altffour-theme`, branch `main`. License: GPL-2.0.
- **This repo is public.** Never commit secrets, credentials, server paths, host names or anything about a particular server's setup. Those belong in `AGENTS.local.md`, which stays out of git.
- **Store-safe wording:** write only about the theme, the plugin and Jellyfin. Never name where media comes from or any third-party content service. Piracy is strictly prohibited.

## Layout

| Path | What |
|---|---|
| `Theme/altffour-theme-v<version>.css` | Theme source, one file per version. The newest is the one to copy for the next version. |
| `Theme/altffour-theme-nightly.css` | Old "nightly" source. Stale; don't build from it. |
| `Theme/dist/` | Output of `scripts/build-theme.mjs`: `-v<version>`, `-latest` and `-compat` CSS, each with a `.min` copy, plus `manifest.json`. |
| `Theme/assets/*.css` | Older copies of `-latest`, `-compat-latest` and `v1.0.0` builds. |
| `Theme/assets/add-ons/` | Add-ons. `*-nightly.*` is the working copy and `*-latest-min.*` is the published one. They're usually identical and not actually minified. |
| `Theme/assets/archive/<timestamp>/add-ons/` | Old add-on versions, named `<name>-vYY.MM.DD.css` or `.js`. |
| `Theme/assets/img/` | Banner and library cover images (`library-covers/*.webp`, sources in `originals/`). |
| `Theme/assets/img/plugin-images/` | Catalogue images: `tweaks.png` (the Tweaks plugin's card in Jellyfin's catalogue) and `theme.png` (the theme's card). 1280×720 PNG under 200 KB, each rendered from the `.html` next to it (shared style `card.css`). |
| `Plugin/Altffour.Tweaks/` | The Tweaks plugin. `bin/` and `obj/` are gitignored build output. |
| `Plugin/Altffour.Tweaks.Tests/` | xunit tests for the plugin's `index.html` middleware. Not part of the plugin package. |
| `scripts/build-theme.mjs` | The theme build (Node, no dependencies). |
| `docs/playback-layout-notes.md` | Rules for the player's CSS. Read it before touching playback or OSD CSS. |
| `README.md`, `CONTRIBUTING.md`, `custom-media-covers.md`, `docs/index.html` | User docs. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Checklist: test desktop, mobile and TV; use `em` units; avoid needless `!important`. |

`CHANGELOG.md` has the changes (Keep a Changelog). The Tweaks plugin has unit tests; the theme has none, and there's no CI.

### Add-ons (`Theme/assets/add-ons/`)

| Add-on | Type | What it does |
|---|---|---|
| `altffour-tweaks-plugin` | JS | Runtime UI fixes, loaded by the Tweaks plugin's JavaScript Injector entry. It reads `window.AltffourTweaksConfig`, which the plugin writes. It handles the colour palette (`ocean`, `graphite`, `emerald`, `sunset`, `crimson`), the home spacer, card-button visibility and route guards. The header comment holds its version (e.g. `v26.03.01.3`). |
| `altffour-user-theme-selector` | JS | Per-user palette picker that imports `colors/<palette>.css`. The plugin currently removes its JavaScript Injector entry. |
| `latest-shows-link-support` | JS | Makes "Latest Shows" headings into links. The plugin turned this fix off in 1.2.2.0. |
| `media-bar-plugin-support` | CSS | Layout for the Media Bar plugin. Due for removal. |
| `altffour-in-player-episode-preview-support` | CSS | Styles for the In-Player Episode Preview plugin. |
| `custom-media-covers` | CSS | Custom library cover art. |

## How Jellyfin uses it

- **The theme** is imported in Jellyfin's Branding custom CSS (Dashboard → General → Branding): the versioned `.min.css` first, then the two Jellyfin 12 add-ons (`add-ons/altffour-theme-jf12-compat.css`, `add-ons/altffour-theme-jf12-modern.css`). Imports carry `?v=` cache-busters.
- **The Tweaks plugin** is installed from a Jellyfin plugin repository (a `manifest.json` listing each version's zip).
- **JavaScript Injector entries:** the Tweaks plugin manages "Altffour Tweaks Plugin", "Altffour Tweaks - Media Bar Support" and "Altffour Tweaks - In-Player Episode Preview Support". Its sync overwrites hand edits to those three, and leaves other entries alone.

## Build and test

Other people's uncommitted work may be in this tree. **Build from a clean copy of a commit, never from the working tree:** `git worktree add <scratch> <commit>` or `git archive <commit> | tar -x -C <scratch>`.

### Theme

```bash
node scripts/build-theme.mjs \
  --source Theme/altffour-theme-v<version>.css \
  --fork-version <version> \
  --theme-slug altffour-theme \
  --brand-name "Altffour Theme"
```

- The script **deletes and rebuilds `Theme/dist/` every run**, so older versioned dist files show up as deleted. Don't commit those deletions.
- **Always pass `--fork-version`.** Without it the files are named `v1.0.0`.
- The minifier keeps the spaces around `+` (required inside `calc()`) and the space before `:` (`.a :not(.b)` is a different selector from `.a:not(.b)`). Still compare a new `.min` with its full file before publishing: load both in a browser and check that every rule's selector and declarations match.
- `-compat` files are the same CSS with every `:has(` rule removed, for older clients.

**Testing:** nothing is automated. Check the change in a browser on desktop and mobile widths, and on TV if you can. Cover home, a details page, playback with the OSD, and the login page. Jellyfin 12 has two layouts; the Modern one is the default, and `jf12-modern.css` styles it. Test on a test server, never on a production one.

### Tweaks plugin

```bash
cd Plugin/Altffour.Tweaks
dotnet build -c Release -o <scratch-out>
```

Tests (run them before every Tweaks release):

```bash
cd Plugin/Altffour.Tweaks.Tests
dotnet test
```

- They run the `index.html` middleware in front of ASP.NET Core's real brotli and gzip response compression, as Jellyfin does, and check that the page comes back plain, whole and with the loader, whatever the browser's `Accept-Encoding`, `If-None-Match` or `Range` headers say.
- Build the plugin package from `Plugin/Altffour.Tweaks` only. Building the test project into the same output folder would add test DLLs to it.
- The output is `Altffour.Plugin.Tweaks.dll`, `.pdb` and `.deps.json`.
- The csproj targets `net10.0` and compiles against Jellyfin's own DLLs: `/jellyfin-bin` by default, or another folder with `-p:JellyfinBin=<folder>`. Build against the **Jellyfin 12.1** DLLs with targetAbi `12.1.0.0`, so one build loads on 12.1 and 12.2; a build made against 12.2 won't load on 12.1.
- Plugin facts:
  - GUID `6ba080fc-ff40-4c6c-a59d-9874f96d4206`
  - Name "Altffour Tweaks Plugin"
  - Assembly `Altffour.Plugin.Tweaks`
  - Settings page `altffourTweaks`, embedded from `Configuration/config.html`
- The add-on URLs and their `?v=` cache-busters are constants in `InjectorConfigSynchronizer.cs` (`BaseAddOnUrl` and the `*Url` constants). The health checks in `PluginHealthEvaluator.cs` use the same constants.

## Releasing

Publishing changes what users load, so it's done only with the owner's OK. The server-specific steps are in `AGENTS.local.md`.

### Theme release

1. Copy the current source to a new version (`Theme/altffour-theme-v<next>.css`) and make your changes there. Build with `--fork-version <next>`.
2. Publish only the **new** versioned files. Never overwrite a published versioned file.
3. Replacing `-latest` or add-on files changes what users load straight away. When you do, bump the `?v=` cache-buster wherever the file is referenced: the Branding imports, the constants in `InjectorConfigSynchronizer.cs` (compiled into the DLL, so that needs a Tweaks release) and `PALETTE_VERSION` in `altffour-user-theme-selector.js`. Archive the old add-on in a dated `archive/` folder first.
4. Update the changelog, commit, tag `theme-v<version>` and push the tag.

### Tweaks release

1. Bump `<Version>`, `<FileVersion>` and `<AssemblyVersion>` in `Altffour.Tweaks.csproj` (4 parts, higher than the last published version).
2. Build from a clean copy of the commit, and run the tests.
3. Zip the three output files flat:
   ```bash
   zip -j altffour-tweaks_<version>.zip Altffour.Plugin.Tweaks.dll Altffour.Plugin.Tweaks.pdb Altffour.Plugin.Tweaks.deps.json
   ```
4. Add a new first entry under `versions` in the plugin repository's `manifest.json`: `version`, `changelog`, `targetAbi: "12.1.0.0"`, `sourceUrl` (the zip's URL), `checksum` (the zip's MD5, upper-case) and `timestamp` (UTC ISO 8601). The plugin entry's `imageUrl` points at `tweaks.png`. Never overwrite a published zip, and never point the manifest at a missing zip or image.
5. Check that the manifest, zip and image URLs load and that the downloaded zip's MD5 matches.
6. Update the changelog, commit, tag `tweaks-v<version>` and push the tag.

## Versioning, changelog and tags

- **Theme:** versioned like `v1.0.65`. The version is in the source file name, the build's `--fork-version` and the Branding import.
- **Tweaks plugin:** a 4-part Jellyfin version (`1.3.1.0`) in the csproj, the manifest entry and `meta.json`.
- **Add-ons:** a date version (`vYY.MM.DD[.N]`) in the header comment and in archived copies. The published `-latest-min` file is pinned by `?v=YYYYMMDD-N` cache-busters.
- **Every release** bumps the version, adds a changelog entry (and, for Tweaks, the manifest `changelog` line) and gets a git tag: `theme-v<version>` or `tweaks-v<version>`.
- **A published version is never replaced.** Fix a bad one with the next version.
- **Update `CHANGELOG.md` with every change** (Keep a Changelog): new work goes in the top section; a release gives that section its version and date.

### Plugin images

- `Theme/assets/img/plugin-images/tweaks.html` and `theme.html` are the sources. Render the edited one to a 1280×720 PNG under 200 KB (headless browser, with the Chakra Petch and JetBrains Mono fonts, both SIL OFL 1.1), and commit the HTML and the PNG together.
- Our own artwork only: no stock images and no copied icons or logos.

## Working in this repo

- **Other agents and people may have uncommitted work here.** Run `git status` first. Never stage, commit, stash, revert or edit someone else's changes. Stage only your own files by name (no `git add -A` or `git commit -a`).
- **One branch per task,** in its own worktree, finished with a pull request that the owner reviews and merges.
- **Commits:** plain, short messages in the history's style, `type(scope): summary` (e.g. `fix(theme): ...`, `docs(readme): ...`). Author and committer are the owner, `EclipseKnight <jpaquin1106@gmail.com>`; no agent or bot identity.
- **No AI attribution:** no `Co-Authored-By` trailer and no "Generated with ..." line in commits, PRs, tags or release notes.
- **Never copy code from other projects.** Read them to learn how something works, then write it yourself.
- **Writing:** plain, short wording in docs, comments and commits. Comments say why.
- Keep add-ons optional and in their own files.
