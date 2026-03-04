# Quick Task 001: GitHub repo creation + npm publish

## Goal

Set up the public GitHub repository and publish initial npm packages for the Tuireel project.

## Tasks

### Task 1: Create GitHub repository and push code
- Create `Microck/tuireel` repo on GitHub (public)
- Set description, homepage (tuireel.dev), topic tags
- Add git remote origin, push main branch
- **Verification:** `gh repo view Microck/tuireel` succeeds

### Task 2: Initial npm publish
- Publish `@tuireel/core@0.1.0` (scoped, public access)
- Publish `tuireel@0.1.0` (unscoped CLI, public access)
- Requires creating `tuireel` npm org first (free, public)
- **Verification:** `npm view tuireel` and `npm view @tuireel/core` return package info

### Task 3: Configure trusted publishers (user manual step)
- Guide user to configure OIDC trusted publishers on npmjs.com
- Each package: Settings > Trusted Publishers > GitHub Actions
- Repo: `Microck/tuireel`, workflow: `release.yml`
- Future releases via changesets + GitHub Actions, no npm token needed
