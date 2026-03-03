---
phase: 06-workflow-polish
plan: 05
subsystem: distribution
tags: [npm, bunx, npx, cli, packaging]

# Dependency graph
requires:
  - phase: 06-workflow-polish
    provides: "Watch mode command surface and workflow polish features from 06-04"
provides:
  - "Publish-ready `tuireel` package metadata with bin wiring to dist output"
  - "Publish-ready `@tuireel/core` package metadata with stable dist export mapping"
  - "Verified CLI launch path for node, npx, and bunx local execution"
affects: ["release workflow", "installation docs", "end-user onboarding"]

# Tech tracking
tech-stack:
  added: []
  patterns: ["ESM CLI bin + shebang banner", "realpath-aware direct execution detection"]

key-files:
  created: []
  modified:
    - packages/cli/package.json
    - packages/core/package.json
    - packages/cli/src/index.ts

key-decisions:
  - "Keep CLI package as ESM with explicit `bin`, `main`, `files`, and `engines` metadata for npm publishing safety."
  - "Use realpath-aware direct execution detection in CLI bootstrap so symlinked npx/bunx bins still execute command registration."

patterns-established:
  - "Distribution smoke-test flow: `pnpm build` -> `node ... --help` -> `npx`/`bunx` help checks."

# Metrics
duration: 3 min
completed: 2026-03-03
---

# Phase 6 Plan 5: npm/Bun distribution packaging Summary

**Tuireel distribution metadata now supports npm publish workflows with a verified executable CLI path across direct node, npx, and bunx invocation patterns.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-03T04:51:48Z
- **Completed:** 2026-03-03T04:55:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Finalized publish-facing metadata for `tuireel` and `@tuireel/core` (`name`, `version`, module/bin/exports/files/engines fields).
- Verified shebang-preserving CLI build output and full command surface (`init`, `record`, `preview`, `validate`, `composite`).
- Confirmed local execution compatibility for `node`, `npx`, and `bunx --no-install` flows.

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure packages for npm distribution** - `1318625` (feat)
2. **Task 2: checkpoint:human-verify (npm/Bun distribution configuration)** - human approved (no code commit)

**Plan metadata:** pending docs commit

## Files Created/Modified
- `packages/cli/package.json` - publish metadata, binary mapping, and runtime dependency placement.
- `packages/core/package.json` - publish metadata plus dist entrypoint/export alignment.
- `packages/cli/src/index.ts` - direct-execution detection fix for symlinked bin execution via package runners.

## Decisions Made
- Treated package metadata correctness as a runtime contract (not docs-only) and verified each field by building and executing the built CLI.
- Used a bunx local-install smoke test (`bunx --no-install`) for pre-publish validation because Bun does not accept folder-spec execution the same way npm path specs do.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed direct execution detection for symlinked npx/bunx bin paths**
- **Found during:** Task 1 (Configure packages for npm distribution)
- **Issue:** CLI bootstrap direct-run detection failed when package manager shims resolved to symlinked binary paths, preventing command setup in local package-runner scenarios.
- **Fix:** Updated CLI entrypoint execution detection to resolve real paths before comparison.
- **Files modified:** `packages/cli/src/index.ts`
- **Verification:** `cd /tmp && npx --yes /home/ubuntu/workspace/tuireel/packages/cli --help` and `bunx --no-install tuireel --help` (from local install sandbox)
- **Committed in:** `1318625`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Correctness fix directly required for the stated npx/bunx execution goals; no scope creep.

## Issues Encountered
- `bunx /path/to/package --help` fails because Bun expects package specs differently than npm path execution. Validation switched to a local install + `bunx --no-install` workflow.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 6 deliverables are complete, including distribution/installability coverage (`INF-01`).
- Project plan stack is complete (22/22 plans); ready for final verification/transition workflow.

---
*Phase: 06-workflow-polish*
*Completed: 2026-03-03*

## Self-Check: PASSED

- Verified summary and referenced key files exist on disk.
- Verified Task 1 commit (`1318625`) exists in git history.
