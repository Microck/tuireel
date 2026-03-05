---
phase: 19-bun-publish-smoke-gate
verified: 2026-03-05T01:41:14Z
status: passed
score: 7/7 must-haves verified
---

# Phase 19: Bun Publish Smoke Gate Verification Report

**Phase Goal:** `pnpm -w publish:smoke` passes (including bun), unblocking the release workflow gate and restoring confidence in `bunx` install/run.
**Verified:** 2026-03-05T01:41:14Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                   | Status   | Evidence                                                                                                                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `pnpm -w publish:smoke` passes locally, including bun smoke checks                      | VERIFIED | Executed `pnpm -w publish:smoke` in this workspace; run completed with `ALL CHECKS PASSED`, including the bun smoke section (`bun install`, `bun runtime`, and bun record/audio checks).                                                                                                                    |
| 2   | Bun smoke installs `tuireel` and `@tuireel/core` from packed tarballs deterministically | VERIFIED | Bun temp manifest pins tarball paths in both `dependencies` and `overrides` (`scripts/publish-smoke.ts:367`, `scripts/publish-smoke.ts:374`), then runs `bun install` (`scripts/publish-smoke.ts:380`) and tarball-equivalence assertions (`scripts/publish-smoke.ts:116`, `scripts/publish-smoke.ts:382`). |
| 3   | Bun smoke executes CLI via Bun runtime (`bun x --no-install`)                           | VERIFIED | Bun runtime commands are executed via `bun --cwd ... x --no-install ...` with Bun 1.3 fallback (`scripts/publish-smoke.ts:452`, `scripts/publish-smoke.ts:458`, `scripts/publish-smoke.ts:467`).                                                                                                            |
| 4   | Bun smoke fails fast if nested `tuireel/node_modules/@tuireel/core` appears             | VERIFIED | Nested-path detection is explicit and aborts with actionable diagnostics (`scripts/publish-smoke.ts:394`, `scripts/publish-smoke.ts:403`, `scripts/publish-smoke.ts:405`).                                                                                                                                  |
| 5   | Bun smoke verifies `@tuireel/core` export surface includes `resolveOutputPath`          | VERIFIED | Script writes `core-export-surface.mjs`, imports `resolveOutputPath`, executes under Bun, and enforces runtime type `function` (`scripts/publish-smoke.ts:416`, `scripts/publish-smoke.ts:419`, `scripts/publish-smoke.ts:438`).                                                                            |
| 6   | Temp directories used by publish smoke are cleaned up, including `bunDir`               | VERIFIED | Cleanup loop includes `packDir`, `npxDir`, and `bunDir` with best-effort recursive removal (`scripts/publish-smoke.ts:481`, `scripts/publish-smoke.ts:487`).                                                                                                                                                |
| 7   | Release workflow remains gated on publish smoke before publish                          | VERIFIED | Release workflow installs Bun and runs `pnpm -w publish:smoke` before changesets publish (`.github/workflows/release.yml:32`, `.github/workflows/release.yml:36`, `.github/workflows/release.yml:37`, `.github/workflows/release.yml:39`).                                                                  |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact                        | Expected                                                                                                          | Status   | Details                                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/publish-smoke.ts`      | Deterministic bun smoke install/run gate with tarball equivalence assertions and export-surface regression checks | VERIFIED | Exists (501 lines), substantive implementation (no TODO/placeholder stubs), and wired via `publish:smoke` script (`package.json:16`); runtime-verified by successful command execution.                         |
| `package.json`                  | Root script wiring for publish smoke gate                                                                         | VERIFIED | Exists and defines `publish:smoke` as `pnpm -w build --filter tuireel... && tsx scripts/publish-smoke.ts` (`package.json:16`), which was executed successfully.                                                 |
| `.github/workflows/release.yml` | Release pipeline gate runs publish smoke (with bun available) before publish                                      | VERIFIED | Exists and wires `setup-bun` plus `pnpm -w publish:smoke` before `changesets/action` publish step (`.github/workflows/release.yml:32`, `.github/workflows/release.yml:37`, `.github/workflows/release.yml:41`). |

### Key Link Verification

| From                            | To                                    | Via                                                                                  | Status | Details                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`                  | `scripts/publish-smoke.ts`            | npm script `publish:smoke`                                                           | WIRED  | `package.json:16` invokes `tsx scripts/publish-smoke.ts`; command execution confirms link is live.                                                                                                                 |
| `scripts/publish-smoke.ts`      | Packed CLI/core tarballs              | `pnpm --filter ... pack`                                                             | WIRED  | Tarballs are produced before smoke install checks (`scripts/publish-smoke.ts:265`, `scripts/publish-smoke.ts:266`, `scripts/publish-smoke.ts:283`, `scripts/publish-smoke.ts:284`).                                |
| `scripts/publish-smoke.ts`      | Bun dependency resolution             | Temp `package.json` `dependencies` + `overrides`                                     | WIRED  | Bun manifest pins `tuireel` and `@tuireel/core` to tarball paths and forces core override (`scripts/publish-smoke.ts:370`, `scripts/publish-smoke.ts:372`, `scripts/publish-smoke.ts:374`).                        |
| `scripts/publish-smoke.ts`      | Installed package metadata validation | `tar -xOzf ... package/package.json` + compare installed `node_modules` package.json | WIRED  | Tarball JSON extraction and installed JSON comparisons are implemented in `assertInstalledPackageMatchesTarball` (`scripts/publish-smoke.ts:127`, `scripts/publish-smoke.ts:133`, `scripts/publish-smoke.ts:196`). |
| `scripts/publish-smoke.ts`      | Bun runtime CLI entrypoint            | `bun --cwd ... x --no-install tuireel ...`                                           | WIRED  | Bun help/version/record command paths are exercised in smoke runtime checks (`scripts/publish-smoke.ts:452`, `scripts/publish-smoke.ts:458`, `scripts/publish-smoke.ts:467`).                                      |
| `.github/workflows/release.yml` | Release publish step                  | Publish smoke gate before changesets publish                                         | WIRED  | Workflow order enforces smoke gate before publish action (`.github/workflows/release.yml:36`, `.github/workflows/release.yml:39`).                                                                                 |

### Requirements Coverage

| Requirement                                                        | Status    | Blocking Issue                                                                                                                               |
| ------------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| REL-04 (`npx tuireel` and `bunx tuireel` work after first publish) | SATISFIED | In phase scope, gate confidence is restored via deterministic npx/bun smoke checks and release workflow gating; no code-level blocker found. |

### Anti-Patterns Found

| File                       | Line | Pattern     | Severity | Impact                                                                               |
| -------------------------- | ---- | ----------- | -------- | ------------------------------------------------------------------------------------ |
| `scripts/publish-smoke.ts` | 113  | `return {}` | INFO     | Intentional normalization fallback in `normalizeExports`; not a stub implementation. |

### Human Verification Required

None for phase must-haves. Automated command verification and wiring checks were completed in this workspace.

### Gaps Summary

No gaps found against Phase 19 must-haves. The publish smoke gate runs and passes with bun enabled, deterministic tarball/install wiring is present and enforced, core export-surface regression coverage exists, cleanup includes `bunDir`, and release workflow gating remains in place.

---

_Verified: 2026-03-05T01:41:14Z_
_Verifier: Claude (gsd-verifier)_
