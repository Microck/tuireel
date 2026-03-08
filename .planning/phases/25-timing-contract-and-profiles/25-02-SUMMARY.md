---
phase: 25-timing-contract-and-profiles
plan: 02
subsystem: docs
tags: [delivery-profiles, cli, docs, readme, init]

requires:
  - phase: 25-01
    provides: delivery-profile schema, loader resolution, and public contract terms
provides:
  - profile-first `tuireel init` scaffolding with default deliveryProfile output
  - CLI regression coverage for starter config and persisted schema terminology
  - author-facing docs aligned on `fps` vs `captureFps` semantics
affects: [25-03, 25-04, docs, onboarding]

tech-stack:
  added: []
  patterns:
    - "Init teaches deliveryProfile before optional visual preset"
    - "Author docs describe `fps` as final output cadence and `captureFps` as raw capture cadence"

key-files:
  created: []
  modified:
    - packages/cli/test/commands.test.ts
    - packages/cli/src/commands/init.ts
    - README.md
    - docs/config-reference.mdx
    - docs/presets.mdx
    - docs/quickstart.mdx
    - docs/multi-video.mdx
    - skills/tuireel/examples.md

key-decisions:
  - "Default `tuireel init` to `readable-1080p` so delivery profiles become the first author-facing workflow."
  - "Prompt for delivery profile before optional preset so timing intent is chosen before visual polish."
  - "Keep every touched doc surface aligned on stacked `preset` + `deliveryProfile` examples and corrected cadence language."

patterns-established:
  - "Starter configs include `deliveryProfile` by default and only add `preset` when authors opt in."
  - "Examples can stack `deliveryProfile` for timing/readability with `preset` for the visual layer."

requirements-completed: [READ-03, CAP-01]

duration: 4 min
completed: 2026-03-08
---

# Phase 25 Plan 02: Timing Contract and Profiles Summary

**`tuireel init` now scaffolds a delivery-profile-first config, and the README/docs consistently teach `fps` as final output cadence and `captureFps` as raw capture cadence.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T17:27:59Z
- **Completed:** 2026-03-08T17:31:44Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added failing CLI coverage that locks in delivery-profile-first starter config behavior and schema visibility.
- Updated `tuireel init` so non-interactive runs default to `readable-1080p` and interactive runs choose delivery profile before optional preset.
- Rewrote every touched author-facing surface to explain stacked `preset` + `deliveryProfile` usage and corrected timing terminology.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CLI coverage for profile-first starter config** - `b97881f` (test)
2. **Task 2: Make `tuireel init` teach deliveryProfile first** - `d3ccd1e` (feat)
3. **Task 3: Rewrite docs and examples around the new timing contract** - `6ccc666` (docs)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `packages/cli/test/commands.test.ts` - Locks starter config defaults, schema fields, and parser validation into the CLI regression suite.
- `packages/cli/src/commands/init.ts` - Prompts for delivery profile first and scaffolds `deliveryProfile` into generated configs.
- `README.md` - Aligns top-level onboarding copy and examples with the timing contract.
- `docs/config-reference.mdx` - Documents `deliveryProfile`, `captureFps`, and corrected `fps` semantics.
- `docs/presets.mdx` - Clarifies that presets stay visual-only and stack with delivery profiles.
- `docs/quickstart.mdx` - Shows the profile-first starter flow and a stacked preset example.
- `docs/multi-video.mdx` - Extends defaults/examples with `deliveryProfile` and `captureFps` usage.
- `skills/tuireel/examples.md` - Updates skill examples to teach the same timing contract.

## Decisions Made

- Made `readable-1080p` the default starter delivery profile so new configs immediately model the intended workflow.
- Kept preset selection optional and separate from timing/readability selection in both CLI flow and docs.
- Reused the same contract language across README, docs, and skill examples to reduce author drift.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Forced init tests into non-interactive mode**

- **Found during:** Task 1 (Add CLI coverage for profile-first starter config)
- **Issue:** `vitest` inherited a TTY, so `tuireel init` waited on interactive prompts instead of reaching the new assertions.
- **Fix:** Added a test helper that temporarily marks stdin as non-interactive around `init` command runs.
- **Files modified:** `packages/cli/test/commands.test.ts`
- **Verification:** `pnpm --filter tuireel test -- commands.test.ts`
- **Committed in:** `b97881f`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The helper was required to make CLI starter-config coverage deterministic. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `25-03` can now persist and explain the timing contract using the same author-facing terminology already exposed by init and docs.
- `25-04` can rely on the corrected README/reference wording when enforcing recomposite compatibility guidance.

## Self-Check: PASSED

- Found: `.planning/phases/25-timing-contract-and-profiles/25-02-SUMMARY.md`
- Found commit: `b97881f`
- Found commit: `d3ccd1e`
- Found commit: `6ccc666`

---

_Phase: 25-timing-contract-and-profiles_
_Completed: 2026-03-08_
