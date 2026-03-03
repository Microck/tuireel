---
phase: 04-overlay-system
plan: 04
subsystem: overlay
tags: [compositor, ffmpeg, sharp, timeline, cli]

# Dependency graph
requires:
  - phase: 04-01
    provides: InteractionTimeline data contract and frame expansion used by composite pass
  - phase: 04-02
    provides: Cursor motion + raster renderer used for per-frame cursor overlays
  - phase: 04-03
    provides: HUD overlay renderer and shared overlay config contracts
provides:
  - Two-pass compositor engine that decodes raw frames, applies Sharp overlays, and re-encodes via ffmpeg profiles
  - `tuireel composite` CLI command with format and overlay controls
  - Recorder artifact persistence to `.tuireel/raw` and `.tuireel/timelines` for re-compositing without re-recording
affects: [05-sound, 06-workflow-polish, composite-cli, record-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Frame extraction plus Sharp composition plus profile-based ffmpeg re-encode
    - Artifact-first recording flow (raw MP4 + timeline JSON) before final composition

key-files:
  created:
    - packages/core/src/compositor.ts
    - packages/core/src/__tests__/compositor.test.ts
    - packages/cli/src/commands/composite.ts
  modified:
    - packages/core/src/recorder.ts
    - packages/core/src/index.ts
    - packages/cli/src/index.ts
    - packages/cli/src/commands/stubs.ts

key-decisions:
  - "Implement compose() as frame-by-frame Sharp compositing over ffmpeg-decoded JPEG frames, then encode with existing profile definitions."
  - "Keep raw capture fixed to MP4 in record pass, then run composition as a second pass to produce configured final format."
  - "Implement `--no-hud` at CLI layer by stripping HUD state from timeline input, while `--no-cursor` maps to cursor visibility override."

patterns-established:
  - "Compositor reuses timeline expansion from InteractionTimeline.load(...).getFrames() instead of duplicating interpolation logic."
  - "Overlay render caches are state-aware: cursor image cached globally, HUD image re-rendered only when labels or opacity change."

# Metrics
duration: 17 min
completed: 2026-03-03
---

# Phase 4 Plan 4: Composite Pipeline Summary

**Tuireel now records reusable raw/timeline artifacts and ships a full composite pass that overlays cursor and keystroke HUD into MP4, WebM, or GIF outputs without re-recording terminal interaction.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-03T02:03:52Z
- **Completed:** 2026-03-03T02:21:44Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `compose(rawVideoPath, timelineData, outputPath, opts?)` in `packages/core/src/compositor.ts` with ffmpeg decode, Sharp overlay compositing, and ffmpeg re-encode using existing encoder profiles (including GIF two-pass finalize).
- Added compositor integration coverage in `packages/core/src/__tests__/compositor.test.ts` that generates a short raw video, composes timeline overlays, and verifies output playability through ffmpeg.
- Updated record pipeline in `packages/core/src/recorder.ts` to save `.tuireel/raw/{name}.mp4` and `.tuireel/timelines/{name}.timeline.json`, then run compose as final output step.
- Added real `tuireel composite` command in `packages/cli/src/commands/composite.ts` with `--config`, `--format`, `--cursor-size`, `--no-cursor`, and `--no-hud` options, and wired it in CLI entrypoint.

## Task Commits

Each task was committed atomically:

1. **Task 1: Compositor engine** - `10c960b` (feat)
2. **Task 2: Record pass timeline integration + composite CLI** - `256824a` (feat)

## Files Created/Modified

- `packages/core/src/compositor.ts` - Two-pass compositing pipeline and overlay rendering orchestration.
- `packages/core/src/__tests__/compositor.test.ts` - ffmpeg-backed compose verification test.
- `packages/cli/src/commands/composite.ts` - Composite command implementation and options parsing.
- `packages/core/src/recorder.ts` - Raw/timeline artifact persistence and post-record compose invocation.
- `packages/core/src/index.ts` - Export `compose()` in core public API.
- `packages/cli/src/index.ts` - Register composite command.
- `packages/cli/src/commands/stubs.ts` - Remove composite from phase stub list.

## Decisions Made

- Reused `ENCODER_PROFILES` and `encodeGifTwoPass` in compositor output stage to keep format behavior aligned with existing encoding pipeline.
- Captured timeline ticks from `FrameCapturer` frame callback to keep timeline frame count synchronized with actual recorded frames.
- Derived artifact identity from configured output filename stem so `record` and `composite` resolve the same `.tuireel/raw` and `.tuireel/timelines` paths.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Overlay system is complete with record/composite handoff and configurable re-compositing.
- Phase 5 can consume timeline `events` data for sound effects without changing composite command contracts.
- No blockers carried forward.

---
*Phase: 04-overlay-system*
*Completed: 2026-03-03*

## Self-Check: PASSED

- Verified files exist: `packages/core/src/compositor.ts`, `packages/core/src/__tests__/compositor.test.ts`, `packages/cli/src/commands/composite.ts`, `.planning/phases/04-overlay-system/04-04-SUMMARY.md`.
- Verified commits exist: `10c960b`, `256824a`.
