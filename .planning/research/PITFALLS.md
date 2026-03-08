# Pitfalls Research

**Domain:** PTY-based terminal demo recording with human-feeling timing and 1080p capture fidelity
**Researched:** 2026-03-08
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: One FPS Knob Pretends to Mean Two Different Things

**What goes wrong:**
`fps` gets used for both raw capture cadence and final output playback, so maintainers raise it to chase smoother motion and accidentally speed up, starve, or destabilize raw capture.

**Why it happens:**
It looks simpler to expose one number. But PTY state capture and final video presentation are different layers. FFmpeg also treats input cadence and output frame rate differently, which makes the overload easy to hide until artifacts look wrong.

**How to avoid:**

- Define separate concepts now: `captureFps` for raw screenshot cadence and `fps`/`outputFps` for final delivery.
- Treat raw terminal timestamps or timeline offsets as the source of truth for motion; treat FFmpeg as the packager.
- Add artifact metadata showing raw frame count, raw duration, timeline duration, output FPS, and encoded frame count for every debug run.
- Add one fixture that records at low capture cadence but composites to 60fps without changing wall-clock timing.

**Warning signs:**

- A "60fps" request makes typing faster instead of smoother.
- Raw frame count scales linearly with requested output FPS.
- Debug output cannot answer "how many raw states did we actually capture?"
- Maintainers argue about whether `fps` means polling rate or video rate.

**Phase to address:** Phase 1 - Artifact contract and timing semantics

---

### Pitfall 2: Human Feel Implemented as Random Jitter Instead of an Interaction Model

**What goes wrong:**
Typing and pauses stop being robotic in unit tests but still feel fake in the artifact: long commands drag, short commands stutter, Enter happens too fast, and pauses land in the wrong places.

**Why it happens:**
"Human-feeling" gets reduced to random delays. Real demo timing is phase-aware: first keystroke hesitation, burst typing, short-command compression, pause-before-commit, and state-settle waits are different behaviors.

**How to avoid:**

- Use a deterministic timing model with context inputs (`text`, `char`, `index`, command length, action type).
- Bias for visible beats, not statistical realism: first character, midpoint, final character, pre-Enter pause, post-state-settle pause.
- Keep command-specific overrides possible for showcase demos, but make the default model deterministic and testable.
- Validate timing on rendered fixtures, not only helper functions.

**Warning signs:**

- `/help` takes multiple seconds to type despite being a short command.
- Two runs with the same config produce noticeably different pacing.
- Maintainers keep hand-tuning pauses in every demo script to compensate for defaults.
- Timing tests only assert delay ranges, not artifact-level cadence.

**Phase to address:** Phase 2 - Human timing model and pacing acceptance

---

### Pitfall 3: Final Motion Looks Smooth Because the Compositor Is Hiding Sparse Raw Capture

**What goes wrong:**
The final MP4 looks superficially smoother, but raw capture still collapses typing or modal transitions into 1-2 meaningful states. Regressions return as soon as overlays, trims, or encode settings change.

**Why it happens:**
It is tempting to solve human feel entirely in compositing. But in a PTY recorder, missing raw terminal states are missing facts. The compositor can duplicate or interpolate display time; it cannot invent authentic intermediate terminal content.

**How to avoid:**

- Verify raw artifacts first: frame dumps, terminal-frame markers, and sampled frames during typing-heavy fixtures.
- Add semantic capture hooks for human-visible transitions: typing, cursor movement, Enter, modal open, resize, and large screen changes.
- Require milestone acceptance to pass both raw-state checks and final-video checks.
- Keep the rule: compositor may stretch or package time, but it must not be the only source of apparent motion.

**Warning signs:**

- Final video shows motion, but raw frame dumps repeat the same terminal image for long spans.
- Typing-heavy demos only look good when a specific overlay or trim setting is enabled.
- The team debates smoothing before anyone has inspected raw frames.
- Timeline events outnumber terminal-frame markers by a wide margin during typing windows.

**Phase to address:** Phase 3 - Semantic capture density and raw-frame verification

---

