---
phase: quick-004-logo-remove-light-variant-add-beige-stro
plan: 004
subsystem: branding
tags: [svg, docs, readme, drift-checks]

requires: []
provides:
  - "Beige (#F5ECD9) outlined canonical logo SVGs"
  - "Logo drift verification no longer expects a logo-light.svg variant"
affects: [assets/branding, docs/images, README]

tech-stack:
  added: []
  patterns:
    - "Brand drift checks enforce asset byte-equality"
    - "README logo sources use <picture> with light/dark variants"

key-files:
  created:
    - .planning/quick/004-logo-remove-light-variant-add-beige-stro/004-SUMMARY.md
  modified:
    - assets/branding/logo.svg
    - assets/branding/logo-dark.svg
    - docs/images/logo-dark.svg
    - README.md
    - assets/branding/brand-system.md
    - scripts/verify-brand-system.ts

key-decisions:
  - "Apply the beige outline via inherited root-level stroke attributes to avoid rewriting path data"

patterns-established:
  - "Deprecated logo variants are blocked via verify script existence checks"

duration: 3min
completed: 2026-03-05
---

# Quick Task 004 Summary

**Removed the redundant logo-light.svg asset and kept drift resistance by enforcing a single canonical logo + dark variant, both with a beige (#F5ECD9) outline.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T21:27:40Z
- **Completed:** 2026-03-05T21:30:37Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added an inherited beige stroke outline to `assets/branding/logo.svg` and `assets/branding/logo-dark.svg`.
- Synced `docs/images/logo-dark.svg` to remain byte-equal with `assets/branding/logo-dark.svg`.
- Removed `assets/branding/logo-light.svg` and `docs/images/logo-light.svg`, updated README/docs, and updated drift checks to prevent reintroduction.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add beige outline to remaining logo SVGs** - `e48b566` (feat)
2. **Task 2: Remove logo-light variant usage and drift checks** - `633cc0e` (chore)

**Plan metadata:** pending (docs: complete quick-004 plan)

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## Next Phase Readiness

- Brand system verification passes (`pnpm -s tsx scripts/verify-brand-system.ts`).
- Repo no longer contains or consumes `logo-light.svg` as an asset variant.
