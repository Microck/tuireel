# Roadmap: Tuireel

**Created:** 2025-07-26
**Depth:** Standard
**Phases:** 6
**Requirements:** 37 mapped / 37 total

---

## Phase 1: Foundation

**Goal:** Establish the monorepo, config system, and ffmpeg availability so all subsequent phases have infrastructure to build on.
**Requirements:** INF-02, CLI-01, CLI-02, CLI-05, CLI-06, REC-08

### Success Criteria
1. Running `tuireel init` produces a valid `.tuireel.jsonc` starter config with `$schema` reference
2. Running `tuireel validate` on the init-generated config reports zero errors
3. Running `tuireel validate` on a malformed config surfaces clear, actionable error messages
4. On first invocation, ffmpeg is downloaded to `~/.tuireel/` and subsequent runs reuse the cached binary
5. The monorepo builds cleanly: `@tuireel/core` exports a public API, `tuireel` CLI binary resolves commands

### Plans: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Monorepo scaffold (pnpm + Turborepo + both packages)
- [ ] 01-02-PLAN.md — Config schema, JSONC parser, JSON Schema generation (TDD)
- [ ] 01-03-PLAN.md — ffmpeg auto-download with platform detection and caching
- [ ] 01-04-PLAN.md — CLI commands: init, validate, and stub commands

---

## Phase 2: Core Pipeline

**Goal:** Drive a TUI app through scripted steps and produce a basic MP4 video — the minimum end-to-end recording loop.
**Requirements:** REC-01, REC-02, REC-03, REC-06, REC-07, STEP-01, STEP-02, STEP-03, STEP-04, CLI-03

### Success Criteria
1. User defines a config with `launch`, `type`, `press`, `wait`, and `pause` steps, runs `tuireel record`, and gets a playable MP4
2. The MP4 shows the correct terminal content at each step (pixel-perfect frames from tuistory)
3. User can configure frame rate and terminal viewport (cols/rows) in the config and the output reflects those settings
4. The recording pipeline handles tuistory idle detection correctly — no missing frames during fast TUI updates

**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md — Session wrapper + step executor (tuistory integration, 5 step types, human-like typing)
- [ ] 02-02-PLAN.md — Frame capture + ffmpeg encoding + CLI wiring (screenshot loop, image2pipe, `tuireel record`)

---

## Phase 3: Output Quality

**Goal:** Produce production-quality output in all three formats (MP4, WebM, GIF) with terminal theming.
**Requirements:** REC-04, REC-05, THM-01, THM-02

### Success Criteria
1. Running `tuireel record --format webm` produces a valid, well-compressed WebM file
2. Running `tuireel record --format gif` produces an optimized GIF with correct palette (two-pass palettegen)
3. User can set `theme: "catppuccin"` in config and the output uses Catppuccin colors, or define a full custom theme object
4. Themed output has correct colors, font rendering, and padding — visual parity with tuistory's standalone screenshot rendering

**Plans:** 2 plans

Plans:
- [ ] 03-01-PLAN.md — WebM VP9 + GIF two-pass palettegen encoding
- [ ] 03-02-PLAN.md — Terminal theming (8 built-in + custom themes)

---

## Phase 4: Overlay System

**Goal:** Add the cursor overlay, keystroke HUD, and two-pass compositing pipeline — Tuireel's key differentiators.
**Requirements:** OVR-01, OVR-02, OVR-03, OVR-04, CLI-07

### Success Criteria
1. Enabling cursor overlay in config renders an animated cursor that moves smoothly between interaction targets with human-like Bézier easing
2. Enabling keystroke HUD renders a visual overlay showing pressed keys that fades in/out naturally
3. Running `tuireel composite` on a previously saved InteractionTimeline produces new output without re-recording
4. Changing overlay settings and re-running `tuireel composite` applies the changes to the existing recording

