# Roadmap: Tuireel

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-03-03)
- ✅ **v1.1 Branding, Docs & Hardening** - Phases 7-19 (shipped 2026-03-05)
- ✅ **v1.15 Brand Refresh & Docs Hosting** - Phases 20-24 (shipped 2026-03-05)
- 🟡 **v1.2 Human Demo Feel** - Phases 25-37 (post-audit cleanup planned 2026-03-09)

## Current Milestone

### v1.2 Human Demo Feel (Phases 25-37)

**Milestone Goal:** Make Tuireel demos feel human by improving pacing, pause behavior, capture fidelity, and 1080p readability without faking terminal motion.

## Overview

v1.2 shipped its requirement scope and passed milestone audit coverage, then surfaced a small set of post-audit cleanup items. Phases 30-33 re-closed the milestone acceptance surface; phases 34-37 are planned follow-up work for capture-fidelity debt and Nyquist normalization without changing the shipped milestone scope.

## Phases

**Phase Numbering:**

- Integer phases (25, 26, 27): Planned milestone work
- Decimal phases (25.1, 25.2): Urgent insertions if needed later
- Phase 30-33 entries: Gap-closure work that re-closed the milestone acceptance surface
- Phase 34+ entries: Post-audit cleanup and Nyquist normalization for the same milestone

- [x] **Phase 25: Timing Contract and Profiles** - Separate capture/output semantics, named delivery presets, and recomposite-safe timing metadata. (completed 2026-03-08)
- [x] **Phase 26: Human Pacing Engine** - Deliver deterministic cadence, pause beats, scoped timing overrides, and runtime pacing handoff in preview/record flows. (completed 2026-03-08)
- [x] **Phase 27: Readable 1080p Defaults** - Make 1080p terminal output legible and naturally framed by default. (completed 2026-03-08)
- [x] **Phase 28: Capture Fidelity and Final Motion** - Capture more real terminal states and package them into smooth playback without changing authored timing. (completed 2026-03-08)
- [x] **Phase 29: Diagnostics and Acceptance Gates** - Expose pacing/fidelity inspection tools and fixture-backed milestone verification. (completed 2026-03-09)
- [x] **Phase 30: Pacing Provenance and Acceptance (GAP CLOSURE)** - Preserve full pacing provenance and prove paced flows end to end. (completed 2026-03-09)
- [x] **Phase 31: Readable 1080p Acceptance Proof (GAP CLOSURE)** - Prove readable-1080p output on exported artifacts, not just structural proxies. (completed 2026-03-09)
- [x] **Phase 32: Final Output Continuity Gate (GAP CLOSURE)** - Re-close the milestone acceptance surface by proving smoothness on final output artifacts. (completed 2026-03-09)
- [x] **Phase 33: Combined Acceptance Stability Gate (GAP CLOSURE)** - Re-stabilize the shipped pacing/readability/smoothness acceptance trio as one reliable milestone gate. (completed 2026-03-09)
- [ ] **Phase 34: Capture Fidelity Debt Cleanup** - Replace the weak Phase 28 capture-policy proof and remove or rewire stale capture helper surface. (planned)
- [ ] **Phase 35: Acceptance Stability Automation** - Turn the repeated-run Phase 33 proof into an automated gate instead of verification-only evidence. (planned)
- [ ] **Phase 36: Nyquist Backfill for Feature Phases** - Normalize missing and partial validation coverage for Phases 25-28. (planned)
- [ ] **Phase 37: Nyquist Backfill for Acceptance Phases** - Normalize missing and partial validation coverage for Phases 29-31 and 33. (planned)

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

- [x] `25-01-PLAN.md` - Add the core delivery-profile schema, resolver, and precedence contract. (completed 2026-03-08)
- [x] `25-02-PLAN.md` - Make `init`, docs, and examples teach delivery profiles and split fps/captureFps semantics correctly. (completed 2026-03-08)
- [x] `25-03-PLAN.md` - Persist explicit timing contracts and compatibility helpers in saved artifacts. (completed 2026-03-08)
- [x] `25-04-PLAN.md` - Enforce recomposite timing compatibility in `composite` and CLI tests. (completed 2026-03-08)
- [x] `25-05-PLAN.md` - Close the verification gap with core recomposite coverage for saved timing artifacts and legacy fallback semantics. (completed 2026-03-08)

### Phase 26: Human Pacing Engine

**Goal**: Recorded terminal interactions feel intentionally human instead of robotic.
**Depends on**: Phase 25
**Requirements**: PACE-01, PACE-02, PACE-03
**Success Criteria** (what must be TRUE):

1. Typed text follows a deterministic human-feeling cadence profile without the author tuning every script step by hand.
2. Startup, settle, read, and idle moments appear as intentional beats instead of flat uniform pauses.
3. Author can override timing for specific `type` and `pause` steps while the rest of the recording still follows the selected pacing model.

**Plans**: 3 plans

Plans:

