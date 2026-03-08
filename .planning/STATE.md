---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Human Demo Feel
status: in_progress
stopped_at: Completed 25-03-PLAN.md
last_updated: "2026-03-08T17:51:11.117Z"
last_activity: 2026-03-08 - Completed 25-03 timing contract persistence
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 12
  completed_plans: 3
  percent: 89
---

# Project State: Tuireel

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-08)
**Core value:** TUI tool authors can produce polished demo videos from a declarative script, without manual screen recording, editing, or post-production.
**Current focus:** Phase 25 - Timing Contract and Profiles

## Current Position

Phase: 25 of 29 (Timing Contract and Profiles)
Plan: 3 of 4
Status: In progress
Last activity: 2026-03-08 - Completed 25-03 timing contract persistence

Progress: [█████████░] 89%

## Performance Metrics

**Velocity:**

- Total plans completed: 70
- Current milestone plans completed: 3
- Total execution time: 23 min

**By Milestone:**

| Milestone    | Plans  | Status      |
| ------------ | ------ | ----------- | ------- |
| v1.0         | 23/23  | Complete    |
| v1.1         | 38/38  | Complete    |
| v1.15        | 5/5    | Complete    |
| v1.2         | 3/12   | In progress |
| Phase 25 P02 | 4 min  | 3 tasks     | 8 files |
| Phase 25 P03 | 10 min | 2 tasks     | 7 files |

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
- [Phase 25]: Keep TimelineData.fps as the backward-compatible output cadence alias while adding a versioned timingContract object for explicit inspection. — This preserves existing artifact readers while giving later composite and diagnostics flows one explicit timing contract boundary.
- [Phase 25]: Compare only timing-affecting fields in the shared compatibility helper and return an explicit legacy fallback when saved artifacts predate timingContract. — Packaging-only changes should stay recomposite-safe, and legacy artifacts need an explicit non-guessing path for later CLI enforcement.

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 28 likely needs fixture-driven capture budget validation before the policy is locked.
- Phase 29 should prove readability and pacing with artifact-level acceptance checks, not only unit tests.

## Session Continuity

Last session: 2026-03-08T17:51:11.107Z
Stopped at: Completed 25-03-PLAN.md
Resume file: None
