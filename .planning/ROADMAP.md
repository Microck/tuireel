# Roadmap: Tuireel

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-03-03)
- ✅ **v1.1 Branding, Docs & Hardening** - Phases 7-12 (shipped 2026-03-04)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6) — SHIPPED 2026-03-03</summary>

Archive:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/MILESTONES.md`

6 phases, 23 plans, 50 tasks completed.

</details>

### ✅ v1.1 Branding, Docs & Hardening (Shipped 2026-03-04)

**Milestone Goal:** Ship tuireel as a polished, documented, published open-source project with full branding, Mintlify docs, reliability hardening, CI, and release automation.

**Phase Numbering:**

- Integer phases (7-12): Planned milestone work
- Decimal phases (e.g. 8.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 7: Branding & Repo Polish** - Visual identity and repository community assets (completed 2026-03-03)
- [x] **Phase 8: Presets & Reliability** - User-facing presets and pipeline hardening (completed 2026-03-03)
- [x] **Phase 9: Diagnostics** - Verbose/debug CLI modes and actionable error guidance (completed 2026-03-03)
- [x] **Phase 10: Documentation** - Mintlify docs site with guides and references
- [x] **Phase 11: CI & Linting** - GitHub Actions pipeline and code quality enforcement (completed 2026-03-04)
- [x] **Phase 12: Release & Performance** - npm publishing automation and compositing optimization (completed 2026-03-04)

Gap closure phases (from `.planning/v1.1-MILESTONE-AUDIT.md`):

- [ ] **Phase 13: Verify Runtime Phases (08-09)** - Add missing verification reports (GAP CLOSURE)
- [ ] **Phase 14: Verify Ops Phases (10-12)** - Add missing verification reports (GAP CLOSURE)
- [ ] **Phase 15: CI Wiring Fixes** - Real type-check + fix video smoke CLI invocation (GAP CLOSURE)
- [ ] **Phase 16: Publish Installability Fixes** - Remove `workspace:*` from published deps + align version drift (GAP CLOSURE)
- [ ] **Phase 17: Fix Multi-Format Record Outputs (CI Smoke)** - Make MP4/WebM/GIF smoke test deterministic (GAP CLOSURE)

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
   **Plans:** 2 plans

Plans:

- [x] 09-01-PLAN.md — Logger infrastructure + verbose/debug CLI flags + recorder/compositor wiring
- [x] 09-02-PLAN.md — Error message audit with actionable guidance across all core modules

### Phase 10: Documentation

**Goal**: A public Mintlify docs site covers installation, configuration, all features, and every CLI command.
**Depends on**: Phase 7 (branding assets for docs), Phase 8 (presets to document), Phase 9 (diagnostics to document)
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06, DOCS-07, DOCS-08, DOCS-09, DOCS-10
**Success Criteria** (what must be TRUE):

1. Running `npx mintlify dev` in `docs/` serves a docs site with logo, colors, favicon, and working navigation
2. A new user can follow the Quickstart page to install tuireel and produce their first recording
3. Every config field, step type, CLI command, and built-in theme has a reference page with examples
4. Presets and sound configuration each have dedicated pages with usage examples
   **Plans:** 3 plans

Plans:

- [x] 10-01-PLAN.md — Mintlify site setup + branding + Introduction + Quickstart pages
- [x] 10-02-PLAN.md — Config reference + Steps reference + CLI reference pages
- [x] 10-03-PLAN.md — Themes + Presets + Sound + Multi-video/Includes pages

### Phase 11: CI & Linting

**Goal**: Every PR and push to main is automatically validated for code quality and video output correctness.
**Depends on**: Phase 8 (presets must exist for CI to test), Phase 10 (docs structure for lint coverage)
**Requirements**: CI-01, CI-02, CI-03, CI-04, CI-05
**Success Criteria** (what must be TRUE):

1. Pushing to main or opening a PR triggers a GitHub Actions job that runs lint, type-check, build, and unit tests
2. ESLint + Prettier configs exist and `pnpm lint` passes across the monorepo
3. A separate CI job records a short fixture as MP4, WebM, and GIF, asserting each output has correct codec, resolution, and non-zero duration
4. When a video smoke test fails, the produced artifact is uploaded to the GitHub Actions run for inspection
   **Plans:** 2 plans

Plans:

- [x] 11-01-PLAN.md — ESLint + Prettier + turbo lint + GitHub Actions CI workflow
- [x] 11-02-PLAN.md — Video smoke test CI job + artifact upload on failure

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
   **Plans:** 3 plans

Plans:

- [x] 12-01-PLAN.md — Changesets setup + npm publish config
- [x] 12-02-PLAN.md — GitHub Actions release workflow (version PR + auto-publish)
- [x] 12-03-PLAN.md — Performance benchmark + compositing optimization

### Phase 13: Verify Runtime Phases (08-09)

**Goal**: Milestone audit phase verification coverage passes for Phase 08 and Phase 09.
**Depends on**: Phase 8, Phase 9 (work is complete; verification artifacts are missing)
**Requirements**: (Audit gate) Phase verification coverage
**Gap Closure**: Closes `.planning/v1.1-MILESTONE-AUDIT.md` gaps: missing `08-VERIFICATION.md`, missing `09-VERIFICATION.md`
**Success Criteria** (what must be TRUE):

1.  `.planning/phases/08-presets-reliability/08-VERIFICATION.md` exists and records evidence for Phase 08 success criteria
2.  `.planning/phases/09-diagnostics/09-VERIFICATION.md` exists and records evidence for Phase 09 success criteria
3.  Re-running `/gsd-audit-milestone` no longer flags Phase 08 or Phase 09 as BLOCKER due to missing verification
    **Plans:** 3 plans

Plans:

- [x] 13-01-PLAN.md — Create Phase 08 verification report (08-VERIFICATION.md)
- [x] 13-02-PLAN.md — Create Phase 09 verification report (09-VERIFICATION.md)
- [ ] 13-03-PLAN.md — Re-run v1.1 milestone audit and capture 08/09 coverage evidence

### Phase 14: Verify Ops Phases (10-12)

**Goal**: Milestone audit phase verification coverage passes for Phase 10, Phase 11, and Phase 12.
**Depends on**: Phase 10, Phase 11, Phase 12 (work is complete; verification artifacts are missing)
**Requirements**: (Audit gate) Phase verification coverage
**Gap Closure**: Closes `.planning/v1.1-MILESTONE-AUDIT.md` gaps: missing `10-VERIFICATION.md`, missing `11-VERIFICATION.md`, missing `12-VERIFICATION.md`
**Success Criteria** (what must be TRUE):

1. `.planning/phases/10-documentation/10-VERIFICATION.md` exists and records evidence for Phase 10 success criteria
2. `.planning/phases/11-ci-linting/11-VERIFICATION.md` exists and records evidence for Phase 11 success criteria
3. `.planning/phases/12-release-performance/12-VERIFICATION.md` exists and records evidence for Phase 12 success criteria
4. Re-running `/gsd-audit-milestone` no longer flags Phase 10-12 as BLOCKER due to missing verification
   **Plans:** 4 plans

Plans:

- [x] 14-01-PLAN.md — Create Phase 10 verification report (10-VERIFICATION.md)
- [x] 14-02-PLAN.md — Create Phase 11 verification report (11-VERIFICATION.md)
- [x] 14-03-PLAN.md — Create Phase 12 verification report (12-VERIFICATION.md)
- [ ] 14-04-PLAN.md — Re-run v1.1 milestone audit and capture 10/11/12 coverage evidence

### Phase 15: CI Wiring Fixes

**Goal**: CI actually type-checks the repo and video smoke CI can invoke the CLI reliably.
**Depends on**: Phase 11 (CI exists but has wiring gaps)
**Requirements**: CI-01, CI-04
**Gap Closure**: Closes `.planning/v1.1-MILESTONE-AUDIT.md` integration gaps: CI type-check misconfigured; video smoke workflow invokes non-existent CLI binary
**Success Criteria** (what must be TRUE):

1. CI type-check step runs against a real TypeScript project configuration and fails on TS errors
2. Video smoke CI job can invoke tuireel from the correct workspace context (no "command not found")
3. Re-running `/gsd-audit-milestone` no longer flags CI-01 or CI-04 as unsatisfied
   **Plans:** 3 plans

Plans:

- [x] 15-01-PLAN.md — Fix CI type-check to use explicit tsconfig projects
- [ ] 15-02-PLAN.md — Fix video smoke workflow to invoke CLI via built dist entry
- [ ] 15-03-PLAN.md — Re-run milestone audit and record CI-01/CI-04 closure evidence

### Phase 16: Publish Installability Fixes

**Goal**: Published `tuireel` installs via `npx` and does not ship `workspace:*` dependencies.
**Depends on**: Phase 12 (release workflow exists but publish artifact is broken)
**Requirements**: REL-04
**Gap Closure**: Closes `.planning/v1.1-MILESTONE-AUDIT.md` integration + flow gaps: published `workspace:*` dependency breaks installs; `npx tuireel --help` fails; version constant drift noted in `packages/core/src/index.ts`
**Success Criteria** (what must be TRUE):

1. `npm view tuireel dependencies` (or publish artifact inspection) shows no `workspace:*` entries
2. `npx -y tuireel --help` succeeds in a clean environment
3. Any exported version constant matches the published package versioning strategy (or is removed to avoid drift)
   **Plans:** 2 plans

Plans:

- [ ] 16-01-PLAN.md — Remove `workspace:*` publish deps + fix version drift
- [ ] 16-02-PLAN.md — Add pack/npx publish smoke gate + wire into release workflow

### Phase 17: Fix Multi-Format Record Outputs (CI Smoke)

**Goal**: `tuireel record --format` produces format-consistent outputs so CI can reliably record and validate MP4, WebM, and GIF in one job.
**Depends on**: Phase 11 (CI workflows exist), Phase 15 (deterministic CLI invocation pattern)
**Requirements**: CI-04
**Gap Closure**: Closes `.planning/v1.1-MILESTONE-AUDIT.md` gaps: record output naming overwrites output; video smoke MP4/WebM/GIF flow broken.
**Success Criteria** (what must be TRUE):

1. Running `tuireel record --format mp4`, `--format webm`, and `--format gif` produces three distinct output files that match their container/codec expectations.
2. `.github/workflows/video-smoke.yml` records and validates MP4/WebM/GIF without relying on ambiguous filenames.
3. Docs accurately describe `--format` behavior (no "WebM inside .mp4" style mismatches).
   **Plans:** 3 plans

Plans:

- [ ] 17-01-PLAN.md — Define output naming contract for `record --format` + implement deterministic outputs
- [ ] 17-02-PLAN.md — Update video smoke workflow to match the contract + add regression verification
- [ ] 17-03-PLAN.md — Update CLI docs (and README if needed) to match behavior

## Progress

**Execution Order:** 7 → 8 → 9 → 10 → 11 → 12

**Gap Closure Order:** 13 → 14 → 15 → 16

| Phase                                          | Milestone | Plans Complete | Status      | Completed  |
| ---------------------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1-6                                            | v1.0 MVP  | 23/23          | Complete    | 2026-03-03 |
| 7. Branding & Repo Polish                      | v1.1      | 5/5            | Complete    | 2026-03-03 |
| 8. Presets & Reliability                       | v1.1      | 4/4            | Complete    | 2026-03-03 |
| 9. Diagnostics                                 | v1.1      | 2/2            | Complete    | 2026-03-03 |
| 10. Documentation                              | v1.1      | 3/3            | Complete    | 2026-03-04 |
| 11. CI & Linting                               | v1.1      | 2/2            | Complete    | 2026-03-04 |
| 12. Release & Performance                      | v1.1      | 3/3            | Complete    | 2026-03-04 |
| 13. Verify Runtime Phases (08-09)              | v1.1      | 2/3            | In progress | —          |
| 14. Verify Ops Phases (10-12)                  | v1.1      | 3/4            | In progress | —          |
| 15. CI Wiring Fixes                            | v1.1      | 0/TBD          | Planned     | —          |
| 16. Publish Installability Fixes               | v1.1      | 0/2            | Planned     | —          |
| 17. Fix Multi-Format Record Outputs (CI Smoke) | v1.1      | 0/3            | Planned     | —          |