- [x] `26-01-PLAN.md` — Cadence profile data model, profile-aware charDelay, and pacing config schema. (completed 2026-03-08)
- [x] `26-02-PLAN.md` — Beat injection in step executor and profile-aware typeStep with per-step overrides. (completed 2026-03-08)
- [x] `26-03-PLAN.md` — Wire config pacing into preview/record runtime flows and lock it with regression coverage. (completed 2026-03-08)

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

- [x] `27-01-PLAN.md` — Tune readable-1080p profile defaults and prove readability with fixture tests and compositor framing assertions. (completed 2026-03-08)

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

- [x] `28-01-PLAN.md` — Widen capture heuristic to always capture typed characters and add post-step captureNow() hooks for press/scroll/wait. (completed 2026-03-08)
- [x] `28-02-PLAN.md` — Fix outputFrameCount to be timeline-driven, ensuring wall-clock timing preserved under dense capture. (completed 2026-03-08)

### Phase 29: Diagnostics and Acceptance Gates

**Goal**: Authors can verify, inspect, and debug human-feeling demo output with concrete evidence.
**Depends on**: Phase 28
**Requirements**: DIAG-04, DIAG-05, DIAG-06
**Success Criteria** (what must be TRUE):

1. Authors can run acceptance fixtures that verify pacing, readability, and smooth output behavior on representative demos.
2. Authors can inspect one run's pacing stats, including raw frame count, durations, and output metadata, without digging through source code.
3. Authors can dump raw rendered frames from a recording and compare them with final output when diagnosing fidelity issues.

**Plans**: 5 plans

Plans:

- [x] `29-01-PLAN.md` — Core diagnostics module (probe-video, inspect, frame-dumper) with unit tests. (completed 2026-03-08)
- [x] `29-02-PLAN.md` — CLI commands (tuireel inspect + tuireel dump-frames) wired to Commander. (completed 2026-03-08)
- [x] `29-03-PLAN.md` — Acceptance fixture tests proving pacing, readability, and smooth output. (completed 2026-03-08)
- [x] `29-04-PLAN.md` — Close the inspect output-metadata gap by probing `config.output` and surfacing final output details in core + CLI. (completed 2026-03-09)
- [x] `29-05-PLAN.md` — Close the smooth-output continuity verification gap with artifact-level continuity assertions. (completed 2026-03-09)

### Phase 30: Pacing Provenance and Acceptance (GAP CLOSURE)

**Goal**: Config-selected pacing survives recorded artifacts and is proven by inspect plus acceptance flows.
**Depends on**: Phases 26, 29
**Requirements**: PACE-01, PACE-02, PACE-03
**Gap Closure**: Closes the pacing provenance and paced-acceptance gaps from `.planning/v1.2-MILESTONE-AUDIT.md`
**Success Criteria** (what must be TRUE):

1. Recorded artifacts preserve enough pacing provenance for both named profiles and inline pacing objects to be explained after the run.
2. `tuireel inspect` reports the persisted pacing provenance instead of inferring only from the current config selection.
3. Acceptance coverage enables pacing and proves cadence, beats, and per-step overrides through the real config -> record -> inspect/verify flows.

**Plans**: 3 plans

Plans:

- [x] `30-01-PLAN.md` - Persist pacing provenance inside the saved timing contract and recorder artifact boundary. (completed 2026-03-09)
- [ ] `30-02-PLAN.md` - Make inspect read and report saved pacing provenance from the recorded artifact.
- [ ] `30-03-PLAN.md` - Upgrade pacing acceptance fixtures to prove beats and overrides through real paced recordings.

### Phase 31: Readable 1080p Acceptance Proof (GAP CLOSURE)

**Goal**: The exported readable-1080p artifact proves the readability and framing guarantees promised by Phase 27.
**Depends on**: Phases 27, 29
**Requirements**: READ-01, READ-02
**Gap Closure**: Closes the readability acceptance-depth gaps from `.planning/v1.2-MILESTONE-AUDIT.md`
**Success Criteria** (what must be TRUE):

1. The readability acceptance fixture exercises the real `readable-1080p` contract instead of a partially overridden proxy.
2. Acceptance assertions verify legibility and framing on the exported artifact, not only timeline dimensions and output size.
3. The readable-1080p record/composite/acceptance flow no longer breaks at milestone verification depth.

**Plans**: 1 plan

Plans:

- [ ] `31-01-PLAN.md` - Upgrade readable-1080p acceptance to prove legibility and inset framing on exported artifacts.

### Phase 32: Final Output Continuity Gate (GAP CLOSURE)

**Goal**: Final-output smoothness is proven on the composed artifact so milestone acceptance closes cleanly.
**Depends on**: Phases 28, 29, 30, 31
**Requirements**: DIAG-04
**Gap Closure**: Closes the final-output continuity and milestone-acceptance gaps from `.planning/v1.2-MILESTONE-AUDIT.md`
**Success Criteria** (what must be TRUE):

