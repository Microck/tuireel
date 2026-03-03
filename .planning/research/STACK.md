# Stack Research: Tuireel v1.1 -- New Additions

**Domain:** Scripted TUI demo recorder -- docs, CI, release automation, branding, profiling
**Researched:** 2025-07-21
**Confidence:** HIGH

This document covers ONLY the new stack additions for v1.1. The existing v1.0 stack (TypeScript, Bun, pnpm+turbo, tuistory, ghostty-opentui, ffmpeg, Sharp, zod, commander, tsup, vitest) is unchanged and not repeated here.

---

## 1. New Stack Additions

### Documentation (Mintlify)

| Tool | Version | Purpose | Integration Point |
|------|---------|---------|-------------------|
| **mint** (CLI) | 4.2.x | Local preview of Mintlify docs site | `pnpm add -g mint` or `npx mint dev` -- NOT a repo devDependency |
| **docs.json** | n/a (Mintlify config) | Mintlify site configuration file | Lives at `docs/docs.json` with `$schema` reference |

**Rationale:** Mintlify is a hosted docs platform. The `mint` CLI (npm package name: `mint`) provides local preview via `mint dev`. No build step or bundler is needed in the monorepo -- Mintlify builds and hosts the site on push to the connected GitHub repo. The config file is now `docs.json` (not the legacy `mint.json`). Requires Node.js v20.17.0+.

**What goes in `docs/`:** `docs.json`, `.mdx` pages, static assets (logo, favicon). This folder is NOT a pnpm workspace package -- it has no `package.json`.

### Linting and Formatting

| Tool | Version | Purpose | Integration Point |
|------|---------|---------|-------------------|
| **eslint** | ^10.0.2 | Linting TypeScript | Root devDependency |
| **@eslint/js** | ^10.0.1 | ESLint recommended rules base | Root devDependency |
| **typescript-eslint** | ^8.56.1 | TypeScript-specific ESLint rules | Root devDependency |
| **eslint-config-prettier** | ^10.1.8 | Disables ESLint rules that conflict with Prettier | Root devDependency |
| **prettier** | ^3.8.1 | Code formatting | Root devDependency |
| **husky** | ^9.1.7 | Git hooks (pre-commit) | Root devDependency, `prepare` script |
| **lint-staged** | ^16.3.2 | Run linters on staged files only | Root devDependency, config in root `package.json` |

**Rationale:** Matches webreel's exact setup. ESLint 10 flat config with typescript-eslint and prettier integration. Husky + lint-staged ensures formatting on every commit. The ESLint config goes in `eslint.config.js` at repo root (flat config format, no `.eslintrc`).

**Config pattern (from webreel):**
```js
// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["**/dist/", "**/node_modules/", "**/.turbo/"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
);
```

### Release Automation (Changesets)

| Tool | Version | Purpose | Integration Point |
|------|---------|---------|-------------------|
| **@changesets/cli** | ^2.30.0 | Version management + CHANGELOG generation for pnpm monorepo | Root devDependency |
| **changesets/action** | v1 | GitHub Action for automated version PRs and npm publish | `.github/workflows/release.yml` |

**Rationale:** Changesets is the standard for pnpm monorepo versioning. Webreel uses it identically. Provides:
- `pnpm changeset` to create changeset files describing changes
- `changeset version` to bump versions and generate per-package CHANGELOG.md
- `changeset publish` to publish to npm with `workspace:*` resolution
- GitHub Action opens a "Version Packages" PR automatically

