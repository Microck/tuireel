---
phase: 11-ci-linting
verified: 2026-03-04T06:10:00Z
status: gaps_found
score: 2/4 must-haves verified
---

# Phase 11: CI & Linting Verification Report

**Phase Goal:** Every PR and push to main is automatically validated for code quality and video output correctness.
**Verified:** 2026-03-04T06:10:00Z
**Status:** gaps_found

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                       | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Pushing to main or opening a PR triggers a GitHub Actions job that runs lint, type-check, build, and unit tests                             | ~ PARTIAL  | Workflow triggers are correctly configured (`on: push: branches: [main]` + `pull_request: branches: [main]` in both `ci.yml` and `video-smoke.yml`). Lint/build/test pass locally. **However**, the type-check step (`pnpm exec tsc --noEmit`) runs at the monorepo root which has no `tsconfig.json` — it prints the tsc help text instead of type-checking.              |
| 2   | ESLint + Prettier configs exist and `pnpm lint` passes across the monorepo                                                                  | ✓ VERIFIED | `eslint.config.mjs` exists (flat config with typescript-eslint + prettier compat). `.prettierrc` exists (semi, double-quote, 2-space, trailing commas, 100 width). `.prettierignore` exists. `pnpm lint` passes with warnings only (0 errors).                                                                                                                             |
| 3   | A separate CI job records a short fixture as MP4, WebM, and GIF, asserting each output has correct codec, resolution, and non-zero duration | ~ PARTIAL  | `.github/workflows/video-smoke.yml` exists with correct structure (record 3 formats + validate 3 with ffprobe). **However**, it invokes `pnpm exec tuireel record ...` which fails because `tuireel` is not available in the root pnpm `.bin`. Running `pnpm exec tuireel --help` at repo root produces: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "tuireel" not found`. |
| 4   | When a video smoke test fails, the produced artifact is uploaded to the GitHub Actions run for inspection                                   | ✓ VERIFIED | `video-smoke.yml` line 73-81: `uses: actions/upload-artifact@v4` with `if: failure()`, uploading `smoke-output.*` and `*-probe.json` with 7-day retention.                                                                                                                                                                                                                 |

**Score:** 2/4 truths fully verified (truths 2 and 4 pass; truths 1 and 3 are partial due to known wiring gaps)

### Required Artifacts

| Artifact                                          | Expected             | Status                 | Details                                                                                           |
| ------------------------------------------------- | -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`                               | ESLint flat config   | ✓ EXISTS + SUBSTANTIVE | 33 lines, typescript-eslint + prettier compat, relaxed rules for existing code                    |
| `.prettierrc`                                     | Prettier config      | ✓ EXISTS + SUBSTANTIVE | JSON with semi, double-quote, 2-space indent, trailing commas, 100 width                          |
| `.prettierignore`                                 | Prettier ignore file | ✓ EXISTS               | Excludes dist, node_modules, .turbo, lockfile                                                     |
| `.github/workflows/ci.yml`                        | CI workflow          | ✓ EXISTS + SUBSTANTIVE | 30 lines: checkout, pnpm, node 22, install, lint, tsc, build, test                                |
| `.github/workflows/video-smoke.yml`               | Video smoke workflow | ✓ EXISTS + SUBSTANTIVE | 81 lines: checkout, pnpm, node 22, ffmpeg, build, record 3 formats, validate 3, upload on failure |
| `packages/core/test/fixtures/smoke.tuireel.jsonc` | Smoke test fixture   | ✓ EXISTS               | Minimal 40x12 terminal at 10fps with shell built-ins                                              |

**Artifacts:** 6/6 exist

### Key Link Verification

