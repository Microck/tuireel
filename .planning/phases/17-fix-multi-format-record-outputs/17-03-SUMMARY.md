---
phase: 17-fix-multi-format-record-outputs
plan: 03
subsystem: docs
tags: [cli, docs, format]

requires:
  - phase: 17-fix-multi-format-record-outputs
    provides: record/composite runtime output filename normalization
provides:
  - CLI docs that state --format normalizes output filename extensions
affects: [video-smoke, record, composite, ci-04]

tech-stack:
  added: []
  patterns: ["Document runtime contracts in CLI reference"]

key-files:
  created: []
  modified:
    - docs/cli-reference.mdx

key-decisions:
  - "None - followed plan as specified"

patterns-established:
  - "CLI docs must describe filename normalization when format is authoritative"

duration: 3 min
completed: 2026-03-04
---

# Phase 17 Plan 03: Fix Multi-Format Record Outputs Summary

**Documented that selecting `--format` (or config `format`) normalizes the output filename extension for both `record` and `composite`.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T16:22:30Z
- **Completed:** 2026-03-04T16:25:30Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Updated `record` docs to state the output extension is rewritten to match the selected format (with a concrete example).
- Updated `composite` docs to confirm the same output filename normalization rule applies.

## Task Commits

Each task was committed atomically:

1. **Task 1: Document record --format output filename normalization (with rule + example)** - `0a1b355` (docs)
2. **Task 2: Align composite --format docs with the same naming rule** - `67ca230` (docs)

## Files Created/Modified

- `docs/cli-reference.mdx` - Clarifies that selecting `--format` normalizes the output filename extension for record/composite.

## Decisions Made

None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Docs now match runtime output naming behavior for multi-format CI smoke.
- Remaining Phase 17 work (if any) can proceed without docs/runtime mismatch.

## Self-Check: PASSED
