---
phase: 04-overlay-system
verified: 2026-03-03T02:59:48Z
status: passed
score: 20/20 must-haves verified
re_verification:
  previous_status: human_needed
  previous_score: 19/20
  gaps_closed:
    - "Cursor and HUD positioning validated on wide and small captures without clipping"
    - "Long-travel jitter behavior validated visually and with bezier regression tests"
  gaps_remaining: []
  regressions: []
---

# Phase 4: Overlay System Verification Report

**Phase Goal:** Add the cursor overlay, keystroke HUD, and two-pass compositing pipeline.
**Verified:** 2026-03-03T02:59:48Z
**Status:** passed
**Re-verification:** Yes - after completed runtime visual checks

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | InteractionTimeline records per-frame cursor position and keystroke state | ✓ VERIFIED | `tick()` captures frame state and increments frame (`packages/core/src/timeline/interaction-timeline.ts:191`, `packages/core/src/timeline/interaction-timeline.ts:209`); regression test still passes (`packages/core/src/timeline/__tests__/interaction-timeline.test.ts:10`). |
| 2 | Timeline serializes to JSON and deserializes losslessly | ✓ VERIFIED | `toJSON()` + `load()` are present (`packages/core/src/timeline/interaction-timeline.ts:263`, `packages/core/src/timeline/interaction-timeline.ts:279`); roundtrip test passes (`packages/core/src/timeline/__tests__/interaction-timeline.test.ts:43`). |
| 3 | Timeline saves to disk and loads from disk | ✓ VERIFIED | `save()` + `fromFile()` exist (`packages/core/src/timeline/interaction-timeline.ts:275`, `packages/core/src/timeline/interaction-timeline.ts:298`); persistence test passes (`packages/core/src/timeline/__tests__/interaction-timeline.test.ts:61`). |
| 4 | Only keyframes with state changes are stored; interpolation fills gaps | ✓ VERIFIED | Change-only keyframe push and interpolation remain wired (`packages/core/src/timeline/interaction-timeline.ts:312`, `packages/core/src/timeline/interaction-timeline.ts:251`); keyframe test passes (`packages/core/src/timeline/__tests__/interaction-timeline.test.ts:110`). |
| 5 | Sound events are recorded with frame-accurate timestamps | ✓ VERIFIED | `addEvent()` stamps current frame/time (`packages/core/src/timeline/interaction-timeline.ts:183`); frame-accurate event test passes (`packages/core/src/timeline/__tests__/interaction-timeline.test.ts:96`). |
| 6 | Cursor path computation produces smooth Bezier movement with human-like easing | ✓ VERIFIED | Bezier control/eval and easing are implemented (`packages/core/src/overlay/bezier.ts:19`, `packages/core/src/overlay/bezier.ts:32`, `packages/core/src/overlay/bezier.ts:52`); behavior tests pass (`packages/core/src/overlay/__tests__/bezier.test.ts:57`). |
| 7 | Micro-jitter reaches visible 1-2px range on long moves, peaks mid-path, and fades near endpoints | ✓ VERIFIED | New jitter envelope uses distance ramp + long-move boost (`packages/core/src/overlay/bezier.ts:60`); regression tests enforce `>=1` mid jitter and endpoint decay (`packages/core/src/overlay/__tests__/bezier.test.ts:92`, `packages/core/src/overlay/__tests__/bezier.test.ts:130`). |
| 8 | Movement duration scales with distance (sqrt distance) | ✓ VERIFIED | `moveDuration()` still uses sqrt distance scaling (`packages/core/src/overlay/bezier.ts:72`); monotonic duration test passes (`packages/core/src/overlay/__tests__/bezier.test.ts:67`). |
| 9 | Cursor renderer outputs compositable PNG and consumes shared overlay contracts | ✓ VERIFIED | Renderer imports shared `CursorConfig`/`CursorImage` (`packages/core/src/overlay/cursor-renderer.ts:2`) and returns PNG buffer (`packages/core/src/overlay/cursor-renderer.ts:31`); compositor consumes `CursorImage` (`packages/core/src/compositor.ts:15`, `packages/core/src/compositor.ts:227`). |
| 10 | Cursor SVG is configurable (custom SVG or default) | ✓ VERIFIED | Default SVG fallback and optional custom SVG remain (`packages/core/src/overlay/cursor-renderer.ts:4`, `packages/core/src/overlay/cursor-renderer.ts:29`); custom SVG test passes (`packages/core/src/overlay/__tests__/cursor-renderer.test.ts:18`). |
| 11 | Keystroke HUD renders key labels as visual badges | ✓ VERIFIED | HUD emits badge rect/text nodes per key (`packages/core/src/overlay/hud-renderer.ts:113`, `packages/core/src/overlay/hud-renderer.ts:116`). |
| 12 | Multiple simultaneous keys stack horizontally | ✓ VERIFIED | Labels become horizontal item sequence with plus separators (`packages/core/src/overlay/hud-renderer.ts:82`, `packages/core/src/overlay/hud-renderer.ts:121`). |
| 13 | HUD supports configurable position/colors/font | ✓ VERIFIED | HUD merges config and applies style/position (`packages/core/src/overlay/hud-renderer.ts:65`, `packages/core/src/overlay/hud-renderer.ts:98`, `packages/core/src/overlay/hud-renderer.ts:136`). |
| 14 | HUD renderer outputs Sharp-compositable PNG with alpha | ✓ VERIFIED | HUD rasterizes SVG to PNG (`packages/core/src/overlay/hud-renderer.ts:131`) and compositor overlays returned image (`packages/core/src/compositor.ts:272`). |
| 15 | HUD opacity parameter controls fade visibility | ✓ VERIFIED | Opacity is clamped and applied to `<g opacity=...>` (`packages/core/src/overlay/hud-renderer.ts:70`, `packages/core/src/overlay/hud-renderer.ts:104`). |
| 16 | `tuireel composite` reads saved timeline + raw video and produces overlaid output | ✓ VERIFIED | CLI checks artifact existence, loads timeline JSON, and calls `compose()` (`packages/cli/src/commands/composite.ts:114`, `packages/cli/src/commands/composite.ts:122`, `packages/cli/src/commands/composite.ts:128`); compositor integration test passes (`packages/core/src/__tests__/compositor.test.ts:70`). |
| 17 | Re-running composite with changed overlay settings applies changes without re-recording | ✓ VERIFIED | CLI options still expose `--cursor-size`, `--no-cursor`, `--no-hud` and pass runtime overlay options (`packages/cli/src/commands/composite.ts:103`, `packages/cli/src/commands/composite.ts:130`, `packages/cli/src/commands/composite.ts:134`). |
| 18 | Record pass saves InteractionTimeline JSON alongside raw video in `.tuireel` | ✓ VERIFIED | Recorder resolves `.tuireel/raw` + `.tuireel/timelines`, creates dirs, saves timeline JSON (`packages/core/src/recorder.ts:17`, `packages/core/src/recorder.ts:234`, `packages/core/src/recorder.ts:325`). |
| 19 | Cursor and HUD are correctly positioned in composited output | ✓ VERIFIED | Runtime checks succeeded on two sizes: `node packages/cli/dist/index.js record /tmp/tuireel-overlay-wide.jsonc`, `node packages/cli/dist/index.js composite /tmp/tuireel-overlay-wide.jsonc`, `node packages/cli/dist/index.js record /tmp/tuireel-overlay-small.jsonc`, `node packages/cli/dist/index.js composite /tmp/tuireel-overlay-small.jsonc`; sampled frames (`/tmp/overlay-wide-1.png`, `/tmp/overlay-wide-2.png`, `/tmp/overlay-small-1.png`, `/tmp/overlay-small-2.png`) show cursor/HUD within bounds with no clipping. |
| 20 | Composite supports MP4, WebM, and GIF outputs | ✓ VERIFIED | Output format enum includes all three (`packages/core/src/config/schema.ts:6`), encoder profiles include all three with GIF two-pass (`packages/core/src/encoding/encoder-profiles.ts:19`), CLI parser still validates formats (`packages/cli/src/commands/composite.ts:26`). |

