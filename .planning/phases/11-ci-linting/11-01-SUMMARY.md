---
phase: 11-ci-linting
plan: 01
subsystem: infra
tags: [eslint, prettier, github-actions, ci, turbo]

requires:
  - phase: 10-documentation
    provides: docs structure for lint coverage
provides:
  - ESLint flat config with typescript-eslint
  - Prettier config matching existing code style
  - Turbo lint and test pipeline tasks
  - GitHub Actions CI workflow (lint, type-check, build, test)
affects: [12-release-performance]

tech-stack:
  added: [eslint@10, typescript-eslint@8, eslint-config-prettier, prettier@3]
  patterns: [flat eslint config, turbo lint pipeline, single-job CI]

key-files:
  created: [eslint.config.mjs, .prettierrc, .prettierignore, .github/workflows/ci.yml]
  modified: [package.json, turbo.json, packages/core/package.json, packages/cli/package.json, pnpm-lock.yaml]

key-decisions:
  - "Relaxed preserve-caught-error, no-useless-escape, no-explicit-any to warnings to avoid mass reformatting existing code"
  - "Added root test script (turbo run test) for CI pnpm test command"
  - "Single CI job for lint+typecheck+build+test (appropriate for project size)"

patterns-established:
  - "ESLint flat config at monorepo root, per-package lint scripts target src/"
  - "CI pipeline: install → lint → type-check → build → test"

duration: 3min
completed: 2026-03-04
---

# Phase 11 Plan 01: ESLint + Prettier + CI Summary

**ESLint 10 flat config with typescript-eslint, Prettier matching existing double-quote/semi style, and GitHub Actions CI running lint/typecheck/build/test on every PR**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T00:03:10Z
- **Completed:** 2026-03-04T00:06:41Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- ESLint + Prettier configured matching existing code style (double quotes, semicolons, trailing commas, 2-space indent, 100 char width)
- Turbo lint and test tasks added to pipeline
- GitHub Actions CI workflow triggers on push to main and PRs

## Task Commits

Each task was committed atomically:

1. **Task 1: ESLint + Prettier setup with turbo lint task** - `f0e3b96` (chore)
2. **Task 2: GitHub Actions CI workflow** - `4aeb8ce` (feat)

## Files Created/Modified
- `eslint.config.mjs` - Flat ESLint config with typescript-eslint + prettier compat
- `.prettierrc` - Prettier config matching existing code style
- `.prettierignore` - Excludes dist, node_modules, .turbo, lockfile
- `.github/workflows/ci.yml` - CI workflow: lint → type-check → build → test
- `package.json` - Added lint and test scripts
- `turbo.json` - Added lint and test tasks
- `packages/core/package.json` - Added lint script
- `packages/cli/package.json` - Added lint script
- `pnpm-lock.yaml` - Updated with new dev dependencies

## Decisions Made
- Relaxed `preserve-caught-error` (off), `no-useless-escape` (warn), `no-explicit-any` (warn) to avoid mass reformatting existing code — plan instruction: "If many violations, relax rules rather than mass reformatting"
- Added `test` turbo task and root `pnpm test` script (needed for CI `pnpm test` step, not in original turbo.json)
- Used ESLint v10 flat config format (`eslint.config.mjs`) instead of legacy `.eslintrc.cjs` — plan listed `.eslintrc.cjs` but specified flat config in action steps

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added test turbo task and root test script**
- **Found during:** Task 1 (turbo.json update)
- **Issue:** Root package.json had no `test` script and turbo.json had no `test` task — CI `pnpm test` would fail
- **Fix:** Added `"test": "turbo run test"` to root package.json and `"test": { "dependsOn": [] }` to turbo.json
- **Files modified:** package.json, turbo.json
- **Verification:** `pnpm test` runs vitest in both packages
- **Committed in:** f0e3b96 (Task 1 commit)

**2. [Rule 1 - Bug] Relaxed ESLint rules causing false errors on existing code**
- **Found during:** Task 1 (initial lint run)
- **Issue:** ESLint 10's new `preserve-caught-error` rule flagged 4 existing catch blocks, `no-explicit-any` flagged utility code, `no-useless-escape` flagged template literals
- **Fix:** Set `preserve-caught-error: off`, `no-explicit-any: warn`, `no-useless-escape: warn`
- **Files modified:** eslint.config.mjs
- **Verification:** `pnpm lint` passes with 0 errors (12 warnings only)
- **Committed in:** f0e3b96 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both deviations necessary for CI to pass. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Lint + CI foundation complete
- Ready for 11-02 (video smoke test CI job)
- CI workflow will run on next push to main or PR

---
*Phase: 11-ci-linting*
*Completed: 2026-03-04*

## Self-Check: PASSED

- All 4 created files verified on disk
- Both task commits (f0e3b96, 4aeb8ce) verified in git log
