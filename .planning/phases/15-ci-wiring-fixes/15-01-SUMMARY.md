---
phase: 15-ci-wiring-fixes
plan: 01
subsystem: infra
tags: [ci, typescript, github-actions, type-check]

requires:
  - phase: 06-workflow-polish
    provides: "CI workflow and tsconfig setup"
provides:
  - "CI type-check targets real tsconfig projects (core + cli)"
  - "CI step order: install -> lint -> build -> type-check -> test"
affects: [15-02, 15-03]

tech-stack:
  added: []
  patterns:
    - "Explicit tsc -p per package in CI (no bare root tsc)"
    - "Build before type-check in CI (CLI depends on core dist/*.d.ts)"

key-files:
  created: []
  modified:
    - ".github/workflows/ci.yml"

key-decisions:
  - "Moved build step before type-check to satisfy CLI's dependency on core's generated .d.ts files"
  - "Used named steps for type-check (Type-check core, Type-check cli) for clear CI output"

patterns-established:
  - "CI type-check: explicit tsc --noEmit -p per package tsconfig"

duration: 1min
completed: 2026-03-04
---

# Phase 15 Plan 01: CI Type-Check Fix Summary

**CI type-check now targets real tsconfig projects (core + cli) instead of a bare root tsc, with build-before-check ordering**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-04T06:14:21Z
- **Completed:** 2026-03-04T06:15:22Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced bare `tsc --noEmit` with explicit `tsc --noEmit -p packages/core/tsconfig.json` and `tsc --noEmit -p packages/cli/tsconfig.json`
- Reordered CI steps so `pnpm build` runs before type-check (CLI depends on core's generated `dist/*.d.ts`)
- CI order is now: install -> lint -> build -> type-check (core) -> type-check (cli) -> test
- Added named steps for clear CI output

## Task Commits

Each task was committed atomically:

1. **Task 1: Make CI type-check target real tsconfig projects** - `bbf8450` (fix)

## Files Created/Modified

- `.github/workflows/ci.yml` - Updated type-check step to use explicit tsconfig projects, reordered build before type-check

## Decisions Made

- Moved build step before type-check to satisfy CLI's dependency on core's generated .d.ts files
- Used named steps for type-check clarity in CI output

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CI type-check is now meaningful (no false-green root tsc)
- Ready for 15-02 (next CI wiring fix)

## Self-Check: PASSED

- FOUND: .github/workflows/ci.yml
- FOUND: 15-01-SUMMARY.md
- FOUND: commit bbf8450

---

_Phase: 15-ci-wiring-fixes_
_Completed: 2026-03-04_
