---
phase: quick-008-fix-ci-test-timeout-in-run-22739610221
plan: 008
subsystem: testing
tags: [ci, vitest, timeout, ffmpeg, compositor]

requires: []
provides:
  - Scoped a per-test timeout override for the ffmpeg-backed compositor integration test to tolerate first-run download and extract latency
  - Verified @tuireel/core and root workspace test gates pass after the timeout adjustment
affects: [ci, @tuireel/core, compositor]

tech-stack:
  added: []
  patterns:
    - Use per-test Vitest timeout overrides for slow integration tests instead of broad global timeout changes

key-files:
  created: []
  modified:
    - packages/core/src/__tests__/compositor.test.ts

key-decisions:
  - "Use a 120000ms timeout only on the compositor ffmpeg integration test so default test strictness remains intact"
  - "Keep ffmpeg download/extract integration behavior unchanged and avoid modifying packages/core/vitest.config.ts"

patterns-established:
  - "Slow first-run binary setup paths should be handled via scoped test-level timeouts when integration behavior must stay real"

duration: 2m19s
completed: 2026-03-05
---

# Phase quick-008-fix-ci-test-timeout-in-run-22739610221 Plan 008 Summary

**The CI timeout blocker from run `22739610221` is resolved by applying a 120000ms timeout only to the ffmpeg-backed compositor integration test while preserving real download/extract validation.**

## Performance

- **Duration:** 2m19s
- **Started:** 2026-03-05T23:20:40Z
- **Completed:** 2026-03-05T23:22:59Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added a scoped timeout override on `creates a playable output from raw video and timeline data` in `packages/core/src/__tests__/compositor.test.ts`
- Confirmed `pnpm --filter @tuireel/core test` passes with the compositor integration test still running end-to-end with `ensureFfmpeg()`
- Confirmed root `pnpm test` passes, matching CI gate expectations for workspace-level execution

## Task Commits

Each task was committed atomically:

1. **Task 1: Add a scoped timeout for the ffmpeg-backed compositor integration test** - `eab1010` (fix)
2. **Task 2: Validate workspace-level test gate matches CI expectation** - `864d156` (chore)

**Plan metadata:** committed under `docs(quick-008): ...` (see git history)

## Files Created/Modified

- `packages/core/src/__tests__/compositor.test.ts` - Added a per-test timeout override (`120_000`) to the ffmpeg-backed compositor integration case only

## Decisions Made

- Keep timeout scope strictly at the single slow integration test instead of changing global Vitest timeout defaults

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CI-equivalent test gate for this timeout failure path is green at both package and workspace scope
- No blocker carried forward for the compositor ffmpeg timeout regression in run `22739610221`

## Self-Check: PASSED

- Summary file present: `.planning/quick/008-fix-ci-test-timeout-in-run-22739610221/008-SUMMARY.md`
- Key file present: `packages/core/src/__tests__/compositor.test.ts`
- Task commits present: `eab1010`, `864d156`
