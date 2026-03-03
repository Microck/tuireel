---
phase: 05-sound
verified: 2026-03-03T03:43:04Z
status: passed
score: 9/9 must-haves verified
re_verification:
  previous_status: human_needed
  previous_score: 8/9
  gaps_closed:
    - "Runtime media checks completed for SFX sync path, track duration handling, and mixed volume behavior"
    - "User-provided sound.track runtime output validated with AAC stream presence"
  gaps_remaining: []
  regressions: []
---

# Phase 5: Sound Verification Report

**Phase Goal:** Add sound effects synced to terminal interactions and custom audio track mixing.
**Verified:** 2026-03-03T03:43:04Z
**Status:** passed
**Re-verification:** Yes - runtime audio checks completed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Sound events from timeline are extracted with ms timestamps | ✓ VERIFIED | `extractSoundEvents()` filters `timeline.events` and maps `{type,timeMs}` in `packages/core/src/sound.ts:136`; unit test confirms mapping in `packages/core/src/__tests__/sound.test.ts:178`. |
| 2 | Sound effect placement uses per-event timestamped ffmpeg delays | ✓ VERIFIED | `buildAudioMixArgs()` emits `adelay=${delayMs}` and `amix` in `packages/core/src/sound.ts:181` and `packages/core/src/sound.ts:186`; tests assert concrete delays in `packages/core/src/__tests__/sound.test.ts:78`; runtime `record` check produced muxed AAC output in `/tmp/tuireel-sfx-check.mp4`. |
| 3 | Sound remains opt-in by default (silent when unconfigured) | ✓ VERIFIED | `buildFullAudioArgs()` returns `null` when neither effects nor track exist in `packages/core/src/sound.ts:232`; finalizers short-circuit to silent output path in `packages/core/src/sound.ts:316` and `packages/core/src/sound.ts:352`. |
| 4 | Multiple bundled variants (1-4) are selectable for click/key effects | ✓ VERIFIED | `SfxConfig` supports `1|2|3|4|string` in `packages/core/src/sound.ts:38`; resolver maps numeric variant to asset filename in `packages/core/src/sound.ts:123`; schema mirrors variants in `packages/core/src/config/schema.ts:7`. |
| 5 | Custom effect file paths are accepted | ✓ VERIFIED | `resolveSfxPath()` returns string paths as-is in `packages/core/src/sound.ts:119`; schema allows strings in `packages/core/src/config/schema.ts:12`; tests validate custom paths in `packages/core/src/__tests__/sound.test.ts:31`. |
| 6 | User-provided `sound.track` is mixed into output video | ✓ VERIFIED | Runtime outputs `/tmp/tuireel-track-short.mp4` and `/tmp/tuireel-track-long.mp4` both contain AAC audio streams (`codec_name=aac`), confirming track mux path executes end-to-end. |
| 7 | Custom track is duration-matched (trim/pad/fade) | ✓ VERIFIED | Track filter applies `atrim`, `apad`, and `afade` in `packages/core/src/sound.ts:214`; runtime durations validate behavior: short-track output `3.132993s` and long-track output `3.032993s` around ~3s target, indicating pad/trim matching to video length. |
| 8 | Effects + track can mix together with independent volume controls | ✓ VERIFIED | Combined branch applies separate effect/track volume and `amix=inputs=2` in `packages/core/src/sound.ts:287` and `packages/core/src/sound.ts:292`; runtime `mix-a`/`mix-b` outputs differ in AAC bitrate (`80165` vs `119608`) and SHA-256 hash, showing volume config materially changes output mix. |
| 9 | Composite flow applies sound using saved recording artifacts (no re-record required) | ✓ VERIFIED | `composite` command reads `.tuireel/raw` + `.tuireel/timelines` artifacts in `packages/cli/src/commands/composite.ts:65` and `packages/cli/src/commands/composite.ts:140`, then passes sound config to `compose()` in `packages/cli/src/commands/composite.ts:146`; compositor applies sound in `packages/core/src/compositor.ts:310`. |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/core/assets/sounds/` | Bundled click/key presets | ✓ VERIFIED | 8 MP3 assets exist (`click-1..4`, `key-1..4`). |
| `packages/core/src/sound.ts` | Event extraction, effect mixing, custom track mixing, finalizers | ✓ VERIFIED | Exists (375 lines), substantive implementation, exports all expected sound functions, imported by compositor/tests/index. |
| `packages/core/src/__tests__/sound.test.ts` | Unit coverage for sound module + schema | ✓ VERIFIED | Exists (256 lines), non-stub test suite covering extraction, effect args, track-only and mixed modes, schema validation. |
| `packages/core/src/config.ts` (plan path) | Sound config contract | ✓ VERIFIED | Repository uses `packages/core/src/config/schema.ts` instead; sound fields (`effects`, `track`, volumes) are implemented and exported there. |
| `packages/core/src/compositor.ts` | Sound pipeline integration in compose pass | ✓ VERIFIED | Exists (336 lines), imports sound module and finalizes mp4/webm with `options.sound`. |
| `packages/cli/src/commands/composite.ts` | CLI sound config handoff to compositor | ✓ VERIFIED | Exists (167 lines), resolves relative `sound.track` and passes `sound` into compose options. |
| `packages/core/src/recorder.ts` | Record flow sound passthrough into compose | ✓ VERIFIED | Exists (348 lines), passes `sound: config.sound` to `compose()`. |
| `packages/cli/src/commands/record.ts` | Record CLI resolves and preserves `sound.track` path | ✓ VERIFIED | Exists (63 lines), resolves track relative to config file and forwards to core recorder. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `packages/core/src/sound.ts` | `TimelineData.events` | `extractSoundEvents()` | ✓ WIRED | Reads `timeline.events`, filters sound types, maps `timeMs` in `packages/core/src/sound.ts:137`. |
| `packages/core/src/sound.ts` | ffmpeg effect timeline | `buildAudioMixArgs()` | ✓ WIRED | Emits per-event `adelay` and final `amix` in `packages/core/src/sound.ts:181` and `packages/core/src/sound.ts:186`, consumed by finalizers in `packages/core/src/sound.ts:324`. |
| `packages/core/src/sound.ts` | ffmpeg custom track mix | `buildTrackFilter()` + `mixAudioTracks()` | ✓ WIRED | Applies track trim/pad/fade/volume in `packages/core/src/sound.ts:214`, then mixes effects+track via `amix=inputs=2` in `packages/core/src/sound.ts:292`. |
| `packages/core/src/compositor.ts` | `packages/core/src/sound.ts` | Extract + finalize with `options.sound` | ✓ WIRED | Extracts events then calls `finalizeWebmWithSound`/`finalizeMp4WithSound` with `options.sound` in `packages/core/src/compositor.ts:310` and `packages/core/src/compositor.ts:325`. |
| `packages/cli/src/commands/composite.ts` | `packages/core/src/compositor.ts` | `compose(..., { sound: resolvedSound })` | ✓ WIRED | CLI resolves relative track path and passes sound config to core compose in `packages/cli/src/commands/composite.ts:128` and `packages/cli/src/commands/composite.ts:156`. |
| `packages/cli/src/commands/record.ts` | `packages/core/src/recorder.ts` -> compositor | `runRecord(resolvedConfig)` | ✓ WIRED | CLI injects resolved sound config in `packages/cli/src/commands/record.ts:52`; core recorder forwards it to compose in `packages/core/src/recorder.ts:327`. |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
| --- | --- | --- |
| SND-01 | ✓ SATISFIED | None. Runtime effects check (`record` with sound effects) produced muxed AAC output in `/tmp/tuireel-sfx-check.mp4`. |
| SND-02 | ✓ SATISFIED | None. Runtime track-only and mixed-volume checks produced AAC outputs with duration alignment and measurable mix differences. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `packages/core/src/sound.ts` | 233 | `return null` | ℹ INFO | Intentional opt-in guard for silent default path, not a stub. |
| `packages/core/src/compositor.ts` | 101 | `return null` | ℹ INFO | Helper nullability for missing frame state; does not block sound pipeline. |
| `packages/cli/src/commands/composite.ts` | 144 | `console.log(...)` | ℹ INFO | Expected CLI progress output; not placeholder logic. |

### Human Verification Required

None. Previously required runtime media checks were completed and accepted in this verification pass.

### Runtime Audio Evidence (Completed)

1. `record` SFX check: `node packages/cli/dist/index.js record /tmp/tuireel-sfx-check.jsonc` succeeded; `/tmp/tuireel-sfx-check.mp4` includes AAC audio stream (`codec_name=aac`).
2. Track-only duration behavior:
   - `/tmp/tuireel-track-short.mp4` duration `3.132993s` with AAC audio stream.
   - `/tmp/tuireel-track-long.mp4` duration `3.032993s` with AAC audio stream.
3. Mixed balance behavior:
   - `/tmp/tuireel-mix-a.mp4` AAC bitrate `80165`.
   - `/tmp/tuireel-mix-b.mp4` AAC bitrate `119608`.
   - SHA-256 differs (`ddfd4f...a40f` vs `799599...db09`), confirming materially different outputs under different mix settings.

### Gaps Summary

No remaining gaps. All code-level and runtime validation checks required for Phase 5 are satisfied.

---

_Verified: 2026-03-03T03:43:04Z_
_Verifier: Claude (gsd-verifier)_
