# Roadmap: Tuireel

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-03-03)
- 🚧 **v1.1 Branding, Docs & Hardening** - Phases 7-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6) — SHIPPED 2026-03-03</summary>

Archive:
- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/MILESTONES.md`

6 phases, 23 plans, 50 tasks completed.

</details>

### 🚧 v1.1 Branding, Docs & Hardening (In Progress)

**Milestone Goal:** Ship tuireel as a polished, documented, published open-source project with full branding, Mintlify docs, reliability hardening, CI, and release automation.

**Phase Numbering:**
- Integer phases (7-12): Planned milestone work
- Decimal phases (e.g. 8.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 7: Branding & Repo Polish** - Visual identity and repository community assets (completed 2026-03-03)
- [x] **Phase 8: Presets & Reliability** - User-facing presets and pipeline hardening (completed 2026-03-03)
- [ ] **Phase 9: Diagnostics** - Verbose/debug CLI modes and actionable error guidance
- [ ] **Phase 10: Documentation** - Mintlify docs site with guides and references
- [ ] **Phase 11: CI & Linting** - GitHub Actions pipeline and code quality enforcement
- [ ] **Phase 12: Release & Performance** - npm publishing automation and compositing optimization

## Phase Details

### Phase 7: Branding & Repo Polish
**Goal**: Project has a complete visual identity and repository is ready for public open-source contribution.
**Depends on**: Nothing (first v1.1 phase)
**Requirements**: BRND-01, BRND-02, BRND-03, BRND-04, BRND-05, REPO-01, REPO-02, REPO-03, REPO-04, REPO-05
**Success Criteria** (what must be TRUE):
  1. Repository root shows a branded README with logo, badges (npm, CI, license), install command, quickstart, and docs link
  2. Opening a link to the repo in social media shows a branded preview card (OG image)
  3. LICENSE file exists with Apache 2.0 text and both package.json files reference `Apache-2.0`
  4. A new contributor can find CONTRIBUTING.md, issue templates, and PR template to understand how to participate
  5. All branding assets (logo SVG, banner PNG, OG PNG, favicon) exist in `assets/branding/`
**Plans:** 5 plans

Plans:
- [x] 07-01-PLAN.md — Logo SVG + favicon (icon, dark/light variants, color palette)
- [x] 07-02-PLAN.md — LICENSE (Apache 2.0) + package.json updates + CONTRIBUTING.md
- [x] 07-03-PLAN.md — GitHub issue templates (YAML) + PR template
- [x] 07-04-PLAN.md — Banner PNG (1280x640) + OG image PNG (1200x630) via Sharp
- [x] 07-05-PLAN.md — README.md (branded, with logo/banner/badges) + human verification

### Phase 8: Presets & Reliability
**Goal**: Users can select named presets for instant polished output, and the pipeline handles failures and long recordings gracefully.
**Depends on**: Phase 7 (license must be set before code changes)
**Requirements**: PRST-01, PRST-02, PRST-03, PRST-04, RELY-01, RELY-02, RELY-03, RELY-04, RELY-05, RELY-06
**Success Criteria** (what must be TRUE):
  1. User can add `"preset": "polished"` to config and get catppuccin theme + cursor + HUD + sound without specifying each individually
  2. User-specified config values override preset defaults (e.g., preset sets sound on, user turns it off)
  3. `tuireel init` prompts to choose a preset during scaffolding
  4. Pressing Ctrl+C during recording or compositing cleanly terminates all child processes and removes temp files
  5. A recording with 1000+ frames completes without zombie processes or unbounded memory growth
**Plans:** 4 plans

Plans:
- [x] 08-01-PLAN.md — Schema extensions + preset definitions + tested resolution logic (TDD)
- [x] 08-02-PLAN.md — Compositor signal handling + ffmpeg error enhancement
- [x] 08-03-PLAN.md — Preset wiring into loader + init command preset prompt + cursor/hud passthrough
- [x] 08-04-PLAN.md — defaultWaitTimeout wiring + tuistory error context + long recording verification

### Phase 9: Diagnostics
**Goal**: Users can diagnose pipeline failures with verbose/debug output and every error message tells them what to do.
**Depends on**: Phase 8 (reliability error improvements feed diagnostic messages)
**Requirements**: DIAG-01, DIAG-02, DIAG-03
**Success Criteria** (what must be TRUE):
  1. Running `tuireel record --verbose` shows step-by-step progress, frame counts, and encoding stats in the terminal
  2. Running `tuireel record --debug` additionally shows full ffmpeg stderr, tuistory events, and internal timing
  3. Every error the CLI can produce includes what went wrong and a concrete suggestion for what to try
**Plans**: TBD

### Phase 10: Documentation
**Goal**: A public Mintlify docs site covers installation, configuration, all features, and every CLI command.
**Depends on**: Phase 7 (branding assets for docs), Phase 8 (presets to document), Phase 9 (diagnostics to document)
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06, DOCS-07, DOCS-08, DOCS-09, DOCS-10
**Success Criteria** (what must be TRUE):
  1. Running `npx mintlify dev` in `docs/` serves a docs site with logo, colors, favicon, and working navigation
  2. A new user can follow the Quickstart page to install tuireel and produce their first recording
  3. Every config field, step type, CLI command, and built-in theme has a reference page with examples
  4. Presets and sound configuration each have dedicated pages with usage examples
**Plans**: TBD

### Phase 11: CI & Linting
**Goal**: Every PR and push to main is automatically validated for code quality and video output correctness.
**Depends on**: Phase 8 (presets must exist for CI to test), Phase 10 (docs structure for lint coverage)
**Requirements**: CI-01, CI-02, CI-03, CI-04, CI-05
**Success Criteria** (what must be TRUE):
  1. Pushing to main or opening a PR triggers a GitHub Actions job that runs lint, type-check, build, and unit tests
  2. ESLint + Prettier configs exist and `pnpm lint` passes across the monorepo
  3. A separate CI job records a short fixture as MP4, WebM, and GIF, asserting each output has correct codec, resolution, and non-zero duration
  4. When a video smoke test fails, the produced artifact is uploaded to the GitHub Actions run for inspection
**Plans**: TBD

### Phase 12: Release & Performance
**Goal**: Merging to main triggers automated npm publishing with GitHub releases, and compositing performance has a benchmark baseline with at least one optimization applied.
**Depends on**: Phase 11 (CI must pass before releases), Phase 7 (license must be set for changesets)
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05, PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. Adding a changeset file and merging to main creates a "Version Packages" PR automatically
  2. Merging the version PR publishes both packages to npm and creates a GitHub release with tag
  3. `npx tuireel` and `bunx tuireel` install and run successfully after the first publish
  4. A benchmark script records a standard fixture and reports total time, per-frame time, and compositing time
  5. At least one compositing optimization is applied and its improvement is measurable against the benchmark baseline
**Plans**: TBD

## Progress

**Execution Order:** 7 → 8 → 9 → 10 → 11 → 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v1.0 MVP | 23/23 | Complete | 2026-03-03 |
| 7. Branding & Repo Polish | v1.1 | 5/5 | Complete | 2026-03-03 |
| 8. Presets & Reliability | v1.1 | 4/4 | Complete | 2026-03-03 |
| 9. Diagnostics | v1.1 | 0/TBD | Not started | - |
| 10. Documentation | v1.1 | 0/TBD | Not started | - |
| 11. CI & Linting | v1.1 | 0/TBD | Not started | - |
| 12. Release & Performance | v1.1 | 0/TBD | Not started | - |
