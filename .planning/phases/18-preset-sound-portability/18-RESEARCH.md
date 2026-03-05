# Phase 18: Preset Sound Portability - Research

**Researched:** 2026-03-04
**Domain:** npm/bun packaging + runtime asset path resolution (built-in SFX)
**Confidence:** HIGH

## User Constraints

- No phase `CONTEXT.md` exists; treat `.planning/ROADMAP.md` + `.planning/v1.1-MILESTONE-AUDIT.md` as source of truth.
- Goal: built-in preset SFX works in typical installed usage (npx/bunx), not only when CWD is the repo.
- Success criteria:
  - `tuireel record` from a non-repo directory with config `{"preset":"polished"}` succeeds (no missing asset errors)
  - Output includes an audio stream (proof SFX applied)
  - Built-in SFX assets ship in the published package and resolve package-relatively (no `process.cwd()` dependency)
- Runtime constraints: Bun primary; npm/npx and bunx execution must remain supported.

## Summary

Preset sound portability is currently broken for installed usage because built-in SFX asset resolution is tied to `process.cwd()` and the published `@tuireel/core` package does not include `assets/sounds/*.mp3`.

Fix requires two changes:

1. ship the assets in the npm tarball, and
2. resolve built-in SFX paths relative to the installed module location (not the caller's working directory).

**Primary recommendation:** make `@tuireel/core` publish `assets/` and resolve SFX via `import.meta.url`-relative path; add a pack+record smoke that runs from a temp non-repo CWD.

## Root Cause Hypothesis (What’s Broken)

**Packaging (HIGH):** `packages/core/package.json#files` only includes `dist`.

- Current: `"files": ["dist"]`
- Result: `packages/core/assets/sounds/*.mp3` are not present in `pnpm pack` / published tarball.

**Runtime resolution (HIGH):** `packages/core/src/sound.ts` resolves assets using CWD heuristics.

- `resolveAssetsDirectory()` candidates include:
  - `resolve(process.cwd(), "assets", "sounds")`
  - `resolve(process.cwd(), "node_modules", "@tuireel", "core", "assets", "sounds")`
- In typical installed usage (`npx tuireel ...` / `bunx tuireel ...`):
  - `process.cwd()` is the user project directory (no `assets/`, often no `node_modules/`)
  - built-in preset sound attempts to open missing `assets/sounds/*.mp3` and ffmpeg fails

## Standard Stack

### Core

| Component             | Location                           | Purpose                                    |
| --------------------- | ---------------------------------- | ------------------------------------------ |
| `@tuireel/core`       | `packages/core`                    | owns built-in SFX and sound mixing logic   |
| `tsup` build          | `packages/core/tsup.config.ts`     | emits ESM + CJS into `packages/core/dist/` |
| npm publish allowlist | `packages/core/package.json#files` | defines what ships in tarball              |

## Recommended Fix Approach

### 1) Ship built-in SFX assets in `@tuireel/core` tarball

- Update `packages/core/package.json#files` to include `assets` (keep `dist`).
- Add a smoke assertion that the packed tarball contains `package/assets/sounds/*.mp3`.

### 2) Resolve built-in SFX via module-relative path (not CWD)

Use `import.meta.url` to compute the package root at runtime, then `../assets/sounds`.

Code pattern (source-level, works for both `src/` and `dist/` layouts):

```ts
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function resolveBuiltInSoundsDir(): string {
  // sound.ts lives in: <pkg>/src/... or <pkg>/dist/...
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "assets", "sounds");
}
```

Practical wiring in `packages/core/src/sound.ts`:

- Prefer module-relative directory first.
- Keep CWD-based candidates only as last-resort (for local dev overrides), not as the primary path.
- Optionally: if built-in variant files are missing, throw a clear error before invoking ffmpeg.

## Don’t Hand-Roll

| Problem                            | Don’t build                                    | Use instead                          | Why                                                            |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| locate built-in package assets     | CWD heuristics / `../..` guessing from process | `import.meta.url`-relative directory | works for npx/bunx cache installs; not dependent on caller CWD |
| “did ffmpeg add audio?” validation | fragile log parsing                            | `ffmpeg -map 0:a:0 -f null -`        | stream-map fails deterministically when audio missing          |

## Common Pitfalls

### `package.json#files` is an allowlist

**What goes wrong:** assets exist in repo but are absent in published tarball.
**Where to look:** `packages/core/package.json#files`.
**Avoid:** assert tarball contents in smoke tests (`pnpm pack` + `tar -tf`).

### ESM/CJS path resolution differences

**What goes wrong:** using `__dirname` works in CJS but not in ESM; using `import.meta.url` must be verified in CJS output.
**Avoid:** build both formats (`pnpm -C packages/core build`) and sanity-run both entrypoints.

### npx/bunx executes from non-project install locations

**What goes wrong:** assuming `process.cwd()/node_modules/...` exists.
**Avoid:** always resolve built-in assets relative to the installed module, not the user project.

## Concrete Planning Notes

Likely code/package changes:

- `packages/core/package.json` (publish `assets`)
- `packages/core/src/sound.ts` (module-relative assets directory)
- `scripts/publish-smoke.ts` (add: tarball contains SFX; run a temp-dir `record` with `preset: polished`)
- Optional: docs tweak in `docs/sound.mdx` clarifying that _custom_ paths are CWD-relative, but built-in variants are shipped.

Local verification checklist:

1. `pnpm -C packages/core build` then `pnpm --filter "@tuireel/core" pack --pack-destination /tmp/...` and confirm tarball contains `assets/sounds/*.mp3`.
2. In a temp directory (not the repo), install tarballs (`npm install <core.tgz> <cli.tgz>`) and run:
   - create a minimal config with `{"preset":"polished"}` and a couple `type/press` steps
   - `npx tuireel record ./config.jsonc --format mp4`
3. Prove audio exists (MP4/WebM only):
   - run `~/.tuireel/bin/ffmpeg -v error -i output.mp4 -map 0:a:0 -f null -` (should exit 0)

## Sources

### Primary (repo-local)

- `.planning/ROADMAP.md` (Phase 18 definition + success criteria)
- `.planning/v1.1-MILESTONE-AUDIT.md` (breakage description + suspected root cause)
- `packages/core/package.json` (`files` allowlist excludes assets)
- `packages/core/src/sound.ts` (CWD-based asset resolution)
- `scripts/publish-smoke.ts` (existing pack+install harness for non-repo directory testing)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - verified in repo
- Architecture/pattern: HIGH - minimal change aligned with Node ESM conventions
- Pitfalls: HIGH - directly evidenced by `files` allowlist + CWD resolution

**Valid until:** 2026-04-04 (packaging/runtime conventions stable)
