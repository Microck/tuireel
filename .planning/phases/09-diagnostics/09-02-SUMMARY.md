---
phase: 09-diagnostics
plan: 02
subsystem: diagnostics
tags: [error-messages, ux, actionable-errors, cli]

requires:
  - phase: 08-presets-reliability
    provides: "Error cause chaining pattern and ffmpeg error improvements"
provides:
  - "Every throw new Error in core includes actionable 'Try:' guidance"
  - "Consistent error message pattern: what went wrong + Try: suggestion"
affects: [10-documentation, 12-release-performance]

tech-stack:
  added: []
  patterns: ["Error message pattern: 'What went wrong. Try: actionable suggestion.'"]

key-files:
  created: []
  modified:
    - packages/core/src/session.ts
    - packages/core/src/compositor.ts
    - packages/core/src/recorder.ts
    - packages/core/src/config/loader.ts
    - packages/core/src/config/resolver.ts
    - packages/core/src/ffmpeg/downloader.ts
    - packages/core/src/encoding/encoder.ts
    - packages/core/src/sound.ts
    - packages/core/src/themes/resolve.ts
    - packages/core/src/preview.ts
    - packages/core/src/presets/resolve.ts
    - packages/core/src/executor/step-executor.ts
    - packages/core/src/executor/steps/launch.ts
    - packages/core/src/executor/steps/press.ts
    - packages/core/src/capture/frame-capturer.ts

key-decisions:
  - "Keep Error class (no custom error classes) — simple and composable"
  - "Wrap config loader readFile in try/catch for ENOENT-specific guidance"
  - "Update test expectations to match new error messages"

patterns-established:
  - "Error pattern: 'What went wrong. Try: actionable suggestion.'"
  - "Preserve { cause: error } chaining on all re-thrown errors"

duration: 8min
completed: 2026-03-03
---

# Phase 9 Plan 2: Error Message Audit Summary

**Actionable 'Try:' suggestions added to all 30+ error paths across 15 core source files**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-03T23:38:34Z
- **Completed:** 2026-03-03T23:47:00Z
- **Tasks:** 1
- **Files modified:** 17 (15 source + 2 tests)

## Accomplishments
- Every `throw new Error` in `packages/core/src/` now includes a "Try:" suggestion with actionable guidance
- Error categories covered: config loading, session I/O, FFmpeg operations, sound mixing, theme resolution, preview validation, preset resolution, step execution, frame capture, encoder lifecycle
- Added ENOENT-specific error handling to config loader for missing file guidance
- Updated 2 test files (resolver, themes) to match new error message format
- All existing `{ cause: error }` chaining preserved — no error context lost

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and improve error messages across core** - `3cf5f5f` (feat)

## Files Created/Modified
- `packages/core/src/session.ts` — type/press/waitForText error suggestions
- `packages/core/src/compositor.ts` — ffmpeg/decode/interrupt error suggestions
- `packages/core/src/recorder.ts` — launch step/interrupt error suggestions
- `packages/core/src/config/loader.ts` — config loading + ENOENT handling
- `packages/core/src/config/resolver.ts` — include file parse/circular/missing errors
- `packages/core/src/ffmpeg/downloader.ts` — platform/download/extraction errors
- `packages/core/src/encoding/encoder.ts` — encoder write/finalize errors
- `packages/core/src/sound.ts` — audio mixing error
- `packages/core/src/themes/resolve.ts` — unknown theme/invalid config errors
- `packages/core/src/preview.ts` — unsupported step/missing launch errors
- `packages/core/src/presets/resolve.ts` — unknown preset error
- `packages/core/src/executor/step-executor.ts` — assertNever/step failure errors
- `packages/core/src/executor/steps/launch.ts` — empty command error
- `packages/core/src/executor/steps/press.ts` — empty key error
- `packages/core/src/capture/frame-capturer.ts` — invalid fps error
- `packages/core/test/resolver.test.ts` — updated regex to match new message format
- `packages/core/test/themes.test.ts` — updated inline snapshot for new message

## Decisions Made
- Keep plain `Error` class — no custom error hierarchies. Composable and simple.
- Added try/catch around `readFile` in `loadConfig` for ENOENT-specific guidance (plan didn't specify but file-not-found is the most common user error)
- Audited files beyond the plan's explicit list: found `resolver.ts`, `presets/resolve.ts`, `step-executor.ts`, `launch.ts`, `press.ts`, `frame-capturer.ts` also had bare errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added ENOENT handling to config loader**
- **Found during:** Task 1
- **Issue:** `loadConfig` did not catch file-not-found errors separately — users got a generic Node.js ENOENT message
- **Fix:** Wrapped `readFile` in try/catch, detect `code === 'ENOENT'`, provide specific "Try: run 'tuireel init'" guidance
- **Files modified:** packages/core/src/config/loader.ts
- **Verification:** Build passes, tests pass
- **Committed in:** 3cf5f5f

**2. [Rule 2 - Missing Critical] Audited 6 additional files beyond plan's explicit list**
- **Found during:** Task 1 (grep audit)
- **Issue:** Plan listed 9 files but 6 more in core also had `throw new Error` without guidance
- **Fix:** Added "Try:" suggestions to all errors in resolver.ts, presets/resolve.ts, step-executor.ts, launch.ts, press.ts, frame-capturer.ts
- **Files modified:** 6 additional files
- **Verification:** Build passes, all tests pass
- **Committed in:** 3cf5f5f

**3. [Rule 1 - Bug] Updated test expectations for changed error messages**
- **Found during:** Task 1 (test verification)
- **Issue:** 2 tests had expectations matching old error message format
- **Fix:** Updated regex in resolver.test.ts and inline snapshot in themes.test.ts
- **Files modified:** packages/core/test/resolver.test.ts, packages/core/test/themes.test.ts
- **Verification:** All 96 project tests pass
- **Committed in:** 3cf5f5f

---

**Total deviations:** 3 auto-fixed (2 missing critical, 1 bug)
**Impact on plan:** All auto-fixes necessary for completeness and correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 9 diagnostics depends on 09-01 (logger infrastructure) completing separately
- Once both 09-01 and 09-02 are done, Phase 9 success criteria are met
- Phase 10 (Documentation) can reference the error message patterns established here

---
*Phase: 09-diagnostics*
*Completed: 2026-03-03*
