---
phase: 04-overlay-system
plan: 02
subsystem: overlay
tags: [cursor, bezier, sharp, overlay-system, motion]

# Dependency graph
requires:
  - phase: 04-01
    provides: InteractionTimeline frame and cursor state contract for overlay planning
provides:
  - Bezier-based cursor motion planning with asymmetric easing, control-point shaping, and micro-jitter
  - Sharp-backed cursor SVG renderer producing compositable PNG buffers with alpha channel
affects: [04-03, 04-04, cursor-overlay, compositor]

# Tech tracking
tech-stack:
  added: [sharp]
  patterns:
    - Asymmetric 40 percent inflection easing over quadratic Bezier cursor paths
    - SVG-first cursor asset rendering converted to PNG buffers via Sharp

key-files:
  created:
    - packages/core/src/overlay/bezier.ts
    - packages/core/src/overlay/cursor-renderer.ts
    - packages/core/src/overlay/__tests__/bezier.test.ts
  modified:
    - packages/core/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Keep easing, Bezier control, and jitter helpers internal, exporting only computeCursorPath and moveDuration."
  - "Use jitter only for movements above 60px and enforce destination exactness on the final point."
  - "Embed drop shadow in default cursor SVG and let Sharp handle only SVG-to-PNG rasterization."

patterns-established:
  - "Motion planning is pure and testable before compositor integration."
  - "Cursor visuals are generated as reusable PNG buffers with explicit dimensions."

# Metrics
duration: 6 min
completed: 2026-03-03
---

# Phase 4 Plan 2: Cursor Overlay Motion Summary

**Cursor overlay now has deterministic Bezier path planning with human-like easing plus a Sharp-based SVG renderer that outputs compositable PNG cursor buffers.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-03T01:45:02Z
- **Completed:** 2026-03-03T01:51:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Implemented `computeCursorPath()` with Fitts-style distance timing, asymmetric easing, quadratic Bezier control shaping, and distance-gated micro-jitter in `packages/core/src/overlay/bezier.ts`.
- Added focused motion tests in `packages/core/src/overlay/__tests__/bezier.test.ts` covering endpoint exactness, minimum path steps, distance-to-step scaling, easing inflection behavior, and duration growth.
- Implemented `renderCursor()` in `packages/core/src/overlay/cursor-renderer.ts` to rasterize configurable/default SVG cursors into alpha PNG buffers with returned dimensions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Bezier path computation with easing and jitter** - `48fd250` (feat)
2. **Task 2: Sharp cursor image renderer** - `71efeed` (feat)

## Files Created/Modified

- `packages/core/src/overlay/bezier.ts` - Cursor motion math, timing, easing, and path generation.
- `packages/core/src/overlay/__tests__/bezier.test.ts` - Behavioral coverage for path and duration properties.
- `packages/core/src/overlay/cursor-renderer.ts` - SVG cursor rendering to PNG via Sharp.
- `packages/core/package.json` - Added `sharp` runtime dependency.
- `pnpm-lock.yaml` - Lockfile update for Sharp and transitive artifacts.

## Decisions Made

- Follow webreel's cursor-motion shape while adapting duration randomness to `+ random * 30` for this plan.
- Keep helper functions unexported to preserve a minimal public API for upcoming compositor integration.
- Use a default white circle cursor with black stroke and SVG drop shadow so visual style remains customizable through `svg` overrides.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing Sharp dependency required by renderer**
- **Found during:** Task 2 (Sharp cursor image renderer)
- **Issue:** `renderCursor()` required `sharp`, but `@tuireel/core` had no `sharp` dependency declared.
- **Fix:** Added `sharp` to `packages/core/package.json` and refreshed `pnpm-lock.yaml`.
- **Files modified:** `packages/core/package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm -C packages/core build` succeeds and `bun -e 'import { renderCursor } ...'` returns PNG signature `89504e470d0a1a0a` with non-zero bytes.
- **Committed in:** `71efeed`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Dependency addition was required for correctness. No scope creep.

## Issues Encountered

- Plan verification command `pnpm test -- bezier` did not run from repo root because root `package.json` has no `test` script. Verification used `pnpm -C packages/core test -- bezier` to target the package directly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Cursor motion planner and renderer are ready for integration with HUD and compositor work in 04-03/04-04.
- No blockers carried forward.

---
*Phase: 04-overlay-system*
*Completed: 2026-03-03*

## Self-Check: PASSED

- Verified files exist: `packages/core/src/overlay/bezier.ts`, `packages/core/src/overlay/cursor-renderer.ts`, `packages/core/src/overlay/__tests__/bezier.test.ts`, `.planning/phases/04-overlay-system/04-02-SUMMARY.md`.
- Verified commits exist: `48fd250`, `71efeed`.
