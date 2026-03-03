---
phase: 02-core-pipeline
plan: 02
subsystem: recording
tags: [ffmpeg, tuistory, image2pipe, mp4, cli]
requires:
  - phase: 02-core-pipeline
    provides: Session wrapper + step executor from 02-01 used by the recorder orchestrator
provides:
  - Frame capturer loop that streams terminal JPEG frames at configured FPS
  - ffmpeg image2pipe encoder for MP4 output with backpressure handling
  - End-to-end `record(config)` orchestration with signal-aware cleanup
  - CLI `tuireel record` command wired to config loading + recording execution
affects: [03-output-quality, 04-overlay-system, 06-workflow-polish]
tech-stack:
  added: []
  patterns: [image2pipe-streaming, signal-safe-recorder-cleanup, viewport-sized-terminal-render]
key-files:
  created:
    - packages/core/src/capture/frame-capturer.ts
    - packages/core/src/encoding/encoder.ts
    - packages/core/src/recorder.ts
    - packages/cli/src/commands/record.ts
  modified:
    - packages/core/src/index.ts
    - packages/core/src/session.ts
    - packages/core/src/executor/timing.ts
    - packages/cli/src/index.ts
    - packages/cli/src/commands/stubs.ts
    - packages/cli/tsconfig.json
key-decisions:
  - "Resolve launch command from the first launch step to preserve the existing config contract from 02-01."
  - "Force screenshot height from configured terminal rows so viewport dimensions are reflected in video output."
  - "Register recorder signal handlers before setup and terminate ffmpeg immediately on interrupt to reduce orphan risk."
patterns-established:
  - "Recorder cleanup is centralized and idempotent, with best-effort abort for encoder and capturer."
  - "CLI help path stays lightweight by lazy-loading session runtime only when recording starts."
duration: 29 min
completed: 2026-03-03
---

# Phase 2 Plan 2: Frame Capture and Record Command Summary

**`tuireel record` now executes the full pipeline from validated config to playable H.264 MP4 using a live frame capture loop and ffmpeg image2pipe encoding.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-03-02T23:48:20Z
- **Completed:** 2026-03-03T00:18:18Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added `FfmpegEncoder` in `packages/core/src/encoding/encoder.ts` with image2pipe ffmpeg spawn, stderr capture, stdin backpressure handling, finalize/abort lifecycle, and termination helper.
- Added `FrameCapturer` in `packages/core/src/capture/frame-capturer.ts` with FPS-driven screenshot loop, drift skip behavior, and frame-count progress hook.
- Added `record(config)` in `packages/core/src/recorder.ts` to orchestrate ffmpeg/session/capture/step execution, wait for final idle, and clean up on errors and signals.
- Replaced CLI record stub with real command implementation in `packages/cli/src/commands/record.ts`, wired through `packages/cli/src/index.ts`, and kept preview/composite as phase-gated stubs.
- Ensured viewport settings are reflected in output dimensions by rendering screenshots at fixed row-based height in `packages/core/src/session.ts`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Frame capturer and ffmpeg encoder** - `49dfef2` (feat)
2. **Task 2: Recording orchestrator and CLI wiring** - `f34055f` (feat)

Additional stabilization commit:

- **Post-task fixes:** `9f14297` (fix) - signal cleanup hardening in recorder + encoder

**Plan metadata:** pending docs commit (`02-02-SUMMARY.md` + `STATE.md`).

## Files Created/Modified

- `packages/core/src/capture/frame-capturer.ts` - FPS capture loop writing JPEG frames to encoder with timing drift protection.
- `packages/core/src/encoding/encoder.ts` - ffmpeg process wrapper for image2pipe input, x264 output, and backpressure-aware writes.
- `packages/core/src/recorder.ts` - end-to-end recording orchestration with signal/error cleanup paths.
- `packages/core/src/session.ts` - viewport-height-aware screenshot rendering to keep row settings visible in video output.
- `packages/core/src/executor/timing.ts` - unref sleep timer for better interrupt behavior during pauses.
- `packages/core/src/index.ts` - exports `record` from core public API.
- `packages/cli/src/commands/record.ts` - CLI command implementation that loads config and executes recording.
- `packages/cli/src/index.ts` - registers record command.
- `packages/cli/src/commands/stubs.ts` - removes record from stub list.
- `packages/cli/tsconfig.json` - removes invalid project reference that blocked package typecheck.

