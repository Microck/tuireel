---
phase: 03-output-quality
plan: 02
subsystem: ui
tags: [theme, zod, tuistory, ghostty-opentui]

requires:
  - phase: 02-core-pipeline
    provides: Recording session orchestration and frame capture loop
  - phase: 03-output-quality
    provides: Multi-format encoder pipeline from 03-01
provides:
  - Built-in terminal theme registry with 8 named palettes
  - Custom theme validation with full 16-color ANSI palette support
  - Theme resolution and application in the recording pipeline
affects: [04-overlay-system, 06-workflow-polish, config-contract]

tech-stack:
  added: []
  patterns:
    - Schema + registry + resolver split for config-backed feature flags
    - OSC-based terminal palette setup before frame capture

key-files:
  created:
    - packages/core/src/themes/schema.ts
    - packages/core/src/themes/built-in.ts
    - packages/core/src/themes/resolve.ts
    - packages/core/src/themes/index.ts
    - packages/core/test/themes.test.ts
    - packages/core/test/session-theme.test.ts
  modified:
    - packages/core/src/config/schema.ts
    - packages/core/src/recorder.ts
    - packages/core/src/session.ts
    - packages/core/test/config.test.ts

key-decisions:
  - "Apply ANSI palette overrides via OSC escape sequences during session setup instead of trying to mutate renderer internals."
  - "Treat theme.fontFamily as renderer passthrough metadata and map path-like values to ghostty-opentui fontPath support."

patterns-established:
  - "Theme config is validated with strict Zod objects before runtime application."
  - "Recorder resolves named theme strings once, then passes concrete ThemeConfig into session creation."

duration: 9 min
completed: 2026-03-03
---

# Phase 3 Plan 2: Terminal Theming Summary

**Terminal theming now supports eight built-in palettes plus fully validated custom ANSI themes applied directly in captured output.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-03T01:08:44Z
- **Completed:** 2026-03-03T01:18:24Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added a dedicated theme module (`schema`, `built-in`, `resolve`, barrel export) with 8 built-in theme definitions.
- Added config-level theme support (`string | object`) and custom theme validation for background/foreground/cursor + full ANSI palette.
- Integrated theme application into recording by resolving the configured theme and applying OSC palette/default-color overrides before capture.
- Added focused tests covering resolver behavior, config validation, OSC palette remapping, and screenshot option mapping.

## Task Commits

Each task was committed atomically:

1. **Task 1: Theme schema, built-in registry, and resolver** - `c5707e5` (feat)
2. **Task 2: Integrate theme into config schema and tuistory renderer** - `84490c2` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `packages/core/src/themes/schema.ts` - Defines strict custom theme schema and exported theme types.
- `packages/core/src/themes/built-in.ts` - Registers Dracula, Catppuccin, One Dark, Monokai, Solarized Dark, Tokyo Night, Nord, and Gruvbox Dark.
- `packages/core/src/themes/resolve.ts` - Resolves built-in names and validates custom objects with clear errors.
- `packages/core/src/themes/index.ts` - Theme module barrel exports.
- `packages/core/src/config/schema.ts` - Adds optional `theme` config field (`string | theme object`).
- `packages/core/src/recorder.ts` - Resolves configured theme and passes it into session creation before capture.
- `packages/core/src/session.ts` - Applies OSC palette/default-color commands and maps theme styling into screenshot render options.
- `packages/core/test/themes.test.ts` - Verifies theme resolution and validation behavior.
- `packages/core/test/config.test.ts` - Verifies config acceptance/rejection behavior for built-in and custom themes.
- `packages/core/test/session-theme.test.ts` - Verifies OSC palette remapping and screenshot option mapping logic.

## Decisions Made
- Used OSC `4`, `10`, `11`, and `12` commands to apply ANSI palette/default colors at terminal level so rendered spans reflect configured themes naturally.
- Kept no-theme behavior unchanged by only applying theme commands/options when `config.theme` is provided.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- One assertion initially failed due hex-case differences (`#F38BA8` vs `#f38ba8`); updated the assertion to compare case-insensitively.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 is complete: output format support and terminal theming are both implemented.
- Ready to begin Phase 4 overlay work with `04-01-PLAN.md`.

---
*Phase: 03-output-quality*
*Completed: 2026-03-03*

## Self-Check: PASSED

- Verified all listed created files exist on disk.
- Verified task commits `c5707e5` and `84490c2` exist in git history.