| From                             | To                 | Via                          | Status      | Details                                                                                                                                                                                               |
| -------------------------------- | ------------------ | ---------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml` triggers                | push/PR to main    | `on:` section                | ✓ WIRED     | Lines 3-7: `push: branches: [main]`, `pull_request: branches: [main]`                                                                                                                                 |
| `ci.yml` type-check              | TypeScript project | `pnpm exec tsc --noEmit`     | ✗ NOT WIRED | No root `tsconfig.json` exists — tsc prints help text instead of type-checking. Per-package tsconfigs exist at `packages/core/tsconfig.json` and `packages/cli/tsconfig.json` but are not referenced. |
| `video-smoke.yml` triggers       | push/PR to main    | `on:` section                | ✓ WIRED     | Lines 3-7: `push: branches: [main]`, `pull_request: branches: [main]`                                                                                                                                 |
| `video-smoke.yml` record         | tuireel CLI        | `pnpm exec tuireel record`   | ✗ NOT WIRED | `pnpm exec tuireel` at root returns `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "tuireel" not found`                                                                                                  |
| `video-smoke.yml` failure upload | GitHub artifacts   | `actions/upload-artifact@v4` | ✓ WIRED     | Lines 73-81: conditional upload with `if: failure()`                                                                                                                                                  |

**Wiring:** 3/5 connections verified

## Requirements Coverage

| Requirement                                                   | Status      | Blocking Issue                                         |
| ------------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| CI-01: Workflow runs lint, type-check, build, test on push/PR | ~ PARTIAL   | Type-check step does not type-check (no root tsconfig) |
| CI-02: ESLint + Prettier configured                           | ✓ SATISFIED | -                                                      |
| CI-03: pnpm lint passes                                       | ✓ SATISFIED | -                                                      |
| CI-04: Video smoke records and validates MP4/WebM/GIF         | ✗ BLOCKED   | `pnpm exec tuireel` not found at monorepo root         |
| CI-05: Artifact upload on failure                             | ✓ SATISFIED | -                                                      |

**Coverage:** 3/5 requirements satisfied, 1 partial, 1 blocked

## Anti-Patterns Found

| File                                | Line  | Pattern                                        | Severity   | Impact                                                               |
| ----------------------------------- | ----- | ---------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| `.github/workflows/ci.yml`          | 26    | `pnpm exec tsc --noEmit` without root tsconfig | ⚠️ Warning | Type-check silently succeeds (prints help) instead of checking types |
| `.github/workflows/video-smoke.yml` | 31-37 | `pnpm exec tuireel record ...`                 | 🛑 Blocker | CLI binary not available in root context; all record steps will fail |

**Anti-patterns:** 2 found (1 blocker, 1 warning)

## Human Verification Required

None — all verifiable items checked programmatically.

## Gaps Summary

### Critical Gaps (Block Progress)

These gaps are **known from `.planning/v1.1-MILESTONE-AUDIT.md`** and are owned by **Phase 15: CI Wiring Fixes**.

1. **CI type-check does not type-check**
   - Missing: Root `tsconfig.json` or explicit per-package tsc invocations
   - Evidence: Running `pnpm exec tsc --noEmit` at repo root prints tsc help text (Version 5.9.3) instead of type-checking
   - Impact: TypeScript errors are not caught in CI — type-check step silently "passes"
   - Remediation: Phase 15 (15-01-PLAN.md) — Fix CI type-check to use explicit tsconfig projects

2. **Video smoke workflow cannot invoke tuireel CLI**
   - Missing: `tuireel` binary accessible via `pnpm exec` at monorepo root
   - Evidence: `pnpm exec tuireel --help` returns `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "tuireel" not found`
   - Impact: All three record steps in video-smoke.yml will fail in CI
   - Remediation: Phase 15 (15-02-PLAN.md) — Fix video smoke workflow to invoke CLI via built dist entry

### Non-Critical Gaps

None.

## Local Verification Evidence

### pnpm lint

```
pnpm lint → turbo run lint → 2 packages (core, cli)
Result: 0 errors, warnings only (consistent-type-imports, no-explicit-any)
Status: PASS
```

### pnpm build

```
pnpm build → turbo run build → 2 packages
Result: Build successful (cached)
Status: PASS
```

### pnpm test

```
pnpm test → turbo run test → @tuireel/core
Result: 12 test files, 91 tests passed
Status: PASS
```

### tsc --noEmit (reproduction of known gap)

```
$ pnpm exec tsc --noEmit
Version 5.9.3
tsc: The TypeScript Compiler - Version 5.9.3
COMMON COMMANDS
  tsc
  Compiles the current project (tsconfig.json in the working directory.)
  ...
```

No root `tsconfig.json` → tsc prints usage help instead of type-checking.

### tuireel CLI invocation (reproduction of known gap)

```
$ pnpm exec tuireel --help
undefined
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tuireel" not found
Did you mean "pnpm exec turbo"?
```

CLI binary not available in root pnpm scope.

## Verification Metadata

**Verification approach:** Goal-backward (derived from ROADMAP.md Phase 11 success criteria)
**Must-haves source:** ROADMAP.md Phase 11 "Success Criteria" section
**Automated checks:** 4 truths evaluated (2 passed, 2 partial)
**Human checks required:** 0
**Total verification time:** ~2 min

---

_Verified: 2026-03-04_
_Verifier: Claude (gsd-executor)_
