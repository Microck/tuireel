# Requirements: Tuireel

**Defined:** 2026-07-16
**Core Value:** TUI tool authors can produce polished demo videos from a declarative script, without manual screen recording, editing, or post-production.

## v1.1 Requirements

Requirements for the Branding, Docs & Hardening milestone. Each maps to roadmap phases.

### Branding

- [ ] **BRND-01**: Project has a primary SVG logo that works at favicon size (16px) and in both dark/light modes
- [ ] **BRND-02**: Project has a color palette (primary, accent, dark bg, light bg) used consistently across README, docs, and social assets
- [ ] **BRND-03**: Project has a banner image (PNG 1280x640) for README hero section
- [ ] **BRND-04**: Project has an OG/social card image (PNG 1200x630) for link previews
- [ ] **BRND-05**: Project has a favicon derived from the logo for the docs site

### Repository Polish

- [ ] **REPO-01**: README.md exists with logo, one-line description, badges (npm version, CI, license), install instructions, quickstart example, and docs link
- [ ] **REPO-02**: LICENSE file contains Apache 2.0 full text and both package.json files have `license: "Apache-2.0"`
- [ ] **REPO-03**: CONTRIBUTING.md exists with dev setup, testing instructions, and PR process
- [ ] **REPO-04**: GitHub issue templates exist (bug report, feature request)
- [ ] **REPO-05**: GitHub PR template exists

### Documentation

- [ ] **DOCS-01**: Mintlify docs site is initialized with `docs.json` config, branding (logo, colors, favicon), and navigation structure
- [ ] **DOCS-02**: Introduction/landing page exists explaining what Tuireel is and why it exists
- [ ] **DOCS-03**: Quickstart page exists showing install + first recording in under 5 minutes
- [ ] **DOCS-04**: Configuration reference page covers the full config schema with examples for each field
- [ ] **DOCS-05**: Steps reference page documents all step types (launch, type, press, wait, pause, scroll, click, set-env) with examples
- [ ] **DOCS-06**: CLI reference page documents all commands (init, record, preview, composite, validate) with flags and examples
- [ ] **DOCS-07**: Themes page documents built-in themes and custom theme configuration
- [ ] **DOCS-08**: Presets page documents all built-in presets with visual examples
- [ ] **DOCS-09**: Multi-video and includes page documents multi-video configs and shared step includes
- [ ] **DOCS-10**: Sound page documents sound effects configuration and custom audio tracks

### Presets

- [ ] **PRST-01**: Config schema supports an optional `preset` field that references a named preset
- [ ] **PRST-02**: Preset values are applied as defaults that user config overrides
- [ ] **PRST-03**: Built-in presets exist: `polished` (catppuccin + sound + cursor + HUD), `minimal` (tokyo-night + cursor only), `demo` (dracula + sound + cursor + HUD), `silent` (no overlays, no sound)
- [ ] **PRST-04**: `tuireel init` offers preset selection during project scaffolding

### Reliability

- [ ] **RELY-01**: Ctrl+C during recording gracefully terminates child processes (ffmpeg, tuistory) and cleans up temp files
- [ ] **RELY-02**: Ctrl+C during compositing gracefully terminates and cleans up partial output
- [ ] **RELY-03**: Configurable timeout guards exist for tuistory wait steps (prevents infinite hangs)
- [ ] **RELY-04**: ffmpeg spawn failures produce actionable error messages with context (command, stderr, exit code)
- [ ] **RELY-05**: tuistory failures produce actionable error messages with context
- [ ] **RELY-06**: Long-running recordings (1000+ frames) complete without memory leaks or process zombies

### Diagnostics

- [ ] **DIAG-01**: CLI supports `--verbose` flag that outputs detailed pipeline progress (step execution, frame counts, encoding stats)
- [ ] **DIAG-02**: CLI supports `--debug` flag that outputs full ffmpeg stderr, tuistory events, and internal timing
- [ ] **DIAG-03**: All error messages include actionable guidance (what went wrong, what to try)

### CI Pipeline

- [ ] **CI-01**: GitHub Actions workflow runs lint, type-check, build, and unit tests on every PR and push to main
- [ ] **CI-02**: ESLint + Prettier are configured with rules matching the existing codebase style
- [ ] **CI-03**: Turbo pipeline includes a `lint` task
- [ ] **CI-04**: GitHub Actions workflow runs video smoke tests (record → assert output exists with correct codec/resolution/duration) for MP4, WebM, and GIF
- [ ] **CI-05**: Video test artifacts (produced videos) are uploaded as GitHub Actions artifacts on failure

