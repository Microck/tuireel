---
phase: 17-fix-multi-format-record-outputs
plan: 01
subsystem: cli
tags: [record, watch, composite, mp4, webm, gif, pnpm, vitest]

requires: []
provides:
  - "resolveOutputPath() helper exported from @tuireel/core"
  - "record/watch/composite normalize output paths for selected --format"
affects: [ci, cli, core, recording]

tech-stack:
  added: []
  patterns:
    - "Single shared output naming helper (resolveOutputPath)"

key-files:
  created:
    - packages/core/src/utils/output-path.ts
    - packages/core/src/__tests__/output-path.test.ts
  modified:
    - packages/core/src/index.ts
    - packages/cli/src/commands/record.ts
    - packages/core/src/watch.ts
    - packages/cli/src/commands/composite.ts
    - packages/core/src/recorder.ts
    - pnpm-workspace.yaml
    - pnpm-lock.yaml

key-decisions:
  - "Whitelist node-pty in pnpm onlyBuiltDependencies so local smoke recording can run"

patterns-established:
  - "Normalize output path any time a format is selected (CLI + core defense-in-depth)"

duration: 19min
completed: 2026-03-04
---

# Phase 17 Plan 01: Fix Multi-Format Record Outputs Summary

**Multi-format recording now produces format-consistent filenames via a shared core output-path normalization helper.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-03-04T15:58:37Z
- **Completed:** 2026-03-04T16:18:06Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added `resolveOutputPath(outputPath, format)` to core and exported it from `@tuireel/core`
- Wired output normalization into CLI record + core watch record flow
- Removed duplicated composite output naming logic and normalized output inside core recorder (defense-in-depth)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add shared output-path normalization helper (with unit tests)** - `992c567` (feat)
2. **Task 2: Normalize output paths in CLI record and core watch record flow** - `d465cbb` (fix)
3. **Task 3: Deduplicate composite output naming and add core recorder normalization defense** - `dbba67f` (fix)

**Plan metadata:** (see final docs commit)

## Files Created/Modified

- `packages/core/src/utils/output-path.ts` - shared `resolveOutputPath()` helper
- `packages/core/src/__tests__/output-path.test.ts` - vitest coverage for normalization contract
- `packages/core/src/index.ts` - exports `resolveOutputPath` for CLI usage
- `packages/cli/src/commands/record.ts` - normalizes output path when a format is selected
- `packages/core/src/watch.ts` - applies the same normalization in watch record mode
- `packages/cli/src/commands/composite.ts` - uses core helper instead of duplicated logic
- `packages/core/src/recorder.ts` - normalizes output path before naming/logging/compose calls
- `pnpm-workspace.yaml` - allows `node-pty` build scripts so record smoke runs work
- `pnpm-lock.yaml` - lockfile update for workspace config change

## Decisions Made

- Whitelisted `node-pty` in pnpm `onlyBuiltDependencies` so native bindings are built during installs (required to run `record` locally in verification).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Allow node-pty native builds for record smoke verification**

- **Found during:** Task 2 (smoke verification)
- **Issue:** `record` failed at runtime because `node-pty` native bindings were not built under pnpm `onlyBuiltDependencies`.
- **Fix:** Added `node-pty` to `pnpm-workspace.yaml` `onlyBuiltDependencies` and updated the lockfile.
- **Files modified:** `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- **Verification:** `node packages/cli/dist/index.js record ... --format webm` produces `smoke-output.webm`
- **Committed in:** `d465cbb`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for verification and basic local recording; no scope creep.

## Issues Encountered

- Local workspace dependency linking required a reinstall to ensure `@tuireel/core` resolution reflected the updated core export during smoke verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Multi-format smoke runs now generate distinct `smoke-output.mp4|webm|gif` outputs from a single fixture output path.

## Self-Check: PASSED
