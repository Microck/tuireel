---
phase: 17-fix-multi-format-record-outputs
plan: 02
subsystem: infra
tags: [github-actions, ci, ffprobe, ffmpeg, node, pnpm]

requires:
  - phase: 17-fix-multi-format-record-outputs
    provides: record output naming contract (smoke-output.<ext>)
provides:
  - CI-04 video smoke clears stale outputs and fails on missing files
  - Per-format ffprobe assertions for codec + resolution + duration
affects: [ci, video, record, release]

tech-stack:
  added: []
  patterns:
    - Deterministic CLI invocation for CI smoke
    - Fail-fast guards (test -s) for artifact existence
    - Robust duration checks (format.duration -> stream.duration -> frames/fps)

key-files:
  created: []
  modified:
    - .github/workflows/video-smoke.yml

key-decisions:
  - "None - followed plan as specified"

patterns-established:
  - "CI-04 must delete smoke-output.* before recording to prevent stale-pass"

duration: 4 min
completed: 2026-03-04
---

# Phase 17 Plan 02: Fix Multi-Format Record Outputs Summary

**CI-04 now records and validates MP4/WebM/GIF with explicit filenames, fail-fast existence checks, and robust ffprobe duration assertions.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T16:21:26Z
- **Completed:** 2026-03-04T16:25:42Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Prevents stale-pass by deleting `smoke-output.*` before recording and asserting each output exists and is non-empty.
- Validates codec + width/height + duration for MP4/WebM/GIF using a duration fallback chain resilient to `N/A`/missing fields.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add cleanup + existence guards for smoke-output artifacts** - `4e0d3f0` (fix)
2. **Task 2: Make validation explicitly cover all three distinct outputs** - `f96e6b5` (fix)

## Files Created/Modified

- `.github/workflows/video-smoke.yml` - Clears stale outputs, asserts output existence, and validates codec+resolution+duration per format.

## Decisions Made

None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for `17-03-PLAN.md` (manual audit/checkpoint plan).

## Self-Check: PASSED
