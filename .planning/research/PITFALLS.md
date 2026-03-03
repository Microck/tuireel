# Pitfalls Research: Tuireel v1.1 — Branding, Docs & Hardening

**Domain:** Adding CI, release automation, Mintlify docs, branding, and reliability hardening to a working CLI tool monorepo (pnpm + turbo, TypeScript, Sharp + ffmpeg)
**Researched:** 2026-07-16
**Confidence:** HIGH (based on documented community failures, pnpm/changesets issue trackers, Mintlify migration reports, and Sharp/ffmpeg CI post-mortems)

> **Note:** v1.0 pitfalls (frame timing, ffmpeg pipeline, GIF quality, tuistory stability, etc.) are preserved below this section. This document covers pitfalls specific to the v1.1 milestone scope.

---

## Critical Pitfalls

### P13: `workspace:*` Not Resolved on npm Publish

**What goes wrong:**
Publishing `tuireel` (CLI package) to npm while it depends on `@tuireel/core` via `workspace:*` results in a broken package. npm receives the literal string `"workspace:*"` as the version range, which is invalid. Users who `npm install tuireel` get unresolvable dependency errors.

**Why it happens:**
`pnpm publish` alone does rewrite `workspace:` protocols to real semver — but only when run through pnpm's own publish pipeline. If CI uses `npm publish`, `npx changeset publish`, or a custom script that doesn't go through pnpm's workspace resolution, the rewrite doesn't happen. Changesets' `changeset publish` calls `npm publish` by default, not `pnpm publish`.

**How to avoid:**
- Use `pnpm changeset publish` (not `changeset publish` or `npm publish`) in CI — this routes through pnpm's workspace protocol rewriter.
- In `.changeset/config.json`, do NOT set a custom `publish` command that bypasses pnpm.
- Verify after first publish: `npm view tuireel dependencies` should show `@tuireel/core: "^0.1.0"` (real range), not `workspace:*`.
- Add a CI smoke test that runs `pnpm pack` on the CLI package and inspects the generated `package.json` inside the tarball for any remaining `workspace:` references.

**Warning signs:**
- `npm install tuireel` fails with "Could not resolve dependency" errors mentioning `workspace:`.
- `pnpm pack` output still contains `workspace:*` in dependencies.

**Phase to address:** Release Automation phase (before first npm publish)

---

### P14: Sharp Native Module Fails in CI

**What goes wrong:**
Sharp uses prebuilt native binaries (libvips). GitHub Actions `ubuntu-latest` runner periodically upgrades its base image (22.04 → 24.04), which changes glibc version. Sharp prebuilds compiled against older glibc stop working. The CI job fails during `pnpm install` or at runtime with `Error: Could not load the "sharp" module`.

**Why it happens:**
Sharp downloads platform-specific prebuilds during `npm install`. When there's a mismatch between the prebuild's expected glibc and the runner's glibc, the binary silently fails to load. This is intermittent — it works until GitHub upgrades the runner image or you bump Sharp version.

**How to avoid:**
- Pin the runner to a specific Ubuntu version: `runs-on: ubuntu-22.04` instead of `ubuntu-latest`.
- Pin Sharp version exactly (no `^`): `"sharp": "0.34.5"` — avoid floating ranges that could pull a version without prebuilds for your runner.
- Install build fallback deps in CI: `sudo apt-get install -y build-essential python3 pkg-config` so if the prebuild fails, it can compile from source.
- Test the CI workflow on a clean runner periodically (not just cache hits).

**Warning signs:**
- CI passes for weeks, then suddenly breaks with no code changes.
- `Error: something went wrong installing the "sharp" module` in CI logs.
- Works locally on macOS but fails on Linux CI.

**Phase to address:** CI Pipeline phase (first workflow setup)

---

### P15: ffmpeg Not Available or Wrong Version in CI

