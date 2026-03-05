# Phase 16: Publish Installability Fixes - Research

**Researched:** 2026-03-04
**Domain:** npm publishing for pnpm+Changesets monorepo; installability via npx
**Confidence:** HIGH

<user_constraints>

## User Constraints

No `CONTEXT.md` found for Phase 16. No locked decisions.
</user_constraints>

## Summary

This repo publishes with `pnpm` + `@changesets/cli` + `changesets/action`. Today, the published `tuireel@0.1.0` package still contains an internal dependency declared as `workspace:*` (`@tuireel/core`), which npm cannot install in a clean environment; `npx -y tuireel --help` fails with `Unsupported URL Type "workspace:"`.

Changesets' versioning logic explicitly preserves the `workspace:` protocol when updating inter-package dependency ranges (it rewrites the version but re-prefixes with `workspace:`). Therefore, fixing installability is primarily about ensuring publishable package.json files do not contain `workspace:` dependency specifiers at publish time.

Separately, `packages/core/src/index.ts` exports a hard-coded `VERSION = "0.0.1"`, while packages are published as `0.1.0`. That version string should be removed or derived from a single source of truth (the published package version) to avoid drift.

**Primary recommendation:** Replace `workspace:*` internal deps in publishable packages with real semver ranges (prefer exact), and make CLI/core version reporting derive from package version rather than hard-coded strings; add a pack/install smoke check that fails CI if `workspace:` appears in the tarball.

## Standard Stack

### Core

| Component              | Version (repo) | Purpose                                  | Why Standard                                     |
| ---------------------- | -------------: | ---------------------------------------- | ------------------------------------------------ |
| `pnpm`                 |      `10.28.2` | Workspace installs/publish script runner | Matches repo `packageManager` and CI setup       |
| `@changesets/cli`      |      `^2.30.0` | Versioning + publishing                  | Existing release workflow uses it                |
| `changesets/action@v1` |     (workflow) | Version PR + publish on `main`           | Already wired in `.github/workflows/release.yml` |
| `tsup`                 |       `^8.5.0` | Build `dist/` for publish                | Existing package build pipeline                  |

### Supporting

| Tool                     | Purpose                          | When to Use                                       |
| ------------------------ | -------------------------------- | ------------------------------------------------- |
| `npm pack` / `pnpm pack` | Inspect publish tarball contents | Pre-publish verification for `workspace:` leakage |
| `npx -y <pkg> --help`    | Clean install/run check          | Post-publish validation; also usable with tarball |

## Architecture Patterns

### Pattern 1: Publishable packages must not use `workspace:` protocol

**What:** In packages that will be published to npm, internal deps should be real semver ranges, not `workspace:*`.

**Why:** Changesets preserves the `workspace:` prefix when bumping internal dependency ranges, so `workspace:*` will survive versioning and can end up published.

**Repo evidence:** `packages/cli/package.json` currently has `"@tuireel/core": "workspace:*"`.

**Upstream evidence (Changesets):** Changesets detects `workspace:` ranges and then re-adds `workspace:` when writing the updated range:

```ts
// opensrc/.../changesets/packages/apply-release-plan/src/version-package.ts
const usesWorkspaceRange = depCurrentVersion.startsWith("workspace:");
...
if (usesWorkspaceRange) newNewRange = `workspace:${newNewRange}`;
```

**Recommended implementation in this repo:**

- Set `packages/cli/package.json` dependency `@tuireel/core` to an exact version (example: `"0.1.0"`).
- Let Changesets update it on future releases.

### Pattern 2: Version reporting must have a single source of truth

**What:** Avoid hard-coded version strings exported from runtime code.
**When to use:** CLI `.version(...)` and any exported `VERSION` constant.
**This repo:** `packages/core/src/index.ts` exports `VERSION = "0.0.1"` while packages are `0.1.0`.

**Preferred approach:** Read version from the package’s own `package.json` at runtime (or delete the constant).

## Don't Hand-Roll

| Problem                             | Don't Build                      | Use Instead                                              | Why                                               |
| ----------------------------------- | -------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| “Fix publish by rewriting tarballs” | Custom post-pack tarball mutator | Stop using `workspace:` in published `package.json` deps | Simpler, fewer edge cases, works with npm tooling |
| “Manual version constant updates”   | Hard-coded `VERSION = "..."`     | Derive from package version (or remove)                  | Prevents drift; no human process required         |

## Common Pitfalls

### Pitfall 1: Assuming Changesets converts `workspace:` to semver on publish

**What goes wrong:** Version PR/publish succeeds but the published package still contains `workspace:*` and installs fail.
**Why it happens:** Changesets preserves the `workspace:` prefix when updating ranges.
**How to avoid:** Keep publishable package.json deps as real semver ranges.

### Pitfall 2: `npx --help` loads too much code

**What goes wrong:** `tuireel --help` throws before printing help due to a top-level import failure.
**Why it happens:** Command modules import `@tuireel/core` at module load time.
**How to avoid:** If this becomes an issue, move heavy imports into the `.action(...)` handlers (dynamic import/lazy wiring).

### Pitfall 3: Version drift between packages and runtime strings

**What goes wrong:** CLI reports the wrong version.
**Why it happens:** A manually maintained `VERSION` constant drifts from `package.json`.
**How to avoid:** Read from `package.json` or delete the constant.

## Code Examples

### CLI version from its own `package.json` (ESM-safe)

```ts
import { createRequire } from "node:module";
import { Command } from "commander";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const program = new Command();
program.version(version);
```

### Pre-publish smoke check: ensure tarball has no `workspace:`

```bash
# From repo root
pnpm --filter tuireel build
pnpm --filter tuireel pack --pack-destination /tmp/tuireel-pack
tar -xOf /tmp/tuireel-pack/tuireel-*.tgz package/package.json | rg "workspace:"
```

### Clean install/run smoke check (local tarball)

```bash
TARBALL=$(ls -1 /tmp/tuireel-pack/tuireel-*.tgz | head -n 1)
npx -y "$TARBALL" --help
```

## Sources

### Primary (HIGH confidence)

- Local repo: `packages/cli/package.json` (has `@tuireel/core: workspace:*`)
- Local repo: `packages/core/src/index.ts` (hard-coded `VERSION`)
- Changesets source: `opensrc/repos/github.com/changesets/changesets/packages/apply-release-plan/src/version-package.ts` (re-adds `workspace:` prefix when bumping ranges)

### Secondary (MEDIUM confidence)

- Changesets issue tracker: https://github.com/changesets/changesets/issues/432 (Kagi search result; not fully re-validated here)
- Ecosystem symptom: multiple reports of npm failing with `Unsupported URL Type "workspace:"` when consuming published packages that include `workspace:` deps (Kagi search results)

## Open Questions

1. **Should `@tuireel/core` continue exporting `VERSION` at all?**
   - What we know: it is currently wrong (`0.0.1`) and causes drift.
   - Recommendation: prefer removing it (CLI should use its own version); if kept, derive it from package version.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - verified in-repo (`package.json`, workflows)
- Architecture: HIGH - validated against Changesets source code in `opensrc/`
- Pitfalls: MEDIUM - mix of in-repo evidence + ecosystem reports

**Research date:** 2026-03-04
**Valid until:** 2026-04-03
