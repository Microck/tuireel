# Stack Research

**Domain:** human-feeling terminal demo recording for an existing PTY-based recorder
**Researched:** 2026-03-08
**Confidence:** HIGH

This file covers only v1.2 additions and approach changes. The existing TypeScript monorepo, `@tuireel/core` + CLI split, `tuistory`, ffmpeg, Sharp, JSONC config, and current overlay/composite pipeline stay in place.

## Recommended Stack

### Core Technologies

| Technology                               | Version                  | Purpose                                                           | Why Recommended                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| In-house timing model in `@tuireel/core` | no new package           | Human typing cadence, pauses, idle holds, per-step timing presets | This should stay deterministic and recorder-native. Tuireel already has `type.speed`, `pause`, `fps`, and `captureFps`; the missing piece is a richer timing model, not a new dependency. Add token-aware delays, punctuation/whitespace holds, first-key delay, post-command settle pauses, and seeded jitter so re-renders stay reproducible. |
| `tuistory`                               | 0.0.16 (latest on npm)   | PTY automation and terminal state capture                         | Keep the current PTY backend. The right integration is to emit more precise timestamps around typed characters and step boundaries, not to swap recorders. This keeps human-feel work aligned with the existing session/executor flow.                                                                                                          |
| ffmpeg                                   | existing external binary | Decouple capture cadence from delivery FPS and keep CFR output    | Use ffmpeg as the final timing normalizer, not as the source of fake smoothness. Record raw terminal changes at higher cadence than final delivery, then encode CFR output at the chosen presentation FPS. This fits Tuireel's current raw-video plus composite architecture.                                                                   |
| `sharp`                                  | 0.34.5 (latest on npm)   | 1080p readability policy for scaling, padding, and preview parity | Keep Sharp for overlay compositing and sizing policy. The new work is integer-scale-first layout math for terminal content so 1080p renders stay crisp, with padding/background handled before final ffmpeg encode. No separate raster stack is needed.                                                                                         |

### Supporting Libraries

| Library                  | Version | Purpose                                                                           | When to Use                                                                                                                                                              |
| ------------------------ | ------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `zod`                    | 4.1.12  | Extend config/schema for `typing`, `pause`, `captureFps`, and readability presets | Use for new config surface such as `typing.mode`, `typing.seed`, `pause.afterCommandMs`, `pause.afterScrollMs`, and explicit `outputSize` presets like `1080p-readable`. |
| `vitest`                 | 3.2.4   | Lock timing and scaling behavior with deterministic tests                         | Use for seeded timing snapshots, timeline expansion tests, and golden checks that 1080p preset math does not regress.                                                    |
| no extra runtime library | n/a     | Preserve a small dependency surface                                               | Do not add generic typing-animation packages, browser recorders, or a second compositor unless a real gap appears that current code cannot cover.                        |

### Development Tools

| Tool                                       | Purpose                                                         | Notes                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `ffprobe` from the existing ffmpeg bundle  | Verify output FPS, CFR behavior, duration, and 1920x1080 sizing | Add tests/assertions around actual encoded output instead of trusting config intent.                    |
| existing preview/record/composite fixtures | Validate human-feel visually against current pipeline           | Add a small fixture set: fast command entry, long idle read, scroll-heavy output, and 1080p dense text. |

## Installation

```bash
# Recommended default: no new runtime dependencies
# Keep using the current stack and extend @tuireel/core behavior.

# Optional: refresh latest patch-level deps already in use
pnpm --filter @tuireel/core up tuistory@^0.0.16 sharp@^0.34.5

# No new supporting packages recommended
```

## Integration Points in the Current Pipeline

- `packages/core/src/executor/steps/type.ts`: replace single-character fixed jitter with a preset-based humanizer that understands bursts, punctuation, whitespace, and end-of-command dwell.
- `packages/core/src/executor/timing.ts`: make timing deterministic from config seed + step index so preview, record, and composite all agree.
- `packages/core/src/recorder.ts`: keep `captureFps` separate from presentation FPS and record timestamp-rich step events at capture cadence.
- `packages/core/src/timeline/interaction-timeline.ts`: prefer time-based expansion over frame-count assumptions when capture FPS exceeds output FPS.
- `packages/core/src/compositor.ts`: continue mapping terminal source frames separately from overlay motion, but make output-frame selection explicitly timestamp-driven when possible.
- `packages/core/src/config/schema.ts`: add high-level presets rather than many low-level knobs; good defaults matter more than unlimited tuning.

## Alternatives Considered