**What goes wrong:**
Tuireel auto-downloads ffmpeg to `~/.tuireel/` for local use. In CI, this download may fail (network restrictions, rate limits on static build hosts), be slow (adding 30+ seconds), or produce a different ffmpeg version than local development — causing subtle output differences in video encoding.

**Why it happens:**
The auto-download mechanism targets end-user convenience, not CI reliability. Static ffmpeg build hosts (johnvansickle, GitHub releases) have rate limits. CI runners start clean each time, so there's no cache. The downloaded version may differ from what developers use locally.

**How to avoid:**
- In CI, install ffmpeg via `apt-get` (fast, reliable, cached by runner images): `sudo apt-get install -y ffmpeg`.
- Set `TUIREEL_FFMPEG_PATH` env var in CI to point at the system ffmpeg, bypassing auto-download entirely.
- Alternatively, use `FedericoCarboni/setup-ffmpeg@v3` action for pinned versions.
- Pin the ffmpeg version used in CI and document it. If tests compare output byte-for-byte, version differences will cause false failures.
- Do NOT rely on auto-download in CI — it's a user convenience feature, not a CI feature.

**Warning signs:**
- CI jobs intermittently timing out during ffmpeg download.
- Video output tests passing locally but failing in CI with slightly different encoded output.
- `ffmpeg: command not found` after auto-download silently fails.

**Phase to address:** CI Pipeline phase (first workflow setup)

---

### P16: Video Output Tests Are Non-Deterministic

**What goes wrong:**
Tests that compare video file output (MP4/WebM/GIF) byte-for-byte fail intermittently because video encoding is inherently non-deterministic. Different ffmpeg versions, CPU instruction sets, threading behavior, and even timestamp metadata produce different binary output for identical input frames.

**Why it happens:**
ffmpeg embeds timestamps, uses thread-dependent encoding order, and different builds enable different SIMD optimizations. A test that passes on your M2 Mac fails on the CI's x86 runner — not because the output is wrong, but because it's encoded differently.

**How to avoid:**
- Never compare video files byte-for-byte. Instead, verify structural properties:
  - File exists and has non-zero size.
  - `ffprobe` reports expected duration (±0.5s tolerance), resolution, codec, and frame count.
  - For GIF: verify frame count and palette presence.
- For visual regression, compare individual decoded frames (extract frame N with ffmpeg, compare with Sharp/pixelmatch) rather than encoded files.
- Keep test fixtures tiny: 1-2 second recordings at low resolution. Long recordings amplify non-determinism.
- Separate "does the pipeline run without errors" tests (fast, reliable) from "does the output look right" tests (slower, can be CI-optional).

**Warning signs:**
- Tests pass locally, fail in CI (or vice versa).
- Tests are flaky — pass on retry without code changes.
- CI takes 10+ minutes because tests re-encode full videos.

**Phase to address:** CI Pipeline phase (test design before writing tests)

---

### P17: Changesets Versions Root Package Instead of Workspace Packages

**What goes wrong:**
Running `pnpm changeset version` bumps the root `package.json` version (which is `private: true`) instead of the actual publishable packages. Or it only publishes one of the two packages. The "Version Packages" PR created by the Changesets GitHub Action contains no meaningful changes.

**Why it happens:**
Changesets discovers publishable packages by scanning workspace entries for packages with both a `name` and `version` field that aren't `private: true`. If `pnpm-workspace.yaml` doesn't match the actual package locations, or if packages have `"license": "UNLICENSED"` without proper `version` fields, Changesets silently skips them.

**How to avoid:**
- Ensure both `@tuireel/core` and `tuireel` (CLI) have `name`, `version`, and are NOT `private: true`.
- Change `"license": "UNLICENSED"` to `"license": "Apache-2.0"` before setting up Changesets (UNLICENSED can cause npm publish warnings/rejections).
- In `.changeset/config.json`, set `"access": "public"` for scoped packages (npm defaults scoped packages to restricted).
- After first `pnpm changeset` + `pnpm changeset version`, verify BOTH packages got bumped in the resulting changeset PR.
- Add `"ignore": []` explicitly in changeset config — make sure no packages are accidentally excluded.

