---
phase: 31-readable-1080p-acceptance-proof
plan: 01
subsystem: testing
tags: [acceptance, readability, 1080p, ffmpeg, sharp, vitest]
requires:
  - phase: 27-readable-1080p-defaults
    provides: readable-1080p font-scale, coverage, and framing contract thresholds
  - phase: 29-diagnostics-and-acceptance-gates
    provides: artifact-backed acceptance fixture and local media-analysis patterns
  - phase: 30-pacing-provenance-and-acceptance
    provides: record-once acceptance reuse across exported-artifact assertions
provides:
  - readable-1080p acceptance proof on decoded exported frames
  - stable late-frame geometry checks for final-output readability evidence
affects: [32-01, v1.2, milestone-acceptance, testing]
tech-stack:
  added: []
  patterns:
    - local final-output frame extraction and scoring inside acceptance files
    - profile-owned readability contracts proven on decoded export frames instead of timeline proxies
key-files:
  created:
    - .planning/phases/31-readable-1080p-acceptance-proof/31-01-SUMMARY.md
  modified:
    - packages/core/test/acceptance/readability.acceptance.ts
key-decisions:
  - "Keep readable-1080p acceptance local to one file and derive artifact geometry from decoded exported frames instead of adding a shared helper."
  - "Render a dense deterministic terminal frame so final-output legibility can be measured from real artifact geometry without OCR."
patterns-established:
  - "Readable-1080p acceptance records a real named-profile artifact with no fps or grid overrides, then measures exported-frame bounds against the Phase 27 contract."
  - "Final-output readability gates can retain the temp workdir and print artifact paths when geometry assertions fail."
requirements-completed: [READ-01, READ-02]
duration: 7 min
completed: 2026-03-09
---

# Phase 31 Plan 01: Readable 1080p Acceptance Proof Summary

**Readable-1080p acceptance now records the real named profile and proves final-output legibility plus inset framing on decoded exported frames.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-09T04:39:00Z
- **Completed:** 2026-03-09T04:46:19Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Rebuilt `packages/core/test/acceptance/readability.acceptance.ts` around a true `deliveryProfile: "readable-1080p"` config with no explicit `fps`, `cols`, or `rows` overrides.
- Added local exported-frame extraction and pixel-bound scoring so readability is measured on the final MP4 artifact instead of only timeline metadata.
- Proved readable font scale, coverage, margin balance, and centered inset framing against the Phase 27 contract on decoded export frames.
- Added a late-frame stability check so readable-1080p geometry stays consistent across settled final-output frames.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rebuild the readability fixture around the real named profile** - `8de1f3a` (feat)
2. **Task 2: Prove exported-artifact legibility and inset framing** - `b6cd1c5` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `packages/core/test/acceptance/readability.acceptance.ts` - records a readable-1080p artifact, decodes settled export frames, and asserts readability/framing geometry on the final MP4.
- `.planning/phases/31-readable-1080p-acceptance-proof/31-01-SUMMARY.md` - execution summary for this plan.

## Decisions Made

- Kept all final-output readability helpers local to `packages/core/test/acceptance/readability.acceptance.ts` so the gap closes without widening the shared diagnostics surface.
- Used deterministic dense terminal content and geometry-based assertions to prove exported readability without introducing OCR or brittle exact-pixel snapshots.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected the recorded timeline artifact path in the upgraded acceptance fixture**

- **Found during:** Task 1 verification
- **Issue:** The first rewritten fixture pointed at `readability.timeline.json`, but the recorder emits `readability-acceptance.timeline.json`, which broke the framing proof's secondary timeline evidence read.
- **Fix:** Updated the acceptance fixture to use the actual emitted timeline artifact name.
- **Files modified:** `packages/core/test/acceptance/readability.acceptance.ts`
- **Verification:** `pnpm --filter @tuireel/core exec vitest run test/readability.test.ts test/acceptance/readability.acceptance.ts`
- **Committed in:** `8de1f3a`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix stayed inside the acceptance upgrade and was required to keep the exported-artifact proof runnable.

## Issues Encountered

- The first rewritten acceptance pass failed because the timeline artifact name did not match the output file stem; once corrected, both targeted and package-level verification were green.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 31 now proves `READ-01` and `READ-02` on exported artifacts instead of structural proxies.
- Phase 32 can reuse the same artifact-backed acceptance pattern to move smoothness proof onto final output frames.

## Self-Check: PASSED

- Verified `.planning/phases/31-readable-1080p-acceptance-proof/31-01-SUMMARY.md` exists.
- Verified `packages/core/test/acceptance/readability.acceptance.ts` exists.
- Verified task commits `8de1f3a` and `b6cd1c5` exist in git history.

---

_Phase: 31-readable-1080p-acceptance-proof_
_Completed: 2026-03-09_
