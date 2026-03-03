---
phase: 8
plan: 3
subsystem: presets
tags: [presets, config-loading, init-command, cursor, hud]
dependency-graph:
  requires: [08-01, 08-02]
  provides: [preset-wiring, init-preset-prompt, cursor-passthrough, hud-passthrough]
  affects: [config-loading, recording-pipeline, cli-init]
tech-stack:
  patterns: [preset-resolution-before-validation, interactive-tty-prompt]
key-files:
  modified:
    - packages/core/src/config/loader.ts
    - packages/core/src/index.ts
    - packages/cli/src/commands/init.ts
  already-committed:
    - packages/core/src/recorder.ts
decisions:
  - Preset resolution runs before Zod validation and step-type checks
  - Init preset prompt only appears when stdin is a TTY (non-interactive skips)
  - Recorder HUD/cursor passthrough was already committed in prior plan
metrics:
  duration: 3m 26s
  completed: 2026-03-03
---

# Phase 8 Plan 3: Preset Wiring + Init Prompt + Cursor/HUD Passthrough Summary

Wire preset resolution into the config loading pipeline, add interactive preset selection to `tuireel init`, and pass cursor/hud config through to the compositor.

## Tasks Completed

### Task 1: Wire preset resolution into config loader

- Added `resolvePreset()` import to `loader.ts`
- Inserted preset resolution in `parseSingleConfig()` — happens after JSON parse, before Zod validation
- Inserted preset resolution in `loadConfigFromString()` — same position, ensures multi-video configs also resolve presets
- Exported `PRESET_NAMES` and `PresetName` type from `@tuireel/core` index

### Task 2: Add preset prompt to init + cursor/HUD passthrough

**Part A — Init command:**
- Added interactive `promptPreset()` function using `readline` interface
- Prompt only appears when `stdin.isTTY` is true (CI/pipes skip gracefully)
- Shows numbered list of presets with descriptions (polished, minimal, demo, silent, none)
- Updated `createStarterConfig()` to optionally include `"preset"` field in generated JSONC
- Prints "Using preset: X" confirmation when preset is selected

**Part B — Cursor/HUD passthrough:**
- Recorder.ts already had cursor and HUD passthrough changes committed in a prior plan execution
- `cursorConfig: { visible }` is passed to `compose()` options
- HUD visibility check (`config.hud?.visible ?? true`) gates `timeline.showHud()` calls
- When HUD is hidden, `addEvent("key")` still fires (sound events remain independent)

## Commits

| Hash | Message |
|------|---------|
| `16de914` | feat(08-03): wire preset resolution into config loading pipeline |
| `d4b3ccd` | feat(08-03): add preset prompt to init command |

## Requirements Addressed

- **PRST-01**: Preset resolution wired into config loading (both single and multi-video paths)
- **PRST-02**: Init command offers interactive preset selection
- **PRST-04**: Cursor and HUD config passed through to compositor (already committed)

## Deviations from Plan

### Already-committed changes

**Recorder.ts cursor/hud passthrough** — The changes to `recorder.ts` (HUD visibility gating and `cursorConfig` passthrough to `compose()`) were already present in HEAD when this plan executed. They were committed as part of a prior plan (08-04). No re-application was needed.

## Verification

```
pnpm build → 2 packages, 0 errors, 8.455s
```

Both `@tuireel/core` and `tuireel` CLI build cleanly with all changes.

## Self-Check: PASSED

- [x] `packages/core/src/config/loader.ts` — FOUND, contains `resolvePreset` import and calls
- [x] `packages/core/src/index.ts` — FOUND, exports `PRESET_NAMES` and `PresetName`
- [x] `packages/cli/src/commands/init.ts` — FOUND, contains `promptPreset` and updated `createStarterConfig`
- [x] Commit `16de914` — FOUND
- [x] Commit `d4b3ccd` — FOUND
