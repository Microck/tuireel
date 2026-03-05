# Phase 19: Bun Publish Smoke Gate - Research

**Researched:** 2026-03-04
**Domain:** Deterministic Bun-based publish smoke for packed tarballs
**Confidence:** HIGH

## User Constraints

- No phase `CONTEXT.md` exists; use `.planning/ROADMAP.md` + `.planning/v1.1-MILESTONE-AUDIT.md` as source of truth.
- Goal: `pnpm -w publish:smoke` passes (including Bun), unblocking `.github/workflows/release.yml` gate and restoring confidence in `bunx` install/run.
- Depends on: Phase 16 (publish smoke tooling), Phase 17 (multi-format output contract).
- Requirement: REL-04.
- Runtime constraint: Bun primary; npm/npx and bunx must remain supported (`.planning/PROJECT.md`).
- Known failure: Bun smoke errors with `SyntaxError: The requested module '@tuireel/core' does not provide an export named 'resolveOutputPath'` and Bun installs a nested `node_modules/tuireel/node_modules/@tuireel/core` lacking that export.

## Summary

The current Bun smoke test in `scripts/publish-smoke.ts` installs both tarballs, but Bun still resolves `tuireel -> @tuireel/core@0.1.0` from the registry (or cache) as a _separate_ dependency graph node, creating a nested `node_modules/tuireel/node_modules/@tuireel/core` that is not the packed tarball under test. That nested copy is missing the Phase 17 `resolveOutputPath` export, so the CLI fails to load.

Additionally, the script currently executes the CLI via the `node` shebang (`./node_modules/.bin/tuireel`), not via Bun. In Bun installs, `tuistory`'s `optionalDependencies.node-pty` was not present, which will break Node execution paths; running with Bun uses `tuistory`'s `"bun"` export condition and avoids `node-pty`.

**Primary recommendation:** In the Bun smoke section, install tarballs using a temp `package.json` with Bun `overrides` pinning `@tuireel/core` to the core tarball, then execute the CLI via `bun --cwd <dir> run ./node_modules/tuireel/dist/index.js ...` and assert no nested `@tuireel/core` exists.

## Root Cause Hypothesis (with repo evidence)

### What fails

- Command: `pnpm -w publish:smoke` (see root `package.json` script).
- Failure occurs in Bun section of `scripts/publish-smoke.ts` around the Bun install + execution:
  - `scripts/publish-smoke.ts`: bun install is `bun add "${coreTarPath}" "${cliTarPath}"`
  - `scripts/publish-smoke.ts`: execution is `./node_modules/.bin/tuireel --help` (Node shebang)

### Why it fails (confirmed locally)

1. Bun installs the CLI tarball and separately resolves its dependency `"@tuireel/core": "0.1.0"` from the registry, producing a nested core at:
   - `node_modules/tuireel/node_modules/@tuireel/core`
2. That nested core copy is _not_ the packed tarball under test and is missing the Phase 17 export.
   - In the failing Bun smoke tmp dir, nested `@tuireel/core/dist/index.js` export list ends without `resolveOutputPath`.
3. The CLI imports `resolveOutputPath` from `@tuireel/core` at module load (e.g. `packages/cli/src/commands/record.ts`, `packages/cli/src/commands/composite.ts`), so module evaluation fails immediately.

### Lockfile indicator (Bun)

In the failing Bun smoke tmp dir, `bun.lock` contains a transitive resolution entry for the nested core (shape observed):

- `tuireel/@tuireel/core`: resolved as `@tuireel/core@0.1.0` (registry) rather than the tarball path.

## Standard Stack

### Core

| Tool                                                | Purpose                                    | Notes                                                           |
| --------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `pnpm --filter <pkg> pack --pack-destination <dir>` | Produce the tarballs under test            | Already used by `scripts/publish-smoke.ts`                      |
| `bun install`                                       | Deterministic install from `package.json`  | Prefer over `bun add` when the test wants a controlled manifest |
| `package.json.overrides` (Bun)                      | Force transitive dependency version/source | Use to pin `@tuireel/core` to the core tarball                  |
| `bun --cwd <dir> run <file> ...`                    | Execute the CLI with Bun runtime           | Avoid Node shebang paths                                        |

## Architecture Patterns

### Pattern: “Temp project installs packed artifacts”

