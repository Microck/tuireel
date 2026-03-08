# Feature Research: v1.2 Human Demo Feel

**Domain:** scripted terminal demo timing and capture fidelity
**Researched:** 2026-03-08
**Confidence:** HIGH for table stakes, MEDIUM for differentiators

## Feature Landscape

### Table Stakes (Users Expect These)

Features users now assume from a serious scripted terminal demo tool. Missing these keeps recordings looking robotic or hard to read.

| Feature                                                      | Why Expected                                                                                                                                             | Complexity | Notes                                                                                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-action typing speed control                              | VHS and Demo Tape both expose global typing speed plus per-command overrides; fixed-speed typing feels fake fast.                                        | MEDIUM     | Build on existing `type` step. Add cadence options per step and preset-level defaults.                                                            |
| Explicit pause primitives for beats before and after actions | Terminal demos need readable beats before Enter, after command output, and after major state changes.                                                    | LOW        | Extend existing `wait`/`pause` behavior with clearer intent fields or presets rather than forcing users to hand-tune raw milliseconds everywhere. |
| Output-aware waiting, not sleep-only timing                  | VHS `Wait`/`Wait+Line` and Demo Tape `WaitUntil` make demos robust against variable command duration.                                                    | LOW        | Already partially covered by existing wait steps; milestone should make this the recommended path for human-feeling pacing after commands.        |
| Idle-time shaping with readability floor                     | Terminalizer exposes `maxIdleTime`; t-rec exposes `idle-pause`; tools commonly cap dead air without removing all reading time.                           | MEDIUM     | Add policy-level control like "keep first N ms of idle output, compress the rest" on top of existing recording/composite flow.                    |
| Capture density / FPS controls                               | VHS exposes framerate; t-rec recommends higher FPS for smoother typing; capture density is a baseline quality knob.                                      | MEDIUM     | Build on raw recording/composite pipeline with target capture profiles instead of a single hardcoded density.                                     |
| Readability controls for 1080p output                        | VHS, Demo Tape, and Terminalizer all expose width, height, font size, line height, padding, or margin because terminal video is unreadable without them. | LOW        | Existing resize/theme/composite features are enough; this milestone needs opinionated presets and validation for 1080p-safe output.               |
| Separate playback-speed control from capture timing          | VHS and Betamax both distinguish capture timing from final playback speed/loop pacing.                                                                   | MEDIUM     | Keep timing truthful in raw capture, then allow final-duration adjustment during composite without breaking cadence logic.                        |

### Differentiators (Competitive Advantage)

Features that would make Tuireel feel more polished than current terminal-focused tools, while still staying deterministic and scriptable.