1. Smoothness acceptance validates the finished output artifact instead of stopping at raw-frame continuity.
2. The capture-to-output evidence chain stays debuggable by keeping raw-frame evidence while asserting final-output continuity.
3. The milestone acceptance surface now fully proves pacing, readability, and smoothness together, so DIAG-04 can be re-closed.

**Plans**: 1 plan

Plans:

- [ ] `32-01-PLAN.md` - Move the smooth-output continuity gate to final output artifacts while preserving raw-frame debugging evidence.

### Phase 33: Combined Acceptance Stability Gate (GAP CLOSURE)

**Goal**: The combined pacing, readability, and smoothness acceptance surface passes reliably as one shipped milestone gate.
**Depends on**: Phases 30, 31, 32
**Requirements**: DIAG-04
**Gap Closure**: Closes the combined milestone acceptance instability from `.planning/v1.2-MILESTONE-AUDIT.md`
**Success Criteria** (what must be TRUE):

1. Running the pacing, readability, and smooth-output acceptance files together passes reliably in the normal shared workspace run.
2. The shared acceptance path keeps real artifact-backed proof for cadence, readability, and smoothness instead of weakening any signal into an isolated proxy.
3. The milestone acceptance trio can serve as one stable closeout gate for v1.2 without shared-state, setup, or timing flakiness.

**Plans**: 1 plan

Plans:

- [x] `33-01-PLAN.md` - Re-verify the combined milestone acceptance surface, record stability evidence, and re-close DIAG-04 in planning docs. (completed 2026-03-09)

### Phase 34: Capture Fidelity Debt Cleanup

**Goal**: Capture-fidelity behavior is proven by meaningful runtime-facing tests and no longer carries stale recorder helper surface.
**Depends on**: Phases 28, 33
**Requirements**: CAP-02
**Gap Closure**: Closes the Phase 28 tech-debt findings from `.planning/v1.2-MILESTONE-AUDIT.md`

**Plans**: Pending planning

### Phase 35: Acceptance Stability Automation

**Goal**: The combined pacing/readability/smoothness acceptance trio is enforced by automation instead of living only in one verification document.
**Depends on**: Phases 33, 34
**Requirements**: DIAG-04
**Gap Closure**: Closes the Phase 33 repeated-run automation gap from `.planning/v1.2-MILESTONE-AUDIT.md`

**Plans**: Pending planning

### Phase 36: Nyquist Backfill for Feature Phases

**Goal**: Feature-building phases 25-28 have current Nyquist validation artifacts with accurate Wave 0, per-task status, and approval state.
**Depends on**: Phases 25, 26, 27, 28, 34
**Requirements**: None (Nyquist coverage only)
**Gap Closure**: Closes the missing/partial Nyquist findings for Phases 25-28 from `.planning/v1.2-MILESTONE-AUDIT.md`

**Plans**: Pending planning

### Phase 37: Nyquist Backfill for Acceptance Phases

**Goal**: Acceptance-oriented phases 29-31 and 33 have current Nyquist validation artifacts with accurate status and missing files restored.
**Depends on**: Phases 29, 30, 31, 33, 35
**Requirements**: None (Nyquist coverage only)
**Gap Closure**: Closes the missing/partial Nyquist findings for Phases 29-31 and 33 from `.planning/v1.2-MILESTONE-AUDIT.md`

**Plans**: Pending planning

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
25 -> 26 -> 27 -> 28 -> 29 -> (30, 31) -> 32 -> 33 -> 34 -> 35 -> (36, 37)

| Phase                                      | Plans Complete | Status   | Completed  |
| ------------------------------------------ | -------------- | -------- | ---------- |
| 25. Timing Contract and Profiles           | 5/5            | Complete | 2026-03-08 |
| 26. Human Pacing Engine                    | 3/3            | Complete | 2026-03-08 |
| 27. Readable 1080p Defaults                | 1/1            | Complete | 2026-03-08 |
| 28. Capture Fidelity and Final Motion      | 2/2            | Complete | 2026-03-08 |
| 29. Diagnostics and Acceptance Gates       | 5/5            | Complete | 2026-03-09 |
| 30. Pacing Provenance and Acceptance       | 3/3            | Complete | 2026-03-09 |
| 31. Readable 1080p Acceptance Proof        | 1/1            | Complete | 2026-03-09 |
| 32. Final Output Continuity Gate           | 1/1            | Complete | 2026-03-09 |
| 33. Combined Acceptance Stability Gate     | 1/1            | Complete | 2026-03-09 |
| 34. Capture Fidelity Debt Cleanup          | 0/TBD          | Planned  | -          |
| 35. Acceptance Stability Automation        | 0/TBD          | Planned  | -          |
| 36. Nyquist Backfill for Feature Phases    | 0/TBD          | Planned  | -          |
| 37. Nyquist Backfill for Acceptance Phases | 0/TBD          | Planned  | -          |
