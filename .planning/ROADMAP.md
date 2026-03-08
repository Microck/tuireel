# Roadmap: Tuireel

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-03-03)
- ✅ **v1.1 Branding, Docs & Hardening** - Phases 7-19 (shipped 2026-03-05)
- ✅ **v1.15 Brand Refresh & Docs Hosting** - Phases 20-24 (shipped 2026-03-05)
- 🚧 **v1.2 Human Demo Feel** - Phases 25-29 (planned)

## Active Milestone

### 🚧 v1.2 Human Demo Feel (Phases 25-29)

**Milestone Goal:** Make Tuireel demos feel human by improving pacing, pause behavior, capture fidelity, and 1080p readability without faking terminal motion.

## Overview

v1.2 turns Tuireel's next quality gap into five delivery boundaries: lock the pacing and artifact contract first, make typing and pauses feel intentional, keep 1080p output readable by default, capture enough real terminal states for smoother playback, then ship the debug and acceptance surface that proves the milestone works.

## Phases

**Phase Numbering:**

- Integer phases (25, 26, 27): Planned milestone work
- Decimal phases (25.1, 25.2): Urgent insertions if needed later

- [x] **Phase 25: Timing Contract and Profiles** - Separate capture/output semantics, named delivery presets, and recomposite-safe timing metadata. (gap closure planned) (completed 2026-03-08)
- [ ] **Phase 26: Human Pacing Engine** - Deliver deterministic cadence, pause beats, and scoped timing overrides.
- [ ] **Phase 27: Readable 1080p Defaults** - Make 1080p terminal output legible and naturally framed by default.
- [ ] **Phase 28: Capture Fidelity and Final Motion** - Capture more real terminal states and package them into smooth playback without changing authored timing.
- [ ] **Phase 29: Diagnostics and Acceptance Gates** - Expose pacing/fidelity inspection tools and fixture-backed milestone verification.

## Phase Details

### Phase 25: Timing Contract and Profiles

**Goal**: Authors can choose stable pacing and delivery semantics that survive recording and recompositing.
**Depends on**: Phase 24 (prior milestone shipped)
**Requirements**: CAP-01, CAP-04, READ-03
**Success Criteria** (what must be TRUE):

1. Author can set raw capture cadence separately from final delivery FPS without ambiguity in config or presets.
2. Author can choose a named output preset for a common delivery target and get the expected timing/render profile without hand-tuning low-level knobs.
3. A saved recording can be recomposited later and preserve the same timing intent and motion behavior as the original run.

**Plans**: 5 plans

Plans:

- [ ] `25-01-PLAN.md` - Add the core delivery-profile schema, resolver, and precedence contract.
- [ ] `25-02-PLAN.md` - Make `init`, docs, and examples teach delivery profiles and split fps/captureFps semantics correctly.
- [ ] `25-03-PLAN.md` - Persist explicit timing contracts and compatibility helpers in saved artifacts.
- [ ] `25-04-PLAN.md` - Enforce recomposite timing compatibility in `composite` and CLI tests.
- [ ] `25-05-PLAN.md` - Close the verification gap with core recomposite coverage for saved timing artifacts and legacy fallback semantics.

### Phase 26: Human Pacing Engine

**Goal**: Recorded terminal interactions feel intentionally human instead of robotic.
**Depends on**: Phase 25
**Requirements**: PACE-01, PACE-02, PACE-03
**Success Criteria** (what must be TRUE):

1. Typed text follows a deterministic human-feeling cadence profile without the author tuning every script step by hand.
2. Startup, settle, read, and idle moments appear as intentional beats instead of flat uniform pauses.
3. Author can override timing for specific `type` and `pause` steps while the rest of the recording still follows the selected pacing model.

**Plans**: 2 plans

Plans:

- [ ] `26-01-PLAN.md` — Cadence profile data model, profile-aware charDelay, and pacing config schema.
- [ ] `26-02-PLAN.md` — Beat injection in step executor and profile-aware typeStep with per-step overrides.

### Phase 27: Readable 1080p Defaults