### Pitfall 4: Renderer Fidelity Tuned by Eye, Not Locked as a Contract

**What goes wrong:**
Text becomes blocky, cramped, edge-to-edge, or unreadable at 1080p because line height, font size, padding, and scaling drift while timing work is underway.

**Why it happens:**
Capture-fidelity work tends to start with ad hoc tweaks on one demo. In this repo, raw readability already broke when line height was tightened too far, and font-family assumptions were misleading because the renderer used a bundled font path instead of the configured family.

**How to avoid:**

- Treat terminal legibility as a product invariant: sane line height, predictable padding, realistic terminal footprint, and readable text at 1080p.
- Lock renderer defaults with snapshot/fixture checks against known readable frames.
- Test the actual renderer inputs that matter: font path, line height, canvas dimensions, and output fit behavior.
- Add a "raw frame readability" gate before any milestone sign-off.

**Warning signs:**

- Raw capture is already unreadable before composition.
- Small config tweaks produce dramatic text rendering changes.
- Terminal fills nearly the whole 1920x1080 canvas with no realistic monitor margin.
- Changing `fontFamily` appears to do nothing because the underlying renderer ignores it.

**Phase to address:** Phase 4 - 1080p renderer defaults and readability gates

---

### Pitfall 5: Capture Work Serializes User Input and Slows the Demo Down

**What goes wrong:**
Adding more capture points makes typing slower, waits longer, or causes timeouts because screenshots and encoding block the interaction path.

**Why it happens:**
In terminal recorders, capture is often more expensive than expected. Community evidence from VHS shows that when capture exceeds budget, the recorder drops effective frames and can even delay key delivery. This repo has already seen a variant of that: typing latency grew when capture and encoding costs accumulated in the live path.

**How to avoid:**

- Measure capture cost explicitly: screenshot latency, encoder write latency, delayed-frame count, and per-step wall-clock time.
- Keep background polling resilient and best-effort; semantic capture should wait for idle safely, not cascade unhandled failures.
- Avoid assuming every requested capture can happen on schedule; record actual timestamps.
- Budget for worst-case frames (busy screen, large canvas, PNG path), not only idle terminal states.

**Warning signs:**

- Step duration grows sharply after adding semantic capture hooks.
- `type` or `press` steps take much longer in real runs than in isolated session probes.
- Capture failures surface as destroyed-terminal or no-content errors during shutdown.
- Higher capture fidelity makes the demo feel slower instead of richer.

**Phase to address:** Phase 5 - Capture budget instrumentation and backpressure hardening

---

### Pitfall 6: Recompose Guarantees Regress While Chasing Better Timing

**What goes wrong:**
`record` starts depending on compositor-only settings, or `composite` quietly requires rerunning the PTY session after timing and fidelity changes. The two-pass architecture becomes implicit again.

**Why it happens:**
Timing and fidelity changes touch both recorder and compositor, so it is easy to thread new behavior through the wrong boundary. If artifact requirements stay undocumented, regressions look like harmless refactors until recomposite stops being trustworthy.

**How to avoid:**

- Freeze the `.tuireel/` artifact contract before feature work expands: raw video path, timeline path, optional frame dump path, and compatibility expectations.
- Make `composite` fail directly when required artifacts are missing or incompatible.
- Test that overlay, HUD, sound, and output tweaks can rerun from stored artifacts alone.
- Keep timing metadata in the saved timeline/artifacts, not only in process memory.

**Warning signs:**

- Changing output FPS or overlays requires rerunning `record`.
- `record` writes different artifacts depending on compositor flags.
- Docs cannot clearly say what `record` produces and what `composite` consumes.
- Bug fixes land in `record` because `composite` no longer has enough saved metadata.

**Phase to address:** Phase 1 - Artifact contract and command semantics

---

### Pitfall 7: No Debug Surface for Proving Why a Demo Feels Wrong

**What goes wrong:**
Maintainers debate subjective "feel" but cannot prove whether the issue is timing, raw capture density, render scale, encoding, or recomposition. Fixes become trial-and-error.

**Why it happens:**
Terminal demo tools often ship only the final video. That is not enough for PTY debugging. Human-feel work needs inspection surfaces at the raw-frame and timeline layers.