**Changeset config (`.changeset/config.json`):**
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.3/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [["@tuireel/core", "tuireel"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "privatePackages": { "version": true, "tag": false }
}
```

The `"fixed"` array keeps `@tuireel/core` and `tuireel` on the same version number (like webreel). CHANGELOG.md is generated per-package automatically by changesets.

### GitHub Actions CI

| Tool | Version | Purpose | Integration Point |
|------|---------|---------|-------------------|
| **actions/checkout** | v4 | Checkout repository | `.github/workflows/ci.yml` |
| **pnpm/action-setup** | v4 | Install pnpm (reads `packageManager` from `package.json`) | `.github/workflows/ci.yml` |
| **actions/setup-node** | v4 | Install Node.js + cache pnpm store | `.github/workflows/ci.yml` |
| **FedericoCarboni/setup-ffmpeg** | v3 | Install ffmpeg for video output regression tests | `.github/workflows/ci.yml` |
| **actions/upload-artifact** | v4 | Upload test video output as CI artifact for manual inspection | `.github/workflows/ci.yml` |

**Rationale:**
- `pnpm/action-setup@v4` reads the `packageManager` field from `package.json` (already set to `pnpm@10.28.2`), so no version input is needed.
- `FedericoCarboni/setup-ffmpeg@v3` is the most maintained ffmpeg action (137 stars, supports Linux/macOS/Windows, caches binary). This enables video output regression tests in CI.
- `actions/upload-artifact@v4` stores test output videos as downloadable artifacts for visual regression inspection.

**CI workflow structure:**
```yaml
# .github/workflows/ci.yml
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm build
      - run: pnpm test
  video-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - uses: FedericoCarboni/setup-ffmpeg@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test:video  # runs video output tests
      - uses: actions/upload-artifact@v4
        with: { name: video-outputs, path: test-outputs/ }
```

### Performance Profiling

| Tool | Version | Purpose | Integration Point |
|------|---------|---------|-------------------|
| **Node.js built-in profiler** | n/a | `node --prof` + `node --prof-process` for V8 CPU profiling | Scripts in `scripts/` |
| **hyperfine** | system binary | CLI benchmarking (wall-clock timing of full pipeline runs) | Installed via system package manager, not npm |
| **Bun built-in profiler** | n/a | `bun --inspect` for Bun-specific profiling | Dev-only |

**Rationale:**
- `node --prof` is the most reliable profiler for Node.js video pipelines. It captures V8 CPU ticks for Sharp operations, Buffer handling, and child process orchestration. No npm package needed.
- `hyperfine` (Rust-based CLI benchmarker) is the gold standard for wall-clock benchmarking of CLI tools. Install via `apt install hyperfine` or `brew install hyperfine`. Used to benchmark full `tuireel record` runs with statistical analysis (warmup, min/max/mean).
- For Bun-specific profiling, use `bun --inspect` which connects to Chrome DevTools.
- No npm profiling package is needed. Clinic.js and 0x are Node.js-specific and add complexity without value for this use case (we need simple CPU profiling + wall-clock timing, not async tracing).

### Branding / Logo Assets

| Tool | Version | Purpose | Integration Point |
|------|---------|---------|-------------------|
| **Sharp** (already in stack) | 0.34.5+ | SVG-to-PNG conversion for logo variants | Build script in `scripts/` |
| **favicons** | ^7.2.0 | Generate favicon set (ICO, multiple PNG sizes, manifest) from source SVG/PNG | One-time script, devDependency optional |

**Rationale:**
- Sharp already handles SVG-to-PNG conversion natively (`sharp('logo.svg').png().toFile(...)`). No additional SVG library needed for generating logo size variants.
- The `favicons` package generates the full favicon set (favicon.ico, apple-touch-icon, manifest.json, multiple PNG sizes) from a single source image. This is needed for the Mintlify docs site and future website. Run once via a script, not a build-time dependency.
- The logo SVG itself is hand-crafted or designed externally. No programmatic SVG generation library is needed.

---

## 2. Existing Stack (Unchanged) -- Reference Only

These are already validated and in use. Not re-researched.

| Category | Tools |
|----------|-------|
| Runtime | Bun 1.2+, TypeScript 5.8+, Node.js >=18 compat |
| Terminal | tuistory ^0.0.16, ghostty-opentui ^1.4.5 |
| Video | ffmpeg (auto-downloaded), Sharp ^0.34.5 |
| CLI/Config | commander ^14.0, jsonc-parser ^3.3, zod ^4.1, zod-to-json-schema, chokidar ^5.0 |
| Build | tsup ^8.5, turbo ^2.5, pnpm 10.28 |
| Test | vitest ^3.2 |

---

## 3. What NOT to Add

| Tool | Why NOT | Use Instead |
|------|---------|-------------|
| **Docusaurus / Nextra / VitePress** | Mintlify is hosted -- no local SSG framework needed. Adding a docs framework to the monorepo adds build complexity for no benefit. | Mintlify (hosted) + `mint` CLI for preview |
| **@changesets/changelog-github** | Adds GitHub PR links to changelogs. Nice but adds a dependency + requires `GITHUB_TOKEN` in changeset config. The default `@changesets/cli/changelog` is sufficient for v1.1. | Default changelog generator |
| **semantic-release** | Designed for single packages, poor pnpm workspace support, opinionated commit convention. Changesets is the standard for pnpm monorepos. | @changesets/cli |
| **Clinic.js / 0x** | Node.js-specific async tracing tools. Overkill for profiling Sharp + ffmpeg pipelines. Don't work with Bun. | `node --prof` + hyperfine |
| **svgo** (npm) | SVG optimization. Only needed if shipping SVGs in the npm package. Logo SVGs are static assets for docs/website only. | Hand-optimize if needed |
| **sharp-cli** (npm) | CLI wrapper for Sharp. We already have Sharp as a library dependency and can write simple scripts. | Sharp API directly in scripts |
| **tsx** | TS script runner. Bun runs TS natively, so tsx is redundant. | `bun run scripts/foo.ts` |
| **Biome** | All-in-one linter/formatter. Promising but webreel uses ESLint+Prettier and the ecosystem is more mature. Switching would diverge from reference project. | ESLint + Prettier |
| **commitlint** | Enforce conventional commits. Overkill for a 1-2 person project. Changesets handle the release narrative. | Changesets for release notes |
| **pixelmatch / looks-same** | Pixel-level image comparison for video regression. Fragile with video encoding (codec artifacts, color space). | File-size + metadata assertions, manual artifact inspection |

---

## 4. Integration Notes

### How new tools connect to existing monorepo

**Root `package.json` additions (devDependencies):**
```json
{
  "@changesets/cli": "^2.30.0",
  "@eslint/js": "^10.0.1",
  "eslint": "^10.0.2",
  "eslint-config-prettier": "^10.1.8",
  "husky": "^9.1.7",
  "lint-staged": "^16.3.2",
  "prettier": "^3.8.1",
  "typescript-eslint": "^8.56.1"
}
```

**Root `package.json` script additions:**
```json
{
  "lint": "eslint .",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "changeset": "changeset",
  "ci:version": "changeset version && pnpm install --no-frozen-lockfile",
  "ci:publish": "pnpm build && changeset publish",
  "prepare": "husky"
}
```

**`turbo.json` additions:**
```json
{
  "lint": { "cache": true },
  "type-check": { "cache": true }
}
```

**New files to create:**
- `eslint.config.js` -- flat config (see pattern above)
- `.prettierrc` -- formatting rules
- `.changeset/config.json` -- changeset configuration
- `.changeset/README.md` -- explanation for contributors
- `.github/workflows/ci.yml` -- lint/build/test
- `.github/workflows/release.yml` -- changesets version/publish
- `docs/docs.json` -- Mintlify configuration
- `docs/index.mdx` -- docs landing page
- `scripts/generate-favicons.ts` -- one-time favicon generation

**Mintlify docs (`docs/`) is NOT a workspace package.** It contains only `docs.json`, `.mdx` files, and static assets. It is deployed by Mintlify's GitHub App on push, not by turbo. Add `docs/` to pnpm-workspace.yaml's exclusions if needed (though it won't match since it has no `package.json`).

**Video regression in CI:** The `FedericoCarboni/setup-ffmpeg@v3` action installs ffmpeg system-wide. Tests that produce video output should write to a `test-outputs/` directory which gets uploaded as a CI artifact. These tests run in a separate job to avoid slowing down the lint/build/test pipeline.

### Version compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| eslint@10 | typescript-eslint@8 | Flat config required (eslint.config.js) |
| prettier@3.8 | eslint-config-prettier@10 | Disables conflicting rules |
| @changesets/cli@2.30 | pnpm@10 | Native workspace protocol support |
| mint CLI@4.2 | Node.js v20.17+ | Not compatible with older Node versions |
| FedericoCarboni/setup-ffmpeg@v3 | ubuntu-latest (24.04) | Caches binary, supports Linux/macOS/Windows |
| husky@9 | git 2.x+ | Uses `core.hooksPath` approach |

---

## Sources

- Mintlify official docs (mintlify.com/docs/quickstart, /installation, /settings) -- verified `docs.json` config format, `mint` CLI package name, Node.js v20.17+ requirement
- webreel reference project (opensrc) -- verified ESLint flat config pattern, changesets config with fixed versioning, CI workflow structure, husky+lint-staged setup
- npm registry (verified 2025-07-21) -- @changesets/cli@2.30.0, eslint@10.0.2, prettier@3.8.1, typescript-eslint@8.56.1, husky@9.1.7, lint-staged@16.3.2, eslint-config-prettier@10.1.8, favicons@7.2.0
- GitHub repos -- pnpm/action-setup@v4.2.0, changesets/action@v1.7.0, FedericoCarboni/setup-ffmpeg@v3.1 (137 stars, last release Feb 2024)
- Node.js docs -- `--prof` flag for V8 CPU profiling
- hyperfine (github.com/sharkdp/hyperfine) -- system binary, not npm package

---
*Stack research for: Tuireel v1.1 new additions*
*Researched: 2025-07-21*