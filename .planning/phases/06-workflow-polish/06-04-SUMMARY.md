---
phase: 06-workflow-polish
plan: 04
subsystem: workflow
tags: [watch-mode, chokidar, cli, recording]

# Dependency graph
requires:
  - phase: 06-workflow-polish
    provides: "Multi-video record flow and config include resolution from 06-03"
provides:
  - "Chokidar-based watch loop with debounced re-record cycles"
  - "`tuireel record --watch` / `-w` CLI entrypoint"
  - "Concurrent re-record guard plus non-fatal re-record error handling"
affects: ["06-05 packaging", "record command UX", "authoring iteration loop"]

# Tech tracking
tech-stack:
  added: [chokidar]
  patterns: ["debounced file-change rerun", "watch-mode command branching"]

key-files:
  created:
    - packages/core/src/utils/debounce.ts
    - packages/core/src/watch.ts
  modified:
    - packages/core/package.json
    - pnpm-lock.yaml
    - packages/cli/src/commands/record.ts
    - packages/core/src/index.ts

key-decisions:
  - "Watch mode reuses loadConfig() + record() cycle so single-video and multi-video inputs follow the same recording path."
  - "Watch mode applies the same format override and relative sound track resolution used by normal record command runs."

patterns-established:
  - "Watch engine: initial record, then chokidar change listener with 500ms debounce."
  - "Concurrency guard: skip change-triggered run while an active recording is still in progress."

# Metrics
duration: 5 min
completed: 2026-03-03
---

# Phase 6 Plan 4: Watch mode Summary

**Chokidar-backed watch mode now re-runs recordings on config edits through `tuireel record --watch`, with debounce and in-progress protection.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03T04:27:38Z
- **Completed:** 2026-03-03T04:33:21Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added core watch engine (`watchAndRecord`) with chokidar file watching and 500ms debounced change handling.
- Added reusable debounce utility used by watch mode event handling.
- Added `--watch` / `-w` to `tuireel record` and routed watch-mode execution through the new core API.
- Preserved existing one-shot record behavior when `--watch` is not provided.

## Task Commits

Each task was committed atomically:

1. **Task 1: Watch mode engine with chokidar** - `5e76dbd` (feat)
2. **Task 2: Wire --watch flag into record CLI command** - `11122bc` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified
- `packages/core/src/utils/debounce.ts` - generic debounce helper used by watcher callbacks.
- `packages/core/src/watch.ts` - watch-mode runtime with initial record, debounced re-record, and graceful SIGINT close.
- `packages/core/package.json` - added `chokidar` runtime dependency.
- `pnpm-lock.yaml` - lockfile update for chokidar/readdirp dependency graph.
- `packages/cli/src/commands/record.ts` - added `--watch` option and watch command branch.
- `packages/core/src/index.ts` - exported `watchAndRecord` from core public API.

## Decisions Made
- Kept watch mode inside core (`watchAndRecord`) so CLI remains a thin command router and programmatic consumers can reuse the same behavior.
- Reused the existing per-config recording loop in watch cycles, including multi-video logging and per-output completion logs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed strict typing mismatch for chokidar error event handler**
- **Found during:** Task 1 (Watch mode engine with chokidar)
- **Issue:** `watcher.on("error", handler)` expects `unknown`, but handler was typed as `Error`, causing `tsc --noEmit` failure.
- **Fix:** Updated error callback to accept `unknown` and normalize to `Error` before rejecting.
- **Files modified:** `packages/core/src/watch.ts`
- **Verification:** `pnpm --filter @tuireel/core exec tsc --noEmit`
- **Committed in:** `5e76dbd`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary type-safety fix; no scope creep.

## Issues Encountered
- CLI package typecheck initially failed after adding new core export because CLI reads core declaration output; resolved by building core before CLI verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Watch mode requirements for `STEP-06` are implemented and verified via typecheck + CLI help output.
- Ready for `06-05-PLAN.md` (npm/Bun distribution packaging).

---
*Phase: 06-workflow-polish*
*Completed: 2026-03-03*

## Self-Check: PASSED

- Verified key files exist on disk.
- Verified task commits exist in git history.