| Recommended                                                 | Alternative                                    | When to Use Alternative                                                                                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recorder-native humanizer in `@tuireel/core`                | Generic typing animation libraries             | Use a typing-animation library only for browser DOM demos. Tuireel writes to a PTY, so DOM-oriented typing packages do not fit the execution path.       |
| Higher `captureFps` plus explicit output FPS                | ffmpeg `minterpolate` / optical-flow smoothing | Use optical-flow interpolation for live-action video, not terminal text. For terminal glyphs it can invent in-between frames and make text shimmer.      |
| Integer-scale terminal framing with existing Sharp + ffmpeg | Full browser/screen-capture pipeline           | Use browser capture only for browser products. Tuireel already has direct terminal frames, so screen recording adds blur and timing noise for no upside. |

## What NOT to Use

| Avoid                                                                            | Why                                                                                                                                                                               | Use Instead                                                       |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `minterpolate` as default smoothing                                              | Official ffmpeg docs describe it as motion interpolation; that is the wrong abstraction for terminal glyph changes and cursor snaps. It risks ghosting and synthetic text motion. | Capture more real frames, then encode CFR output at 30 or 60 fps. |
| Browser-recorder stacks (`playwright` video, Remotion, Puppeteer screen capture) | They solve rendered-web capture, not PTY-native terminal state. They add browser dependencies and degrade terminal crispness.                                                     | Stay on `tuistory` + current compositor.                          |
| Extra ffmpeg downloader packages like `ffmpeg-static`                            | Tuireel already manages ffmpeg resolution and caching. A second binary source complicates release and support.                                                                    | Keep the existing ffmpeg downloader/cache path.                   |
| Generic typing-effect packages                                                   | Most target DOM text, not PTY writes, and they make determinism harder.                                                                                                           | Keep timing logic inside `packages/core/src/executor/timing.ts`.  |

## Stack Patterns by Variant

**If the goal is the default polished MP4/WebM demo:**

- Capture terminal frames at 45-60 fps, keep output at 30 fps by default.
- Hold real idle frames for readability, but never synthesize motion with interpolation.

**If the goal is ultra-readable 1080p product marketing output:**

- Use a named readability preset that chooses cols/rows, font scale, padding, and output size together.
- Favor integer-ish scaling and larger text over trying to fit a dense 80x24 frame into 1080p unchanged.

## Version Compatibility

| Package A                      | Compatible With                          | Notes                                                                                                          |
| ------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `tuistory@0.0.16`              | current `@tuireel/core` PTY/session flow | Latest npm release matches the version already in the repo, so no PTY backend change is required.              |
| `sharp@0.34.5`                 | current compositor and resize pipeline   | Latest npm release already matches the repo; use it for sizing policy, not a new image stack.                  |
| ffmpeg filters `fps` + `scale` | current encode/composite pipeline        | ffmpeg docs support CFR conversion and high-quality scaling directly; this is enough for terminal output work. |

## Sources

- Local repo: `packages/core/src/executor/steps/type.ts`, `packages/core/src/executor/timing.ts`, `packages/core/src/recorder.ts`, `packages/core/src/timeline/interaction-timeline.ts`, `packages/core/src/compositor.ts`, `packages/core/src/config/schema.ts` — verified existing integration points.
- npm registry: `https://registry.npmjs.org/tuistory/latest` — verified latest `tuistory` is `0.0.16`.
- npm registry: `https://registry.npmjs.org/sharp/latest` — verified latest `sharp` is `0.34.5`.
- npm registry: `https://registry.npmjs.org/ghostty-opentui/latest` — verified latest `ghostty-opentui` is `1.4.7`; useful context, but not required for this milestone.
- FFmpeg filter docs: `https://ffmpeg.org/ffmpeg-filters.html` — verified `fps`, `scale`/`lanczos`, and `minterpolate` capabilities and tradeoffs.
- Sharp resize docs: `https://sharp.pixelplumbing.com/api-resize/` — verified `lanczos3`, `fit`, and `withoutEnlargement` behavior for readability-focused scaling.
- Terminalizer README: `https://raw.githubusercontent.com/faressoft/terminalizer/master/README.md` — verified prior-art concepts like frame delay and max idle time. MEDIUM confidence for ecosystem patterning.
- t-rec README: `https://raw.githubusercontent.com/sassman/t-rec-rs/main/README.md` — verified prior-art concepts like start/end pause, idle pause, and configurable capture FPS. MEDIUM confidence for ecosystem patterning.

---

_Stack research for: Tuireel v1.2 human-feeling demo recording_
_Researched: 2026-03-08_
