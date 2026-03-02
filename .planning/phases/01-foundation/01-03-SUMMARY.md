---
phase: 01-foundation
plan: 03
subsystem: infra
tags: [ffmpeg, downloader, caching, platform-detection, vitest]
requires:
  - phase: 01-01
    provides: core package scaffold and public export barrel
provides:
  - ffmpeg auto-download to ~/.tuireel/bin/ffmpeg with cache reuse
  - lockfile-based concurrent download protection for ffmpeg bootstrap
  - ffmpeg module tests covering path/platform/url and integration validation
affects: [01-04, 02-core-pipeline, 03-output-quality, 05-sound]
tech-stack:
  added: []
  patterns: [binary bootstrap on first use, ~/.tuireel cache path, lockfile download guard]
key-files:
  created:
    - packages/core/src/ffmpeg/downloader.ts
    - packages/core/src/ffmpeg/index.ts
    - packages/core/test/ffmpeg.test.ts
  modified:
    - packages/core/src/index.ts
key-decisions:
  - "Use evermeet zip builds for darwin targets because the latest BtbN release does not provide macOS assets."
  - "Validate downloaded binaries with ffmpeg -version before returning cached paths."
patterns-established:
  - "ffmpeg bootstrap: ensureFfmpeg downloads once, then reuses ~/.tuireel/bin/ffmpeg."
  - "Concurrency guard: .ffmpeg.lock serializes concurrent downloader execution."
duration: 6 min
completed: 2026-03-02
---

# Phase 1 Plan 3: FFmpeg Bootstrap Summary

**Platform-aware ffmpeg bootstrap now auto-downloads and caches binaries in `~/.tuireel/bin/ffmpeg`, with integration tests proving executable readiness.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02T22:48:16Z
- **Completed:** 2026-03-02T22:54:47Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `ensureFfmpeg()` bootstrap flow that downloads, extracts, chmods, and verifies ffmpeg before returning.
- Added `getFfmpegPath()`, `detectPlatform()`, and `getDownloadUrl()` logic with support for darwin-arm64/x64 and linux targets.
- Added lockfile coordination (`~/.tuireel/bin/.ffmpeg.lock`) to prevent concurrent downloader races.
- Added ffmpeg tests covering cache path, platform detection, URL mapping, and real binary verification.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement ffmpeg downloader** - `b7e1c39` (feat)
2. **Task 2: Add ffmpeg integration test** - `9cb9d6a` (test)

**Plan metadata:** pending final docs commit (`SUMMARY.md` + `STATE.md`)

## Files Created/Modified

- `packages/core/src/ffmpeg/downloader.ts` - ffmpeg download/cache/lock/verification implementation.
- `packages/core/src/ffmpeg/index.ts` - ffmpeg module barrel export.
- `packages/core/src/index.ts` - public re-export for ffmpeg helpers.
- `packages/core/test/ffmpeg.test.ts` - unit and integration tests for ffmpeg bootstrap behavior.

## Decisions Made

- Kept linux downloads on BtbN static `latest` artifacts and routed darwin to evermeet zip builds for macOS compatibility.
- Verified binary health through direct `ffmpeg -version` execution instead of filesystem checks alone.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced darwin BtbN download path with evermeet fallback**
- **Found during:** Task 1 (Implement ffmpeg downloader)
- **Issue:** Latest BtbN release no longer contains macOS artifacts, so darwin URLs based on the plan pattern would fail.
- **Fix:** Mapped darwin arm64/x64 targets to `https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip` while retaining BtbN for linux.
- **Files modified:** `packages/core/src/ffmpeg/downloader.ts`
- **Verification:** `ensureFfmpeg()` completed successfully and tests passed.
- **Committed in:** `b7e1c39` (Task 1 commit)

**2. [Rule 3 - Blocking] Resolved Node stream type incompatibility in DTS build**
- **Found during:** Task 1 (Implement ffmpeg downloader)
- **Issue:** `Readable.fromWeb` typing conflict failed `tsup` DTS generation.
- **Fix:** Switched archive download implementation to `response.arrayBuffer()` + `writeFile`.
- **Files modified:** `packages/core/src/ffmpeg/downloader.ts`
- **Verification:** `pnpm --filter @tuireel/core build` succeeded.
- **Committed in:** `b7e1c39` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were required for cross-platform correctness and successful package build, with no scope creep.

## Authentication Gates

None.

## Issues Encountered

- Initial downloader implementation failed DTS generation due Node WebStream typing mismatch, then passed after download-path simplification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for `01-04-PLAN.md` CLI command wiring with ffmpeg bootstrap available from `@tuireel/core`.
- No blockers carried forward.

---
*Phase: 01-foundation*
*Completed: 2026-03-02*

## Self-Check: PASSED

- Verified summary and ffmpeg task files exist on disk.
- Verified task commits `b7e1c39` and `9cb9d6a` are present in git history.
