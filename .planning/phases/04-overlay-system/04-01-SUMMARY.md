---
phase: 04-overlay-system
plan: 01
subsystem: overlay
tags: [timeline, serialization, tdd, vitest, overlay-system]

# Dependency graph
requires:
  - phase: 03-output-quality
    provides: themed frame capture pipeline and fps-driven recording loop
provides:
  - InteractionTimeline contract with tick recording, cursor path, HUD state, and sound event timing
  - JSON roundtrip + disk persistence APIs for record/composite pass handoff
  - Keyframe-only storage with expanded per-frame interpolation API
affects: [04-02, 04-03, 04-04, composite-pass]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Keyframe timeline persistence with frameCount + interpolation expansion
    - RED/GREEN TDD cycle for data-contract-first implementation

key-files:
  created:
    - packages/core/src/timeline/types.ts
    - packages/core/src/timeline/interaction-timeline.ts
    - packages/core/src/timeline/__tests__/interaction-timeline.test.ts
  modified:
    - packages/core/src/index.ts
    - packages/core/vitest.config.ts

key-decisions:
  - "Serialize keyframes plus frameCount, and expose full frame playback via getFrames() interpolation."
  - "Keep save/load synchronous (writeFileSync/readFileSync) to match timeline contract simplicity and webreel parity."
  - "Extend Vitest include globs so src/**/__tests__ timeline specs run in standard package test command."

patterns-established:
  - "Timeline contract first: tests define roundtrip and persistence guarantees before implementation."
  - "State-change compression: only changed frame states are persisted; render-time expansion reconstructs full sequence."

# Metrics
duration: 7 min
completed: 2026-03-03
---

# Phase 4 Plan 1: InteractionTimeline Summary

**InteractionTimeline now records cursor/HUD/event state with tick-based keyframes, and round-trips losslessly through JSON and file persistence for composite-pass reuse.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-03T01:34:12Z
- **Completed:** 2026-03-03T01:41:42Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 5

## Accomplishments

- Added timeline type contract (`TimelineData`, `FrameData`, `CursorState`, `HudState`, `SoundEvent`) in `packages/core/src/timeline/types.ts`.
- Implemented `InteractionTimeline` with `tick`, `setCursorPath`, `showHud`, `hideHud`, `addEvent`, `toJSON/load`, `save/fromFile`, and frame interpolation in `packages/core/src/timeline/interaction-timeline.ts`.
- Added end-to-end TDD coverage for frame recording, cursor movement, HUD transitions, sound event timing, JSON roundtrip, and disk persistence in `packages/core/src/timeline/__tests__/interaction-timeline.test.ts`.
- Re-exported timeline API from `@tuireel/core` root in `packages/core/src/index.ts`.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED - failing interaction timeline tests** - `2ac18e5` (test)
2. **Task 2: GREEN - timeline implementation + exports** - `d40fe5c` (feat)

_Note: No separate REFACTOR commit was required because GREEN landed in a clean state after verification._

## Files Created/Modified

- `packages/core/src/timeline/types.ts` - Timeline contract interfaces for record/composite handoff.
- `packages/core/src/timeline/interaction-timeline.ts` - Timeline implementation, keyframe storage, interpolation, JSON/file IO.
- `packages/core/src/timeline/__tests__/interaction-timeline.test.ts` - TDD behavior suite covering required plan cases.
- `packages/core/src/index.ts` - Public API re-export for timeline class and types.
- `packages/core/vitest.config.ts` - Include `src/**/__tests__/**/*.test.ts` so timeline tests run by default.

## Decisions Made

- Serialize keyframes plus `frameCount`, then reconstruct full per-frame output through `getFrames()` interpolation for downstream consumers.
- Use synchronous file persistence (`save`/`fromFile`) because timeline export/import is deterministic and called at phase boundaries.
- Keep timeline events frame-accurate by timestamping with current `frameCount` and `fps` when `addEvent()` is called.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Expanded Vitest include globs for src timeline tests**
- **Found during:** Task 1 (RED test execution)
- **Issue:** Package test config only matched `test/**/*.test.ts`, so the required `src/timeline/__tests__` file would not run in normal test commands.
- **Fix:** Updated `packages/core/vitest.config.ts` include list to also match `src/**/__tests__/**/*.test.ts`.
- **Files modified:** `packages/core/vitest.config.ts`
- **Verification:** `pnpm -C packages/core test` executes `src/timeline/__tests__/interaction-timeline.test.ts`.
- **Committed in:** `2ac18e5`

**2. [Rule 1 - Bug] Fixed DTS strictness edge case in keyframe expansion**
- **Found during:** Task 2 (GREEN verification)
- **Issue:** `tsup` DTS build flagged possible `undefined` keyframe access in `getFrames()`.
- **Fix:** Added explicit first-keyframe guard before interpolation loop.
- **Files modified:** `packages/core/src/timeline/interaction-timeline.ts`
- **Verification:** `pnpm -C packages/core build` succeeds with DTS output.
- **Committed in:** `d40fe5c`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were required for correctness and verification integrity. No scope creep.

## Issues Encountered

- DTS generation initially failed on strict undefined analysis in interpolation logic, resolved within Task 2 before final commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Timeline contract is in place and exported for cursor/HUD renderers in 04-02 and 04-03.
- Composite pass (04-04) can consume persisted timeline JSON via `InteractionTimeline.fromFile()`.
- No blockers carried forward.

---
*Phase: 04-overlay-system*
*Completed: 2026-03-03*

## Self-Check: PASSED

- Verified files exist: `packages/core/src/timeline/types.ts`, `packages/core/src/timeline/interaction-timeline.ts`, `packages/core/src/timeline/__tests__/interaction-timeline.test.ts`, `.planning/phases/04-overlay-system/04-01-SUMMARY.md`.
- Verified commits exist: `2ac18e5`, `d40fe5c`.
