# Project Research Summary

**Project:** Tuireel v1.2 Human Demo Feel
**Domain:** PTY-native terminal demo timing, capture fidelity, and 1080p readability
**Researched:** 2026-03-08
**Confidence:** HIGH

## Executive Summary

Tuireel v1.2 is not a new recorder. It is a fidelity upgrade for an existing PTY-native, two-pass terminal demo pipeline. The research is consistent across stack, features, architecture, and pitfalls: keep `tuistory`, ffmpeg, Sharp, and the current `record` -> `composite` flow, then make timing, capture cadence, and readability first-class concepts inside `@tuireel/core` rather than bolting on browser-recorder tricks.

The recommended approach is opinionated. Add deterministic human timing profiles, explicit pause and idle policies, 1080p readability presets, separate capture cadence from output FPS, and persist richer timing metadata in the timeline/artifact contract. Experts solve this category by capturing real terminal state changes, then packaging them into polished output. They do not fake smoothness with optical-flow interpolation, random jitter, or browser-style camera effects.

The biggest risks are semantic drift and fake polish: one FPS knob meaning two things, random delays pretending to be human, sparse raw capture hidden by the compositor, and readability tuned by eye instead of by contract. The mitigation is equally clear: define the config and artifact contract first, validate rendered fixtures as well as helper functions, instrument capture budgets, and treat raw-frame readability plus recomposite reliability as milestone gates.

## Key Findings

### Recommended Stack

The stack recommendation is conservative by design. Keep the existing TypeScript monorepo, `@tuireel/core` plus CLI split, `tuistory`, ffmpeg, Sharp, JSONC config, and current overlay/composite pipeline. The milestone is about improving the model inside the recorder, not swapping foundations.

**Core technologies:**

- In-house timing model in `@tuireel/core` - human cadence, pauses, and seeded jitter belong in recorder-native logic so preview, record, and composite stay deterministic.
- `tuistory@0.0.16` - keep the current PTY automation backend and emit richer timing/capture events around real step execution.
- ffmpeg - use it as the final packager for CFR output, scaling, and delivery FPS, not as the source of fake smoothness.
- `sharp@0.34.5` - keep it for overlay compositing and output sizing, with new integer-scale-first readability rules for 1080p.
- `zod` + `vitest` - extend the config contract and lock timing, scaling, and fixture behavior with deterministic tests.

**Critical version requirements:**

- `tuistory` stays on the repo-aligned `0.0.16`; no PTY backend swap is needed.
- `sharp` stays on the repo-aligned `0.34.5`; fidelity work is policy, not image-stack replacement.
- ffmpeg features already in use (`fps`, `scale`, `ffprobe`) are sufficient; do not add `minterpolate` as a default strategy.

### Expected Features

The feature research is clear on launch scope. v1.2 should ship the features that directly remove robotic pacing and unreadable output, while deferring the higher-risk polish layers until the underlying timing and capture model is proven.

**Must have (table stakes):**

- Deterministic cadence profiles and per-action typing speed control.
- Pause defaults, explicit timing beats, output-aware waiting, and idle caps with a readability floor.
- Capture density profiles that separate raw capture cadence from final output playback.
- 1080p readability presets for font scale, padding, footprint, and output sizing.
- Playback-speed polish controls that tune final duration without distorting authored timing.

**Should have (competitive):**

- Semantic pause presets like read/think/settle.
- Timing preview or pacing diagnostics for authors.
- Adaptive capture density by event type.
- Output-target presets such as `1080p-demo`, `readme-gif`, or `social-clip`.

**Defer (v2+):**

- Terminal-safe interpolation or tweening.
- Seeded typo/correction automation.
- Narrative pacing assistants and other guidance-heavy features.

### Architecture Approach

The architecture should stay two-pass and contract-first. Extend `config/schema.ts` first, resolve timing/render/capture profiles up front, keep PTY screenshots as source-of-truth terminal states, and serialize richer beats/frame markers into the timeline so the compositor can render denser final output without inventing terminal states.

**Major components:**

1. `recorder.ts` - resolve timing, capture, and render profiles; coordinate PTY execution; persist richer artifacts.
2. `executor/*` - own deterministic human timing behavior in `timing.ts`, `type.ts`, and a new `human-timing-profile.ts`.
3. `capture/*` - add a cadence planner/profile layer so capture is hybrid and event-aware instead of globally over-sampled.
4. `timeline/*` - store semantic beats, terminal-frame markers, and output-timeline intent as the record/composite contract.
5. `render/*` plus `session.ts` - centralize 1080p readability defaults and canvas-fit policy.
6. `compositor.ts` plus encoder profiles - map discrete PTY frames to smooth final output while only interpolating overlays/time, never terminal glyph states.

### Critical Pitfalls

1. **Coupled capture FPS and output FPS** - split semantics now and expose artifact metadata so 60fps output never changes wall-clock behavior.
2. **Random jitter posing as human feel** - use a deterministic interaction model with context-aware beats, then validate artifact-level pacing on fixtures.
3. **Compositor hiding sparse raw capture** - add semantic capture hooks and raw-frame verification so smooth output is backed by real PTY states.
4. **Readability tuned by eye** - lock 1080p renderer defaults and readable-frame gates in tests, not ad hoc demo tweaks.
5. **Capture slowing interaction** - instrument screenshot latency, delayed frames, and per-step duration so fidelity work does not serialize input.

## Implications for Roadmap

Based on the combined research, the roadmap should follow the artifact contract, then the human timing model, then readability, then capture density, then compositor smoothing and debug acceptance. That ordering matches both the architecture dependencies and the pitfall map.

