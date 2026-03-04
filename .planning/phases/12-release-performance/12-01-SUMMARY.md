# Summary: 12-01 — Changesets Setup

**Status:** complete
**Duration:** 3 min

## What was done

1. **Installed @changesets/cli** as workspace dev dependency.

2. **Configured changesets** (`.changeset/config.json`): Fixed versioning group linking `@tuireel/core` and `tuireel` CLI so both version together. Access set to `public`, base branch `main`.

3. **Added changeset scripts** to root `package.json`: `changeset`, `version`, and `release` (build + publish).

4. **Added publishConfig** to both packages: `{ "access": "public" }` in `packages/core/package.json` and `packages/cli/package.json`.

## Artifacts

| File | Purpose |
|------|---------|
| `.changeset/config.json` | Fixed versioning config |
| `.changeset/README.md` | Changesets documentation (auto-generated) |
| `package.json` | Added changeset/version/release scripts |
| `packages/core/package.json` | Added publishConfig.access: public |
| `packages/cli/package.json` | Added publishConfig.access: public |

## Verification

- `pnpm changeset status` runs (exits with expected "no changesets" warning)
- Fixed versioning group configured for both packages
- Both packages have publishConfig.access: public
- All 91 tests pass
