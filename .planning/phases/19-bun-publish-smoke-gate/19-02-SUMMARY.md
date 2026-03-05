---
phase: 19-bun-publish-smoke-gate
plan: 02
subsystem: testing
tags: [bun, publish-smoke, tarball, regression]

# Dependency graph
requires:
  - phase: 19-01
    provides: deterministic bun install/runtime smoke baseline
provides:
  - Bun tarball-equivalence assertions for tuireel and @tuireel/core package metadata
  - Fail-fast nested @tuireel/core detection before CLI execution
  - Bun export-surface probe proving resolveOutputPath is importable
  - Best-effort cleanup that attempts packDir, npxDir, and bunDir independently
affects:
  - release workflow publish gate
  - REL-04 bunx installability confidence

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fail-fast smoke assertions with actionable diagnostics"
    - "Runtime export-contract probe via temp ESM script"

key-files:
  created:
    - .planning/phases/19-bun-publish-smoke-gate/19-02-SUMMARY.md
  modified:
    - scripts/publish-smoke.ts

key-decisions:
  - "Compare installed vs tarball package.json name/version and exports to catch Bun registry/cache fallbacks deterministically."
  - "Probe @tuireel/core export surface via bun-executed ESM script before any CLI invocation."

patterns-established:
  - "Pattern: Tarball equivalence check precedes bun runtime checks."
  - "Pattern: Temp directory cleanup runs per-directory best effort to avoid cascading cleanup skips."

# Metrics
duration: 6 min
completed: 2026-03-05
---

# Phase 19 Plan 02: Bun Publish Smoke Gate Summary

**Bun publish smoke now fails deterministically on tarball/registry mismatches, verifies resolveOutputPath export availability, and cleans all temp dirs reliably.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-05T01:28:44Z
- **Completed:** 2026-03-05T01:35:04Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added tarball-equivalence assertions for installed `tuireel` and `@tuireel/core` package metadata (`name`, `version`, and `exports` keys/values).
- Added fail-fast nested install detection for `node_modules/tuireel/node_modules/@tuireel/core` before any Bun CLI execution.
- Added Bun export-surface regression probe using `core-export-surface.mjs` to validate `resolveOutputPath`.
- Hardened cleanup to attempt `packDir`, `npxDir`, and `bunDir` deletion independently in best-effort mode.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Bun determinism assertions (tarball equivalence + no nested core)** - `c506c88` (fix)
2. **Task 2: Add Bun export-surface regression check + complete cleanup** - `8b76306` (fix)

**Plan metadata:** pending (created after SUMMARY/STATE updates)

## Files Created/Modified

- `scripts/publish-smoke.ts` - Bun determinism checks, export-surface probe, and robust temp-dir cleanup.
- `.planning/phases/19-bun-publish-smoke-gate/19-02-SUMMARY.md` - Execution summary and verification record.

## Decisions Made

- Compared tarball and installed package metadata at the package.json level to surface Bun cache/registry fallback with actionable diagnostics.
- Added a dedicated ESM import probe for `resolveOutputPath` before CLI invocations to isolate export regressions from command runtime failures.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- REL-04 bun publish smoke gate now validates deterministic installs and export-surface correctness before CLI checks.
- `.github/workflows/release.yml` remains unchanged and still runs `pnpm -w publish:smoke` before publish.
- Ready for follow-up planning or audit work outside this plan scope.

## Self-Check: PASSED

- FOUND: `.planning/phases/19-bun-publish-smoke-gate/19-02-SUMMARY.md`
- FOUND: `c506c88`
- FOUND: `8b76306`
