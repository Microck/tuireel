---
phase: 15-ci-wiring-fixes
verified: 2026-03-05T03:05:00Z
status: passed
score: 6/6 must-haves verified
human_verification:
  - test: "GitHub CI type-check fails on intentional TS error"
    expected: "CI fails in Type-check core/cli when a TypeScript error is introduced"
    result: "approved-without-test"
  - test: "GitHub video-smoke runner invokes CLI from dist entry"
    expected: "Record MP4/WebM/GIF steps run via node packages/cli/dist/index.js with no command-not-found failures"
    result: "approved-without-test"
approval_note: "User approved phase completion without running external GitHub Actions runtime checks."
---

# Phase 15: CI Wiring Fixes Verification Report

**Phase Goal:** CI actually type-checks the repo and video smoke CI can invoke the CLI reliably.
**Verified:** 2026-03-05T03:05:00Z
**Status:** passed
**Re-verification:** Yes - user approval checkpoint

## Goal Achievement

### Observable Truths

| #   | Truth                                                                    | Status   | Evidence                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | CI type-check runs against real tsconfig projects (not bare root tsc)    | VERIFIED | `.github/workflows/ci.yml:29` runs `tsc --noEmit -p packages/core/tsconfig.json` and `.github/workflows/ci.yml:32` runs `tsc --noEmit -p packages/cli/tsconfig.json`; no bare `pnpm exec tsc --noEmit` remains.                                                                                                                            |
| 2   | Type-check step fails CI on TypeScript errors                            | VERIFIED | Type-check commands are direct `run:` steps (`.github/workflows/ci.yml:29`, `.github/workflows/ci.yml:32`) with no `continue-on-error` and no forced-success shell fallback; non-zero `tsc` exits fail the job by default.                                                                                                                 |
| 3   | Video smoke CI can invoke tuireel CLI reliably (no command not found)    | VERIFIED | `.github/workflows/video-smoke.yml:35`, `.github/workflows/video-smoke.yml:40`, `.github/workflows/video-smoke.yml:45` invoke `node packages/cli/dist/index.js record ...`; no `pnpm exec tuireel` usage exists.                                                                                                                           |
| 4   | Video smoke CI still records MP4/WebM/GIF and validates outputs          | VERIFIED | Record + file guards at `.github/workflows/video-smoke.yml:33`-`.github/workflows/video-smoke.yml:46`; ffprobe validations for all formats at `.github/workflows/video-smoke.yml:48`, `.github/workflows/video-smoke.yml:98`, `.github/workflows/video-smoke.yml:148`; failure artifact upload at `.github/workflows/video-smoke.yml:198`. |
| 5   | Re-running milestone audit no longer flags CI-01 or CI-04 as unsatisfied | VERIFIED | `.planning/v1.1-MILESTONE-AUDIT.md:9` shows `unsatisfied: 0`; requirements rows are satisfied at `.planning/v1.1-MILESTONE-AUDIT.md:155` (CI-01) and `.planning/v1.1-MILESTONE-AUDIT.md:158` (CI-04); legacy CI gap strings are absent.                                                                                                    |
| 6   | Audit rerun evidence is recorded in a Phase 15 artifact                  | VERIFIED | `.planning/phases/15-ci-wiring-fixes/15-audit-milestone.md:5` records `/gsd-audit-milestone v1.1`; `.planning/phases/15-ci-wiring-fixes/15-audit-milestone.md:30`-`.planning/phases/15-ci-wiring-fixes/15-audit-milestone.md:41` captures negative-string checks and results.                                                              |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact                                                    | Expected                                         | Status   | Details                                                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`                                  | CI workflow runs lint/build/real type-check/test | VERIFIED | Exists (34 lines), substantive workflow, wired to both package tsconfigs via explicit `-p` commands.                                            |
| `packages/core/tsconfig.json`                               | TypeScript project config for core               | VERIFIED | Exists (11 lines), substantive config (`extends` + compiler options), wired from CI type-check core step.                                       |
| `packages/cli/tsconfig.json`                                | TypeScript project config for CLI                | VERIFIED | Exists (11 lines), substantive config (`extends` + compiler options), wired from CI type-check cli step.                                        |
| `.github/workflows/video-smoke.yml`                         | Video smoke record/validate workflow             | VERIFIED | Exists (206 lines), substantive record + ffprobe assertions + artifact upload, wired to built CLI entry and outputs.                            |
| `packages/cli/dist/index.js`                                | Built CLI entry used by CI invocation            | VERIFIED | Exists (462 lines), substantive compiled CLI with exports (`createProgram`, `runCli`), wired from video-smoke record steps.                     |
| `.planning/v1.1-MILESTONE-AUDIT.md`                         | Milestone audit showing CI closure state         | VERIFIED | Exists (177 lines), frontmatter includes `milestone: v1.1`, requirements table marks CI-01/CI-04 satisfied, no CI unsatisfied integration gaps. |
| `.planning/phases/15-ci-wiring-fixes/15-audit-milestone.md` | Evidence note for audit rerun outcome            | VERIFIED | Exists (45 lines), substantive evidence note with command, timestamp, excerpt, and explicit absence checks.                                     |

### Key Link Verification

| From                                | To                            | Via                             | Status | Details                                                                                                                                                                                                 |
| ----------------------------------- | ----------------------------- | ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`          | `packages/core/tsconfig.json` | `pnpm exec tsc --noEmit -p ...` | WIRED  | Explicit command in `.github/workflows/ci.yml:29`; target file exists and is valid.                                                                                                                     |
| `.github/workflows/ci.yml`          | `packages/cli/tsconfig.json`  | `pnpm exec tsc --noEmit -p ...` | WIRED  | Explicit command in `.github/workflows/ci.yml:32`; target file exists and is valid.                                                                                                                     |
| `.github/workflows/video-smoke.yml` | `packages/cli/dist/index.js`  | `node .../dist/index.js record` | WIRED  | Invocations at `.github/workflows/video-smoke.yml:35`, `.github/workflows/video-smoke.yml:40`, `.github/workflows/video-smoke.yml:45`; build precedes invoke at `.github/workflows/video-smoke.yml:28`. |
| `.planning/v1.1-MILESTONE-AUDIT.md` | CI-01/CI-04 closure state     | requirements coverage rows      | WIRED  | CI-01 and CI-04 are marked satisfied at `.planning/v1.1-MILESTONE-AUDIT.md:155` and `.planning/v1.1-MILESTONE-AUDIT.md:158`.                                                                            |
| `15-audit-milestone.md`             | Legacy-gap removal proof      | negative grep evidence          | WIRED  | Evidence note includes exact removed strings and verification commands showing no matches.                                                                                                              |