**Warning signs:**
- `pnpm changeset version` completes instantly with no file changes.
- Only `@tuireel/core` gets a version bump but `tuireel` CLI stays at old version (or vice versa).
- npm shows only one of the two packages published.

**Phase to address:** Release Automation phase

---

### P18: Mintlify Uses `docs.json` Now, Not `mint.json`

**What goes wrong:**
Setting up Mintlify with the old `mint.json` format causes build failures. The `mintlify dev` command produces cryptic schema validation errors like `Invalid type. Expected field to be of type 'array', received 'object'` on the navigation field.

**Why it happens:**
Mintlify migrated from `mint.json` to `docs.json` in 2025. The navigation structure changed fundamentally — from top-level `tabs`/`anchors` arrays + separate `navigation` objects to a single recursive `navigation` array. Most blog posts, tutorials, and even some official examples still reference the old format.

**How to avoid:**
- Use `docs.json` from the start, not `mint.json`. Do not follow older tutorials.
- Install the latest Mintlify CLI: `npm i -g mintlify@latest` or use `npx mintlify@latest dev`.
- Follow the official `docs.json` schema at mintlify.com/docs/settings — not cached/older docs.
- Key structural differences to know:
  - Navigation is a flat array of tab/group objects (not nested under separate top-level keys).
  - Page references do NOT include `.mdx` or `.md` extensions.
  - Tabs and anchors are defined inside the `navigation` array, not as separate top-level fields.
- Run `mintlify dev` locally before committing — catches schema errors immediately.

**Warning signs:**
- `mintlify dev` fails with "Invalid docs.json" schema errors.
- Navigation sidebar shows but tabs/sections are empty or duplicated.
- Pages render locally but fail on Mintlify's hosted deployment.

**Phase to address:** Documentation phase (very first task)

---

## Moderate Pitfalls

### P19: README That Explains What But Not Why

**What goes wrong:**
The README documents installation, config format, and CLI flags — but doesn't answer the question "why would I use this instead of VHS/asciinema/terminalizer?" A developer lands on the repo, reads technical docs, but never understands the value proposition. They leave without trying it.

**Why it happens:**
Tool authors know their tool's value intuitively and jump straight to "how to use it." They forget that potential users need to be sold on the concept first. The README becomes a reference manual instead of a landing page.

**How to avoid:**
- First 3 lines: what it is + a compelling GIF/video showing the output.
- Before any installation instructions: a "Why Tuireel?" section comparing to alternatives (VHS = great but no overlays/compositing; asciinema = live recording not scripted; terminalizer = unmaintained).
- Show a minimal config → output GIF pair (5 lines of JSONC → polished video).
- Keep the README under 300 lines — link to Mintlify docs for everything else.
- Structure: Hero → Why → Quick Start → Features (brief) → Links to Docs.

**Warning signs:**
- GitHub stars but low npm downloads (people see it, don't try it).
- Issues asking "what does this do differently than X?"
- README is >500 lines of reference docs.

**Phase to address:** Branding & README phase

---

### P20: Branding Inconsistency Across Touchpoints

**What goes wrong:**
The logo uses one color palette, the README banner uses different colors, the docs site has its own theme, and the npm package description doesn't match the GitHub repo description. The project looks amateur and uncoordinated.

**Why it happens:**
Branding is done piecemeal: logo designed first, README written later, docs site configured separately. No single source of truth for colors, fonts, tone, or visual identity. Each asset is created in isolation.

**How to avoid:**
- Create a brand guide document FIRST (before any visual assets): primary color, secondary color, font, logo usage rules, tone of voice.
- Derive all assets from the brand guide: logo → banner → docs theme → social images.
- Sync descriptions across all surfaces:
  - `package.json` description fields (both packages)
  - GitHub repo description
  - npm package page
  - Mintlify docs hero
  - README hero line
- Use the same color values in `docs.json` theme config as in the logo and README badges.

**Warning signs:**
- "Tuireel" spelled differently in different places (capitalization, spacing).
- Logo colors don't match docs site accent colors.
- npm package description says something different than GitHub repo description.

**Phase to address:** Branding phase (first task, before any visual work)

---

### P21: CI Runs PTY-Dependent Tests Without a TTY

**What goes wrong:**
Tuireel's core tests exercise tuistory, which spawns real PTY sessions. GitHub Actions runners don't allocate a TTY by default. PTY-dependent code may behave differently or fail when `process.stdout.isTTY` is `undefined`, shell initialization skips `.bashrc`/`.zshrc`, or terminal capabilities are missing.

**Why it happens:**
CI environments are headless. There's no terminal emulator, no TERM variable (or it's set to `dumb`), and no interactive shell. tuistory creates its own PTY, but the parent environment affects PTY initialization, signal handling, and shell behavior.