## Decisions Made

- Kept config semantics aligned with the existing schema and 02-01 behavior: launch command is derived from the first `launch` step, while `cols`/`rows` continue to come from top-level config fields.
- Used dynamic import for `createSession()` inside recorder so `tuireel record --help` does not eagerly load tuistory native dependencies.
- Added ffmpeg padding filter (`pad=ceil(iw/2)*2:ceil(ih/2)*2`) to guarantee x264-compatible dimensions for all captured frames.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed workspace typecheck blocker in CLI tsconfig**
- **Found during:** Task 2 verification
- **Issue:** CLI `tsc --noEmit` failed because `packages/cli/tsconfig.json` referenced a non-composite core project.
- **Fix:** Removed the invalid project reference so CLI and core typechecks can run independently as configured.
- **Files modified:** `packages/cli/tsconfig.json`
- **Verification:** `pnpm --filter @tuireel/core exec tsc --noEmit` and `pnpm --filter tuireel exec tsc --noEmit` both pass.
- **Committed in:** `f34055f`

**2. [Rule 2 - Missing Critical] Prevented ffmpeg/x264 failure on odd frame heights**
- **Found during:** Task 2 integration recording run
- **Issue:** ffmpeg failed with `height not divisible by 2` when terminal render height was odd.
- **Fix:** Added `-vf pad=ceil(iw/2)*2:ceil(ih/2)*2` to encoder args.
- **Files modified:** `packages/core/src/encoding/encoder.ts`
- **Verification:** `node packages/cli/dist/index.js record /tmp/tmp.6kjAAMGO1o/record.jsonc` succeeds and `ffprobe` reports valid H.264 stream.
- **Committed in:** `f34055f`

**3. [Rule 2 - Missing Critical] Enforced viewport rows in screenshot output**
- **Found during:** Task 2 viewport verification
- **Issue:** Renderer trimmed trailing empty lines, so output height did not reflect configured terminal rows.
- **Fix:** Set screenshot render height from `terminalData.rows * fontSize * lineHeight`.
- **Files modified:** `packages/core/src/session.ts`
- **Verification:** `ffprobe` shows `672x504` for `80x24` and `840x630` for `100x30` test configs.
- **Committed in:** `f34055f`

**4. [Rule 1 - Bug] Hardened interrupt cleanup to reduce orphaned ffmpeg/session processes**
- **Found during:** Task 2 signal cleanup verification
- **Issue:** Interrupt path was not consistently cleaning spawned resources in all timing windows.
- **Fix:** Added synchronous encoder `terminate()` helper and refactored recorder signal flow to register handlers early and clean up via nullable resource refs.
- **Files modified:** `packages/core/src/recorder.ts`, `packages/core/src/encoding/encoder.ts`
- **Verification:** Interrupt test exits on SIGINT/SIGTERM and no matching ffmpeg/session child process remains after cleanup polling.
- **Committed in:** `9f14297`

---

**Total deviations:** 4 auto-fixed (1 blocking, 2 missing critical, 1 bug)
**Impact on plan:** All deviations were required to achieve a stable, verifiable recording pipeline. No scope expansion beyond plan intent.

## Authentication Gates

None.

## Issues Encountered

- `node-pty` native bindings were missing in this execution environment; resolved for verification by compiling with `pnpm dlx node-gyp rebuild` inside the `node-pty` package directory.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `tuireel record` now produces MP4 output with configurable FPS + viewport dimensions, enabling Phase 3 format-quality and theming work.
- Encoder and capture abstractions are in place for adding WebM/GIF and additional render/compositing behavior.
- Remaining risk: interrupt exit status can be signal-native (`130`) depending on timing, but cleanup paths are in place and verification confirms no lingering ffmpeg/session child processes.

---
*Phase: 02-core-pipeline*
*Completed: 2026-03-03*

## Self-Check: PASSED

- Verified `.planning/phases/02-core-pipeline/02-02-SUMMARY.md` exists on disk.
- Verified task/stabilization commits `49dfef2`, `f34055f`, and `9f14297` exist in git history.
