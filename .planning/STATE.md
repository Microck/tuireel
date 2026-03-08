---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Human Demo Feel
status: in_progress
stopped_at: Completed 25-02-PLAN.md
last_updated: "2026-03-08T17:33:07.744Z"
last_activity: 2026-03-08 - Completed 25-02 init/docs timing contract rollout
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 12
  completed_plans: 2
  percent: 87
---

# Project State: Tuireel

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-08)
**Core value:** TUI tool authors can produce polished demo videos from a declarative script, without manual screen recording, editing, or post-production.
**Current focus:** Phase 25 - Timing Contract and Profiles

## Current Position

Phase: 25 of 29 (Timing Contract and Profiles)
Plan: 2 of 4
Status: In progress
Last activity: 2026-03-08 - Completed 25-02 init/docs timing contract rollout

Progress: [█████████░] 87%

## Performance Metrics

**Velocity:**

- Total plans completed: 68
- Current milestone plans completed: 2
- Total execution time: 13 min

**By Milestone:**

| Milestone    | Plans | Status      |
| ------------ | ----- | ----------- | ------- |
| v1.0         | 23/23 | Complete    |
| v1.1         | 38/38 | Complete    |
| v1.15        | 5/5   | Complete    |
| v1.2         | 2/12  | In progress |
| Phase 25 P02 | 4 min | 3 tasks     | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in `.planning/PROJECT.md`.
Recent decisions affecting v1.2:

- Keep Tuireel PTY-native and two-pass; do not pivot toward browser recording.
- Keep the milestone deterministic and testable; no random jitter as default humanization.
- Improve motion by capturing more real terminal states, not by optical-flow or glyph interpolation.
- [Phase 25]: Keep `preset` visual-only and add a separate `deliveryProfile` field for timing/readability defaults. — This preserves the shipped preset mental model while giving Phase 25 one authoritative timing/readability layer.
- [Phase 25]: Resolve delivery profiles in the shared loader so single-video and multi-video flows keep the same precedence rules. — Applying resolution in one loader path avoids drift between record, watch, preview, and future composite timing enforcement.
- [Phase 25]: Treat explicit `fps`, `captureFps`, and readability fields as authoritative over profile defaults. — Authors need named profiles for fast setup without losing direct control over raw capture cadence or final delivery cadence.
- [Phase 25]: Default tuireel init to readable-1080p so delivery profiles become the first author-facing workflow.
- [Phase 25]: Prompt for delivery profile before optional preset so timing intent is chosen before visual polish.
- [Phase 25]: Keep README, docs, and skill examples aligned on stacked preset plus deliveryProfile examples and corrected cadence language.

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 28 likely needs fixture-driven capture budget validation before the policy is locked.
- Phase 29 should prove readability and pacing with artifact-level acceptance checks, not only unit tests.

## Session Continuity

Last session: 2026-03-08T17:33:07.737Z
Stopped at: Completed 25-02-PLAN.md
Resume file: None
