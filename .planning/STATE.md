# Project State: Tuireel

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-07-16)
**Core value:** TUI tool authors can produce polished demo videos from a declarative script.
**Current focus:** Phase 8 — Presets & Reliability (v1.1)

## Current Position

Phase: 8 of 12 (Presets & Reliability)
Plan: 2 of 4 in current phase
Status: In progress
Last activity: 2026-03-03 — Completed 08-02-PLAN.md (Compositor Signal Handling & Error Messages)

Progress: [██████████████████████░░░░░░] Phase 8: 1/4 summaries

## Milestone Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-6 | 23/23 | Complete | 2026-03-03 |
| v1.1 Branding, Docs & Hardening | 7-12 | 6/10+ | In progress (Phase 8 in progress) | — |

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 23
- 6 phases, 50 tasks
- Shipped in <1 day

**v1.1:** 6 plans completed. Phase 7 complete (5 plans). Phase 8: 08-02 complete (2 min).

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
- 3 badges only for README (npm, CI, license) — no badge overload
- Relative image paths in README for portability
- README section order established: logo -> banner -> tagline -> badges -> install -> quickstart -> features -> docs -> contributing -> license

Phase 8 decisions:
- process.once (not process.on) for compositor signal handling to avoid conflicts with recorder
- Interrupt check every 100 frames balances responsiveness vs overhead
- ffmpeg errors: drop error.message, use exit code + command string + stderr instead
- Error cause chaining with { cause: error } for debugging

### Blockers/Concerns

- None. Phase 8 in progress.

### Key Risks

| Risk | Mitigation |
|------|------------|
| `workspace:*` not rewritten on publish | Verify changesets dry-run before first release |
| Sharp native binary in CI | Use `--platform=linux` in pnpm install |
| ffmpeg not in CI | Use `setup-ffmpeg@v3` action |
| Non-deterministic video output | Compare metadata, not pixels |

## Session Continuity

Last session: 2026-03-03
Stopped at: Completed 08-02-PLAN.md (Compositor Signal Handling & Error Messages)
Resume: Continue Phase 8 — next plans are 08-01 (if not yet done), 08-03, 08-04
