# Project State: Tuireel

## Project Reference

See: `.planning/PROJECT.md`
**Core value:** TUI tool authors can produce polished demo videos from a declarative script.
**Current focus:** v1.15 milestone complete. All 3 milestones shipped.

## Current Position

Phase: 24 - README Refresh + Link Hygiene (complete)
Plan: 24-01 complete (1/1); All phases done
Status: v1.15 milestone shipped
Last activity: 2026-03-05 - Completed quick task 003: Replace all emdashes in README

Progress: v1.15 complete (Phase 20: 2/2, Phase 21: 1/1, Phase 22: 1/1, Phase 23: 1/1, Phase 24: 1/1)

## Milestone Progress

| Milestone                          | Phases | Plans | Status   | Shipped    |
| ---------------------------------- | ------ | ----- | -------- | ---------- |
| v1.0 MVP                           | 1-6    | 23/23 | Complete | 2026-03-03 |
| v1.1 Branding, Docs & Hardening    | 7-19   | 38/38 | Complete | 2026-03-05 |
| v1.15 Brand Refresh & Docs Hosting | 20-24  | 5/5   | Complete | 2026-03-05 |

## Performance Metrics

**Velocity (v1.0):**

- Total plans completed: 23
- 6 phases, 50 tasks
- Shipped in <1 day

**v1.1:** 19 plans completed. Phase 7 complete (5 plans). Phase 8 complete: 08-01 (3 min), 08-02 (2 min), 08-03 (3 min), 08-04 (2 min). Phase 9 complete: 09-01 (8 min), 09-02 (8 min). Phase 10 complete: 10-01 (2 min), 10-02 (2 min), 10-03 (3 min). Phase 11: 11-01 (3 min), 11-02 (3 min). Phase 12: 12-01 (3 min), 12-02 (2 min), 12-03 (5 min).

**Gap closure:** 13-01 (2 min), 13-02 (2 min), 13-03 (5 min), 14-01 (2 min), 14-02 (1 min), 14-03 (2 min), 15-01 (1 min), 15-02 (1 min), 16-01 (2 min), 16-02 (2 min), 17-01 (19 min), 17-02 (4 min), 17-03 (3 min).

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.
Recent decisions:

- Apache 2.0 license (confirmed in requirements)
- Mintlify for docs (confirmed in requirements)
- GitHub Actions for CI (confirmed in requirements)
- Icon concept: film reel frame + terminal prompt (>\_) with sprocket holes
- Color palette (v1.15): tokens `background`/`surface`/`primary`/`secondary`/`accent` in `assets/branding/palette.json`
- Copyright holder: "Tuireel Contributors" (community project)
- CI CLI invocation via node packages/cli/dist/index.js (deterministic, no workspace resolution)
- CLI version sourced from own package.json via createRequire (no cross-package VERSION constants)
- Publish smoke gate: packs tarballs, validates no workspace: refs, tests npx + bun execution before release
- @tuireel/core publish allowlist includes assets/ so built-in SFX ship in package tarballs
- Built-in SFX paths resolve package-relatively via import.meta.url/\_\_dirname before CWD fallbacks
- Publish smoke now verifies core tarballs include required built-in SFX files before install checks
- Publish smoke now records polished/demo presets in temp npx+bunx installs and asserts MP4 audio via ffmpeg stream mapping
- Bun smoke runtime checks now execute through bun runtime command paths while preserving compatibility with Bun 1.3 CLI parsing
- Bun smoke now compares installed `tuireel` + `@tuireel/core` package.json name/version/exports against packed tarballs and fails fast on mismatch
- Bun smoke now verifies `resolveOutputPath` export via temp ESM probe before any CLI command and reports stderr snippets on failures
- Publish smoke cleanup now deletes `packDir`, `npxDir`, and `bunDir` independently in best-effort mode
- v1.1 milestone audit now records explicit Phase 08/09 verification coverage rows and no longer includes missing-verification blocker strings
- v1.1 milestone audit now records explicit Phase 10/11/12 verification coverage rows and no longer includes missing-verification blocker strings
- v1.1 milestone audit evidence now explicitly confirms CI-01 and CI-04 are not flagged as unsatisfied wiring gaps

### Quick Tasks Completed

| #   | Description                               | Date       | Commit  | Directory                                                                         |
| --- | ----------------------------------------- | ---------- | ------- | --------------------------------------------------------------------------------- |
| 001 | GitHub repo creation + npm publish        | 2026-03-04 | 1254e25 | [001-github-npm-publish](./quick/001-github-npm-publish/)                         |
| 002 | Expand README following webreel structure | 2026-03-05 | 260eb67 | [002-expand-readme](./quick/002-expand-readme/)                                   |
| 003 | Replace all emdashes in README            | 2026-03-05 | pending | [003-replace-all-emdashes-in-readme](./quick/003-replace-all-emdashes-in-readme/) |

## Blockers/Concerns Carried Forward

- None.

## Session Continuity

- Last session: 2026-03-05
- Stopped at: v1.15 milestone shipped — all phases 20-24 complete
- Resume file: Use `/gsd-new-milestone` to define the next milestone