| Feature                                   | Value Proposition                                                                                                                                                           | Complexity | Notes                                                                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic human cadence profiles      | Users want "feels human" without hand-editing every keypress. A profile can model bursts, punctuation hesitation, and brief settle pauses while staying reproducible.       | MEDIUM     | Depends on existing `type` step plus preset system. Best shape: named profiles like `steady`, `human`, `presenter`, with optional per-step override.      |
| Semantic pause presets                    | Let authors say "hold for read", "brief think", or "command settle" instead of raw milliseconds. This reduces robotic scripts and improves docs ergonomics.                 | MEDIUM     | Depends on existing pause/wait steps and docs/schema support. Internally these still resolve to deterministic durations.                                  |
| Adaptive capture density by event type    | Most tools expose a flat FPS knob. Tuireel can do better by allocating more frames during typing, scrolling, resize, or cursor motion and fewer while static.               | HIGH       | Depends on raw frame timeline plus composite pass. This is the strongest fidelity differentiator, but should stay terminal-safe and deterministic.        |
| Readability presets tied to output target | A `1080p-demo`, `readme-gif`, or `social-clip` preset that chooses cols/rows/font scale/padding is more valuable than exposing knobs alone.                                 | LOW        | Depends on existing presets, resize, themes, and composite sizing. This is cheap and immediately user-facing.                                             |
| Timing preview / pacing diagnostics       | Show where a script is too fast, too slow, or over-compressed before rendering final video. This is rare in terminal tools and fits Tuireel's existing diagnostics posture. | MEDIUM     | Depends on preview/watch and diagnostics features already shipped. Output can be a timeline summary, warnings, or annotated preview.                      |
| Terminal-safe smoothing in composite      | Improve perceived smoothness for scroll/resize/cursor motion without adding browser-recorder gimmicks.                                                                      | HIGH       | Should be constrained to terminal semantics: better frame pacing, optional oversampling, or event-aware tweening only where terminal state stays correct. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature                                                   | Why Requested                                                                | Why Problematic                                                                                                             | Alternative                                                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Fully random "humanizer" timing                           | It sounds like the easiest way to make typing feel human.                    | Random jitter breaks determinism, makes tests flaky, and can make the same script look different on every run.              | Use seeded or preset-based deterministic cadence profiles.                                     |
| Browser-style camera moves, cursor zooms, and motion blur | Adjacent screen-recording tools market these as "smoothness" features.       | They move Tuireel toward browser-recorder territory, hide terminal text, and fight the milestone's terminal-specific scope. | Focus on terminal-safe pacing, frame density, scaling, and readability presets.                |
| Aggressive dead-air stripping                             | Users hate long pauses and may ask for instant compression of all idle time. | Over-compression destroys readability and makes demos feel anxious rather than human.                                       | Cap long idle spans but always preserve a minimum readable hold time.                          |
| Character-level typo simulation by default                | Mistakes and backspaces can look human in rare cases.                        | Default typos waste viewer time, complicate scripts, and look contrived in product demos.                                   | Offer explicit scripted backspace/correction steps when the story actually benefits from them. |
| Post-process speed-ramping as the main pacing tool        | Simple global acceleration feels like a shortcut to smooth output.           | It distorts command timing, makes cursor motion unnatural, and fights output-aware waits.                                   | Keep pacing in the script model first; use playback speed only as a final polish control.      |

## Feature Dependencies

```text
Deterministic human cadence profiles
    └──requires──> existing type step
                       └──requires──> preset/schema system

Semantic pause presets
    └──requires──> existing wait/pause steps
                       └──enhances──> output-aware waiting

Adaptive capture density
    └──requires──> raw recording timeline
                       └──requires──> composite output pass

Readability presets
    └──requires──> existing resize/theme/composite controls

Timing preview / pacing diagnostics
    └──requires──> existing preview/watch + diagnostics

Terminal-safe smoothing
    └──requires──> adaptive capture density
                       └──conflicts──> browser-style motion effects
```

### Dependency Notes

- **Cadence profiles require the existing `type` step:** this milestone should enrich typing behavior, not add a second typing system.
- **Semantic pauses depend on existing wait primitives:** the win is abstraction and defaults, not a brand-new execution model.
- **Adaptive capture density requires both raw recording and composite:** it only works because capture and render are already separated in Tuireel.
- **Readability presets depend on shipped resize/theme support:** this is mostly productization of existing knobs into opinionated defaults.
- **Timing preview depends on preview/watch and diagnostics:** the milestone can reuse shipped developer-facing surfaces for pacing feedback.
- **Terminal-safe smoothing conflicts with browser-style effects:** once zooms and cinematic motion enter the system, scope expands into a different product category.

## MVP Definition

### Launch With (v1.2)

Minimum set to make Tuireel demos stop feeling robotic and remain readable at 1080p.

- [ ] **Deterministic cadence profiles** — essential because fixed-speed typing is the most obvious "bot" tell.
- [ ] **Readable pause defaults and idle caps** — essential because human-feeling pacing needs beats, not just faster typing.
- [ ] **1080p readability presets** — essential because fidelity is a milestone goal, not a nice-to-have.
- [ ] **Capture density profiles** — essential because smooth typing/scrolling needs better frame allocation than a one-size-fits-all default.
- [ ] **Playback-speed polish controls** — essential because authors need to tune final duration without reauthoring whole scripts.

### Add After Validation (v1.2.x)

- [ ] **Semantic pause presets** — add once the base cadence model proves useful and users want less millisecond tuning.
- [ ] **Timing preview / pacing diagnostics** — add when authors start asking why a demo still feels rushed or sluggish.
- [ ] **Adaptive event-aware density** — add once simpler capture profiles show where flat FPS is still insufficient.

