---
phase: 18-preset-sound-portability
plan: 01
subsystem: infra
tags: [npm, packaging, audio, esm, cjs]
requires:
  - phase: 08-presets-reliability
    provides: Built-in presets and sound configuration plumbing
  - phase: 16-publish-installability-fixes
    provides: Publish smoke and install-surface validation workflows
provides:
  - "@tuireel/core tarballs include built-in sounds under assets/sounds/*.mp3"
  - "resolveSfxPath and ensureSoundAssets resolve built-ins package-relatively"
  - "ESM and CJS builds map default SFX to shipped package assets"
affects: [18-02-regression-coverage, publish-smoke, preset-polished-e2e]
tech-stack:
  added: []
  patterns:
    - Ship runtime assets via explicit package.json files allowlist
    - Resolve built-in assets from import.meta.url with __dirname fallback
key-files:
  created:
    - .planning/phases/18-preset-sound-portability/18-01-SUMMARY.md
  modified:
    - packages/core/package.json
    - packages/core/src/sound.ts
key-decisions:
  - Kept publish allowlist minimal by adding only assets alongside dist
  - Kept process.cwd candidates as fallback-only for local overrides
patterns-established:
  - Built-in runtime assets resolve package-relatively, not from caller CWD
duration: 4 min
completed: 2026-03-04
---

# Phase 18 Plan 01: Preset Sound Portability Summary

**Core package tarballs now ship built-in click/key SFX and resolve them package-relatively in both ESM and CJS builds.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T20:56:48Z
- **Completed:** 2026-03-04T21:01:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `assets/` to `@tuireel/core` publish allowlist while keeping `dist/` intact.
- Verified packed tarball now contains `package/assets/sounds/click-1.mp3` and `package/assets/sounds/key-1.mp3`.
- Reworked built-in SFX resolution to prefer module-relative directories (`import.meta.url`, `__dirname`) before CWD-based fallbacks.
- Verified default SFX resolution from both ESM and CJS builds points to `packages/core/assets/sounds/*`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Ship built-in SFX assets in @tuireel/core tarball** - `6910b02` (fix)
2. **Task 2: Resolve built-in SFX directory package-relatively (no process.cwd dependency)** - `9dbbdf8` (fix)

## Files Created/Modified

- `.planning/phases/18-preset-sound-portability/18-01-SUMMARY.md` - Execution outcomes and verification evidence.
- `packages/core/package.json` - Publish allowlist now includes `assets` plus `dist`.
- `packages/core/src/sound.ts` - Module-relative built-in SFX directory resolution with CWD fallbacks kept last.

## Decisions Made

- Keep package surface narrow: include only `assets` in addition to existing `dist` for SFX portability.
- Prefer package-relative resolution for built-ins, while preserving CWD candidates only as local-dev fallback paths.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for `18-02-PLAN.md` to add regression coverage for non-repo preset sound usage.
- No blockers carried forward from this plan.

## Self-Check: PASSED

- Found `.planning/phases/18-preset-sound-portability/18-01-SUMMARY.md`.
- Found task commits `6910b02` and `9dbbdf8` in git history.
