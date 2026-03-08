---
phase: 25-timing-contract-and-profiles
plan: 01
subsystem: config
tags: [delivery-profiles, zod, config-loader, presets, schema]

requires:
  - phase: 08-presets-reliability
    provides: visual preset definitions and user-wins preset resolution semantics
  - phase: 06-workflow-polish
    provides: shared config loader path for single and multi-video inputs
provides:
  - named delivery profiles for timing and readability defaults
  - shared deliveryProfile resolution in the core config loader
  - public schema validation and JSON-schema visibility for deliveryProfile
affects: [25-02, 25-03, 25-04, config, record, composite]

tech-stack:
  added: []
  patterns:
    - "Parallel profile layers: visual preset + deliveryProfile + explicit config overrides"
    - "Profile resolution runs in the shared config loader for single and multi-video inputs"

key-files:
  created:
    - packages/core/src/delivery-profiles/built-in.ts
    - packages/core/src/delivery-profiles/resolve.ts
    - packages/core/src/delivery-profiles/index.ts
    - packages/core/test/delivery-profiles.test.ts
  modified:
    - packages/core/src/config/schema.ts
    - packages/core/src/config/loader.ts
    - packages/core/src/config/index.ts
    - packages/core/src/index.ts
    - packages/core/src/presets/built-in.ts
    - packages/core/test/config.test.ts

key-decisions:
  - "Keep `preset` visual-only and add a separate `deliveryProfile` field for timing/readability defaults."
  - "Resolve delivery profiles in the shared loader so single-video and multi-video flows keep the same precedence rules."
  - "Treat explicit `fps`, `captureFps`, and readability fields as authoritative over profile defaults."

patterns-established:
  - "Delivery profiles are named outcome presets that may set timing and readability defaults but never replace explicit author config."
  - "Schema guidance for unknown delivery profiles should list the supported profile names directly."

requirements-completed: [CAP-01, READ-03]

duration: 9 min
completed: 2026-03-08
---

# Phase 25 Plan 01: Timing Contract and Profiles Summary

**Delivery profiles now provide stackable timing and readability defaults while keeping explicit `fps` and `captureFps` overrides authoritative.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-08T17:05:36Z
- **Completed:** 2026-03-08T17:14:10Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added built-in delivery profiles with outcome-based names and shared resolution logic.
- Wired `deliveryProfile` into the public config contract, loader path, and core exports.
- Added regression coverage for preset/profile stacking, explicit timing overrides, schema visibility, and validation guidance.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add delivery-profile resolution tests first** - `c6f53d0` (test)
2. **Task 2: Implement stackable delivery-profile modules and loader precedence** - `6e7444f` (feat), `9a027e2` (fix)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `packages/core/src/delivery-profiles/built-in.ts` - Built-in delivery profile defaults for timing and readability.
- `packages/core/src/delivery-profiles/resolve.ts` - Shared resolver that applies delivery-profile defaults under explicit config.
- `packages/core/src/delivery-profiles/index.ts` - Barrel exports for downstream consumers.
- `packages/core/src/config/loader.ts` - Applies preset and delivery-profile resolution before schema validation.
- `packages/core/src/config/schema.ts` - Exposes `deliveryProfile` on single and multi-video authoring surfaces.
- `packages/core/src/config/index.ts` - Re-exports delivery-profile helpers and schema pieces from the public config surface.
- `packages/core/src/index.ts` - Re-exports delivery-profile modules from the package root.
- `packages/core/src/presets/built-in.ts` - Keeps visual presets from claiming `deliveryProfile` ownership.
- `packages/core/test/delivery-profiles.test.ts` - Resolver/default precedence regression coverage.
- `packages/core/test/config.test.ts` - JSON-schema coverage for `deliveryProfile`, `fps`, and `captureFps`.

## Decisions Made

- Kept `preset` visual-only so delivery timing/readability semantics live behind a separate `deliveryProfile` field.
- Used outcome-based profile names (`readable-1080p`, `social-quick-share`, `high-motion-demo`) so authors can pick a target without reading low-level timing knobs first.
- Preserved explicit author fields as the last write in loader resolution instead of silently rewriting timing values.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `25-02` can now teach delivery profiles and split `fps`/`captureFps` semantics from the real schema surface.
- `25-03` can persist the resolved timing contract without inventing a second profile-resolution path.
- `25-04` can enforce recomposite compatibility against the same loader-resolved timing fields.

## Self-Check: PASSED

- Found: `.planning/phases/25-timing-contract-and-profiles/25-01-SUMMARY.md`
- Found commit: `c6f53d0`
- Found commit: `6e7444f`
- Found commit: `9a027e2`

---

_Phase: 25-timing-contract-and-profiles_
_Completed: 2026-03-08_
