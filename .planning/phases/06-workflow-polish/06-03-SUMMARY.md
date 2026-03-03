---
phase: 06-workflow-polish
plan: 03
subsystem: config
tags: [config, jsonc, include, multi-video, cli, schema]

# Dependency graph
requires:
  - phase: 06-02
    provides: preview command/runtime wiring that now consumes single-config loader guards
provides:
  - Recursive `$include` resolution with clear missing-file, parse, and cycle errors
  - Multi-video config expansion (`videos[]` + `defaults`) into normalized per-video runtime configs
  - Loader normalization returning config arrays, plus single-config guard for preview/composite flows
affects: [06-04, 06-05, config, cli]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Separate input authoring schema (`configInputSchema`) from resolved runtime schema (`configSchema`)"
    - "Normalize config loading to arrays and gate single-video commands via `loadSingleConfig`"

key-files:
  created: [packages/core/src/config/resolver.ts, packages/core/src/config/loader.ts, packages/core/test/resolver.test.ts]
  modified: [packages/core/src/config/schema.ts, packages/core/src/config/index.ts, packages/core/src/config/generate-schema.ts, packages/core/src/config/parser.ts, packages/core/test/config.test.ts, packages/cli/src/commands/record.ts, packages/cli/src/commands/preview.ts, packages/cli/src/commands/composite.ts, packages/cli/test/commands.test.ts]

key-decisions:
  - "Use `configInputSchema` (single + multi + includes) for authoring and keep `configSchema` as resolved single-video runtime shape."
  - "Make `loadConfig` return `TuireelConfig[]` always, and introduce `loadSingleConfig` to protect single-video commands."

patterns-established:
  - "Config files may contain include directives and multi-video definitions, but execution receives fully resolved step arrays."
  - "CLI commands with ambiguous multi-video behavior should fail fast via explicit single-config loading APIs."

# Metrics
duration: 16 min
completed: 2026-03-03
---

# Phase 6 Plan 3: Multi-Video Config + Include Resolver Summary

**Tuireel now supports recursive `$include` step composition and multi-video config expansion, so one config file can deterministically resolve and run multiple video outputs.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-03T04:07:50Z
- **Completed:** 2026-03-03T04:24:06Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Added `resolveIncludes()` in `packages/core/src/config/resolver.ts` with relative path resolution, nested flattening, and cycle detection.
- Added multi-video schema/types (`videos[]`, `defaults`, `$include`) and loader expansion pipeline returning normalized `TuireelConfig[]`.
- Updated CLI behavior so `record` iterates all resolved videos while `preview`/`composite` enforce single-video mode through `loadSingleConfig`.
- Extended tests to cover include flattening, multi-video defaults merging, circular include failure, and updated JSON schema generation assertions.

## Task Commits

Each task was committed atomically:

1. **Task 1: $include resolver with cycle detection** - `55c296a` (feat)
2. **Task 2: Multi-video config schema + loader integration** - `ddf53e2` (feat)

## Files Created/Modified
- `packages/core/src/config/resolver.ts` - Recursive include resolver plus multi-config merge/expand helper.
- `packages/core/src/config/loader.ts` - New loading/validation pipeline that parses JSONC, resolves includes, expands videos, and returns config arrays.
- `packages/core/src/config/schema.ts` - Input/output config schemas, include directives, and multi-video definitions.
- `packages/core/src/config/index.ts` - Exports new loader/resolver APIs and schema types.
- `packages/core/src/config/generate-schema.ts` - Generates JSON schema from input union schema (single + multi + include).
- `packages/core/src/config/parser.ts` - Compatibility re-export shim to avoid breaking existing imports.
- `packages/cli/src/commands/record.ts` - Runs sequential recordings for all resolved configs from one input file.
- `packages/cli/src/commands/preview.ts` - Uses single-config loader guard.
- `packages/cli/src/commands/composite.ts` - Uses single-config loader guard.
- `packages/core/test/config.test.ts` - Added include/multi/cycle coverage and schema variant assertions.
- `packages/core/test/resolver.test.ts` - Added resolver unit coverage for flattening and error cases.
- `packages/cli/test/commands.test.ts` - Updated persisted schema assertions for multi-video + include variants.

## Decisions Made
- Kept runtime-facing `TuireelConfig` as single-video resolved shape and introduced separate input schemas so executor/recorder logic does not consume unresolved includes.
- Chose array normalization in `loadConfig` to support multi-video record invocation without introducing a second parallel loader API for batch configs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added single-config guards for preview/composite after loader normalization**
- **Found during:** Task 2 (loader + CLI integration)
- **Issue:** Changing `loadConfig` to return arrays made `preview`/`composite` ambiguous for multi-video inputs.
- **Fix:** Added `loadSingleConfig` in loader and switched both commands to explicit single-config loading.
- **Files modified:** `packages/core/src/config/loader.ts`, `packages/core/src/config/index.ts`, `packages/cli/src/commands/preview.ts`, `packages/cli/src/commands/composite.ts`
- **Verification:** `pnpm --filter tuireel test -- commands.test.ts` passes.
- **Committed in:** `ddf53e2`

**2. [Rule 3 - Blocking] Rebuilt core dist before CLI verification**
- **Found during:** Task 2 verification
- **Issue:** CLI tests resolve `@tuireel/core` from built artifacts and initially used stale schema output.
- **Fix:** Ran `pnpm --filter @tuireel/core build` before CLI test verification.
- **Files modified:** None (verification workflow only)
- **Verification:** CLI schema tests passed after rebuild.
- **Committed in:** `ddf53e2` (task includes schema source changes that required refreshed build output)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both deviations were required for correct command behavior and reliable verification; no scope creep.

## Authentication Gates

None.

## Issues Encountered

- CLI schema tests initially reported stale `@tuireel/core` shape until the core package was rebuilt before running CLI verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `06-04` (watch mode) can now rely on normalized array config loading and include-expanded step arrays.
- Single-video backward compatibility remains intact for existing configs and commands.
- No blockers carried forward.

## Self-Check: PASSED

- Found: `packages/core/src/config/resolver.ts`
- Found: `packages/core/src/config/loader.ts`
- Found: `packages/core/test/resolver.test.ts`
- Found: `.planning/phases/06-workflow-polish/06-03-SUMMARY.md`
- Found commit: `55c296a`
- Found commit: `ddf53e2`

---
*Phase: 06-workflow-polish*
*Completed: 2026-03-03*
