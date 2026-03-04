# Summary: 12-02 — Release Workflow

**Status:** complete
**Duration:** 2 min

## What was done

1. **Created release workflow** (`.github/workflows/release.yml`): Uses `changesets/action@v1` for the two-phase release flow:
   - When changesets exist on main: creates a "Version Packages" PR
   - When the version PR merges: publishes both packages to npm

2. **GitHub Release creation**: After successful publish, creates a GitHub release with auto-generated notes using `gh release create`.

3. **Security**: Uses `NPM_TOKEN` secret for npm auth, `GITHUB_TOKEN` for PR/release creation. Concurrency group prevents race conditions.

## User setup required

- Add `NPM_TOKEN` secret to GitHub repository settings before first release

## Artifacts

| File | Purpose |
|------|---------|
| `.github/workflows/release.yml` | Automated release workflow |

## Verification

- Workflow YAML is valid
- Uses changesets/action@v1 with publish command matching root package.json
- GitHub release step conditioned on `published == 'true'`
- NPM_TOKEN documented as required secret
