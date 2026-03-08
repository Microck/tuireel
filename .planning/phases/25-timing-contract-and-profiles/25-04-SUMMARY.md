---
phase: 25-timing-contract-and-profiles
plan: 04
subsystem: cli
tags: [timing-contract, composite, cli, vitest]
requires:
  - phase: 25-03
    provides: persisted timingContract metadata and compatibility helper
provides:
  - composite-time timing enforcement against saved artifacts
  - packaging-only recomposite coverage through the CLI command path
  - explicit legacy timeline guidance for timing-affecting reruns
affects: [phase-26, diagnostics, recomposite]
tech-stack:
  added: []
  patterns:
    - save-time timing metadata is the source of truth for recomposite validation
    - legacy timelines only allow packaging-only recomposition unless timing fields are requested explicitly
key-files:
  created: []
  modified:
    - packages/cli/src/commands/composite.ts
    - packages/cli/test/commands.test.ts
    - packages/core/src/index.ts
key-decisions:
  - "Validate recomposite requests against saved timingContract metadata before compose() runs."
  - "Treat explicit legacy fps, captureFps, or deliveryProfile requests as timing changes that require a fresh record."
patterns-established:
  - "Composite timing gate: fail fast on saved-vs-requested timing drift with record guidance."
  - "Packaging parity: allow format, theme/background, output sizing, trim, cursor, and HUD changes when timing stays compatible."
requirements-completed: [CAP-04]
duration: 10 min
completed: 2026-03-08
---

# Phase 25 Plan 04: Recompose Timing Enforcement Summary

**`composite` now preserves recorded pacing by default, rejects timing drift with clear rerun guidance, and still allows packaging-only recomposition from saved artifacts.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-08T17:53:48Z
- **Completed:** 2026-03-08T18:04:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added CLI regression coverage for packaging-only recomposition, timing-drift rejection, and conservative legacy-timeline handling.
- Enforced saved timing-contract compatibility in `composite` before overlay work starts.
- Restored composite parity for compatible packaging fields such as trim, output sizing, theme background, and config-driven cursor/HUD visibility.

## Task Commits

Each task was committed atomically:

1. **Task 1: Lock recomposite timing enforcement behavior in tests** - `a1d3127` (test)
2. **Task 2: Reject timing drift while allowing packaging-only recomposite changes** - `e82a3f2` (feat)

## Files Created/Modified

- `packages/cli/test/commands.test.ts` - Adds real command-path fixtures that prove packaging-only recomposition still works and timing drift fails with guidance.
- `packages/cli/src/commands/composite.ts` - Validates against saved timing metadata, blocks timing-affecting drift, and forwards packaging-safe options into `compose()`.
- `packages/core/src/index.ts` - Exposes `resolveTheme` so CLI recomposition can reuse the core theme/background resolver.

## Decisions Made

- Use the persisted `timingContract` as the recomposite gate instead of trusting currently resolved config values alone.
- For legacy timelines, inspect the raw config text for explicit `fps`, `captureFps`, or `deliveryProfile` requests so packaging-only recomposition stays allowed while ambiguous timing changes are rejected.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- CLI tests import `@tuireel/core` through the package export surface, so I rebuilt `@tuireel/core` locally during verification to refresh the generated package entry before re-running the CLI suite.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 25 is complete; the timing contract now survives `record` -> `composite` without silent pacing drift.
- Ready for Phase 26 planning and execution on top of the locked timing boundary.

## Self-Check: PASSED

---

_Phase: 25-timing-contract-and-profiles_
_Completed: 2026-03-08_
