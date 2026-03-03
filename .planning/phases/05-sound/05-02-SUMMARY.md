---
phase: 05-sound
plan: 02
subsystem: sound
tags: [ffmpeg, audio-mixing, compositor, cli, zod]

requires:
  - phase: 05-sound
    provides: Sound effect extraction and ffmpeg placement pipeline from 05-01
provides:
  - Custom track mixing with independent effects and track volume controls
  - Compositor sound finalization for mp4/webm output in record and composite flows
  - CLI-level sound.track path resolution relative to config location
affects: [06-workflow-polish, recording, compositor, cli]

tech-stack:
  added: []
  patterns: [buildFullAudioArgs orchestration, relative sound path resolution, silent-by-default output finalization]

key-files:
  created: []
  modified:
    - packages/core/src/sound.ts
    - packages/core/src/config/schema.ts
    - packages/core/src/index.ts
    - packages/core/src/__tests__/sound.test.ts
    - packages/core/src/compositor.ts
    - packages/core/src/recorder.ts
    - packages/cli/src/commands/composite.ts
    - packages/cli/src/commands/record.ts

key-decisions:
  - "Finalize audio after frame composition using buildFullAudioArgs so mp4/webm share one sound path."
  - "Resolve sound.track against the config file directory in both record and composite commands to avoid cwd-dependent failures."

patterns-established:
  - "Audio mode branching pattern: effects-only, track-only, and effects+track all flow through buildFullAudioArgs."
  - "CLI config normalization pattern: absolute config path first, then relative asset path expansion from dirname(configPath)."

duration: 10 min
completed: 2026-03-03
---

# Phase 5 Plan 2: Custom Audio Track Mixing Summary

**Custom audio tracks now mix with sound effects through shared ffmpeg args, with independent volume control and full record/composite CLI wiring.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-03T03:18:58Z
- **Completed:** 2026-03-03T03:29:57Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Extended `sound` config schema with optional `track`, `trackVolume`, and `effectsVolume` fields.
- Added `buildFullAudioArgs()` and `mixAudioTracks()` to support effects-only, track-only, and combined audio modes.
- Updated mp4/webm sound finalizers to consume the unified sound config instead of effects-only config.
- Wired compositor sound finalization for both `tuireel record` and `tuireel composite` paths.
- Added CLI path resolution so relative `sound.track` entries are resolved from the config file directory.
- Expanded sound tests to cover track-only, mixed audio, and schema volume validation cases.

## Task Commits

Each task was committed atomically:

1. **Task 1: Custom audio track mixing** - `e92b4ed` (feat)
2. **Task 2: Wire sound into compositor and CLI** - `6d1fb0f` (feat)

**Plan metadata:** Pending final docs commit.

## Files Created/Modified
- `packages/core/src/sound.ts` - Added full sound config support, combined-track ffmpeg arg building, and shared audio mix helper.
- `packages/core/src/config/schema.ts` - Added `sound.track`, `sound.trackVolume`, and `sound.effectsVolume` schema fields.
- `packages/core/src/index.ts` - Exported `buildFullAudioArgs`, `mixAudioTracks`, and `SoundConfig`.
- `packages/core/src/__tests__/sound.test.ts` - Added tests for track-only and mixed audio args plus schema validations.
- `packages/core/src/compositor.ts` - Added sound-aware compose finalization for mp4/webm outputs.
- `packages/core/src/recorder.ts` - Passed `config.sound` through to compose in the record pipeline.
- `packages/cli/src/commands/composite.ts` - Resolved `sound.track` relative to config and passed `sound` into compose options.
- `packages/cli/src/commands/record.ts` - Resolved `sound.track` relative to config and preserved sound config in record execution.

## Decisions Made
- Unified all sound mixing paths behind `buildFullAudioArgs` so finalizers no longer branch on separate effects-only and track-only code paths.
- Kept audio opt-in behavior intact by returning `null` from full audio arg generation when neither effects nor track are configured.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan path drift for config schema file**
- **Found during:** Task 1 (Custom audio track mixing)
- **Issue:** Plan references `packages/core/src/config.ts`, but repository schema lives in `packages/core/src/config/schema.ts`.
- **Fix:** Applied sound schema field additions in `packages/core/src/config/schema.ts` and updated sound tests there.
- **Files modified:** `packages/core/src/config/schema.ts`, `packages/core/src/__tests__/sound.test.ts`
- **Verification:** `pnpm --filter @tuireel/core test`, `pnpm --filter @tuireel/core exec tsc --noEmit`
- **Committed in:** `e92b4ed`

**2. [Rule 2 - Missing Critical] Added core recorder sound passthrough**
- **Found during:** Task 2 (Wire sound into compositor and CLI)
- **Issue:** Updating CLI `record` command alone would not add sound, because `packages/core/src/recorder.ts` did not pass `config.sound` into `compose()`.
- **Fix:** Added `sound: config.sound` to recorder compose options so record and composite flows both use the same sound pipeline.
- **Files modified:** `packages/core/src/recorder.ts`
- **Verification:** `pnpm --filter @tuireel/core test`, `pnpm build`, manual composite checks for audio/no-audio output
- **Committed in:** `6d1fb0f`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Deviations were required for repository alignment and end-to-end correctness, no scope creep introduced.

## Authentication Gates

None.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 sound work is complete with custom track mixing and CLI integration validated.
- Ready to transition into Phase 6 (`06-01-PLAN.md`) workflow and polish tasks.

---
*Phase: 05-sound*
*Completed: 2026-03-03*

## Self-Check: PASSED
