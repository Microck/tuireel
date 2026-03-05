---
phase: quick-007-fix-failing-github-actions-run-227396102
plan: 007
subsystem: ci
tags: [lint, eslint, core, sound, github-actions]

requires: []
provides:
  - Removed the no-empty lint blocker in core sound asset directory resolution
  - Preserved module-first and cwd fallback candidate order for built-in sound assets
affects: [ci, @tuireel/core, audio]

tech-stack:
  added: []
  patterns:
    - Explicit catch handling for module-relative path probing with intentional fallback continuation

key-files:
  created: []
  modified:
    - packages/core/src/sound.ts

key-decisions:
  - "Keep sound asset resolution silent on module-relative failures and rely on existing fallback candidates"
  - "Use a non-empty catch block with explanatory handling to satisfy eslint no-empty"

patterns-established:
  - "resolveAssetsDirectory keeps candidate precedence: module-relative, then cwd-based fallbacks"

duration: 3m58s
completed: 2026-03-05
---

# Phase quick-007-fix-failing-github-actions-run-227396102 Plan 007 Summary

**The CI lint blocker in `packages/core/src/sound.ts` is removed by making module-relative asset resolution catch handling explicit while preserving existing sound fallback behavior.**

## Performance

- **Duration:** 3m58s
- **Started:** 2026-03-05T22:48:10Z
- **Completed:** 2026-03-05T22:52:08Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Replaced the empty catch in `resolveAssetsDirectory()` with explicit fallback-safe handling in `packages/core/src/sound.ts`
- Verified `pnpm --filter @tuireel/core lint` succeeds with no errors in core
- Verified root `pnpm lint` succeeds (warnings only) and the previous `no-empty` error is gone

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove the empty catch in sound asset resolution without changing behavior** - `37ab3cb` (fix)
2. **Task 2: Validate CI-equivalent lint gate from repo root** - `7fcd950` (chore)

**Plan metadata:** committed under `docs(quick-007): ...` (see git history)

## Files Created/Modified

- `packages/core/src/sound.ts` - Lint-safe, explicit catch handling for module-relative sound asset lookup fallback

## Decisions Made

- Keep silent fallback semantics for module-relative candidate resolution so downstream cwd candidates continue unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Root lint gate is green again for this blocker path
- Existing workspace lint warnings remain unchanged and non-blocking

## Self-Check: PASSED

- Summary file present: `.planning/quick/007-fix-failing-github-actions-run-227396102/007-SUMMARY.md`
- Key file present: `packages/core/src/sound.ts`
- Task commits present: `37ab3cb`, `7fcd950`