**Goal**: Default 1080p output is readable and naturally framed in finished demos.
**Depends on**: Phase 25
**Requirements**: READ-01, READ-02
**Success Criteria** (what must be TRUE):

1. A standard 1080p demo render keeps terminal text legible in the exported video without per-demo readability tweaking.
2. Default framing keeps the terminal window naturally sized within a 1080p canvas instead of feeling cramped, tiny, or over-zoomed.
3. Authors can rely on the built-in 1080p defaults to keep typical terminal sessions readable across representative demo fixtures.

**Plans**: 1 plan

Plans:

- [ ] `27-01-PLAN.md` — Tune readable-1080p profile defaults and prove readability with fixture tests and compositor framing assertions.

### Phase 28: Capture Fidelity and Final Motion

**Goal**: Finished videos look smoother because Tuireel captures and replays more authentic terminal states.
**Depends on**: Phase 26, Phase 27
**Requirements**: CAP-02, CAP-03
**Success Criteria** (what must be TRUE):

1. Short typing bursts and other visible transitions show intermediate real terminal states instead of collapsing into a single visual jump.
2. Final output plays at the target FPS while preserving the authored wall-clock timing of the demo.
3. Viewers see smoother motion in the finished video without fake in-between terminal glyph frames.

**Plans**: 2 plans

Plans:

- [ ] `28-01-PLAN.md` — Widen capture heuristic to always capture typed characters and add post-step captureNow() hooks for press/scroll/wait.
- [ ] `28-02-PLAN.md` — Fix outputFrameCount to be timeline-driven, ensuring wall-clock timing preserved under dense capture.

### Phase 29: Diagnostics and Acceptance Gates

**Goal**: Authors can verify, inspect, and debug human-feeling demo output with concrete evidence.
**Depends on**: Phase 28
**Requirements**: DIAG-04, DIAG-05, DIAG-06
**Success Criteria** (what must be TRUE):

1. Authors can run acceptance fixtures that verify pacing, readability, and smooth output behavior on representative demos.
2. Authors can inspect one run's pacing stats, including raw frame count, durations, and output metadata, without digging through source code.
3. Authors can dump raw rendered frames from a recording and compare them with final output when diagnosing fidelity issues.

**Plans**: 3 plans

Plans:

- [ ] `29-01-PLAN.md` — Core diagnostics module (probe-video, inspect, frame-dumper) with unit tests.
- [ ] `29-02-PLAN.md` — CLI commands (tuireel inspect + tuireel dump-frames) wired to Commander.
- [ ] `29-03-PLAN.md` — Acceptance fixture tests proving pacing, readability, and smooth output.

## Archived Milestones

<details>
<summary>✅ v1.0 MVP (Phases 1-6) - SHIPPED 2026-03-03</summary>

Archive:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/MILESTONES.md`

6 phases, 23 plans, 50 tasks completed.

</details>

<details>
<summary>✅ v1.1 Branding, Docs & Hardening (Phases 7-19) - SHIPPED 2026-03-05</summary>

Archive:

- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md`
- `.planning/MILESTONES.md`

13 phases, 38 plans, 65 tasks completed.

</details>

<details>
<summary>✅ v1.15 Brand Refresh & Docs Hosting (Phases 20-24) - SHIPPED 2026-03-05</summary>

Archive:

- `.planning/MILESTONES.md`

5 phases, 5 plans completed.

</details>

## Progress

**Execution Order:**
25 -> 26 -> 27 -> 28 -> 29

| Phase                                 | Plans Complete | Status      | Completed |
| ------------------------------------- | -------------- | ----------- | --------- |
| 25. Timing Contract and Profiles      | 5/5 | Complete    | 2026-03-08 |
| 26. Human Pacing Engine               | 1/2 | In Progress|  |
| 27. Readable 1080p Defaults           | 0/TBD          | Not started | -         |
| 28. Capture Fidelity and Final Motion | 0/2            | Not started | -         |
| 29. Diagnostics and Acceptance Gates  | 0/TBD          | Not started | -         |