**How to avoid:**

- Add first-class raw-frame dump mode and concise debug summaries.
- Save artifact metadata that compares raw frames, terminal-frame markers, interaction events, and final media stats.
- Keep one typing-heavy golden fixture specifically for diagnosing feel regressions.
- Make debug output answer four questions quickly: what was captured, when, how often, and what was emitted.

**Warning signs:**

- Maintainers use ad hoc ffmpeg probes and one-off scripts to inspect a run.
- Bugs get described only as "looks fake" or "feels off" with no counts or artifact references.
- There is no easy way to compare raw capture and final output for the same run.

**Phase to address:** Phase 6 - Debug surfaces and milestone acceptance fixtures

## Technical Debt Patterns

Shortcuts that feel efficient but create long-term drag.

| Shortcut                                                      | Immediate Benefit                 | Long-term Cost                                              | When Acceptable                                                                           |
| ------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Keep one public `fps` setting and infer everything implicitly | Smaller config surface            | Endless semantic confusion and fragile recomposite behavior | Only if internal semantics are still fully separated and debug output exposes both values |
| Tune timing per demo script instead of fixing defaults        | Fast improvement for one showcase | Every new demo needs hand-editing; defaults remain robotic  | Only as a temporary override after the default model exists                               |
| Trust the final MP4 instead of inspecting raw frames          | Faster iteration loop             | Raw capture regressions hide until late                     | Never for milestone acceptance                                                            |
| Fix 1080p readability with canvas scaling alone               | Easy visual tweak                 | Text remains fragile across fonts, line heights, and themes | Never without renderer-default tests                                                      |

## Integration Gotchas

Common mistakes at subsystem boundaries.

| Integration                       | Common Mistake                                             | Correct Approach                                                                                              |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| PTY session + capture loop        | Let screenshot or encoder latency block input delivery     | Measure capture budget and separate interaction timing from capture timing wherever possible                  |
| FFmpeg                            | Treat output FPS as the source of truth for session timing | Feed FFmpeg correct raw cadence/timestamps and use it as encoder/packager                                     |
| Timeline + compositor             | Store only visual events, not terminal-frame timing facts  | Persist exact timing metadata needed to recomposite without rerunning the session                             |
| Renderer (`ghostty-opentui` path) | Assume `fontFamily` config changes the capture font        | Verify which renderer options actually affect output; lock on effective inputs like font path and line height |

## Performance Traps

Patterns that work on tiny demos but fail on real artifacts.

| Trap                                                           | Symptoms                                                  | Prevention                                                                             | When It Breaks                                 |
| -------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------- |
| High capture FPS on large 1080p terminal states                | Sped-up playback, delayed frames, long step times         | Track actual capture timestamps and cap defaults to sustainable rates                  | Typing-heavy or busy-screen demos              |
| Per-character forced capture with no idle/backpressure control | Timeouts, destroyed session errors, runaway type duration | `waitForIdle()` before semantic capture and keep errors contained until stop/reporting | Short commands plus expensive screenshot paths |
| Edge-to-edge 1080p fitting                                     | Terminal feels unrealistic and unreadable in demos        | Reserve realistic margins and test footprint against a fixed presentation target       | Any full-HD marketing/demo asset               |

## Security Mistakes

Domain-specific mistakes for terminal-demo tooling.

| Mistake                                                              | Risk                                                                 | Prevention                                                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Shipping raw frame dumps or timelines with sensitive terminal output | Secrets, prompts, API keys, and local paths leak into repo artifacts | Keep frame dumps opt-in, document cleanup, and treat `.tuireel/` as sensitive generated output |
| Verbose debug logs include full typed commands by default            | Credentials typed during demos end up in logs/CI artifacts           | Redact or allow opt-out for logged step payloads when demos may contain sensitive text         |

## UX Pitfalls

Common failures in the perceived quality of a terminal demo.