**How to avoid:**
- Set `TERM=xterm-256color` explicitly in CI environment.
- Use `script -qec "command" /dev/null` wrapper if tests need a TTY allocation (Linux trick for forcing TTY).
- Separate tests into tiers:
  - **Unit tests** (no PTY needed): schema validation, config parsing, ffprobe output parsing. Run always.
  - **Integration tests** (PTY needed): actual recording pipeline. Run with explicit TTY setup.
  - **Output verification** (ffprobe checks): verify pre-generated fixtures. Run always.
- Test the PTY tier on both `ubuntu-22.04` and `macos-latest` in a matrix.

**Warning signs:**
- Tests pass locally but tuistory tests hang or produce empty output in CI.
- `Error: Could not open pseudo-terminal` in CI logs.
- Shell prompt detection fails because `.bashrc` didn't load.

**Phase to address:** CI Pipeline phase (test tier design)

---

### P22: Over-Engineering Reliability — Testing Encode Quality Instead of Pipeline Integrity

**What goes wrong:**
The reliability hardening phase produces an elaborate test suite that validates pixel-level video quality, color accuracy, and encoding bitrate — but misses basic pipeline failures like "recording hangs after 60 seconds," "watch mode leaks child processes," or "composite fails silently when InteractionTimeline is missing."

**Why it happens:**
Developers focus on the technically interesting testing problems (video quality verification) rather than the boring-but-critical ones (does the pipeline not crash for the top 5 use cases). "Reliability hardening" gets interpreted as "make the output perfect" instead of "make sure it doesn't break."

**How to avoid:**
- Define reliability as "pipeline completes without errors for all supported configurations" — not "output is pixel-perfect."
- Priority order for reliability tests:
  1. Happy path: record → composite → output file exists, is valid video, has expected duration.
  2. Error paths: missing ffmpeg, invalid config, tuistory crash mid-recording, disk full.
  3. Resource paths: long recordings (>60s) don't OOM, watch mode doesn't leak processes.
  4. Quality paths (lowest priority): output visual quality, color accuracy.
- Budget time: 70% on tiers 1-3, 30% on tier 4.

**Warning signs:**
- Test suite takes 15+ minutes but doesn't test error recovery.
- All tests pass but users report "it just hangs" for basic operations.
- No tests for cleanup/teardown (leaked ffmpeg processes, orphaned PTYs).

**Phase to address:** Reliability Hardening phase

---

### P23: Mintlify Navigation Doesn't Match Content Structure

**What goes wrong:**
The `docs.json` navigation tree is organized by implementation structure (API Reference → Core → CLI) rather than user journey (Getting Started → Writing Scripts → Recording → Customizing Output). Users can't find what they need because the docs mirror the codebase, not the workflow.

**Why it happens:**
The person writing docs is the same person who wrote the code. They naturally organize docs by how the code is structured, not by how users approach the tool. Implementation structure makes perfect sense to the author but is opaque to newcomers.

