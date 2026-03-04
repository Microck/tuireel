---
phase: 15-ci-wiring-fixes
plan: 02
subsystem: infra
tags: [github-actions, ci, video-smoke, cli]

requires:
  - phase: 06-workflow-polish
    provides: video smoke workflow foundation
provides:
  - deterministic CLI invocation in video smoke CI (node dist entry)
affects: [16-publish-installability-fixes]

tech-stack:
  added: []
  patterns:
    - "CI CLI invocation via node packages/cli/dist/index.js instead of pnpm exec"

key-files:
  created: []
  modified:
    - .github/workflows/video-smoke.yml

key-decisions:
  - "Use node packages/cli/dist/index.js over pnpm exec tuireel to avoid workspace root resolution issues"

patterns-established:
  - "CI record invocation: node packages/cli/dist/index.js record <config> --format <fmt>"

duration: 1min
completed: 2026-03-04
---

# Phase 15 Plan 02: Video Smoke CLI Invocation Fix Summary

**Replaced `pnpm exec tuireel` with deterministic `node packages/cli/dist/index.js` invocation in video smoke CI workflow**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-04T06:14:19Z
- **Completed:** 2026-03-04T06:14:59Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Eliminated "command not found" failure mode in video smoke CI (CI-04)
- All three record steps (MP4, WebM, GIF) now use deterministic node invocation
- Validation and artifact upload steps remain unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Invoke CLI via built dist entry in video smoke workflow** - `596334d` (fix)

## Files Created/Modified

- `.github/workflows/video-smoke.yml` - Changed 3 record step invocations from `pnpm exec tuireel` to `node packages/cli/dist/index.js`

## Decisions Made

- Used `node packages/cli/dist/index.js` rather than adding tuireel as a root dependency, keeping the invocation deterministic and avoiding workspace resolution issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Video smoke CI invocation fixed, ready for plan 15-03
- CI-04 gap resolved

---

_Phase: 15-ci-wiring-fixes_
_Completed: 2026-03-04_
