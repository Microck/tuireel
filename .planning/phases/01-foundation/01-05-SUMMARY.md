---
phase: 01-foundation
plan: 05
subsystem: config
tags: [zod, json-schema, cli, vitest]
requires:
  - phase: 01-02
    provides: config schemas, parser, and schema generator entrypoint
  - phase: 01-04
    provides: init command writing ~/.tuireel/schema.json
provides:
  - Non-empty generated JSON Schema aligned with Tuireel config input contract
  - Core regression assertions for top-level config fields and step variants
  - CLI init integration assertions validating persisted schema.json structure
affects: [02-core-pipeline, 06-workflow-polish]
tech-stack:
  added: []
  patterns: [zod-native toJSONSchema generation, cross-package schema parity regression tests]
key-files:
  created: []
  modified:
    - packages/core/src/config/generate-schema.ts
    - packages/core/test/config.test.ts
    - packages/cli/test/commands.test.ts
key-decisions:
  - "Use z.toJSONSchema(configSchema, { target: draft-07, io: input }) to reflect authoring-time config shape while preserving defaults."
  - "Enforce schema parity in both core unit tests and CLI init integration tests to prevent drift."
patterns-established:
  - "Schema generation uses Zod v4 native JSON Schema output instead of compatibility casts."
  - "CLI integration tests assert persisted schema artifacts, not only generated config files."
duration: 6 min
completed: 2026-03-02
---

# Phase 1 Plan 5: Schema Parity Gap Closure Summary

**Zod-native draft-07 schema generation now emits full Tuireel config + step variant structure, and both core and CLI tests lock the contract against empty-schema regressions.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02T23:23:44Z
- **Completed:** 2026-03-02T23:30:22Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Replaced the previous `zod-to-json-schema` compatibility path with Zod v4 native JSON Schema generation in `packages/core/src/config/generate-schema.ts`.
- Generated schema now includes top-level `type`, `properties`, defaults, `required: ["steps"]`, and `steps.items.oneOf` variant shapes for `launch`, `type`, `press`, `wait`, and `pause`.
- Added core regression tests in `packages/core/test/config.test.ts` to assert config property keys plus variant-specific step fields.
- Extended CLI init integration coverage in `packages/cli/test/commands.test.ts` to read `${TUIREEL_HOME}/schema.json` and validate the persisted schema contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: Repair JSON Schema generation output** - `5badc7e` (fix)
2. **Task 2: Add core schema regression tests for contract shape** - `7e16895` (test)
3. **Task 3: Extend init command integration test for schema artifact** - `ae50877` (test)

**Plan metadata:** pending docs commit (`01-05-SUMMARY.md` + `STATE.md`).

## Files Created/Modified

- `packages/core/src/config/generate-schema.ts` - switched to native Zod JSON Schema generation with input-shape semantics.
- `packages/core/test/config.test.ts` - added contract-shape assertions for top-level fields and all step variants.
- `packages/cli/test/commands.test.ts` - added persisted `schema.json` structure assertions after `init`.

## Decisions Made

- Used Zod v4's built-in `z.toJSONSchema` with `io: "input"` so schema requirements match user-authored config files while still exposing defaults.
- Added parity assertions in both producer (`@tuireel/core`) and consumer (`tuireel init`) test suites to catch future contract drift.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rebuilt `@tuireel/core` before CLI integration verification**
- **Found during:** Task 3 verification
- **Issue:** `pnpm --filter tuireel test` initially loaded a stale built `@tuireel/core` artifact and reported missing schema structure.
- **Fix:** Ran `pnpm --filter @tuireel/core build` and re-ran CLI tests so `init` consumed the updated schema generator.
- **Files modified:** None (verification environment refresh only)
- **Verification:** `pnpm --filter tuireel test` passed after rebuild.
- **Committed in:** N/A (no source-file change required)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Blocker was verification-environment related; implementation scope remained unchanged.

## Authentication Gates

None.

## Issues Encountered

- CLI integration tests consumed stale core build output until `@tuireel/core` was rebuilt in-place.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 blocker (`CLI-02` schema parity) is closed.
- Foundation phase is now complete (5/5 plans).
- Ready for phase transition into `02-core-pipeline` planning/execution.

---
*Phase: 01-foundation*
*Completed: 2026-03-02*

## Self-Check: PASSED

- Verified `.planning/phases/01-foundation/01-05-SUMMARY.md` exists on disk.
- Verified task commits `5badc7e`, `7e16895`, and `ae50877` exist in git history.