### Future Consideration (v2+)

- [ ] **Terminal-safe interpolation / tweening** — defer because it is high risk and easy to get visually wrong.
- [ ] **Seeded typo/correction profiles** — defer until there is clear evidence this improves product demos rather than novelty scripts.
- [ ] **Narrative pacing assistants** — defer because guidance can come later; first make the runtime model strong.

## Feature Prioritization Matrix

| Feature                             | User Value | Implementation Cost | Priority |
| ----------------------------------- | ---------- | ------------------- | -------- |
| Deterministic cadence profiles      | HIGH       | MEDIUM              | P1       |
| Pause defaults + idle caps          | HIGH       | MEDIUM              | P1       |
| 1080p readability presets           | HIGH       | LOW                 | P1       |
| Capture density profiles            | HIGH       | MEDIUM              | P1       |
| Playback-speed polish controls      | MEDIUM     | MEDIUM              | P1       |
| Semantic pause presets              | MEDIUM     | MEDIUM              | P2       |
| Timing preview / pacing diagnostics | MEDIUM     | MEDIUM              | P2       |
| Adaptive event-aware density        | HIGH       | HIGH                | P2       |
| Terminal-safe interpolation         | MEDIUM     | HIGH                | P3       |
| Typo/correction automation          | LOW        | MEDIUM              | P3       |

**Priority key:**

- P1: Must have for v1.2 launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature             | VHS                                              | Terminalizer / t-rec                             | Our Approach                                                                  |
| ------------------- | ------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Typing cadence      | Global `TypingSpeed` plus per-command override   | Delay controls, recorded timing, or natural mode | Add deterministic human cadence profiles on top of per-step typing            |
| Pauses and waits    | `Sleep` plus output-aware `Wait`                 | Frame delay / idle controls, fixed pauses        | Keep explicit waits, but add semantic pause defaults and readable idle caps   |
| Capture density     | Flat `Framerate` knob                            | Flat FPS / frame-step controls                   | Add capture profiles first, then event-aware density                          |
| Smoothness strategy | More FPS, playback-speed control                 | More FPS, idle optimization, frame skipping      | Prioritize terminal-safe pacing and density before fake cinematic effects     |
| Readability knobs   | Width, height, font size, padding, margin, theme | Font size, line height, cols/rows, frame styling | Package existing Tuireel controls into 1080p-safe presets and validation      |
| Human feel          | Mostly manual author tuning                      | Mostly manual tuning or real-timing capture      | Make "human-feeling" a first-class scripted concern rather than a side effect |

## Sources

- `https://github.com/charmbracelet/vhs` - official README and command reference; verified support for `TypingSpeed`, `Sleep`, `Wait`, `Framerate`, `PlaybackSpeed`, and layout controls. HIGH confidence.
- `https://github.com/faressoft/terminalizer` - official README/docs; verified `frameDelay`, `maxIdleTime`, frame skipping, font and terminal sizing controls. HIGH confidence.
- `https://github.com/sassman/t-rec-rs` - official README; verified `--fps`, `--idle-pause`, `--natural`, and explicit positioning of smoothness vs file size/readability. HIGH confidence.
- `https://github.com/fnando/demotape` - official README; verified per-command typing modifiers, waits, width/height, font, padding, and cursor controls. HIGH confidence.
- `https://github.com/marcus/betamax` - official README; verified fixed/measured key delays, min/max delay caps, explicit frame capture, and playback speed/loop controls. HIGH confidence.
- `https://github.com/paxtonhare/demo-magic` - official README; verified simulated typing plus intentional wait points as the baseline expectation for live-feeling scripted demos. HIGH confidence.
- `https://screen.studio/guide/speed-up-typing-segments` and `https://screen.studio/guide/animations-motion` - adjacent screen-recording market signal that users now expect smoothness and typing-focused polish, but these are not terminal-specific. MEDIUM confidence.
- `.planning/PROJECT.md` - Tuireel scope and already-shipped capabilities used for dependency mapping. HIGH confidence.

---

_Feature research for: Tuireel v1.2 Human Demo Feel_
_Researched: 2026-03-08_
