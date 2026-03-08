---
phase: 25-timing-contract-and-profiles
plan: 03
subsystem: core
tags: [timing-contract, timeline, recorder, serialization, vitest]

# Dependency graph
requires:
  - phase: 25-01
    provides: delivery-profile resolution and split output/capture cadence semantics
provides:
  - versioned timing-contract metadata persisted in saved timeline artifacts
  - shared timing compatibility helper with explicit legacy fallback behavior
  - regression coverage for serialized timing facts and compatibility semantics
affects: [25-04, composite, diagnostics, artifact-inspection]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - persist resolved timing facts in the timeline artifact instead of re-deriving them later
    - treat packaging-only recomposite changes as compatible while timing changes require explicit contract checks

key-files:
  created:
    - packages/core/src/timeline/timing-contract.ts
    - packages/core/test/timing-contract.test.ts
  modified:
    - packages/core/src/timeline/types.ts
    - packages/core/src/timeline/interaction-timeline.ts
    - packages/core/src/recorder.ts
    - packages/core/src/index.ts
    - packages/core/src/timeline/__tests__/interaction-timeline.test.ts

key-decisions:
  - "Keep TimelineData.fps as the backward-compatible output cadence alias while adding a versioned timingContract object for explicit inspection."
  - "Compare only timing-affecting fields in the shared compatibility helper and return an explicit legacy fallback when saved artifacts predate timingContract."

patterns-established:
  - "Artifact timing enforcement should consume packages/core/src/timeline/timing-contract.ts instead of inferring from ffprobe or config names."
  - "Legacy timeline behavior must stay explicit at the helper boundary, not as silent guesses in CLI code."

requirements-completed: [CAP-04]

# Metrics
duration: 10 min
completed: 2026-03-08
---

# Phase 25 Plan 03: Timing Contract Persistence Summary

**Saved timeline artifacts now carry a versioned timing contract with output/capture cadence, duration, frame-count facts, and legacy-aware compatibility semantics for later recomposite enforcement.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-08T17:29:16Z
- **Completed:** 2026-03-08T17:39:26Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added RED coverage for timing-contract serialization, compatibility checks, and legacy fallback behavior in `packages/core/test/timing-contract.test.ts` and `packages/core/src/timeline/__tests__/interaction-timeline.test.ts`.
- Added `packages/core/src/timeline/timing-contract.ts` as the shared source of truth for building persisted contracts and assessing compatibility.
- Extended saved timeline JSON to include `timingContract` while keeping `fps` as the backward-compatible output cadence alias.
- Wired `record()` to persist resolved timing facts, including output FPS, capture FPS, duration, raw frame count, output frame count, terminal frame count, and `deliveryProfile`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Lock serialized timing-contract behavior in core tests** - `c05d06b` (test)
2. **Task 2: Persist explicit timingContract metadata in timeline artifacts** - `c3454a1` (feat)

## Files Created/Modified

- `packages/core/test/timing-contract.test.ts` - Defines compatibility and legacy fallback expectations for persisted timing metadata.
- `packages/core/src/timeline/__tests__/interaction-timeline.test.ts` - Verifies saved timeline JSON carries the explicit timing contract through disk round-trips.
- `packages/core/src/timeline/timing-contract.ts` - Defines the versioned timing contract plus the shared compatibility helper.
- `packages/core/src/timeline/types.ts` - Extends `TimelineData` with optional `timingContract` metadata while preserving legacy compatibility.
- `packages/core/src/timeline/interaction-timeline.ts` - Persists and reloads timing contracts alongside serialized timeline data.
- `packages/core/src/recorder.ts` - Saves resolved timing facts into the artifact contract during record.
- `packages/core/src/index.ts` - Re-exports timing-contract helpers and types from core.

## Decisions Made

- Keep the serialized contract versioned from day one so later pacing fields can extend the same artifact boundary without redefining semantics.
- Preserve legacy `.timeline.json` loading by making compatibility resolution explicit in the helper rather than mutating old artifacts on load.
- Ignore packaging-only fields in compatibility assessment so later `composite` enforcement can reject only timing drift.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The repo's `pnpm --filter @tuireel/core test -- timing-contract.test.ts interaction-timeline.test.ts` invocation overmatched into unrelated `src/__tests__/compositor.test.ts` coverage and timed out once. Focused verification passed with `pnpm --filter @tuireel/core exec vitest run test/timing-contract.test.ts src/timeline/__tests__/interaction-timeline.test.ts`, and the follow-up is logged in `.planning/phases/25-timing-contract-and-profiles/deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Core artifacts now expose the timing facts `25-04` needs to enforce recomposite compatibility at the CLI boundary.
- Legacy timelines have an explicit fallback path ready for future composite guidance instead of silent inference.
- Ready for `25-04-PLAN.md`.

---

_Phase: 25-timing-contract-and-profiles_
_Completed: 2026-03-08_

## Self-Check: PASSED

- Verified files exist: `.planning/phases/25-timing-contract-and-profiles/25-03-SUMMARY.md`, `packages/core/src/timeline/timing-contract.ts`, `packages/core/test/timing-contract.test.ts`.
- Verified commits exist: `c05d06b`, `c3454a1`.