**Score:** 20/20 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/core/src/overlay/bezier.ts` | Jitter envelope and cursor path math | ✓ VERIFIED | Exists (119 lines), substantive implementation, exported functions (`moveDuration`, `computeCursorPath`), used by recorder/tests (`packages/core/src/recorder.ts:12`). |
| `packages/core/src/overlay/__tests__/bezier.test.ts` | Jitter magnitude + endpoint decay regression tests | ✓ VERIFIED | Exists (132 lines), non-stub tests include long-move magnitude and endpoint decay assertions (`packages/core/src/overlay/__tests__/bezier.test.ts:76`, `packages/core/src/overlay/__tests__/bezier.test.ts:96`). |
| `packages/core/src/overlay/types.ts` | Shared cursor/HUD contracts | ✓ VERIFIED | Exists (42 lines), exports `CursorImage`/`CursorConfig` and defaults (`packages/core/src/overlay/types.ts:7`, `packages/core/src/overlay/types.ts:39`), imported by renderer/compositor/tests. |
| `packages/core/src/overlay/cursor-renderer.ts` | Cursor renderer typed against shared contracts | ✓ VERIFIED | Exists (38 lines), imports shared types (`packages/core/src/overlay/cursor-renderer.ts:2`), exports renderer (`packages/core/src/overlay/cursor-renderer.ts:22`), used by compositor/tests. |
| `packages/core/src/overlay/__tests__/cursor-renderer.test.ts` | Renderer contract regression tests | ✓ VERIFIED | Exists (39 lines), validates PNG signature/default sizing/custom sizing (`packages/core/src/overlay/__tests__/cursor-renderer.test.ts:9`, `packages/core/src/overlay/__tests__/cursor-renderer.test.ts:18`). |
| `packages/core/src/compositor.ts` | Two-pass compose engine with cursor/HUD overlay wiring | ✓ VERIFIED | Exists (299 lines), imports shared cursor/hud types (`packages/core/src/compositor.ts:15`), calls both renderers, and encodes by format profile. |
| `packages/core/src/timeline/interaction-timeline.ts` | Timeline capture/serialize/load behavior | ✓ VERIFIED | Exists (347 lines), key methods unchanged and covered by passing regression tests. |
| `packages/core/src/overlay/hud-renderer.ts` | HUD badge renderer | ✓ VERIFIED | Exists (145 lines), substantive SVG layout + PNG rasterization used by compositor. |
| `packages/cli/src/commands/composite.ts` | CLI re-composite command | ✓ VERIFIED | Exists (148 lines), command + flags + compose handoff intact. |
| `packages/core/src/recorder.ts` | Raw/timeline persistence for two-pass flow | ✓ VERIFIED | Exists (347 lines), persists timeline and triggers compose pass. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `packages/core/src/overlay/bezier.ts` | `packages/core/src/overlay/__tests__/bezier.test.ts` | long-move jitter assertions | ✓ WIRED | Tests invoke `computeCursorPath()` and enforce jitter envelope/decay (`packages/core/src/overlay/__tests__/bezier.test.ts:81`, `packages/core/src/overlay/__tests__/bezier.test.ts:92`, `packages/core/src/overlay/__tests__/bezier.test.ts:130`). |
| `packages/core/src/overlay/cursor-renderer.ts` | `packages/core/src/overlay/types.ts` | shared `CursorConfig` + `CursorImage` import | ✓ WIRED | Direct import now present (`packages/core/src/overlay/cursor-renderer.ts:2`), replacing prior local contract divergence. |
| `packages/core/src/compositor.ts` | `packages/core/src/overlay/cursor-renderer.ts` | `renderCursor()` typed integration | ✓ WIRED | `renderCursor(options.cursorConfig)` result cached as `CursorImage` and used in overlays (`packages/core/src/compositor.ts:227`, `packages/core/src/compositor.ts:237`, `packages/core/src/compositor.ts:252`). |
| `packages/core/src/compositor.ts` | `packages/core/src/overlay/hud-renderer.ts` | `renderHud()` overlay generation | ✓ WIRED | HUD image is rendered and composited when labels exist (`packages/core/src/compositor.ts:262`, `packages/core/src/compositor.ts:272`). |
| `packages/cli/src/commands/composite.ts` | `packages/core/src/compositor.ts` | CLI `compose()` call | ✓ WIRED | CLI imports core compose and calls it with selected options (`packages/cli/src/commands/composite.ts:10`, `packages/cli/src/commands/composite.ts:128`). |
| `packages/core/src/recorder.ts` | `packages/core/src/timeline/interaction-timeline.ts` | timeline save/load handoff | ✓ WIRED | Recorder instantiates timeline, saves JSON artifact, then composes (`packages/core/src/recorder.ts:248`, `packages/core/src/recorder.ts:325`, `packages/core/src/recorder.ts:327`). |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
| --- | --- | --- |
| OVR-01 | ✓ SATISFIED | Jitter envelope remains covered in code/tests (`packages/core/src/overlay/bezier.ts:60`, `packages/core/src/overlay/__tests__/bezier.test.ts:92`) and runtime behavior was validated with visual frame review and `pnpm -C packages/core test -- src/overlay/__tests__/bezier.test.ts`. |
| OVR-02 | ✓ SATISFIED | HUD renderer and compositing integration remain implemented and wired. |
| OVR-03 | ✓ SATISFIED | Re-composite flow uses saved raw video + timeline artifacts. |
| OVR-04 | ✓ SATISFIED | Recorder persists timeline JSON under `.tuireel/timelines`. |
| CLI-07 | ✓ SATISFIED | `tuireel composite` command and format/options parsing remain active. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `packages/cli/src/commands/stubs.ts` | 17 | `Not yet implemented. Coming in Phase ...` log | ℹ INFO | Expected Phase 6 `preview` stub; not part of Phase 4 goal and not blocking. |

### Runtime Visual Verification (Completed)

- Overlay positioning check completed on wide and small captures (`/tmp/tuireel-overlay-wide.jsonc`, `/tmp/tuireel-overlay-small.jsonc`) with successful `record` and `composite` runs.
- Frame samples (`/tmp/overlay-wide-1.png`, `/tmp/overlay-wide-2.png`, `/tmp/overlay-small-1.png`, `/tmp/overlay-small-2.png`) were analyzed with image-understanding; verdict: cursor/HUD visible, within frame bounds, and no clipping or major artifacts.
- Motion/jitter regression validation confirmed with passing test run: `pnpm -C packages/core test -- src/overlay/__tests__/bezier.test.ts`.

### Gaps Summary

No remaining gaps. Automated coverage and runtime visual checks now agree: cursor/HUD overlays render correctly across tested sizes, jitter behavior remains within the intended envelope, and the two-pass pipeline functions end-to-end.

---

_Verified: 2026-03-03T02:59:48Z_
_Verifier: Claude (gsd-verifier)_