### Release Automation

- [ ] **REL-01**: Changesets is configured with fixed versioning group for `@tuireel/core` and `tuireel`
- [ ] **REL-02**: GitHub Action creates "Version Packages" PR when changesets are merged to main
- [ ] **REL-03**: Merging the version PR auto-publishes both packages to npm and creates a GitHub release
- [ ] **REL-04**: `npx tuireel` and `bunx tuireel` work after first publish
- [ ] **REL-05**: Both package.json files have `publishConfig.access: "public"` and correct `files` field

### Performance

- [ ] **PERF-01**: Benchmark script exists that records a standard fixture and reports timing (total, per-frame, compositing)
- [ ] **PERF-02**: Compositing throughput for 500+ frame recordings is profiled and bottlenecks are identified
- [ ] **PERF-03**: At least one measurable optimization is applied to the compositing pipeline (e.g., skip unchanged overlay frames, batch Sharp operations)

## Future Requirements

Deferred to v1.1.x patches or v1.2+.

### Extended Documentation

- **DOCS-11**: End-to-end guide: config to published GIF walkthrough
- **DOCS-12**: Guide: embedding tuireel output in GitHub README
- **DOCS-13**: Guide: running tuireel in CI to auto-generate demos
- **DOCS-14**: Changelog page in docs linked from changesets output

### Extended CI

- **CI-06**: Visual regression tests using perceptual hash comparison of key frames
- **CI-07**: macOS CI runner for cross-platform verification

### Extended Features

- **PRST-05**: User-defined custom presets (preset file format, discovery, validation)
- **DOCS-15**: TypeDoc-style API reference for @tuireel/core programmatic API
- **DOCS-16**: Mintlify versioned docs for breaking changes

## Out of Scope

| Feature | Reason |
|---------|--------|
| Interactive config builder (web UI) | JSON Schema + IDE autocompletion already covers this. Huge maintenance burden. |
| Mintlify API playground | @tuireel/core is not a REST API; playground is for HTTP APIs |
| Docker-based CI for video testing | Overkill; ffmpeg is deterministic enough with version pinning |
| Automatic changelog from conventional commits | Changesets provides better user-facing changelogs for monorepos |
| Pixel-perfect video comparison in CI | Too brittle across ffmpeg versions; use metadata comparison instead |
| Custom preset authoring | Premature; validate built-in preset UX first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRND-01 | — | Pending |
| BRND-02 | — | Pending |
| BRND-03 | — | Pending |
| BRND-04 | — | Pending |
| BRND-05 | — | Pending |
| REPO-01 | — | Pending |
| REPO-02 | — | Pending |
| REPO-03 | — | Pending |
| REPO-04 | — | Pending |
| REPO-05 | — | Pending |
| DOCS-01 | — | Pending |
| DOCS-02 | — | Pending |
| DOCS-03 | — | Pending |
| DOCS-04 | — | Pending |
| DOCS-05 | — | Pending |
| DOCS-06 | — | Pending |
| DOCS-07 | — | Pending |
| DOCS-08 | — | Pending |
| DOCS-09 | — | Pending |
| DOCS-10 | — | Pending |
| PRST-01 | — | Pending |
| PRST-02 | — | Pending |
| PRST-03 | — | Pending |
| PRST-04 | — | Pending |
| RELY-01 | — | Pending |
| RELY-02 | — | Pending |
| RELY-03 | — | Pending |
| RELY-04 | — | Pending |
| RELY-05 | — | Pending |
| RELY-06 | — | Pending |
| DIAG-01 | — | Pending |
| DIAG-02 | — | Pending |
| DIAG-03 | — | Pending |
| CI-01 | — | Pending |
| CI-02 | — | Pending |
| CI-03 | — | Pending |
| CI-04 | — | Pending |
| CI-05 | — | Pending |
| REL-01 | — | Pending |
| REL-02 | — | Pending |
| REL-03 | — | Pending |
| REL-04 | — | Pending |
| REL-05 | — | Pending |
| PERF-01 | — | Pending |
| PERF-02 | — | Pending |
| PERF-03 | — | Pending |

**Coverage:**
- v1.1 requirements: 43 total
- Mapped to phases: 0
- Unmapped: 43

---
*Requirements defined: 2026-07-16*
*Last updated: 2026-07-16 after initial definition*