### Phase 1: Contract and Semantics

**Rationale:** Every downstream change depends on clear config and artifact meaning.
**Delivers:** Separate `captureFps` vs output FPS semantics, new config blocks, saved timing metadata, explicit recomposite expectations.
**Addresses:** Capture density controls, playback-speed separation, readability presets as named contract surface.
**Avoids:** One-FPS ambiguity and recomposite regressions.

### Phase 2: Human Timing Engine

**Rationale:** Human feel is the most user-visible gap and the foundation for every later pacing feature.
**Delivers:** Deterministic cadence profiles, typed-beat logic, pause defaults, idle shaping, per-step overrides, fixture-backed pacing tests.
**Addresses:** Per-action typing speed, pause behavior, output-aware waiting, idle caps.
**Avoids:** Random-jitter timing and script-by-script hand tuning.

### Phase 3: Readable 1080p Rendering

**Rationale:** Raw capture must be legible before smoothness work is meaningful.
**Delivers:** Render profile resolver, canvas-fit helpers, screenshot defaults, readable 1080p presets, frame-level regression checks.
**Addresses:** 1080p readability controls and output-target presets.
**Avoids:** Renderer fidelity drifting by eye.

### Phase 4: Hybrid Capture Density

**Rationale:** Smooth final output requires better source-state coverage, not just compositor tricks.
**Delivers:** Cadence planner, burst capture hooks for typing/scroll/resize, timestamp-rich frame markers, sustainable capture profiles.
**Uses:** Existing `tuistory`, recorder flow, and frame-capturer with policy extensions.
**Implements:** The new `capture/*` boundary and recorder-to-timeline callbacks.
**Avoids:** Sparse raw capture hidden by later packaging.

### Phase 5: Output Timeline and Final Motion

**Rationale:** Once the recorder produces trustworthy artifacts, the compositor can safely densify delivery output.
**Delivers:** Timeline expansion at output FPS, repeated real PTY frames, smoother overlay motion, playback-speed polish controls.
**Addresses:** Terminal-safe smoothing and final-motion quality.
**Avoids:** Motion interpolation on terminal pixels and browser-recorder-style gimmicks.

### Phase 6: Diagnostics and Acceptance Gates

**Rationale:** Human feel is subjective unless the project can inspect and explain captured artifacts.
**Delivers:** Raw-frame dump mode, concise debug summaries, ffprobe-backed media stats, milestone fixtures that compare raw capture with final output.
**Addresses:** Timing preview/diagnostics and long-term maintainability.
**Avoids:** Trial-and-error tuning and regressions that cannot be explained.

### Phase Ordering Rationale

- Contract first because schema and artifact semantics are shared dependencies for executor, capture, timeline, and compositor changes.
- Human timing before capture density because the project needs correct pacing rules before deciding where extra capture is worth the budget.
- Readability before smoothing because unreadable raw frames cannot be fixed by better pacing alone.
- Capture density before compositor smoothing because the compositor cannot invent authentic terminal states.
- Diagnostics last in implementation order, but the acceptance fixtures should begin early and harden as each phase lands.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 4:** capture budget thresholds and burst heuristics will need fixture-driven validation against real screenshot cost.
- **Phase 5:** output timeline expansion and any event-aware smoothing need careful verification to avoid fake terminal motion.
- **Phase 6:** debug surface shape should be validated against actual maintainer workflows so it answers the right questions quickly.

Phases with standard patterns (skip research-phase):

- **Phase 1:** config/artifact contract split is already well specified by the current research.
- **Phase 2:** deterministic timing-profile work is well documented and locally grounded.
- **Phase 3:** readability presets and render-profile extraction follow standard, low-risk patterns in this codebase.

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                   |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Strong local repo grounding plus official npm and ffmpeg/sharp docs; recommendation is conservative and specific.                                       |
| Features     | HIGH       | Table stakes are strongly validated by multiple established terminal-demo tools; differentiators are slightly more speculative but still well reasoned. |
| Architecture | HIGH       | Based primarily on existing Tuireel boundaries and concrete file-level integration points, not abstract greenfield advice.                              |
| Pitfalls     | HIGH       | Well supported by local repo evidence, ffmpeg/asciinema semantics, and known community failure modes from adjacent tools.                               |

**Overall confidence:** HIGH

### Gaps to Address

- Capture-budget numbers - the research defines the architecture and warnings, but sustainable burst thresholds still need measurement on real 1080p fixtures.
- Readability acceptance thresholds - the research is decisive on direction, but the exact acceptable font scale, padding, and window footprint should be locked with milestone fixtures.
- Timeline contract shape - the need for richer metadata is clear, but the final serialized fields should be validated against recomposite and debug use cases before freezing.

## Sources

### Primary (HIGH confidence)

- Local repo sources in `packages/core/src/*` and `packages/core/test/*` - current recorder, compositor, timing, session, and timeline integration points.
- `.planning/PROJECT.md` - milestone scope, shipped capabilities, and current product posture.
- Official/npm docs for `tuistory`, `sharp`, and ffmpeg - version checks and capability boundaries.
- Official READMEs for VHS, Terminalizer, t-rec, Demo Tape, and Betamax - table stakes for terminal-demo timing, waits, FPS, and readability controls.

### Secondary (MEDIUM confidence)

- `screen.studio` motion and typing guides - market signal for polish expectations, but not terminal-specific.
- Terminalizer and t-rec prior-art ecosystem notes beyond their core documented features.

### Tertiary (LOW confidence)

- None material. The research is mostly grounded in local code and primary upstream docs.

---

_Research completed: 2026-03-08_
_Ready for roadmap: yes_