**How to avoid:**
- Organize docs by user journey:
  1. **Getting Started**: install, first recording, see output.
  2. **Writing Scripts**: config format, step types, step includes.
  3. **Customizing**: themes, overlays, sound, presets.
  4. **CLI Reference**: command-by-command docs (generated or manual).
  5. **Advanced**: multi-video configs, watch mode, performance tuning.
- API reference is a separate tab, not the main navigation.
- Each page answers one question ("How do I add a cursor overlay?") rather than documenting one module.

**Warning signs:**
- Users ask basic "how do I do X" questions despite X being documented (but buried under an implementation-oriented heading).
- Getting Started section jumps into config schema details before showing a working example.

**Phase to address:** Documentation phase (information architecture before content)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip Changesets, version manually | Faster first release | Version drift between packages, forgotten changelogs, no automation foundation | Never — setup cost is <1 hour |
| Use `ubuntu-latest` in CI | Less config | Sharp/ffmpeg breaks on runner image upgrades with no code changes | Never for integration tests; OK for lint-only jobs |
| Byte-for-byte video comparison tests | Catches any output change | Constant false failures across platforms/ffmpeg versions | Never — use ffprobe structural checks |
| README as sole documentation | One file to maintain | README bloats past 500 lines, can't organize by topic, no search | Only for first 2 weeks before Mintlify is live |
| Single CI job for everything | Simple workflow file | 15+ minute jobs, can't get fast feedback on lint/types | Only during initial CI setup, split within first week |
| Hardcode ffmpeg version in tests | Deterministic locally | Breaks when CI installs different version | Never — test structural properties, not encoded bytes |
| Publish from local machine | Works right now | No audit trail, no CI gate, risk of publishing uncommitted changes | First 1-2 releases only, then move to CI |

## Integration Gotchas

Common mistakes when connecting to external services and tools.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Changesets + pnpm | Running `changeset publish` (uses npm) instead of `pnpm changeset publish` (uses pnpm) | Always prefix with `pnpm` — ensures workspace protocol rewriting |
| Changesets + GitHub Actions | Not setting `GITHUB_TOKEN` and `NPM_TOKEN` secrets | Both are required: GITHUB_TOKEN for PR creation, NPM_TOKEN for publish |
| Changesets + scoped packages | Forgetting `"access": "public"` in config | npm defaults scoped packages to restricted; first publish silently fails |
| Mintlify + monorepo | Putting `docs/` at package level instead of repo root | Mintlify expects docs at the repo root level; deploy hook targets repo root |
| Mintlify + MDX | Using `.md` files instead of `.mdx` | Custom Mintlify components (callouts, cards, tabs) only work in `.mdx` |
| Mintlify + page paths | Including `.mdx` extension in navigation paths | Navigation paths are extensionless: `getting-started/install`, not `getting-started/install.mdx` |
| GitHub Actions + pnpm | Forgetting `pnpm/action-setup` before `actions/setup-node` with pnpm cache | Node setup with `cache: 'pnpm'` fails if pnpm isn't installed yet |
| GitHub Actions + turbo | Not caching `.turbo` directory | Turbo's remote cache is the ideal solution, but local `.turbo` cache in CI also helps |
| npm + `files` field | Not including all required files in `"files"` array | `pnpm pack --dry-run` before publish to verify tarball contents include dist, types, bin |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full pipeline integration tests in CI | CI takes 10+ minutes per run | Tier tests: unit (fast) + integration (matrix, slower, parallelized) | >5 integration test fixtures |
| Re-encoding video in every test run | Each test takes 5-10s for encode | Pre-generate fixture videos, verify with ffprobe only | >10 test cases with video output |
| Mintlify docs with 50+ pages | Local preview takes 30s+ to rebuild | Use Mintlify's incremental rebuild; keep pages focused and small | >30 documentation pages |
| Single turbo pipeline for build+test+lint | Everything runs serially | Configure turbo task dependencies so lint/types/test can run in parallel | When build exceeds 30s |
| Watch mode spawning new ffmpeg per file change | CPU spike, leaked processes | Debounce file changes, kill previous encode before starting new one | When editing configs rapidly in dev |

