---
phase: 18-preset-sound-portability
plan: 02
subsystem: testing
tags: [publish-smoke, tarball, npx, bunx, ffmpeg, presets]

requires:
  - phase: 18-01
    provides: "Built-in SFX assets are shipped and resolved package-relatively"
provides:
  - "Core tarball SFX asset assertions in publish smoke"
  - "Installed npx/bunx record smoke for polished+demo presets with MP4 audio checks"
affects: [19-bun-publish-smoke-gate, release-gate, PRST-03]

tech-stack:
  added: []
  patterns:
    - "Assert tarball contents before installed-usage smoke"
    - "Validate MP4 audio with ffmpeg -map 0:a:0 in smoke"

key-files:
  created: []
  modified:
    - scripts/publish-smoke.ts

key-decisions:
  - "Publish smoke now treats built-in SFX file presence as a first-class tarball gate."
  - "Bun smoke uses bunx from temp installs and validates audio for polished/demo outputs."

patterns-established:
  - "Temp non-repo CWD smoke configs for preset audio regressions"
  - "Per-preset record + ffmpeg stream-map assertions"

duration: 24 min
completed: 2026-03-04
---

# Phase 18 Plan 02: Preset Sound Portability Summary

**Publish smoke now proves packaged polished/demo presets record from temp installs and produce MP4 audio streams via npx and bunx.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-03-04T21:05:40Z
- **Completed:** 2026-03-04T21:30:28Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added a core tarball gate that checks required built-in SFX files are present in `@tuireel/core` package artifacts.
- Added installed-usage sound smoke in temp non-repo directories for `polished` and `demo` presets via `npx tuireel record`.
- Added bunx installed-usage sound smoke and ffmpeg `-map 0:a:0` assertions proving both preset MP4 outputs contain an audio stream.

## Task Commits

Each task was committed atomically:

1. **Task 1: Assert packed @tuireel/core tarball includes built-in SFX assets** - `dea7c78` (fix)
2. **Task 2: Run non-repo record smoke (npx + bunx) for presets polished + demo and assert audio stream exists** - `1123d56` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `scripts/publish-smoke.ts` - Added tarball SFX checks, temp config generation, npx/bunx record smoke, and ffmpeg audio stream assertions.

## Decisions Made

- Kept `--help` smoke checks and layered sound-record assertions on top so publish smoke still validates CLI basics and new audio portability behavior.
- Used deterministic ffmpeg stream-map checks (`-map 0:a:0`) for both polished and demo outputs instead of log-based heuristics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced bun tarball install path that pulled stale nested core package**

- **Found during:** Task 2 (bun smoke execution)
- **Issue:** `bun add` installed `tuireel/node_modules/@tuireel/core` missing `resolveOutputPath`, causing bun smoke failures unrelated to preset audio assertions.
- **Fix:** Switched bun smoke temp install setup to `npm install` with local tarballs, then ran `bunx --no-install` checks from that temp directory.
- **Files modified:** `scripts/publish-smoke.ts`
- **Verification:** `pnpm -w publish:smoke` passes bunx help/version + polished/demo record + audio assertions.
- **Committed in:** `1123d56` (part of Task 2 commit)

**2. [Rule 1 - Bug] Removed `--bun` from bunx record smoke to avoid hung process after successful recording**

- **Found during:** Task 2 (bunx record execution)
- **Issue:** `bunx --bun --no-install tuireel record ...` wrote output but did not terminate, causing smoke timeouts.
- **Fix:** Used `bunx --no-install tuireel record ...` for bun smoke record commands while keeping bunx installed-usage coverage.
- **Files modified:** `scripts/publish-smoke.ts`
- **Verification:** bunx polished/demo record commands exit 0 and ffmpeg audio checks pass in publish smoke.
- **Committed in:** `1123d56` (part of Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary to complete bunx sound portability verification with stable, non-hanging smoke execution.

## Issues Encountered

- Bun install/runtime behavior in temp smoke directories did not match planned command sequence; addressed inline via blocking + bug auto-fixes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 18 plan goals are fully validated through `pnpm -w publish:smoke`.
- Ready for `19-01-PLAN.md` (bun publish smoke determinism hardening) when scheduled.

---

_Phase: 18-preset-sound-portability_
_Completed: 2026-03-04_

## Self-Check: PASSED

- Verified files exist: `scripts/publish-smoke.ts`, `.planning/phases/18-preset-sound-portability/18-02-SUMMARY.md`
- Verified task commits exist in git history: `dea7c78`, `1123d56`
