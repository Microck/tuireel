---
phase: 01-foundation
plan: 02
subsystem: config
tags: [zod, jsonc-parser, zod-to-json-schema, vitest, json-schema]
requires:
  - phase: 01-01
    provides: monorepo workspace, @tuireel/core package, and build pipeline
provides:
  - Zod config schema with discriminated step validation and defaults
  - JSONC parsing and structured config validation errors
  - JSON Schema generator wired to core public exports
affects: [01-03, 01-04, 02-core-pipeline]
tech-stack:
  added: [vitest, @types/node]
  patterns: [schema-first validation, RED-GREEN TDD cycle, normalized config errors]
key-files:
  created:
    - packages/core/src/config/schema.ts
    - packages/core/src/config/parser.ts
    - packages/core/src/config/generate-schema.ts
    - packages/core/src/config/index.ts
    - packages/core/test/config.test.ts
    - packages/core/vitest.config.ts
  modified:
    - package.json
    - packages/core/package.json
    - packages/core/src/index.ts
    - packages/core/tsconfig.json
    - pnpm-lock.yaml
key-decisions:
  - "Accept optional $schema in input but strip it from validated runtime config output"
  - "Expose parser failures as ConfigValidationError with path + message issue objects"
  - "Disable composite in packages/core tsconfig to keep tsup DTS generation stable"
patterns-established:
  - "Config module pattern: schema.ts + parser.ts + generate-schema.ts + barrel export"
  - "Config tests assert both happy path parsing and actionable failure messages"
duration: 7 min
completed: 2026-03-02
---

# Phase 1 Plan 2: Config Schema and Parser Summary

**Zod-backed config validation with JSONC parsing, defaulted runtime config output, and generated JSON Schema for editor integration.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02T22:37:25Z
- **Completed:** 2026-03-02T22:45:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Added a full config domain module in `@tuireel/core` with `configSchema`, `stepSchema`, and typed exports.
- Implemented `validateConfig` and `loadConfig` for JSONC + Zod parsing with structured, actionable error issues.
- Added `generateJsonSchema()` and surfaced config APIs through `packages/core/src/index.ts` for consumers.
- Added Vitest infrastructure and 7 behavior-focused tests covering parsing, defaults, error reporting, and schema generation.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED - failing config tests + test infra** - `f907f56` (test)
2. **Task 2: GREEN - schema/parser/schema-gen implementation** - `b29fee3` (feat)

**Plan metadata:** pending final docs commit (`SUMMARY.md` + `STATE.md`)

## Files Created/Modified

- `packages/core/src/config/schema.ts` - Zod config + step schemas with defaults.
- `packages/core/src/config/parser.ts` - JSONC parsing, validation, and structured error surface.
- `packages/core/src/config/generate-schema.ts` - JSON Schema generation helper.
- `packages/core/src/config/index.ts` - config module barrel exports.
- `packages/core/test/config.test.ts` - RED/GREEN verification cases.
- `packages/core/vitest.config.ts` - package-local test configuration.
- `packages/core/src/index.ts` - top-level re-export of config module.
- `packages/core/package.json` - test script and Node type dependency.
- `packages/core/tsconfig.json` - DTS-compatible compiler option override.
- `package.json` - root `vitest` dev dependency.
- `pnpm-lock.yaml` - lockfile updates for new tooling dependencies.

## Decisions Made

- Kept `$schema` optional in the schema contract for IDE tooling while stripping it from runtime config output consumed by the recorder.
- Standardized validation errors on `ConfigValidationError` with `{ path, message }` issues to support actionable CLI error rendering later.
- Kept Vitest installed at workspace root and configured package-level execution via `pnpm --filter @tuireel/core test`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed tsup DTS failure from composite project constraints**
- **Found during:** Task 2 (GREEN verification)
- **Issue:** `pnpm build` failed with TS6307 when DTS generation followed imports from `src/index.ts`.
- **Fix:** Set `"composite": false` in `packages/core/tsconfig.json` to align with tsup DTS emit expectations.
- **Files modified:** `packages/core/tsconfig.json`
- **Verification:** `pnpm build` progressed past TS6307 after change.
- **Committed in:** `b29fee3`

**2. [Rule 3 - Blocking] Added missing Node typings for parser module**
- **Found during:** Task 2 (GREEN verification)
- **Issue:** DTS build could not resolve `node:fs/promises` types.
- **Fix:** Added `@types/node` to `packages/core` devDependencies.
- **Files modified:** `packages/core/package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm build` no longer reports missing Node module typings.
- **Committed in:** `b29fee3`

**3. [Rule 3 - Blocking] Resolved Zod v4 type incompatibility in JSON Schema generation**
- **Found during:** Task 2 (GREEN verification)
- **Issue:** `zod-to-json-schema` type signature rejected Zod v4 schema at compile time.
- **Fix:** Added a narrow cast at call site and verified generated schema output in tests.
- **Files modified:** `packages/core/src/config/generate-schema.ts`
- **Verification:** `pnpm --filter @tuireel/core test` and `pnpm build` both pass.
- **Committed in:** `b29fee3`

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All deviations were required to complete GREEN verification and keep generated types/build stable.

## Authentication Gates

None.

## Issues Encountered

- Build-time DTS errors surfaced after core module expansion; resolved inline through tsconfig and typing compatibility fixes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `@tuireel/core` now exports config loading/validation/schema-generation APIs needed by `tuireel validate` and `tuireel init`.
- Ready for `01-03-PLAN.md` (ffmpeg auto-download and caching).
- No blockers carried forward.

---
*Phase: 01-foundation*
*Completed: 2026-03-02*

## Self-Check: PASSED

- Verified required config module and test files exist on disk.
- Verified task commits `f907f56` and `b29fee3` are present in git history.