## Security Mistakes

Domain-specific security issues for a CLI tool publishing to npm.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committing NPM_TOKEN to workflow file | Token exposed in repo history; anyone can publish as you | Use GitHub repository secrets; never inline tokens |
| Publishing without `--provenance` flag | Users can't verify package origin | Use `pnpm publish --provenance` in CI (requires OIDC permissions in Actions) |
| Including `.env` or local config in `files` | Sensitive paths leaked in npm tarball | Verify with `pnpm pack --dry-run`; keep `"files": ["dist"]` tight |
| Auto-downloading ffmpeg over HTTP | MITM attack could replace binary | Always use HTTPS; verify SHA256 checksum after download |
| Not setting `engines` field | Users on unsupported Node versions get cryptic failures | Both packages already have `"engines": { "node": ">=18" }` — good, keep it |

## UX Pitfalls

Common user experience mistakes for CLI dev tools.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Error messages showing stack traces by default | Users think the tool is broken/unstable | Show human-readable error + suggestion; stack trace behind `--verbose` flag |
| No example configs in repo | Users have to read full docs to write first config | Ship 2-3 example configs in `examples/` dir; reference from README |
| Docs assume user knows ffmpeg | Non-video-savvy developers can't troubleshoot encoding issues | Explain Tuireel-specific concepts; hide ffmpeg details behind presets |
| First-run experience requires config file | High friction to try the tool | `tuireel init` already exists — make sure `npx tuireel init` is the first README instruction |
| Preset names that are implementation-details | Users confused by "two-pass-h264-crf23" | User-facing preset names: "polished", "readme-gif", "quick-preview" |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **License:** File exists but `package.json` still says `UNLICENSED` — verify both packages updated to `Apache-2.0`
- [ ] **README hero GIF:** GIF exists but was recorded with an old version — re-record with latest after all changes
- [ ] **npm publish:** Package published but `bin` field doesn't work — verify `npx tuireel --help` works from a clean install
- [ ] **Changesets config:** Config exists but `linked` field doesn't include both packages — test a changeset that bumps core to verify CLI gets bumped too
- [ ] **CI pipeline:** Workflow runs green but only tests lint/types — verify integration tests with actual video output exist
- [ ] **Mintlify deployment:** Local preview works but hosted deployment fails — verify GitHub App is connected and deploy webhook fires
- [ ] **Docs navigation:** All pages listed but Getting Started is 3rd tab — verify it's the first thing users see
- [ ] **Badges in README:** Badge URLs are correct but point to wrong package name or unpublished package — verify after first publish
- [ ] **Release automation:** Changesets PR merges but publish step is skipped — verify NPM_TOKEN secret is set and Actions has write permissions
- [ ] **Presets:** Preset configs exist but reference overlay files not included in npm tarball — verify `pnpm pack` includes all preset assets

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| P13: workspace:* published to npm | MEDIUM | `npm unpublish tuireel@X.Y.Z` (within 72h), fix publish pipeline, re-publish |
| P14: Sharp CI failure | LOW | Pin runner version, add build-essential fallback, re-run CI |
| P15: ffmpeg CI failure | LOW | Add apt-get install step, set TUIREEL_FFMPEG_PATH, re-run |
| P16: Flaky video tests | MEDIUM | Rewrite tests to use ffprobe checks instead of byte comparison |
| P17: Wrong packages versioned | LOW | Delete changeset PR, fix config, re-run `pnpm changeset version` |
| P18: Wrong Mintlify format | LOW | Run `mintlify upgrade`, rename to docs.json, fix navigation array |
| P19: Bad README | LOW | Restructure with hero-why-quickstart template, re-record GIF |
| P20: Inconsistent branding | MEDIUM | Create brand guide retroactively, audit all touchpoints, fix one-by-one |
| P21: PTY tests fail in CI | MEDIUM | Add TERM env var, split test tiers, add script wrapper for TTY |
| P22: Over-engineered tests | HIGH | Triage test suite, delete quality tests, add missing pipeline integrity tests |
| P23: Bad doc structure | MEDIUM | Re-organize navigation around user journey, rewrite Getting Started |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P13: workspace:* on publish | Release Automation | `pnpm pack` smoke test inspects tarball for workspace: refs |
| P14: Sharp CI failure | CI Pipeline | Green CI on pinned ubuntu-22.04 with Sharp integration test |
| P15: ffmpeg CI availability | CI Pipeline | CI job installs ffmpeg via apt; TUIREEL_FFMPEG_PATH set |
| P16: Non-deterministic video tests | CI Pipeline (test design) | All video tests use ffprobe structural checks, zero byte comparison |
| P17: Changesets misconfiguration | Release Automation | Both packages versioned in test changeset PR |
| P18: Mintlify format | Documentation (first task) | `npx mintlify dev` runs without errors on docs.json |
| P19: README quality | Branding & README | README has hero GIF, "Why" section, <300 lines |
| P20: Brand inconsistency | Branding (first task) | Brand guide document exists; all surfaces audited against it |
| P21: PTY in CI | CI Pipeline | Integration tests pass on ubuntu-22.04 with TERM=xterm-256color |
| P22: Over-engineered reliability | Reliability Hardening | Test tiers documented; pipeline integrity tests exist before quality tests |
| P23: Doc navigation | Documentation | Navigation follows user journey; Getting Started is first section |

