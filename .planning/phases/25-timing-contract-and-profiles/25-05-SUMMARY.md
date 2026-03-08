---
phase: 25-timing-contract-and-profiles
plan: 05
subsystem: testing
tags: [timing-contract, compositor, vitest, ffmpeg]
requires:
  - phase: 25-04
    provides: CLI timing gate and persisted timingContract enforcement
provides:
  - core compose-path coverage for packaging-only recomposition against saved timing artifacts
  - helper coverage for output-fps and capture-fps timing drift
  - explicit legacy fallback assertions for allow-packaging-only guidance
affects: [phase-26, verification, recomposite]
tech-stack:
  added: []
  patterns:
    - saved timing-artifact fixtures anchor recomposite tests at the core compose boundary
    - timing compatibility stays conservative for legacy timelines while packaging-only fields remain allowed
key-files:
  created: []
  modified:
    - packages/core/src/__tests__/compositor.test.ts
    - packages/core/test/timing-contract.test.ts
key-decisions:
  - "Use saved timingContract-backed fixtures in compositor tests so packaging-only recomposition is proven outside the CLI path."
  - "Lock the legacy helper message and allow-packaging-only fallback semantics in core tests while treating captureFps drift as a timing mismatch."
patterns-established:
  - "Core compose evidence: saved artifact fixtures validate packaging-only recomposition without moving timing enforcement into compose()."
  - "Shared timing helper evidence: output cadence drift, capture cadence drift, and legacy fallback guidance are asserted in one core suite."
requirements-completed: [CAP-04]
duration: 4 min
completed: 2026-03-08
---

# Phase 25 Plan 05: Core Timing Verification Gap Summary

**Core tests now prove packaging-only saved-artifact recomposition at `compose()` and lock the shared timing helper's capture-drift plus legacy fallback semantics.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T18:39:50Z
- **Completed:** 2026-03-08T18:43:21Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added saved-artifact compositor coverage that exercises packaging-only sizing, background, trim, and overlay-visibility changes against a realistic `timingContract` fixture.
- Extended the shared timing-contract suite so `captureFps` drift fails the same way as output-fps drift.
- Locked the exact legacy fallback guidance authors rely on when older timelines do not carry `timingContract` metadata.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add core compose-path coverage for packaging-only recomposition** - `fe6c36b` (test)
2. **Task 2: Strengthen core timing mismatch and legacy fallback assertions** - `34711ed` (test)

## Files Created/Modified

- `packages/core/src/__tests__/compositor.test.ts` - Adds saved-artifact ffmpeg coverage for packaging-only recomposition at the core compose boundary.
- `packages/core/test/timing-contract.test.ts` - Adds capture cadence mismatch coverage and exact legacy fallback assertions for the shared timing helper.

## Decisions Made

- Use saved timing-contract fixtures directly in core compositor tests instead of relying only on CLI-path evidence.
- Assert the legacy helper's exact allow-packaging-only message so later CLI and diagnostics flows keep one conservative fallback contract.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- A duration-based trim assertion was unstable for the saved-artifact compositor case, so the coverage stayed focused on playable packaging-only recomposition there while the dedicated trim-specific compose test continues to validate trimming behavior separately.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 25 now has both CLI-path and core compose-path evidence for saved timing preservation.
- Ready to move into Phase 26 with the timing contract enforced and regression-tested at the shared helper plus artifact boundary.

## Self-Check: PASSED

---

_Phase: 25-timing-contract-and-profiles_
_Completed: 2026-03-08_