| Pitfall                                                       | User Impact                                            | Better Approach                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| Typing is technically visible but too slow for short commands | Demo feels staged and robotic                          | Compress short-command cadence and reserve pauses for meaningful beats |
| Terminal footprint is oversized for 1080p                     | Output looks fake and claustrophobic                   | Lock a realistic window footprint and margins as defaults              |
| Smooth video with semantically wrong timing                   | Viewer senses something is off even if motion is fluid | Preserve authentic wall-clock beats from captured state transitions    |

## "Looks Done But Isn't" Checklist

- [ ] **60fps output:** Verify final 60fps does not require 60 real screenshots per second; inspect raw frame count and timestamps.
- [ ] **Human typing:** Verify a short command and a long command both feel natural; do not sign off based on one fixture.
- [ ] **1080p readability:** Verify raw frames are readable before overlays and encoding.
- [ ] **Recomposite:** Verify `composite` can rerun from `.tuireel/` artifacts after changing overlay/output settings.
- [ ] **Debuggability:** Verify one run exposes raw frames, timeline markers, durations, and final media stats without ad hoc probes.

## Recovery Strategies

| Pitfall                    | Recovery Cost | Recovery Steps                                                                                       |
| -------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Coupled capture/output FPS | MEDIUM        | Split semantics, add artifact metadata, regenerate fixtures, update CLI/docs together                |
| Fake-looking timing model  | MEDIUM        | Rebaseline timing fixtures, encode deterministic rules, remove compensating demo-script pauses       |
| Raw capture too sparse     | HIGH          | Add semantic capture hooks, inspect frame dumps, regenerate artifacts, then retune compositor        |
| Readability regression     | MEDIUM        | Restore known-good renderer defaults, add frame-level regression coverage, rerun 1080p fixture       |
| Recomposite regression     | HIGH          | Re-document artifact contract, fix `record` outputs, add record-once/composite-many integration test |

## Pitfall-to-Phase Mapping

| Pitfall                                  | Prevention Phase                                                    | Verification                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| One FPS knob pretends to mean two things | Phase 1 - Artifact contract and timing semantics                    | A run reports separate capture cadence and output FPS, and 60fps output does not alter wall-clock timing |
| Random jitter masquerades as human feel  | Phase 2 - Human timing model and pacing acceptance                  | Short- and long-command fixtures both meet cadence expectations without per-demo hacks                   |
| Compositor hides sparse raw capture      | Phase 3 - Semantic capture density and raw-frame verification       | Raw frame dumps show meaningful intermediate states during typing and modal transitions                  |
| Renderer fidelity tuned by eye           | Phase 4 - 1080p renderer defaults and readability gates             | Known 1080p frames remain readable after renderer/config changes                                         |
| Capture work serializes user input       | Phase 5 - Capture budget instrumentation and backpressure hardening | Step durations, delayed-frame counts, and capture latency stay within budget on the typing fixture       |
| Recompose guarantees regress             | Phase 1 - Artifact contract and command semantics                   | `composite` reuses saved artifacts after output/overlay tweaks and fails clearly on missing artifacts    |
| No debug surface for proving feel        | Phase 6 - Debug surfaces and milestone acceptance fixtures          | Maintainer can inspect one run and explain captured frames, timing markers, and final media stats        |

## Sources

- Local project context: `.planning/PROJECT.md`
- Local repo evidence: `.planning/debug/opencode-demo-no-ui-render.md`
- Local design notes: `.planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-tuireel-design-checklist.md`
- Current recorder implementation: `packages/core/src/recorder.ts`
- Current frame capture implementation: `packages/core/src/capture/frame-capturer.ts`
- FFmpeg documentation on `-r` vs `-framerate`: `https://ffmpeg.org/ffmpeg.html`
- Asciinema asciicast v3 format docs (event stream and timing model): `https://docs.asciinema.org/manual/asciicast/v3/`
- VHS issue on sped-up output from missed capture budgets: `https://github.com/charmbracelet/vhs/issues/88`
- VHS issue on on-demand capture for unstable outputs: `https://github.com/charmbracelet/vhs/issues/417`

---

_Pitfalls research for: terminal-demo human-feel and capture-fidelity milestone_
_Researched: 2026-03-08_
