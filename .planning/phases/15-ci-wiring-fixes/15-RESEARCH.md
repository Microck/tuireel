# Phase 15: CI Wiring Fixes - Research

**Researched:** 2026-03-04
**Domain:** GitHub Actions CI wiring (pnpm + TypeScript + CLI invocation)
**Confidence:** HIGH

<user_constraints>

## User Constraints

No `*-CONTEXT.md` found for Phase 15.

### Locked Decisions

None.

### Claude's Discretion

Choose the simplest repo-local wiring that makes CI type-check and makes the video smoke workflow able to invoke the CLI.

### Deferred Ideas (OUT OF SCOPE)

None noted.
</user_constraints>

## Summary

This repo is a pnpm workspace monorepo with TypeScript at the root and per-package `tsconfig.json` files in `packages/core` and `packages/cli`. The current CI type-check step runs `pnpm exec tsc --noEmit` at the repo root, where there is no root `tsconfig.json`, so `tsc` prints help and exits successfully (meaning CI "type-check" does not actually type-check).

The video smoke workflow currently runs `pnpm exec tuireel ...` from the repo root, but the `tuireel` binary is not available in the root `node_modules/.bin` because the root package does not depend on the `tuireel` workspace package. Additionally, `pnpm --filter tuireel exec tuireel` does not resolve a workspace package's own `bin` (confirmed in repo history).

**Primary recommendation:** Wire CI to type-check explicit package tsconfigs, and invoke the CLI via the built artifact (`node packages/cli/dist/index.js ...`) or by adding the `tuireel` workspace package as a root devDependency.

## Standard Stack

### Core

| Tool               | Version (repo)   | Purpose                       | Why Standard                                   |
| ------------------ | ---------------- | ----------------------------- | ---------------------------------------------- |
| GitHub Actions     | (hosted)         | CI runner                     | First-party CI for GitHub repos                |
| pnpm               | 10.28.2          | Workspace install + execution | Repo is pnpm workspace (`pnpm-workspace.yaml`) |
| Node.js            | 22 (CI)          | JS runtime                    | Explicitly set in workflows                    |
| TypeScript (`tsc`) | 5.9.3 (lockfile) | Type-check                    | Canonical TS checker                           |

### Supporting

| Tool           | Version (repo)    | Purpose          | When to Use                                         |
| -------------- | ----------------- | ---------------- | --------------------------------------------------- |
| Turbo          | 2.8.12 (lockfile) | Task runner      | Existing `pnpm build/lint/test` use `turbo run ...` |
| ffmpeg/ffprobe | via action        | Video validation | Video smoke workflow assertions                     |

## Architecture Patterns

### Pattern 1: CI type-check must target a real tsconfig

**What:** Run `tsc --noEmit -p <path/to/tsconfig.json>` (not bare `tsc`).
**When to use:** Any monorepo without a root `tsconfig.json`.
**Example:**

```yaml
- name: Type-check
  run: |
    pnpm exec tsc --noEmit -p packages/core/tsconfig.json
    pnpm exec tsc --noEmit -p packages/cli/tsconfig.json
```

### Pattern 2: Invoke workspace CLI deterministically in CI

**What:** Run the built CLI entry directly with Node.
**When to use:** The workspace root does not have the CLI as a dependency (so `pnpm exec <bin>` fails).
**Example:**

```yaml
- name: Record MP4
  run: node packages/cli/dist/index.js record packages/core/test/fixtures/smoke.tuireel.jsonc --format mp4
```

### Anti-Patterns to Avoid

- **Root `pnpm exec tsc --noEmit` without a root `tsconfig.json`:** prints help; does not type-check.
- **`pnpm --filter tuireel exec tuireel ...`:** does not resolve the package's own `bin` in this workspace layout.

## Don't Hand-Roll

| Problem              | Don't Build                 | Use Instead                           | Why                                   |
| -------------------- | --------------------------- | ------------------------------------- | ------------------------------------- |
| Type-checking        | Custom TS file walker       | `tsc --noEmit -p ...`                 | `tsc` encodes TS project semantics    |
| CLI invocation in CI | PATH hacks / shell wrappers | `node packages/cli/dist/index.js ...` | Avoids pnpm bin resolution edge cases |

## Common Pitfalls

### Pitfall 1: False-green type-check

**What goes wrong:** CI says type-check passed but no TS project was checked.
**Why it happens:** `tsc` run with no `tsconfig.json` in cwd prints help and exits 0.
**How to avoid:** Always pass `-p packages/.../tsconfig.json` (or create a real root `tsconfig.json` and run against it).

### Pitfall 2: "Command not found" for tuireel

**What goes wrong:** `pnpm exec tuireel ...` fails in workflows.
**Why it happens:** Root workspace does not depend on the `tuireel` package, so its bin is not linked into root `.bin`.
**How to avoid:** Prefer `node packages/cli/dist/index.js ...` OR add `"tuireel": "workspace:*"` to the root `devDependencies` and keep the `pnpm build` step before invoking it.

## Code Examples

### Minimal local verification commands (match intended CI wiring)

```bash
pnpm exec tsc --noEmit -p packages/core/tsconfig.json
pnpm exec tsc --noEmit -p packages/cli/tsconfig.json

node packages/cli/dist/index.js --help
```

## State of the Art

| Old Approach                          | Current Approach                                 | Impact                    |
| ------------------------------------- | ------------------------------------------------ | ------------------------- |
| Root `tsc` with implicit config       | Explicit `tsc -p <package tsconfig>`             | Avoids false-green checks |
| `pnpm exec <bin>` from workspace root | `node <built-cli-entry>` (or root devDependency) | Stable CLI invocation     |

Note: Many TS monorepos use project references + `tsc -b`, but this repo's package `tsconfig.json` files explicitly set `"composite": false`, so `tsc -b` is not currently the "drop-in" fix.

## Open Questions

1. **Should CI type-check `docs/`?**
   - What we know: TypeScript is used by Mintlify, but there is no `docs/tsconfig.json` in this repo.
   - Recommendation: Limit Phase 15 to `packages/core` + `packages/cli` unless a docs tsconfig is introduced.

2. **Prefer node dist invocation vs root devDependency?**
   - Recommendation: Use `node packages/cli/dist/index.js ...` in CI for the few smoke steps; optionally add root devDependency later for developer ergonomics.

## Sources

### Primary (HIGH confidence)

- Repo evidence: `.github/workflows/ci.yml` (type-check step is bare `tsc`)
- Repo evidence: `.github/workflows/video-smoke.yml` (invokes `pnpm exec tuireel`)
- Repo evidence: `.planning/v1.1-MILESTONE-AUDIT.md` (flags CI-01, CI-04 wiring gaps)
- Repo evidence: `.planning/phases/06-workflow-polish/06-02-SUMMARY.md` (documents `pnpm --filter tuireel exec tuireel` not resolving; uses node `dist/index.js`)
- Local verification: `pnpm exec tsc --noEmit` prints help at repo root; `tsc -p packages/...` succeeds

### Secondary (MEDIUM confidence)

- pnpm CLI docs: https://pnpm.io/cli/exec
- TypeScript tsconfig doc (`noEmit`): https://www.typescriptlang.org/tsconfig/noEmit.html

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - versions verified in `package.json` / `pnpm-lock.yaml` / workflow files
- Architecture: HIGH - validated by local command behavior + prior phase summary
- Pitfalls: HIGH - reproduced (`tsc` help, `pnpm exec tuireel` not found)

**Research date:** 2026-03-04
**Valid until:** 2026-04-03
