# Project State: Tuireel

## Current Position

Phase: 6 of 6 (Workflow & Polish)
Plan: 6 of 6
Status: Phase complete
Last activity: 2026-03-03 - Completed 06-06-PLAN.md (set-env runtime gap closure)
Progress: ████████████████████ 100% (23/23 plans)

## Current Phase

Phase 6: Workflow & Polish — Complete (6/6 plans complete)

## Project Reference

See: `.planning/PROJECT.md` (updated 2025-07-26)
Core value: TUI tool authors can produce polished demo videos from a declarative script.
Current focus: Closing STEP-09 by wiring `set-env` to observable runtime behavior and adding regression coverage.

## Phase Progress

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Foundation | ● Complete | 100% |
| 2 | Core Pipeline | ● Complete | 100% |
| 3 | Output Quality | ● Complete | 100% |
| 4 | Overlay System | ● Complete | 100% |
| 5 | Sound | ● Complete | 100% |
| 6 | Workflow & Polish | ● Complete | 100% |

## Requirement Coverage

- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

## Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | Use `tsup` builds for both workspace packages (`@tuireel/core` dual-format, `tuireel` ESM + shebang). | Keeps package build scripts consistent while emitting typed dist artifacts for both packages. |
| 01-01 | Declare `"packageManager": "pnpm@10.28.2"` in root `package.json`. | Required for Turborepo to resolve workspace graph during `pnpm build`. |
| 01-02 | Accept optional `$schema` in config input but strip it from validated runtime config output. | Preserves IDE schema metadata support without leaking tooling-only metadata into execution config. |
| 01-02 | Use `ConfigValidationError` with structured `{ path, message }` issues. | Provides clear, actionable diagnostics for upcoming CLI `validate` command output. |
| 01-03 | Use evermeet zip builds for darwin and BtbN latest tar.xz builds for linux targets. | Latest BtbN release no longer publishes macOS artifacts, so mixed-source routing is required for platform support. |
| 01-03 | Validate downloaded ffmpeg with direct `ffmpeg -version` execution. | Executability checks alone are insufficient; command execution confirms binary health before caching. |
| 01-04 | Use `parseAsync` with exported `createProgram()`/`runCli()` in CLI entrypoint. | Ensures async command actions are awaited and keeps command wiring testable. |
| 01-04 | Convert JSONC parse offsets to line/column in CLI output. | Gives actionable validation diagnostics while preserving core config error contracts. |
| 01-05 | Use `z.toJSONSchema(configSchema, { target: "draft-07", io: "input" })` for schema generation. | Produces non-empty schema with defaults + required `steps`, matching config authoring contract for IDE autocomplete. |
| 01-05 | Assert schema parity in both core and CLI init integration tests. | Prevents drift between generated schema output and persisted `~/.tuireel/schema.json` artifact. |
| 02-01 | Keep launch orchestration in `createSession()` and treat `launch` execution as validation/no-op in dispatcher. | Prevents double process spawn while retaining schema-compatible launch steps in the execution pipeline. |
| 02-01 | Use `writeRaw` + jittered `charDelay` typing instead of tuistory `session.type()`. | Meets human-like typing cadence requirements rather than fixed 1ms per-character input. |
| 02-01 | Export `Step` as an alias of schema-derived `TuireelStep` in step executor. | Keeps executor dispatch types synchronized with config contract definitions. |
| 02-02 | Resolve launch command from the first `launch` step while keeping top-level `cols`/`rows` config fields. | Maintains compatibility with established config schema and 02-01 launch semantics. |
| 02-02 | Render screenshots at fixed row-derived height (`rows * fontSize * lineHeight`). | Prevents renderer content-trim behavior from collapsing viewport height in MP4 output. |
| 02-02 | Register recorder signal handlers before setup and terminate ffmpeg immediately on interrupt. | Reduces orphan-process risk during SIGINT/SIGTERM shutdown paths. |
| 02-03 | Represent regex waits as `{ regex, flags? }` objects while preserving string `pattern` support. | Keeps existing configs backward-compatible while adding explicit regex configuration semantics. |
| 02-03 | Compile wait regex objects in dispatcher before `waitStep()` calls. | Preserves `waitStep(session, string | RegExp, timeout)` API boundaries and keeps conversion near step dispatch context. |
| 03-01 | Add `format` to config schema and support CLI `record --format` override. | Makes output format selection explicit and keeps MP4/WebM/GIF routing centralized. |
| 03-01 | Route GIF output through temporary MP4 capture followed by palettegen/paletteuse conversion. | Preserves stream capture architecture while enabling true two-pass GIF optimization. |
| 03-01 | Quantize GIF FPS to centisecond-safe `100/N` ratios. | Avoids GIF timing rounding that can overshoot the 15fps cap. |
| 03-02 | Apply terminal theme colors through OSC palette/default color commands before capture starts. | Ensures ANSI color indexes and default fg/bg render with selected theme without changing ghostty internals. |
| 03-02 | Treat `theme.fontFamily` as renderer passthrough metadata and use it as `fontPath` when path-like. | Preserves config flexibility while aligning with ghostty-opentui's supported font configuration surface. |
| 04-01 | Serialize timeline as keyframes plus `frameCount`, and expand to full per-frame states with interpolation via `getFrames()`. | Reduces persisted JSON size while preserving frame-accurate playback semantics for compositing. |
| 04-01 | Keep timeline persistence synchronous (`save`/`fromFile`) using `writeFileSync`/`readFileSync`. | Timeline handoff happens at phase boundaries where deterministic disk IO is simpler than async orchestration. |
| 04-01 | Extend Vitest include globs to cover `src/**/__tests__/**/*.test.ts`. | Ensures new timeline contract tests run under the standard package test command. |
| 04-02 | Keep cursor math helpers internal and export only `computeCursorPath` + `moveDuration` from the Bezier module. | Preserves a narrow overlay motion API while retaining testable implementation detail encapsulation. |
| 04-02 | Render cursor overlays from SVG to PNG via Sharp, with default circle SVG and drop shadow filter. | Produces alpha-ready compositor assets while keeping cursor visuals configurable through SVG overrides. |
| 04-03 | Define shared overlay contracts in `overlay/types.ts` (`OverlayImage`, `CursorConfig`, `HudConfig`) with exported defaults. | Keeps cursor and HUD renderers aligned on config and compositing payload structure before compositor integration. |
| 04-03 | Render keystroke HUD badges as SVG and rasterize through Sharp with group-level opacity control. | Produces alpha-safe, frame-positioned overlays that support multi-key labels and fade animation in a single render step. |
| 04-04 | Implement `compose()` as ffmpeg frame decode + Sharp overlay + profile-based re-encode, including GIF two-pass finalize. | Reuses established encoder behavior while adding per-frame overlay compositing without changing format contracts. |
| 04-04 | Persist `.tuireel/raw/{name}.mp4` and `.tuireel/timelines/{name}.timeline.json` during record, then compose final output from those artifacts. | Delivers true two-pass flow and enables re-compositing with new overlay settings without re-recording steps. |
| 04-04 | Handle `--no-hud` by stripping HUD state in CLI input and `--no-cursor` via cursor visibility override. | Keeps compositor API focused on rendering while exposing user-facing overlay toggles in `tuireel composite`. |
| 04-05 | Scale cursor micro-jitter with a distance ramp plus long-move boost so long travel reaches visible 1-2px amplitude while endpoints stay subtle. | Closes OVR-01 verification gap without changing path/duration APIs or endpoint exactness guarantees. |
| 04-05 | Define and consume shared `CursorImage` overlay contract across cursor renderer and compositor paths. | Removes local type divergence and keeps overlay renderer/compositor contracts aligned under `overlay/types.ts`. |
| 05-01 | Resolve bundled SFX directory through runtime candidate paths (`__dirname`, workspace, node_modules). | Keeps default sound preset lookups working across ESM/CJS builds and local workspace execution. |
| 05-01 | Keep sound behavior strictly opt-in via optional `sound.effects` and skip audio mix when SFX config is absent. | Preserves silent-by-default output for existing configs while enabling explicit sound configuration. |
| 05-02 | Finalize audio using a shared `buildFullAudioArgs` pipeline for effects-only, track-only, and mixed modes. | Consolidates sound branching logic while keeping mp4/webm finalizers format-specific and predictable. |
| 05-02 | Resolve `sound.track` relative to config file path in both `record` and `composite` commands. | Prevents cwd-dependent custom track failures and keeps CLI behavior stable across invocation locations. |
| 06-01 | Extend `TuireelSession` with `scroll`/`clickText` helpers plus mutable `env` state. | Keeps advanced step handlers decoupled from tuistory internals while supporting set-env updates. |
| 06-01 | Skip global idle waits after `screenshot` and `set-env` dispatch cases. | Avoids unnecessary settle delays for steps that do not mutate terminal render state. |
| 06-02 | Implement preview runtime by reusing `executeSteps` callbacks for per-step logging, with no capture/encode pipeline. | Keeps preview behavior aligned with record step semantics while remaining fast and output-free. |
| 06-02 | Register `preview` as a first-class CLI command and stop stub command registration. | Prevents duplicate command wiring and exposes production preview UX via commander. |
| 06-03 | Separate authoring-time config validation (`configInputSchema`) from runtime single-video config validation (`configSchema`). | Enables multi-video + `$include` authoring without forcing recorder/executor consumers to handle unresolved config shapes. |
| 06-03 | Normalize `loadConfig()` to always return `TuireelConfig[]` and add `loadSingleConfig()` for single-video commands. | Supports one-invocation multi-video record while keeping preview/composite deterministic and backward compatible. |
| 06-04 | Implement watch mode as core `watchAndRecord()` plus CLI `record --watch` routing. | Keeps watch/re-record behavior reusable in core while keeping CLI command logic minimal. |
| 06-04 | Reuse record-cycle config normalization (format override + relative sound track resolution) inside watch mode runs. | Preserves output parity between one-shot `record` and watch-triggered re-record cycles. |
| 06-05 | Keep CLI package as ESM with explicit `bin`, `main`, `files`, and `engines` metadata, and preserve shebang banner in build output. | Ensures `tuireel` remains publishable and executable through npm package runners. |
| 06-05 | Use realpath-aware direct execution detection in CLI entrypoint. | Prevents symlinked npx/bunx bin invocations from skipping CLI command registration. |
| 06-06 | Apply `set-env` updates via session-owned shell export emission with deterministic single-quote escaping. | Makes set-env behavior user-visible at runtime while keeping env value handling predictable for spaces and quotes. |
| 06-06 | Wait for idle after `set-env` now that it emits terminal commands. | Prevents downstream step timing races after runtime environment mutation commands. |

## Blockers/Concerns Carried Forward

- None.

## Key Risks

| Risk | Mitigation | Status |
|------|------------|--------|
| tuistory API instability | Pin version, abstraction layer | Unmitigated |
| Frame timing inconsistency | Idle detection + frame dedup (webreel pattern) | Unmitigated |
| ffmpeg pipeline fragility | Follow webreel's proven approach | Unmitigated |
| GIF quality/size | Two-pass palettegen, quality presets | Unmitigated |

## Session Continuity

Last session: 2026-03-03T05:21:13Z
Stopped at: Completed 06-06-PLAN.md
Resume file: None
