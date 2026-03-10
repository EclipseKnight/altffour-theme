#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");
const themeDir = path.join(repoRoot, "Theme");
const distDir = path.join(themeDir, "dist");

function parseArgs(argv) {
    const options = {
        source: "Theme/altffour-theme-v1.0.52.css",
        forkVersion: process.env.FORK_VERSION || "1.0.0",
        themeSlug: process.env.THEME_SLUG || "altffour-theme",
        brandName: process.env.BRAND_NAME || "Altffour Theme",
        buildTag: process.env.BUILD_TAG || "",
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg.startsWith("--")) {
            options.source = arg;
            continue;
        }
        const next = argv[i + 1];
        if (arg === "--source" && next) {
            options.source = next;
            i += 1;
        } else if (arg === "--fork-version" && next) {
            options.forkVersion = next;
            i += 1;
        } else if (arg === "--theme-slug" && next) {
            options.themeSlug = next;
            i += 1;
        } else if (arg === "--brand-name" && next) {
            options.brandName = next;
            i += 1;
        } else if (arg === "--build-tag" && next) {
            options.buildTag = next;
            i += 1;
        }
    }

    return options;
}

const options = parseArgs(process.argv.slice(2));
const sourcePath = path.isAbsolute(options.source)
    ? options.source
    : path.join(repoRoot, options.source);

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    fs.mkdirSync(dirPath, { recursive: true });
}

function readFile(filePath) {
    return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
}

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, "utf8");
}

function extractVersion(css) {
    const footerMatch = css.match(/--altffourFooterText:\s*"Altffour Theme v([0-9.]+)"/);
    if (footerMatch?.[1]) {
        return footerMatch[1];
    }
    const nameMatch = sourcePath.match(/v([0-9.]+)\.css$/);
    if (nameMatch?.[1]) {
        return nameMatch[1];
    }
    return "local";
}

function normalizeHeader(css, label) {
    return css.replace(
        /--altffourFooterText:\s*"[^"]*"/,
        `--altffourFooterText: "${label}"`
    );
}

function stripHasRules(css) {
    let out = "";
    let i = 0;
    let tokenStart = 0;
    const stack = [];

    const isSkipping = () => (stack.length ? stack[stack.length - 1].skip : false);

    while (i < css.length) {
        const ch = css[i];
        const next = css[i + 1];

        if (ch === '"' || ch === "'") {
            let j = i + 1;
            while (j < css.length) {
                if (css[j] === "\\" && j + 1 < css.length) {
                    j += 2;
                    continue;
                }
                if (css[j] === ch) {
                    j += 1;
                    break;
                }
                j += 1;
            }
            i = j;
            continue;
        }

        if (ch === "/" && next === "*") {
            let j = i + 2;
            while (j < css.length && !(css[j] === "*" && css[j + 1] === "/")) {
                j += 1;
            }
            i = j + 2;
            continue;
        }

        if (ch === "{") {
            const header = css.slice(tokenStart, i);
            const parentSkip = isSkipping();
            const currentHas = header.includes(":has(");
            const currentSkip = parentSkip || currentHas;
            if (!currentSkip) {
                out += header + "{";
            }
            stack.push({ skip: currentSkip });
            tokenStart = i + 1;
            i += 1;
            continue;
        }

        if (ch === "}") {
            const body = css.slice(tokenStart, i);
            const frame = stack.pop() || { skip: false };
            if (!frame.skip) {
                out += body + "}";
            }
            tokenStart = i + 1;
            i += 1;
            continue;
        }

        i += 1;
    }

    if (!isSkipping()) {
        out += css.slice(tokenStart);
    }

    // Remove obvious empty at-rules after stripping :has selectors.
    return out
        .replace(/@media[^{]+\{\s*\}/g, "")
        .replace(/@supports[^{]+\{\s*\}/g, "")
        .replace(/\n{3,}/g, "\n\n");
}

function minifyCss(css) {
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    return withoutComments
        .replace(/\s+/g, " ")
        .replace(/\s*([{}:;,>+~])\s*/g, "$1")
        .replace(/;}/g, "}")
        .trim();
}

function build() {
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source CSS not found: ${sourcePath}`);
    }

    cleanDir(distDir);

    const sourceCss = readFile(sourcePath);
    const upstreamVersion = extractVersion(sourceCss);
    const forkVersion = options.forkVersion;
    const themeSlug = options.themeSlug;
    const brandName = options.brandName;
    const buildTag = options.buildTag || `v${forkVersion}`;

    const stableLabel = `${brandName} v${forkVersion}`;
    const latestLabel = `${brandName} Latest • ${buildTag}`;
    const compatLabel = `${brandName} v${forkVersion} (Compat)`;
    const compatLatestLabel = `${brandName} Latest • ${buildTag} (Compat)`;

    const stableCss = normalizeHeader(sourceCss, stableLabel);
    const latestCss = normalizeHeader(sourceCss, latestLabel);

    const compatBase = stripHasRules(stableCss);
    const compatCss = normalizeHeader(compatBase, compatLabel);
    const compatLatestCss = normalizeHeader(compatBase, compatLatestLabel);

    const files = {
        stable: `${themeSlug}-v${forkVersion}.css`,
        stableMin: `${themeSlug}-v${forkVersion}.min.css`,
        latest: `${themeSlug}-latest.css`,
        latestMin: `${themeSlug}-latest.min.css`,
        compat: `${themeSlug}-compat-v${forkVersion}.css`,
        compatMin: `${themeSlug}-compat-v${forkVersion}.min.css`,
        compatLatest: `${themeSlug}-compat-latest.css`,
        compatLatestMin: `${themeSlug}-compat-latest.min.css`,
        manifest: "manifest.json",
    };

    writeFile(path.join(distDir, files.stable), stableCss);
    writeFile(path.join(distDir, files.stableMin), minifyCss(stableCss));
    writeFile(path.join(distDir, files.latest), latestCss);
    writeFile(path.join(distDir, files.latestMin), minifyCss(latestCss));
    writeFile(path.join(distDir, files.compat), compatCss);
    writeFile(path.join(distDir, files.compatMin), minifyCss(compatCss));
    writeFile(path.join(distDir, files.compatLatest), compatLatestCss);
    writeFile(path.join(distDir, files.compatLatestMin), minifyCss(compatLatestCss));

    const manifest = {
        generatedAt: new Date().toISOString(),
        source: path.relative(repoRoot, sourcePath),
        themeSlug,
        brandName,
        forkVersion,
        upstreamVersion,
        notes: {
            stable: "Use pinned version files in Jellyfin Branding.",
            latest: "For testing only; do not use for production pinning.",
            compat: "Reduced selector complexity for older clients (drops :has rules).",
        },
        files,
    };
    writeFile(path.join(distDir, files.manifest), `${JSON.stringify(manifest, null, 2)}\n`);

    console.log(`Built ${brandName} dist from ${path.relative(repoRoot, sourcePath)}`);
    console.log(`Fork version: ${forkVersion}`);
    console.log(`Upstream base: ${upstreamVersion}`);
    console.log(`Output: ${path.relative(repoRoot, distDir)}`);
}

build();
