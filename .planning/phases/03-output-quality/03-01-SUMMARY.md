---
phase: 03-output-quality
plan: 01
subsystem: encoding
tags: [ffmpeg, vp9, gif, palettegen, cli]

requires:
  - phase: 02-core-pipeline
    provides: MP4 image2pipe recorder loop and ffmpeg capture pipeline
provides:
  - Format-aware encoder profile registry for mp4/webm/gif outputs
  - VP9 WebM encoding path wired through config format and CLI flag overrides
  - Two-pass GIF encoding flow (palettegen + paletteuse) with temp cleanup
affects: [03-output-quality, 04-overlay-system, cli-recording]

tech-stack:
  added: []
  patterns:
    - Profile-based ffmpeg argument lookup by output format
    - Finalize-time two-pass GIF conversion from streamed intermediate capture

key-files:
  created:
    - packages/core/src/encoding/encoder-profiles.ts
    - packages/core/src/encoding/gif-encoder.ts
  modified:
    - packages/core/src/encoding/encoder.ts
    - packages/core/src/config/schema.ts
    - packages/core/src/recorder.ts
    - packages/cli/src/commands/record.ts

key-decisions:
  - "Expose output format in config schema and allow CLI --format overrides."
  - "Capture GIF recordings to a temporary MP4, then run palettegen/paletteuse as a finalize step."
  - "Quantize GIF FPS to centisecond-safe rates so playback stays at or below the configured cap."

patterns-established:
  - "Encoder profiles can declare twoPass behavior and profile-specific output frame-rate caps."
  - "Two-pass encoding temp artifacts are cleaned in both finalize and abort paths."

duration: 12 min
completed: 2026-03-03
---

# Phase 3 Plan 1: WebM and GIF Encoding Summary

**VP9 WebM and two-pass GIF output now run through a format-aware ffmpeg pipeline with CLI/config format selection and GIF temp-file cleanup.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-03T00:53:06Z
- **Completed:** 2026-03-03T01:05:15Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Added encoder profile mapping so MP4/WebM/GIF use format-specific ffmpeg arguments and consistent bt709 color flags.
- Wired format selection through config (`format`) and CLI (`tuireel record --format`) without regressing MP4 output.
- Implemented two-pass GIF encoding (`palettegen` + `paletteuse`) with capped playback rate and automatic palette/intermediate cleanup.

## Task Commits

Each task was committed atomically:

1. **Task 1: WebM VP9 encoder profile + format selection** - `99b71ad` (feat)
2. **Task 2: GIF two-pass palettegen encoder** - `bbbcece` (feat)

**Plan metadata:** `pending`

## Files Created/Modified
- `packages/core/src/encoding/encoder-profiles.ts` - defines mp4/webm/gif encoder profiles and output metadata.
- `packages/core/src/encoding/gif-encoder.ts` - runs two-pass GIF conversion with palette generation and cleanup.
- `packages/core/src/encoding/encoder.ts` - switches to profile-driven args and finalize-time two-pass delegation.
- `packages/core/src/config/schema.ts` - adds `format` field (`mp4 | webm | gif`) to config contract.
- `packages/cli/src/commands/record.ts` - adds `--format` flag parsing and runtime format override.

## Decisions Made
- Added `format` as first-class config data and CLI override so output format selection is explicit and testable.
- Kept capture streaming architecture by writing GIF sources to a temporary MP4, then converting in a dedicated pass.
- Quantized GIF FPS to `100/N` values because GIF centisecond timing cannot represent exact 15 fps without overshooting.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Enforced GIF fps cap under GIF timing constraints**
- **Found during:** Task 2 (GIF two-pass palettegen encoder)
- **Issue:** Using `fps=15` yielded effective GIF playback of `50/3` (~16.67 fps) due centisecond frame delay rounding.
- **Fix:** Added GIF fps quantization to centisecond-safe ratios (`100/N`) so effective playback remains within the 10-15 fps cap.
- **Files modified:** packages/core/src/encoding/gif-encoder.ts
- **Verification:** `ffprobe` on generated GIF reports `avg_frame_rate=100/7` (14.285 fps).
- **Committed in:** `bbbcece` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix was required to satisfy the fps-cap requirement without changing scope.

## Authentication Gates
None.

## Issues Encountered
- CLI tests initially read stale `@tuireel/core` dist output after schema changes; rebuilding core before CLI tests resolved it.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for `03-02-PLAN.md` (terminal theming) on top of the new format-aware encoder pipeline.
- No blockers carried forward.

---
*Phase: 03-output-quality*
*Completed: 2026-03-03*

## Self-Check: PASSED

- Verified summary and key created files exist on disk.
- Verified task commits `99b71ad` and `bbbcece` exist in git history.
