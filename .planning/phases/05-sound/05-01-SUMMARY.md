---
phase: 05-sound
plan: 01
subsystem: sound
tags: [ffmpeg, sound-effects, mp3, vitest, zod]

requires:
  - phase: 04-overlay-system
    provides: InteractionTimeline event timestamps and two-pass compose pipeline
provides:
  - Bundled click/key sound assets (8 MP3 presets)
  - Sound extraction and ffmpeg audio filter graph builder in core API
  - Opt-in sound schema validation plus unit coverage for sound module behavior
affects: [05-02, compositor, cli, recording]

tech-stack:
  added: [bundled mp3 assets]
  patterns: [ffmpeg adelay+amix placement, opt-in sound config, preset-or-path sound selection]

key-files:
  created:
    - packages/core/assets/sounds/click-1.mp3
    - packages/core/assets/sounds/click-2.mp3
    - packages/core/assets/sounds/click-3.mp3
    - packages/core/assets/sounds/click-4.mp3
    - packages/core/assets/sounds/key-1.mp3
    - packages/core/assets/sounds/key-2.mp3
    - packages/core/assets/sounds/key-3.mp3
    - packages/core/assets/sounds/key-4.mp3
    - packages/core/src/sound.ts
    - packages/core/src/__tests__/sound.test.ts
  modified:
    - packages/core/src/index.ts
    - packages/core/src/config/schema.ts

key-decisions:
  - "Resolve default sound asset paths through runtime candidate directories so ESM and CJS builds both locate bundled assets."
  - "Treat sound as opt-in, finalize functions skip audio mixing when no events or no SFX config is provided."

patterns-established:
  - "Sound extraction pattern: map timeline.events to ffmpeg-ready {type,timeMs} entries."
  - "Audio placement pattern: anullsrc base + per-event adelay/asetrate/volume + final amix output."

duration: 10 min
completed: 2026-03-03
---

# Phase 5 Plan 1: Sound Effects Engine Summary

**Bundled click/key MP3 presets plus ffmpeg adelay/amix sound mixing and opt-in `sound.effects` config validation.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-03T03:02:23Z
- **Completed:** 2026-03-03T03:12:30Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Added 8 bundled sound presets under `packages/core/assets/sounds/` for click/key variants (1-4).
- Implemented `packages/core/src/sound.ts` with sound event extraction, preset/path resolution, ffmpeg mix graph generation, and MP4/WebM finalize helpers.
- Exported sound APIs from `packages/core/src/index.ts` for package consumers.
- Extended config schema with optional `sound.effects.click` and `sound.effects.key` values (`1-4` or custom path string).
- Added comprehensive sound unit coverage in `packages/core/src/__tests__/sound.test.ts`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Sound assets and sound module** - `987aa5f` (feat)
2. **Task 2: Sound config schema and unit tests** - `0400b7e` (feat)

**Plan metadata:** Pending final docs commit.

## Files Created/Modified
- `packages/core/assets/sounds/click-1.mp3` - Bundled click preset variant 1.
- `packages/core/assets/sounds/click-2.mp3` - Bundled click preset variant 2.
- `packages/core/assets/sounds/click-3.mp3` - Bundled click preset variant 3.
- `packages/core/assets/sounds/click-4.mp3` - Bundled click preset variant 4.
- `packages/core/assets/sounds/key-1.mp3` - Bundled key preset variant 1.
- `packages/core/assets/sounds/key-2.mp3` - Bundled key preset variant 2.
- `packages/core/assets/sounds/key-3.mp3` - Bundled key preset variant 3.
- `packages/core/assets/sounds/key-4.mp3` - Bundled key preset variant 4.
- `packages/core/src/sound.ts` - Sound extraction, ffmpeg argument generation, and output finalize utilities.
- `packages/core/src/index.ts` - Exports for `SfxConfig` and sound helper functions.
- `packages/core/src/config/schema.ts` - Optional opt-in `sound.effects` schema.
- `packages/core/src/__tests__/sound.test.ts` - Unit tests for sound module and sound schema validation.

## Decisions Made
- Used ffmpeg filter graph composition (`anullsrc` + per-event `adelay` + `amix`) as the core sound synchronization strategy because it preserves exact millisecond placement while keeping video copy fast.
- Kept sound disabled unless `sound.effects` is present, preserving current silent-by-default behavior and backward compatibility for existing configs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Resolved plan file path drift for config/types locations**
- **Found during:** Task 1 and Task 2
- **Issue:** Plan referenced `packages/core/src/types.ts` and `packages/core/src/config.ts`, but this codebase stores these contracts in `packages/core/src/timeline/types.ts` and `packages/core/src/config/schema.ts`.
- **Fix:** Implemented extraction typing directly in `packages/core/src/sound.ts` and applied schema changes to `packages/core/src/config/schema.ts`.
- **Files modified:** `packages/core/src/sound.ts`, `packages/core/src/config/schema.ts`
- **Verification:** `pnpm --filter @tuireel/core exec tsc --noEmit`, `pnpm --filter @tuireel/core test`
- **Committed in:** `987aa5f`, `0400b7e`

**2. [Rule 1 - Bug] Fixed CJS runtime break in asset path resolution**
- **Found during:** Task 1 verification (`pnpm --filter @tuireel/core build`)
- **Issue:** Initial implementation used `import.meta.url`, which produced invalid CJS output in tsup (`import_meta.url` undefined at runtime).
- **Fix:** Replaced `import.meta` resolution with runtime candidate directory detection (`__dirname`, workspace, and node_modules asset paths).
- **Files modified:** `packages/core/src/sound.ts`
- **Verification:** `pnpm --filter @tuireel/core build` succeeds for both ESM/CJS outputs without `import.meta` warning.
- **Committed in:** `987aa5f`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** All deviations were required for correctness and repository-structure alignment; no scope creep.

## Authentication Gates

None.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Sound engine foundation is complete and verified, ready for `05-02-PLAN.md` custom audio track mixing and compositor/CLI integration.
- No blockers carried forward.

---
*Phase: 05-sound*
*Completed: 2026-03-03*

## Self-Check: PASSED
