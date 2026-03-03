---
phase: 06-workflow-polish
plan: 01
subsystem: core
tags: [steps, tuistory, zod, json-schema, executor]

# Dependency graph
requires:
  - phase: 02-core-pipeline
    provides: base step executor architecture for launch/type/press/wait/pause
  - phase: 01-foundation
    provides: config validation and JSON schema generation contracts
provides:
  - Five advanced step contracts and handlers (scroll, click, screenshot, resize, set-env)
  - Executor dispatch coverage for all ten supported step types
  - JSON schema conformance checks for the added step variants
affects: [06-02, 06-03, step-authoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Discriminated step handlers consume Extract<TuireelStep, {type: ...}> payloads
    - Executor idle waits are conditional on step side-effects

key-files:
  created:
    - packages/core/src/executor/steps/scroll.ts
    - packages/core/src/executor/steps/click.ts
    - packages/core/src/executor/steps/screenshot.ts
    - packages/core/src/executor/steps/resize.ts
    - packages/core/src/executor/steps/set-env.ts
  modified:
    - packages/core/src/config/schema.ts
    - packages/core/src/executor/step-executor.ts
    - packages/core/src/session.ts
    - packages/core/src/recorder.ts
    - packages/core/test/config.test.ts

key-decisions:
  - "Expose TuireelSession mouse helpers (scroll and clickText) instead of calling tuistory internals in step handlers"
  - "Skip global idle wait after screenshot and set-env while keeping idle waits for interactive state-changing steps"

patterns-established:
  - "Advanced steps follow one-file-per-step handler modules under executor/steps"
  - "Schema additions require JSON schema assertions in config test coverage"

# Metrics
duration: 8 min
completed: 2026-03-03
---

# Phase 6 Plan 1: Advanced Step Types Summary

**Added scroll, click, screenshot, resize, and set-env step contracts with executor dispatch and JSON schema coverage for the full advanced step set.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-03T03:46:01Z
- **Completed:** 2026-03-03T03:54:19Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added five new discriminated step schemas and exported step type support in config contracts.
- Implemented five new step handlers, including PNG screenshot persistence and resize/env updates.
- Wired executor dispatch for all new step types and validated generated JSON schema variants via test coverage.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 5 advanced step type schemas and handlers** - `b277914` (feat)
2. **Task 2: Wire new steps into executor dispatch** - `61a6495` (feat)

## Files Created/Modified
- `packages/core/src/config/schema.ts` - Adds five new step schemas and extends the step union/type list.
- `packages/core/src/executor/step-executor.ts` - Dispatches new steps and applies conditional idle waits.
- `packages/core/src/executor/steps/scroll.ts` - Scroll step handler using session mouse scroll helper.
- `packages/core/src/executor/steps/click.ts` - Click step handler using text-targeted click helper.
- `packages/core/src/executor/steps/screenshot.ts` - Screenshot step handler writing PNG buffers to disk.
- `packages/core/src/executor/steps/resize.ts` - Resize step handler changing terminal dimensions.
- `packages/core/src/executor/steps/set-env.ts` - Set-env step handler mutating session env for later steps.
- `packages/core/src/session.ts` - Adds env state plus scroll/click helper methods required by new handlers.
- `packages/core/src/recorder.ts` - Extends cursor offset map for new step type variants.
- `packages/core/test/config.test.ts` - Asserts generated JSON schema includes all advanced step variants.

## Decisions Made
- Used `TuireelSession` wrapper methods (`scroll`, `clickText`) so handlers remain decoupled from raw tuistory session internals.
- Resolved screenshot output paths to absolute paths and created parent directories before writing PNG buffers.
- Kept global idle waits disabled for `screenshot` and `set-env` to avoid unnecessary per-step settling when no terminal redraw is expected.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added TuireelSession helpers required by new handlers**
- **Found during:** Task 1 (Add 5 advanced step type schemas and handlers)
- **Issue:** Existing `TuireelSession` wrapper did not expose scroll/click APIs or mutable env state needed by the new step handlers.
- **Fix:** Added `env`, `scroll`, and `clickText` methods to `TuireelSession` and threaded initial env through `createSession()`.
- **Files modified:** `packages/core/src/session.ts`
- **Verification:** `pnpm --filter @tuireel/core exec tsc --noEmit`
- **Committed in:** `b277914` (Task 1)

**2. [Rule 3 - Blocking] Updated cursor offset map for expanded step union**
- **Found during:** Task 1 (Add 5 advanced step type schemas and handlers)
- **Issue:** Expanding `TuireelStep` caused `STEP_TYPE_CURSOR_OFFSET` to fail type-checking because new step keys were missing.
- **Fix:** Added offset entries for `scroll`, `click`, `screenshot`, `resize`, and `set-env`.
- **Files modified:** `packages/core/src/recorder.ts`
- **Verification:** `pnpm --filter @tuireel/core exec tsc --noEmit`
- **Committed in:** `b277914` (Task 1)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to keep the new schema/handler contracts type-safe and executable; no scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan `06-02-PLAN.md` can now build preview mode on top of the expanded step vocabulary.
- No blockers carried forward.

---
*Phase: 06-workflow-polish*
*Completed: 2026-03-03*

## Self-Check: PASSED
- FOUND: `.planning/phases/06-workflow-polish/06-01-SUMMARY.md`
- FOUND: `.planning/STATE.md`
- FOUND commit: `b277914`
- FOUND commit: `61a6495`
