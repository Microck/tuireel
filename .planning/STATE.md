# Project State: Tuireel

## Current Position

Phase: 1 of 6 (Foundation)
Plan: 4 of 4
Status: Phase complete
Last activity: 2026-03-02 - Completed 01-04-PLAN.md
Progress: ████░░░░░░░░░░░░░░░░ 21% (4/19 plans)

## Current Phase

Phase 1: Foundation — Complete (4/4 plans complete)

## Project Reference

See: `.planning/PROJECT.md` (updated 2025-07-26)
Core value: TUI tool authors can produce polished demo videos from a declarative script.
Current focus: Phase 1 foundation and config/CLI scaffolding.

## Phase Progress

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Foundation | ● Complete | 100% |
| 2 | Core Pipeline | ○ Pending | 0% |
| 3 | Output Quality | ○ Pending | 0% |
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

## Blockers/Concerns Carried Forward

- None from `01-04-SUMMARY.md`.

## Key Risks

| Risk | Mitigation | Status |
|------|------------|--------|
| tuistory API instability | Pin version, abstraction layer | Unmitigated |
| Frame timing inconsistency | Idle detection + frame dedup (webreel pattern) | Unmitigated |
| ffmpeg pipeline fragility | Follow webreel's proven approach | Unmitigated |
| GIF quality/size | Two-pass palettegen, quality presets | Unmitigated |

## Session Continuity

Last session: 2026-03-02T23:07:26Z
Stopped at: Completed 01-04-PLAN.md
Resume file: .planning/phases/02-core-pipeline/02-01-PLAN.md
