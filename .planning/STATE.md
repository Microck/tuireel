# Project State: Tuireel

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-07-16)
**Core value:** TUI tool authors can produce polished demo videos from a declarative script.
**Current focus:** Phase 11 in progress (v1.1)

## Current Position

Phase: 11 of 12 (CI & Linting)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-03-04 -- Completed 11-01-PLAN.md (ESLint + Prettier + CI)

Progress: [████████████████░░░░░░░░░░░░░░░░] Phase 11: 1/2 summaries

## Milestone Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-6 | 23/23 | Complete | 2026-03-03 |
| v1.1 Branding, Docs & Hardening | 7-12 | 15/19 | In progress (Phase 11: 1/2) | -- |

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 23
- 6 phases, 50 tasks
- Shipped in <1 day

**v1.1:** 15 plans completed. Phase 7 complete (5 plans). Phase 8 complete: 08-01 (3 min), 08-02 (2 min), 08-03 (3 min), 08-04 (2 min). Phase 9 complete: 09-01 (8 min), 09-02 (8 min). Phase 10 complete: 10-01 (2 min), 10-02 (2 min), 10-03 (3 min). Phase 11: 11-01 (3 min).

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.
Recent decisions:
- Apache 2.0 license (confirmed in requirements)
- Mintlify for docs (confirmed in requirements)
- GitHub Actions for CI (confirmed in requirements)
- Icon concept: film reel frame + terminal prompt (>_) with sprocket holes
- Color palette: teal #06B6D4, amber #F59E0B, navy #0F172A, off-white #F8FAFC
- Copyright holder: "Tuireel Contributors" (community project)
- LICENSE uses official apache.org text verbatim for GitHub detection
- YAML form templates (not markdown) for structured issue validation
- Minimal PR template (3 sections, no checklists)
- favicon.svg used as composite source for banner/OG (icon-only, better centering)
- scripts/ directory established for reproducible asset generation
- 3 badges only for README (npm, CI, license) -- no badge overload
- Relative image paths in README for portability
- README section order established: logo -> banner -> tagline -> badges -> install -> quickstart -> features -> docs -> contributing -> license

Phase 8 decisions:
- process.once (not process.on) for compositor signal handling to avoid conflicts with recorder
- Interrupt check every 100 frames balances responsiveness vs overhead
- ffmpeg errors: drop error.message, use exit code + command string + stderr instead
- Error cause chaining with { cause: error } for debugging
- Sound merge uses full replacement, not partial deep merge
- Preset key stripped from resolved output
- PresetConfig excludes steps/output/$schema/format
- ExecuteStepsCallbacks renamed to ExecuteStepsOptions
- Timeout cascade: per-step timeout > defaultWaitTimeout > no timeout
- Session error wrapping with context + cause preservation
- Preset resolution runs before Zod validation in both loading paths
- Init preset prompt only shows in TTY mode (non-interactive skips)

Phase 9 decisions:
- All logger output to stderr (not stdout) to avoid interfering with piped output
- Logger is always optional with silent default fallback -- no breaking API changes
- LogLevel enum: silent(0) < normal(1) < verbose(2) < debug(3)
- --debug flag takes precedence over --verbose when both specified
- Keep plain Error class (no custom error hierarchies) for simplicity
- Error message pattern: "What went wrong. Try: actionable suggestion."
- Preserve { cause: error } chaining on all re-thrown errors
- ENOENT-specific handling added to config loader for file-not-found guidance

Phase 10 decisions:
- Mintlify v4 docs.json format (not older mint.json)
- Branding assets copied into docs/images/ for Mintlify local path requirement
- Single Documentation tab with 3 groups: Get Started, Configuration, Features
- docs/ added to pnpm-workspace.yaml as workspace member
- ResponseField + Expandable components for structured API reference docs
- Config fields grouped into General, Presentation, Sound, Behavior categories
- $include directive documented in steps reference (part of schema API surface)
- Documented all 8 built-in themes (plan listed 6, source has monokai and nord too)
- Include file format documented as { "steps": [...] } per resolver.ts parsing logic

Phase 11 decisions:
- ESLint 10 flat config (eslint.config.mjs) with typescript-eslint recommended
- Relaxed preserve-caught-error (off), no-useless-escape (warn), no-explicit-any (warn)
- Prettier matches existing style: double quotes, semis, trailing commas, 2-space indent, 100 width
- Single CI job: install → lint → type-check → build → test
- Node 22 + pnpm/action-setup@v4 in CI

### Blockers/Concerns

- None.

### Key Risks

| Risk | Mitigation |
|------|------------|
| `workspace:*` not rewritten on publish | Verify changesets dry-run before first release |
| Sharp native binary in CI | Use `--platform=linux` in pnpm install |
| ffmpeg not in CI | Use `setup-ffmpeg@v3` action |
| Non-deterministic video output | Compare metadata, not pixels |

## Session Continuity

Last session: 2026-03-04
Stopped at: Completed 11-01-PLAN.md (ESLint + Prettier + CI) -- Phase 11 in progress
Resume: 11-02-PLAN.md (Video smoke test CI job)
