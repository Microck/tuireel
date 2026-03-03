# Project State: Tuireel

## Current Position

Phase: 3 of 6 (Output Quality)
Plan: 1 of 2
Status: In progress
Last activity: 2026-03-03 - Completed 03-01-PLAN.md (webm vp9 + gif two-pass encoding)
Progress: █████████░░░░░░░░░░░░ 43% (9/21 plans)

## Current Phase

Phase 3: Output Quality — In progress (1/2 plans complete)

## Project Reference

See: `.planning/PROJECT.md` (updated 2025-07-26)
Core value: TUI tool authors can produce polished demo videos from a declarative script.
Current focus: Completing output quality work (format parity delivered, terminal theming pending).

## Phase Progress

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Foundation | ● Complete | 100% |
| 2 | Core Pipeline | ● Complete | 100% |
| 3 | Output Quality | ◐ In progress | 50% |
| 4 | Overlay System | ○ Pending | 0% |
| 5 | Sound | ○ Pending | 0% |
| 6 | Workflow & Polish | ○ Pending | 0% |

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

Last session: 2026-03-03T01:05:15Z
Stopped at: Completed 03-01-PLAN.md (webm vp9 + gif two-pass encoding)
Resume file: .planning/phases/03-output-quality/03-02-PLAN.md
