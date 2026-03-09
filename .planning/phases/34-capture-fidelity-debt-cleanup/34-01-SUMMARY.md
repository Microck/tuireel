---
phase: 34-capture-fidelity-debt-cleanup
plan: 01
subsystem: testing
tags: [capture-fidelity, recorder, vitest, diagnostics, cap-02]
requires:
  - phase: 28-capture-fidelity-and-final-motion
    provides: initial runtime capture hooks for type, press, scroll, and wait
  - phase: 33-combined-acceptance-stability-gate
    provides: stable milestone verification context for post-audit cleanup
provides:
  - artifact-backed CAP-02 runtime proof at sparse capture cadence
  - removal of stale recorder helper surface that runtime code no longer used
  - stronger recorder regression coverage for typed bursts and visible post-step transitions
affects: [phase-35, diagnostics, recorder, testing]
tech-stack:
  added: []
  patterns:
    - low-cadence recorder tests should assert against real artifacts, not helper tables
    - capture-fidelity assertions should prefer baseline comparisons over brittle exact frame totals
key-files:
  created:
    - packages/core/test/capture-fidelity-runtime.test.ts
  modified:
    - packages/core/src/recorder.ts
key-decisions:
  - "Keep CAP-02 proof at the real record() boundary with captureFps set to 1 so missing captureNow hooks become observable."
  - "Use paired baseline fixtures for type, press/wait, and scroll assertions instead of exact frame counts."
  - "Remove shouldCaptureTypedCharacter from recorder.ts because runtime no longer depends on a helper-level capture policy surface."
patterns-established:
  - "Recorder debt cleanup should prove behavior through saved timeline and raw-video artifacts."
  - "When sparse-cadence recorder tests are noisy, compare against a same-fixture baseline instead of pinning exact counts."
requirements-completed: [CAP-02]
duration: 22 min
completed: 2026-03-09
---

# Phase 34 Plan 01: Capture Fidelity Debt Cleanup Summary

**Low-cadence recorder runs now prove CAP-02 through real artifacts, and the stale helper-only capture surface is gone from `packages/core/src/recorder.ts`.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-03-09T17:21:57Z
- **Completed:** 2026-03-09T17:44:21Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `packages/core/test/capture-fidelity-runtime.test.ts` to prove typed bursts, press/wait transitions, and scroll transitions through real `record()` artifacts at `captureFps: 1`.
- Replaced brittle exact-count expectations with paired baseline fixtures so the new proof stays sensitive to missing runtime hooks without depending on incidental polling noise.
- Removed `shouldCaptureTypedCharacter()` from `packages/core/src/recorder.ts`, leaving the recorder surface aligned with the actual runtime capture path.
- Removed the old helper-focused proof surface from `packages/core/src/__tests__/capture-fidelity.test.ts` in the working tree so CAP-02 no longer points at tautological helper coverage.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Replace helper-level capture checks with artifact-backed runtime proof** - `a260ba7` (test)
2. **Task 1 (GREEN): Replace helper-level capture checks with artifact-backed runtime proof** - `16823cb` (feat)
3. **Task 2: Remove the dead recorder helper surface and keep CAP-02 wired through runtime hooks** - `36f61de` (fix)

**Plan metadata:** Pending separate docs commit after state updates.

## Files Created/Modified

- `packages/core/test/capture-fidelity-runtime.test.ts` - real recorder-path CAP-02 regression proof using temp configs, saved timelines, and raw-video artifacts.
- `packages/core/src/recorder.ts` - stale helper export removed while runtime capture hooks stay on the recorder path exercised by the new tests.

## Decisions Made

- Kept the new proof at the runtime artifact boundary instead of replacing one helper-level unit test with another.
- Used `captureFps: 1` plus same-shape baseline fixtures so missing `captureNow()` hooks become visible without exact-frame brittleness.
- Treated the full-suite `SIGKILL` under the default package script as an environment-specific verification issue and re-ran Vitest serially for reliable suite evidence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched full-suite verification to serial Vitest execution**

- **Found during:** Task 2 verification
- **Issue:** `pnpm --filter @tuireel/core test` was killed with exit 137 in this environment before suite completion.
- **Fix:** Re-ran the same suite with `pnpm --filter @tuireel/core exec vitest run --maxWorkers=1 --no-file-parallelism` to complete verification reliably.
- **Files modified:** None
- **Verification:** `pnpm --filter @tuireel/core exec vitest run test/capture-fidelity-runtime.test.ts && pnpm --filter @tuireel/core exec vitest run --maxWorkers=1 --no-file-parallelism`
- **Committed in:** `36f61de` (verification-only deviation, no code changes)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Verification stayed within scope and produced full green evidence without widening the implementation.

## Issues Encountered

- The first RED assertions for the new runtime test were too absolute because real recorder artifacts vary slightly across runs; baseline-relative assertions produced a stronger and more stable proof.
- A single scroll step was still borderline at sparse cadence, so the final scroll proof uses a baseline comparison plus two opposing scroll steps to make the post-step capture delta reliable.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 35 can rely on CAP-02 being proven by runtime artifacts instead of a stale helper abstraction.
- Recorder capture-fidelity debt is closed for Phase 28's post-audit findings; remaining follow-up work can stay focused on acceptance automation and Nyquist backfill.

## Self-Check: PASSED

- Verified `.planning/phases/34-capture-fidelity-debt-cleanup/34-01-SUMMARY.md` exists.
- Verified commits `a260ba7`, `16823cb`, and `36f61de` exist in git history.

---

_Phase: 34-capture-fidelity-debt-cleanup_
_Completed: 2026-03-09_