### Plans (estimated)
- Plan 4.1: InteractionTimeline — Data structure for per-frame cursor position, keystroke state, sound events; serialize to/from disk
- Plan 4.2: Cursor overlay — Sharp-based cursor renderer, Fitts's law Bézier easing, micro-jitter, cursor appearance config
- Plan 4.3: Keystroke HUD overlay — Sharp-based key badge renderer, fade animation, layout/positioning, style config
- Plan 4.4: Two-pass compositor — Orchestrate overlay rendering, ffmpeg overlay filter, `composite` CLI command wiring

---

## Phase 5: Sound

**Goal:** Add sound effects synced to terminal interactions and custom audio track mixing.
**Requirements:** SND-01, SND-02

### Success Criteria
1. Enabling sound effects produces an MP4 with audible key/click sounds synced to the exact frame of each interaction
2. User can mix in a custom audio track (background music) that plays alongside or instead of sound effects
3. Sound-free output remains the default — enabling sound is opt-in and does not affect users who don't configure it

### Plans: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Sound effects engine (assets, extraction, ffmpeg audio builder, config schema, tests)
- [ ] 05-02-PLAN.md — Custom audio track mixing + compositor/CLI integration

---

## Phase 6: Workflow & Polish

**Goal:** Complete the developer experience with preview mode, watch mode, multi-video configs, shared includes, and npm/Bun distribution.
**Requirements:** STEP-05, STEP-06, STEP-07, STEP-08, STEP-09, CLI-04, CLI-08, CLI-09, CLI-10, INF-01

### Success Criteria
1. Running `tuireel preview` executes the script in a visible terminal without producing video output
2. Running `tuireel record --watch` re-records automatically when the config file changes
3. A config file defining multiple videos produces all of them in a single `tuireel record` invocation
4. Shared step includes (`$include`) resolve correctly and the same step sequence can be reused across videos
5. The package is installable and runnable via both `npx tuireel` and `bunx tuireel`

### Plans (estimated)
- Plan 6.1: Advanced steps — Implement `scroll`, `click`, `screenshot`, `resize`, and `set-env` step types
- Plan 6.2: Preview mode — Execute steps in visible terminal via tuistory, skip capture/encoding, `preview` CLI command
- Plan 6.3: Watch mode — File watcher (chokidar) on config, debounced re-trigger of record pipeline
- Plan 6.4: Multi-video & includes — Config resolver for `videos[]` array, `$include` directive, shared step sequences
- Plan 6.5: Distribution — npm package config, bin entrypoint, `npx`/`bunx` compatibility testing, README

---

## Coverage Verification

All 37 v1 requirements mapped:

| Category | IDs | Phase | Count |
|----------|-----|-------|-------|
| Recording Core | REC-01, REC-02, REC-03, REC-06, REC-07 | 2 | 5 |
| Recording Core | REC-04 | 3 | 1 |
| Recording Core | REC-05 | 3 | 1 |
| Recording Core | REC-08 | 1 | 1 |
| Step Types | STEP-01, STEP-02, STEP-03, STEP-04 | 2 | 4 |
| Step Types | STEP-05, STEP-06, STEP-07, STEP-08, STEP-09 | 6 | 5 |
| Overlay System | OVR-01, OVR-02, OVR-03, OVR-04 | 4 | 4 |
| Terminal Theming | THM-01, THM-02 | 3 | 2 |
| Sound | SND-01, SND-02 | 5 | 2 |
| Config & CLI | CLI-01, CLI-02, CLI-05, CLI-06 | 1 | 4 |
| Config & CLI | CLI-03 | 2 | 1 |
| Config & CLI | CLI-07 | 4 | 1 |
| Config & CLI | CLI-04, CLI-08, CLI-09, CLI-10 | 6 | 4 |
| Infrastructure | INF-02 | 1 | 1 |
| Infrastructure | INF-01 | 6 | 1 |
| **Total** | | | **37** |

---
*Roadmap created: 2025-07-26*
