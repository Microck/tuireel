---
phase: 04-overlay-system
plan: 05
subsystem: overlay
tags: [cursor, jitter, overlay-types, compositor, regression-tests]

# Dependency graph
requires:
  - phase: 04-02
    provides: Cursor Bezier movement model and initial jitter implementation
  - phase: 04-03
    provides: Shared overlay contract module and defaults
  - phase: 04-04
    provides: Compositor cursor/HUD overlay integration paths
provides:
  - Distance-scaled cursor jitter envelope that reaches visible 1-2px amplitude on long moves
  - Regression coverage for jitter magnitude and endpoint decay behavior
  - Shared cursor renderer contracts consumed by renderer and compositor typing
affects: [05-sound, 06-workflow-polish, compositor, overlay-quality]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Deterministic horizontal-path baseline math for statistically validating jitter behavior without mocks
    - Shared overlay type contracts consumed across renderer/compositor to avoid local type drift

key-files:
  created:
    - packages/core/src/overlay/__tests__/cursor-renderer.test.ts
  modified:
    - packages/core/src/overlay/bezier.ts
    - packages/core/src/overlay/__tests__/bezier.test.ts
    - packages/core/src/overlay/types.ts
    - packages/core/src/overlay/cursor-renderer.ts
    - packages/core/src/compositor.ts

key-decisions:
  - "Scale jitter using a distance ramp plus long-move boost so long travel peaks in a visible 1-2px band while retaining endpoint fade."
  - "Define shared CursorImage contract in overlay/types and remove cursor-renderer-local contract declarations."

patterns-established:
  - "Overlay renderer typing should originate from overlay/types.ts, not per-file interfaces."
  - "Motion realism regressions should be protected with geometry-based statistical tests instead of brittle fixture values."

# Metrics
duration: 5 min
completed: 2026-03-03
---

# Phase 4 Plan 5: Overlay Gap Closure Summary

**Cursor motion now hits the planned long-move jitter visibility target and the cursor renderer/compositor path shares a single overlay contract layer with regression coverage.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03T02:41:08Z
- **Completed:** 2026-03-03T02:46:51Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Updated cursor micro-jitter in `packages/core/src/overlay/bezier.ts` with a distance-aware ramp and long-move boost so long travel reaches a visible 1-2px envelope while retaining bell-curve endpoint decay.
- Added regression tests in `packages/core/src/overlay/__tests__/bezier.test.ts` that fail when long-move jitter drops below target or endpoint decay behavior regresses.
- Refactored cursor renderer contracts into shared overlay types and added dedicated renderer tests, keeping compositor typing aligned without runtime behavior changes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Raise cursor micro-jitter to the planned 1-2px envelope** - `bc64f4c` (fix)
2. **Task 2: Add jitter regression tests for magnitude bounds and endpoint decay** - `8ca4fed` (test)
3. **Task 3: Adopt shared overlay contracts in cursor renderer and keep compositor wiring green** - `2031fce` (refactor)

## Files Created/Modified

- `packages/core/src/overlay/bezier.ts` - Replaced low jitter cap with distance-ramped 1-2px long-move envelope.
- `packages/core/src/overlay/__tests__/bezier.test.ts` - Added long-move magnitude and endpoint decay regression coverage.
- `packages/core/src/overlay/types.ts` - Added shared `CursorImage` contract for cursor renderer outputs.
- `packages/core/src/overlay/cursor-renderer.ts` - Switched to shared `CursorConfig` and `CursorImage` contracts.
- `packages/core/src/compositor.ts` - Reused shared cursor image contract in compositor cache typing.
- `packages/core/src/overlay/__tests__/cursor-renderer.test.ts` - Added contract-level renderer tests for PNG output and default/custom sizing.

## Decisions Made

- Use a two-stage jitter envelope (`distance ramp` + `long-move boost`) to keep medium moves subtle while allowing long moves to reach visible amplitude.
- Validate jitter against a deterministic horizontal-path x-baseline so Bezier control-point randomness does not mask jitter regressions.
- Consolidate cursor renderer output typing in `overlay/types.ts` and consume it in compositor to prevent contract drift.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 gap closures are complete; OVR-01 jitter target and shared overlay contract adoption are now covered by code and tests.
- Core verification commands passed: `pnpm --filter @tuireel/core test`, `pnpm --filter @tuireel/core exec tsc --noEmit`, `pnpm build`.
- Ready for `05-01-PLAN.md` (sound effects engine).

---
*Phase: 04-overlay-system*
*Completed: 2026-03-03*

## Self-Check: PASSED

- Verified files exist: `.planning/phases/04-overlay-system/04-05-SUMMARY.md`, `packages/core/src/overlay/__tests__/cursor-renderer.test.ts`.
- Verified commits exist: `bc64f4c`, `8ca4fed`, `2031fce`.
