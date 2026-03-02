---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [pnpm, turborepo, typescript, tsup, commander, monorepo]
requires:
  - phase: project-init
    provides: project scaffolding and roadmap artifacts
provides:
  - pnpm workspace root configuration
  - @tuireel/core package with typed public export barrel
  - tuireel CLI package with Commander.js entrypoint and bin mapping
affects: [01-02, 01-03, 01-04, 02-core-pipeline]
tech-stack:
  added: [turbo, typescript, tsup, commander, zod, jsonc-parser, zod-to-json-schema]
  patterns: [pnpm workspace protocol, turbo task graph, shared tsconfig base]
key-files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - tsconfig.base.json
    - packages/core/package.json
    - packages/core/src/index.ts
    - packages/cli/package.json
    - packages/cli/src/index.ts
  modified:
    - .gitignore
    - pnpm-lock.yaml
key-decisions:
  - "Use tsup for both workspace packages, with dual ESM/CJS output in core and ESM shebang output in CLI"
  - "Set root packageManager to pnpm@10.28.2 to satisfy Turborepo workspace resolution"
patterns-established:
  - "Workspace Linking: internal package dependencies use workspace:* protocol"
  - "CLI Packaging: executable dist entrypoint generated via tsup banner shebang"
duration: 4 min
completed: 2026-03-02
---

# Phase 1 Plan 1: Monorepo Scaffold Summary

**pnpm/turborepo monorepo scaffold with typed @tuireel/core exports and a runnable tuireel Commander CLI binary.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T22:28:56Z
- **Completed:** 2026-03-02T22:33:50Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Established root monorepo configuration (`pnpm-workspace.yaml`, `turbo.json`, shared TS config, root scripts).
- Added `@tuireel/core` package with typed dist output and public API barrel export.
- Added `tuireel` CLI package with `bin` entrypoint and Commander-generated help output.
- Verified workspace linking by importing `@tuireel/core` from the CLI package runtime context.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create monorepo root config** - `561c662` (chore)
2. **Task 2: Create @tuireel/core package** - `a24b2fc` (feat)
3. **Task 3: Create tuireel CLI package** - `2f2821a` (feat)

**Plan metadata:** pending final docs commit (`SUMMARY.md` + `STATE.md`)

## Files Created/Modified

- `package.json` - root workspace metadata/scripts and package manager declaration.
- `pnpm-workspace.yaml` - workspace package discovery.
- `turbo.json` - task graph for build/dev/clean.
- `tsconfig.base.json` - strict shared TypeScript compiler defaults.
- `.gitignore` - monorepo build/cache ignore patterns.
- `packages/core/package.json` - core package metadata, exports, and dependencies.
- `packages/core/tsconfig.json` - core TS build config.
- `packages/core/tsup.config.ts` - core ESM/CJS + d.ts build settings.
- `packages/core/src/index.ts` - initial public API export.
- `packages/cli/package.json` - CLI package metadata, bin mapping, workspace dependency.
- `packages/cli/tsconfig.json` - CLI TS config with core project reference.
- `packages/cli/tsup.config.ts` - CLI ESM build with node shebang banner.
- `packages/cli/src/index.ts` - Commander CLI entrypoint with help text.
- `pnpm-lock.yaml` - resolved dependency graph for reproducible installs.

## Decisions Made

- Used `tsup` in each package instead of hand-written `tsc` + bundling scripts to keep package builds concise and consistent.
- Kept CLI version sourced from `@tuireel/core` export (`VERSION`) so package linkage is exercised immediately.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing root `packageManager` field for Turborepo**
- **Found during:** Task 3 (full workspace verification)
- **Issue:** `pnpm build` failed because Turborepo could not resolve workspaces without `packageManager` in root `package.json`.
- **Fix:** Added `"packageManager": "pnpm@10.28.2"` to root `package.json`.
- **Files modified:** `package.json`
- **Verification:** Re-ran `pnpm install && pnpm build && node packages/cli/dist/index.js --help` successfully.
- **Committed in:** `2f2821a` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Blocking fix was required for Turborepo correctness; no scope creep.

## Authentication Gates

None.

## Issues Encountered

- Turborepo workspace resolution failed initially due missing `packageManager`; resolved in Task 3 and verification then passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for `01-02-PLAN.md` (config schema and parser TDD plan).
- No blockers carried forward.

---
*Phase: 01-foundation*
*Completed: 2026-03-02*

## Self-Check: PASSED

- Verified required scaffold files and summary file exist.
- Verified task commits `561c662`, `a24b2fc`, and `2f2821a` are present in git history.
