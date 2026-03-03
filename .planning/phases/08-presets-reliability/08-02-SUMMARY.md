---
phase: 08-presets-reliability
plan: 02
subsystem: core
tags: [ffmpeg, signal-handling, error-messages, compositor, reliability]

requires:
  - phase: 02-core-pipeline
    provides: "compositor.ts compose() function and runFfmpeg helper"
provides:
  - "SIGINT/SIGTERM graceful shutdown for standalone compositor usage"
  - "Enhanced ffmpeg error messages with exit code and command string"
affects: [09-docs-examples, 10-ci-release]

tech-stack:
  added: []
  patterns: ["signal handler registration/cleanup in try/finally", "error cause chaining"]

key-files:
  created: []
  modified: ["packages/core/src/compositor.ts"]

key-decisions:
  - "process.once (not process.on) to avoid double-handler issues with recorder"
  - "Check interrupted flag every 100 frames to avoid per-frame overhead"
  - "Remove partial output file on interruption for clean user experience"
  - "Drop error.message from ffmpeg errors — stderr is more informative"
  - "Preserve original error as cause for debugging chain"

patterns-established:
  - "Signal cleanup pattern: register in function scope, cleanup in finally block"
  - "Error cause chaining: throw new Error(msg, { cause: error })"

duration: 2min
completed: 2026-03-03
---

# Phase 8 Plan 2: Compositor Signal Handling & Error Messages Summary

**SIGINT/SIGTERM graceful shutdown for standalone compositor with enhanced ffmpeg error diagnostics (exit code + command string + cause chain)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T21:45:32Z
- **Completed:** 2026-03-03T21:47:35Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- compose() now handles SIGINT/SIGTERM for standalone `tuireel composite` usage
- Interrupted compositing cleans up signal handlers, partial output, and temp directory
- ffmpeg errors include exit code, full command string, and stderr for actionable debugging
- Original errors preserved via cause chain for deep debugging

## Task Commits

Each task was committed atomically:

1. **Task 1: Add signal handling to compose()** - `42269e1` (feat)
2. **Task 2: Enhance ffmpeg error messages** - `54b1a87` (fix)

## Files Created/Modified
- `packages/core/src/compositor.ts` - Added signal handling to compose(), enhanced runFfmpeg error format

## Decisions Made
- Used `process.once` (not `process.on`) to avoid conflicts with recorder's signal handling
- Interrupt check every 100 frames balances responsiveness vs overhead
- Partial output cleanup uses `rm(outputPath, { force: true })` — covers all formats
- Dropped `error.message` from ffmpeg errors since stderr contains the same info plus more context
- Added `{ cause: error }` for full error chain preservation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Compositor reliability complete (signal handling + error messages)
- Recorder signal handling was already in place (Phase 2)
- Ready for remaining Phase 8 plans (if any)

## Self-Check: PASSED

- FOUND: packages/core/src/compositor.ts
- FOUND: 08-02-SUMMARY.md
- FOUND: commit 42269e1
- FOUND: commit 54b1a87
- VERIFIED: SIGINT/SIGTERM handling in compositor.ts
- VERIFIED: exit code in error messages
- VERIFIED: cause chaining in error messages

---
*Phase: 08-presets-reliability*
*Completed: 2026-03-03*