## Phase Ordering Implications

Based on these pitfalls, the recommended phase sequence is:

1. **Branding** (first) — Brand guide must exist before README, docs, or any visual assets. P20 prevention.
2. **README & Repository Polish** — Depends on branding. LICENSE change unblocks Changesets. P17, P19 prevention.
3. **CI Pipeline** — Must be designed before reliability hardening. Test tier architecture prevents P14, P15, P16, P21.
4. **Reliability Hardening** — Builds on CI. Focuses on pipeline integrity first, quality second. P22 prevention.
5. **Documentation (Mintlify)** — Depends on branding (for theme). Start with docs.json + info architecture. P18, P23 prevention.
6. **Release Automation** — Last phase. Depends on CI being green, both packages having correct metadata. P13, P17 prevention.

Key dependency: LICENSE must change from UNLICENSED to Apache-2.0 before Changesets setup (Phase 2 enables Phase 6).

## Sources

- [pnpm.io: Using Changesets](https://pnpm.io/using-changesets) — official pnpm + changesets integration guide
- [changesets/changesets#1804](https://github.com/changesets/changesets/issues/1804) — "Only one package released" in pnpm workspace
- [changesets/changesets#1335](https://github.com/changesets/changesets/issues/1335) — Changesets skipping workspace packages
- [lovell/sharp#4351](https://github.com/lovell/sharp/issues/4351) — Sharp glibc/Ubuntu runner compatibility
- [lovell/sharp#2596](https://github.com/lovell/sharp/issues/2596) — Sharp install with unsafe-perm in CI
- [codenote.net: mint.json to docs.json](https://codenote.net/en/posts/mintlify-mint-json-to-docs-json-upgrade/) — Mintlify migration gotcha
- [mintlify.com/blog: Refactoring mint.json](https://www.mintlify.com/blog/refactoring-mint-json-into-docs-json) — Official migration guide
- [FedericoCarboni/setup-ffmpeg](https://github.com/FedericoCarboni/setup-ffmpeg) — Pinned ffmpeg in GitHub Actions
- [pnpm/pnpm#9495](https://github.com/pnpm/pnpm/issues/9495) — publishConfig.directory + workspace: issues
- [pnpm/pnpm#7182](https://github.com/pnpm/pnpm/issues/7182) — Registry config not used for publish in workspace

---
*Pitfalls research for: Tuireel v1.1 — Branding, Docs & Hardening*
*Researched: 2026-07-16*