### Requirements Coverage

| Requirement | Status    | Blocking Issue                                                                                                   |
| ----------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| CI-01       | SATISFIED | None in code wiring; CI type-check now targets explicit package tsconfigs and keeps lint/build/test in job flow. |
| CI-04       | SATISFIED | None in code wiring; video smoke records and validates MP4/WebM/GIF via deterministic CLI invocation path.       |

### Anti-Patterns Found

| File                                | Line | Pattern                     | Severity | Impact                                                                                                                                       |
| ----------------------------------- | ---- | --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/video-smoke.yml` | 57   | `return null` (pattern hit) | INFO     | False-positive for stub scan; this is legitimate parse fallback logic inside inline ffprobe validation scripts, not an empty implementation. |

### Human Verification Outcome

### 1. GitHub CI Type-Check Failure Gate

**Test:** Open a PR branch with an intentional TypeScript error in `packages/core` or `packages/cli`, then run the `CI` workflow.
**Expected:** `Type-check core` or `Type-check cli` fails; workflow is red.
**Outcome:** Not executed in this session; user approved without test.

### 2. GitHub Video-Smoke Runtime Invocation

**Test:** Run the `Video Smoke Tests` workflow from a clean GitHub runner.
**Expected:** MP4/WebM/GIF record steps execute via `node packages/cli/dist/index.js` with no command-resolution errors; format validations run.
**Outcome:** Not executed in this session; user approved without test.

### Gaps Summary

No code-level wiring gaps were found in Phase 15 must-haves. External CI runtime checks were skipped and phase closure was approved by user.

---

_Verified: 2026-03-05T03:05:00Z_
_Verifier: Claude (gsd-verifier)_
