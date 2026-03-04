---
phase: 16-publish-installability-fixes
plan: "01"
subsystem: infra
tags: [pnpm, workspace, semver, npm-publish, cli]

requires:
  - phase: 15-ci-wiring-fixes
    provides: working CI pipeline and CLI invocation pattern

provides:
  - publish-safe package.json without workspace:* protocol
  - version reporting derived from package.json (single source of truth)
  - eliminated VERSION constant drift between core and package.json

affects: [16-publish-installability-fixes]

tech-stack:
  added: []
  patterns: [createRequire for package.json version reading in ESM]

key-files:
  modified:
    - packages/cli/package.json
    - packages/cli/src/index.ts
    - packages/core/src/index.ts
    - pnpm-lock.yaml

key-decisions:
  - "Use createRequire to read version from package.json at runtime instead of hardcoded constant"
  - "Remove VERSION export from core entirely rather than deriving it (no consumers remain)"

patterns-established:
  - "Version sourcing: CLI reads own package.json via createRequire, no cross-package VERSION constants"

duration: 2min
completed: 2026-03-04
---

# Phase 16 Plan 01: Remove workspace:\* and Fix Version Drift Summary

**Replaced workspace:\* with real semver and unified version sourcing via createRequire so npx installs work and --version reports 0.1.0**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T06:18:40Z
- **Completed:** 2026-03-04T06:20:31Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Replaced `workspace:*` with `"0.1.0"` in CLI's dependency on `@tuireel/core`
- CLI now reads version from its own `package.json` via `createRequire` (single source of truth)
- Removed drifted `VERSION = "0.0.1"` constant from core (was 0.0.1 vs package.json 0.1.0)
- All 96 tests pass, build succeeds, `--version` reports `0.1.0`

## Task Commits

All three tasks committed atomically (single logical change):

1. **Task 1-3: Remove workspace:\*, fix version sourcing, remove drifted VERSION** - `566d1b5` (fix)

## Files Created/Modified

- `packages/cli/package.json` - Changed `@tuireel/core` from `workspace:*` to `0.1.0`
- `packages/cli/src/index.ts` - Replaced `VERSION` import with `createRequire` reading own `package.json`
- `packages/core/src/index.ts` - Removed `export const VERSION = "0.0.1"` (drifted, no consumers)
- `pnpm-lock.yaml` - Updated to reflect resolved dependency

## Decisions Made

- Used `createRequire(import.meta.url)` to read `../package.json` — standard ESM pattern for reading JSON, avoids experimental `--experimental-json-modules`
- Removed `VERSION` export from core entirely instead of fixing it — the only consumer was CLI, which now reads its own version

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Verification Results

| Check                                       | Result                          |
| ------------------------------------------- | ------------------------------- |
| `rg "workspace:" packages -g"package.json"` | No matches (clean)              |
| `pnpm -w build`                             | Success (2 packages)            |
| `node packages/cli/dist/index.js --help`    | Works correctly                 |
| `node packages/cli/dist/index.js --version` | Prints `0.1.0`                  |
| `pnpm -w test`                              | 96 tests pass (91 core + 5 cli) |

## Next Phase Readiness

- Package.json is now publish-safe (no workspace: protocol references)
- Version reporting is correct and derived from single source of truth
- Ready for 16-02 (if applicable) or npm publish

---

_Phase: 16-publish-installability-fixes_
_Completed: 2026-03-04_
