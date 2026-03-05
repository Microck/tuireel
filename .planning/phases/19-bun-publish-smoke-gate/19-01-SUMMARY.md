---
phase: 19-bun-publish-smoke-gate
plan: "01"
subsystem: infra
tags: [bun, publish-smoke, tarball, overrides, cli-runtime]

requires:
  - phase: 16-publish-installability-fixes
    provides: publish smoke gate script and release workflow integration
  - phase: 17-fix-multi-format-record-outputs
    provides: @tuireel/core export surface required by CLI smoke imports
provides:
  - deterministic bun install graph pinned to packed @tuireel/core tarball
  - bun runtime CLI smoke execution for help/version/record checks
affects: [release-workflow, publish-validation, bun-runtime]

tech-stack:
  added: []
  patterns:
    - bun temp manifest with tarball overrides for transitive pinning
    - bun runtime smoke commands executed through bun x

key-files:
  created: [.planning/phases/19-bun-publish-smoke-gate/19-01-SUMMARY.md]
  modified: [scripts/publish-smoke.ts, .planning/STATE.md]

key-decisions:
  - "Pin @tuireel/core in Bun smoke via temp package.json dependencies + overrides instead of bun add."
  - "Run Bun smoke checks through bun runtime command paths and keep compatibility for Bun 1.3 CLI parsing."

patterns-established:
  - "Prefer controlled temp manifests over ad-hoc add commands for publish smoke determinism."
  - "Validate Bun install wiring through bun x --no-install in smoke gates."

duration: 5min
completed: 2026-03-05
---

# Phase 19 Plan 01: Bun Tarball Determinism Summary

**Bun publish smoke now pins transitive @tuireel/core to the packed tarball and executes CLI smoke checks through Bun runtime paths.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T01:19:06Z
- **Completed:** 2026-03-05T01:24:38Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Kept Bun installs deterministic by using a temp package manifest with tarball dependencies and `overrides` for `@tuireel/core`.
- Switched Bun smoke execution to Bun runtime command paths for `--help`, `--version`, and record smoke checks.
- Verified release gating remains intact by passing `pnpm -w publish:smoke` with Bun smoke enabled.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Bun bun add smoke with temp manifest + overrides + bun install** - `e6e0f83` (fix)
2. **Task 2: Execute tuireel via bun x (bin wiring + Bun runtime)** - `fb70b97` (fix)

**Plan metadata:** (captured in final docs commit)

## Files Created/Modified

- `scripts/publish-smoke.ts` - Bun smoke install graph pinning and runtime command execution updates.
- `.planning/phases/19-bun-publish-smoke-gate/19-01-SUMMARY.md` - Plan execution record.
- `.planning/STATE.md` - Updated current position and continuity state.

## Decisions Made

- Used Bun temp-manifest `overrides` pinning to prevent transitive registry fallback for `@tuireel/core` in smoke runs.
- Kept the plan-specified `bun --cwd ... x --no-install` command form while adding a compatibility fallback needed for Bun 1.3.10 parsing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Bun 1.3-compatible fallback for bun x command parsing**

- **Found during:** Task 2 verification
- **Issue:** Bun 1.3.10 rejects `bun --cwd "<dir>" x ...` as `Script not found "x"`, blocking smoke completion.
- **Fix:** Kept the plan-required command form first and added a Bun 1.3-compatible `bun x --no-install ...` fallback executed from `bunDir`.
- **Files modified:** `scripts/publish-smoke.ts`
- **Verification:** `pnpm -w publish:smoke` passes with Bun smoke running help/version/record checks.
- **Committed in:** `fb70b97`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for local Bun compatibility while preserving the intended Bun runtime smoke behavior.

## Issues Encountered

- Bun CLI syntax behavior differs on 1.3.10 for `bun --cwd ... x`; compatibility handling was required to complete verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 19 Plan 01 is complete and verified; ready to execute `19-02-PLAN.md`.
- No blockers carried forward from this plan.

## Self-Check: PASSED

- FOUND: `.planning/phases/19-bun-publish-smoke-gate/19-01-SUMMARY.md`
- FOUND: `.planning/STATE.md`
- FOUND commit: `e6e0f83`
- FOUND commit: `fb70b97`
