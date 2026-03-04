---
phase: 16-publish-installability-fixes
plan: "02"
subsystem: infra
tags: [ci, publish, smoke-test, npm, bun, github-actions]

requires:
  - phase: 16-publish-installability-fixes
    provides: workspace:* protocol removed from package.json files (16-01)
provides:
  - publish smoke script that validates no workspace: refs ship
  - CI gate preventing broken tarballs from reaching npm
  - post-publish validation with npx and bunx retry loop
affects: [release-workflow, ci]

tech-stack:
  added: [oven-sh/setup-bun@v2]
  patterns: [tarball-extraction validation, post-publish retry loop]

key-files:
  created: [scripts/publish-smoke.ts]
  modified: [package.json, .github/workflows/release.yml]

key-decisions:
  - "Pre-publish smoke packs both tuireel and @tuireel/core tarballs and checks for workspace: refs"
  - "Post-publish validation uses 5-attempt retry with exponential backoff (10s, 20s, 30s, 40s, 50s)"
  - "Bun smoke test is optional locally (skipped if bun not in PATH) but mandatory in CI via setup-bun"

patterns-established:
  - "publish:smoke script: build + pack + validate before any release"
  - "Post-publish validation: retry loop for registry propagation delay"

duration: 2min
completed: 2026-03-04
---

# Phase 16 Plan 02: Publish Smoke Script + CI Gate Summary

**Tarball pack-and-validate smoke script with CI pre-publish gate and post-publish npx/bunx retry validation**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-04T06:22:43Z
- **Completed:** 2026-03-04T06:24:20Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created `scripts/publish-smoke.ts` that packs both packages, extracts package.json from tarballs, and asserts no `workspace:` references
- Smoke script also validates CLI executes via npx and bun (when available)
- Release workflow now gates on smoke test before changesets publish
- Post-publish step validates the published version is installable via npx and bunx with 5-attempt retry

## Task Commits

All tasks committed atomically (single commit covering all 3 tasks):

1. **Task 1: Implement tarball pack + install smoke script** - `3e80d2e`
2. **Task 2: Add workspace script entrypoint** - `3e80d2e`
3. **Task 3: Gate the release workflow with publish smoke** - `3e80d2e`

## Files Created/Modified

- `scripts/publish-smoke.ts` - Smoke test: packs tarballs, checks for workspace: refs, validates npx + bun execution
- `package.json` - Added `publish:smoke` script
- `.github/workflows/release.yml` - Added bun setup, pre-publish smoke gate, post-publish validation with retry

## Decisions Made

- Combined all 3 tasks into a single atomic commit since they form one cohesive feature
- npx smoke test installs both core and CLI tarballs (since CLI depends on core) rather than using `npx -y <tarball>` which wouldn't resolve the core dep

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 16 complete: both publish installability plans (16-01 remove workspace:\*, 16-02 smoke gate) are done
- Release workflow is fully gated against workspace: protocol leaks
- Post-publish validation ensures published packages are actually installable

---

_Phase: 16-publish-installability-fixes_
_Completed: 2026-03-04_