- Pack tarballs into a temp `packsDir`.
- Create isolated temp project dirs (`npm` dir + `bun` dir).
- Install tarballs from absolute paths.
- Execute `--help`/`--version` to validate import graph + bin wiring.

## Recommended Deterministic Bun Smoke Strategy

### Install strategy (pin transitive core)

In the Bun temp project directory, write a `package.json` like:

```json
{
  "private": true,
  "type": "module",
  "dependencies": {
    "tuireel": "/abs/path/to/tuireel-<ver>.tgz",
    "@tuireel/core": "/abs/path/to/tuireel-core-<ver>.tgz"
  },
  "overrides": {
    "@tuireel/core": "/abs/path/to/tuireel-core-<ver>.tgz"
  }
}
```

Then run `bun install` (optionally `--no-cache` to reduce “sticky” resolution behavior between runs).

This removes the nested `node_modules/tuireel/node_modules/@tuireel/core` and forces Bun to use the packed core tarball everywhere.

### Execution strategy (actually use Bun runtime)

Run the CLI entrypoint with Bun:

```bash
bun --cwd "$bunDir" run ./node_modules/tuireel/dist/index.js --help
bun --cwd "$bunDir" run ./node_modules/tuireel/dist/index.js --version
```

This matches the `bunx` runtime model and avoids Node-only optional deps (`tuistory` declares `optionalDependencies.node-pty` and has conditional exports for Bun).

### Determinism assertions (regression guards)

- Fail if `node_modules/tuireel/node_modules/@tuireel/core` exists after Bun install.
- Optionally fail if `bun.lock` contains a `tuireel/@tuireel/core` entry (indicates Bun picked a separate registry resolution).
- Keep the existing `workspace:` tarball inspection.

## Common Pitfalls

- **Running the Bun smoke install but executing with Node:** `./node_modules/.bin/tuireel` typically uses a Node shebang; this bypasses Bun conditional exports and can fail on Bun-installed trees.
- **Same semver version exists on npm:** when tarballs have a version already published (e.g. `0.1.0`), Bun may resolve a transitive dependency from the registry even if the root explicitly installed a tarball of the same name/version.
- **Turbo filter semantics:** root `publish:smoke` uses `pnpm -w build --filter tuireel...` which does not necessarily build dependencies (Turbo filter `pkg...` vs `...pkg` nuance). Release workflow runs `pnpm build` first, but local smoke runs can pack stale `dist/` if core wasn’t built.

## Verification Plan (what to check in Phase 19)

1. `pnpm -w publish:smoke` passes locally, including Bun section.
2. Bun smoke dir proves determinism:
   - `node_modules/tuireel/node_modules/@tuireel/core` does not exist.
   - `bun --cwd <dir> run ./node_modules/tuireel/dist/index.js --help` exits 0.
3. Release gating remains intact:
   - `.github/workflows/release.yml` still runs `pnpm -w publish:smoke` and would pass.

## Concrete Planning Notes

Likely code changes:

- `scripts/publish-smoke.ts`: rewrite Bun section to:
  - generate a custom `package.json` (deps + overrides)
  - run `bun install` instead of `bun add`
  - run CLI via `bun --cwd ... run ./node_modules/tuireel/dist/index.js` (not `./node_modules/.bin/tuireel`)
  - add determinism assertions (no nested core)
  - clean up Bun temp dir in the final cleanup block

Optional hardening (only if needed for determinism):

- root `package.json` `publish:smoke` build filter: ensure core is built before packing in local runs.

## Sources

Primary (repo evidence):

- `scripts/publish-smoke.ts`
- `.github/workflows/release.yml`
- `.planning/ROADMAP.md`
- `.planning/v1.1-MILESTONE-AUDIT.md`
- `.planning/PROJECT.md`

Secondary (official docs):

- Bun docs: https://bun.com/docs/pm/overrides (overrides/resolutions feature; used conceptually, validated by local experiment)

## Metadata

**Confidence breakdown:**

- Root cause: HIGH (reproduced locally; nested `@tuireel/core` missing export confirmed)
- Recommended strategy: HIGH (local experiment: `overrides` removes nested core; Bun runtime execution passes `--help`/`--version`)
- Pitfalls: MEDIUM (Turbo filter nuance is likely but should be validated against current local build behavior)
