# Phase 24: README Refresh + Link Hygiene - Research

**Researched:** 2026-03-05
**Domain:** README authoring, link hygiene, repo documentation
**Confidence:** HIGH

## Summary

Phase 24 has two distinct sub-tasks: (1) restructure the Tuireel README to match Webreel's README structure and tone, and (2) sweep all in-repo links to replace stale `tuireel.dev` references with `https://tuireel.micr.dev`.

The Webreel README (at `github.com/vercel-labs/webreel`) provides the canonical reference for structure and tone. It is a developer-tool README that leads with a one-liner description, a docs/examples link pair, a concise "how it works" paragraph, a Quick Start code block, embedded example videos, full CLI reference (init/record/preview/composite/validate), an actions table, config options tables, development setup, packages table, and a one-line license footer. The tone is terse, scan-friendly, and example-heavy.

The current Tuireel README (84 lines) has the right bones but differs from Webreel in several ways: it lacks a one-liner + links opener, has a "Brand system" link that is internal/developer-facing, uses an abbreviated features list instead of showing real CLI usage, and links to the wrong docs domain (`tuireel.dev` instead of `tuireel.micr.dev`). The link sweep is straightforward: only one stale link exists in source files that matter (README line 76), and docs `.mdx` files contain no external URLs pointing to stale domains.

**Primary recommendation:** Rewrite the README to follow Webreel's section order (description + links, quick start, CLI reference, config overview, development, license) while keeping all Tuireel-specific commands/flags/claims accurate. Fix the single stale link. Verify with `grep -r` that no stale domains remain.

## Standard Stack

This phase involves no libraries or dependencies. It is purely a documentation/content task.

### Core
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `grep -r` / `rg` | Repo-wide link sweep | Catches stale URLs in all file types |
| Manual README editing | Content restructuring | No tooling needed for markdown rewrite |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual grep sweep | `markdown-link-check` npm package | Overkill for a one-time sweep of ~10 files; grep is sufficient |


## Architecture Patterns

### Webreel README Structure (Target)

The Webreel README at `github.com/vercel-labs/webreel` follows this exact section order:

```
1. H1 title (package name)
2. One-line description
3. [Documentation](url) | [Examples](url)   ← inline links, not a section
4. Short "how it works" paragraph (2-3 sentences)
5. "Chrome and ffmpeg are downloaded automatically..." (dependency note)
6. ## Quick Start               ← 3-line code block (install, init, record)
7. ## Examples                  ← embedded <video> tags with descriptions
8. ## Usage                     ← full CLI reference per subcommand
   ### Init                     ← command + flags + example code block
   ### Record
   ### Preview
   ### Composite
   ### Install
   ### Validate
   ### Help and Version
   ### Actions                  ← table of all step/action types
   ### Config options
   #### Top-level               ← table
   #### Per-video               ← table
9. ## Development
   ### Prerequisites            ← bullet list
   ### Setup                    ← code block
10. ## Packages                 ← table of monorepo packages
11. ## License                  ← one line
```

**Key structural observations:**
- No badges in Webreel's README (Tuireel currently has 3 badges — keep or drop is a design choice)
- No logo/banner image in Webreel (Tuireel has a `<picture>` logo block + banner — likely keep since Tuireel has invested in branding)
- Webreel has embedded `<video>` example tags — Tuireel may not have example videos yet
- The docs link is a simple inline `[Documentation](url) | [Examples](url)` line, not a `## Documentation` section
- CLI reference is comprehensive and inline in the README (not just "see docs")
- Config tables are inline in README, not deferred to docs

### Tuireel-Adapted Target Structure

Adapting Webreel's pattern to Tuireel's context (has logo/badges, no example videos, terminal-based not browser-based):

```
1. <picture> logo (keep — already polished from Phase 20)
2. Banner image (keep)
3. Tagline: "Scripted TUI demo recorder..."
4. Badges (npm, CI, license — keep)
5. ---
6. One-line description + [Documentation](https://tuireel.micr.dev) | [GitHub](repo-url)
7. Short "how it works" paragraph
8. ## Quick Start               ← install + init + record (match Webreel's 3-line style)
9. ## Usage                     ← CLI commands: init, validate, record, preview, composite
   ### init
   ### validate
   ### record
   ### preview
   ### composite
   ### Actions (step types table)
   ### Config overview (top-level fields table)
10. ## Development
    ### Prerequisites
    ### Setup
11. ## Packages                 ← monorepo package table
12. ## License                  ← one line
```

**What to remove from current README:**
- `Brand system: assets/branding/brand-system.md` link (line 10) — this is an internal developer reference, not user-facing. Webreel has no equivalent. Remove it.
- `## Features` section — replace with inline CLI reference (Webreel pattern). Feature claims get woven into the description paragraph and usage sections instead of a bullet list.
- `## Documentation` as a heading — replace with an inline link in the opener (Webreel pattern)
- `## Contributing` section — can remain as a short line or be replaced with a link to CONTRIBUTING.md (Webreel has `## Development` instead)

**What to add:**
- Inline CLI reference with flags and examples (mirror Webreel's `## Usage` section)
- Step types / actions table
- Config overview table (top-level fields)
- `## Development` section with prerequisites and setup
- `## Packages` table (monorepo: `@tuireel/core` and `tuireel` CLI)

### Anti-Patterns to Avoid
- **Feature-list-only README:** Listing features without showing how to use them. Webreel shows CLI usage inline; Tuireel should too.
- **Docs-only redirect:** Saying "see docs for everything" loses users who want a quick answer from the README. The README should be self-contained for basic usage.
- **Stale claims:** The README JSONC example on line 55-63 uses `"type": "type", "value": "echo 'Hello, world!'"` — but the actual step schema uses `"text"` not `"value"`. This needs to be verified against the current schema.


## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Link validation | Custom URL checker script | `grep -rn 'tuireel\.dev' --include='*.md' --include='*.mdx' --include='*.json'` | One-time sweep; a full link checker is overkill |
| README structure | Custom templating system | Manual markdown editing following Webreel as reference | It's a single file rewrite, not a repeating task |

**Key insight:** This phase is content work, not code work. No automation, no scripts, no dependencies. The planner should create tasks for content authoring and link sweeping, not tooling.

## Common Pitfalls

### Pitfall 1: Inaccurate CLI Claims in README
**What goes wrong:** README shows flags or step types that don't match the actual CLI. Users try them and get errors.
**Why it happens:** README is written from memory instead of verified against the current CLI and schema.
**How to avoid:** Cross-reference every command, flag, and step example in the README against `docs/cli-reference.mdx` and `docs/steps-reference.mdx` (the verified source of truth). Run `tuireel --help` and `tuireel record --help` to double-check.
**Warning signs:** Any `"value"` field in step examples (the correct field is `"text"`), any flags not listed in cli-reference.mdx.

### Pitfall 2: Forgetting to Update package.json homepage
**What goes wrong:** `package.json` at root has `"homepage": "https://github.com/Microck/tuireel#readme"` which is fine, but if it ever referenced `tuireel.dev` it would be stale.
**Why it happens:** `homepage` field is easy to overlook in link sweeps.
**How to avoid:** Include `package.json` files in the grep sweep pattern.
**Warning signs:** Current root `package.json` homepage points to GitHub (not stale). Sub-packages (`packages/core/package.json`, `packages/cli/package.json`) have no homepage field (verified — not stale).

### Pitfall 3: Missing the .planning/ References
**What goes wrong:** Old `tuireel.dev` references in `.planning/` files are flagged as "stale" when they're just historical records.
**Why it happens:** grep sweep catches everything including planning docs.
**How to avoid:** The link sweep should focus on **user-facing files**: README.md, CONTRIBUTING.md, docs/*.mdx, docs/docs.json, package.json files. Planning files are internal and historical — leave them as-is.
**Warning signs:** If someone "fixes" planning docs, it rewrites history and makes past phase records inaccurate.

### Pitfall 4: README JSONC Example Uses Wrong Field Names
**What goes wrong:** Current README line 57 shows `{ "type": "type", "value": "echo 'Hello, world!'" }` but the actual step schema uses `"text"` not `"value"` (verified in docs/steps-reference.mdx and docs/quickstart.mdx).
**Why it happens:** The README was written early and the field name may have changed, or it was a typo.
**How to avoid:** When rewriting the README, use examples that match the current schema exactly. Copy from docs/quickstart.mdx or docs/introduction.mdx which are already verified.
**Warning signs:** Any step object with `"value"` instead of `"text"`.

### Pitfall 5: Removing the Brand System Link Without Relocating It
**What goes wrong:** The brand-system.md link is removed from README but developers who need it can't find it.
**Why it happens:** It's treated as "just remove it" without considering who uses it.
**How to avoid:** The brand-system.md file stays in `assets/branding/` — it's discoverable by browsing the repo. It doesn't need a prominent README link. Optionally mention it in CONTRIBUTING.md or a development docs section, but it should not be in the user-facing README header.


## Code Examples

No code examples needed — this phase is content/documentation work. The key reference artifacts are:

### Current README (to be rewritten)
- Location: `README.md` (84 lines)
- Stale link: line 76 (`tuireel.dev` -> should be `tuireel.micr.dev`)
- Brand system link to remove: line 10
- JSONC example to fix: line 57 (`"value"` -> `"text"`)

### Webreel README (structural reference)
- Location: `github.com/vercel-labs/webreel` (main branch)
- Key sections to mirror: Quick Start (3 lines), Usage (full CLI inline), Actions table, Config tables, Development, Packages, License

### Verified Tuireel CLI Commands and Flags
Source: `docs/cli-reference.mdx`

| Command | Key Flags |
|---------|-----------|
| `tuireel init` | `-o, --output <path>`, `-f, --force` |
| `tuireel validate` | `[configPath]` |
| `tuireel record` | `[configPath]`, `--format <format>`, `-w, --watch`, `--verbose`, `--debug` |
| `tuireel preview` | `[config]`, `--verbose`, `--debug` |
| `tuireel composite` | `[configPath]`, `-c, --config <path>`, `--format <format>`, `--cursor-size <n>`, `--no-cursor`, `--no-hud`, `--verbose`, `--debug` |
| Global | `-V, --version`, `-h, --help` |

### Verified Step Types
Source: `docs/steps-reference.mdx`

| Step Type | Key Fields |
|-----------|------------|
| `launch` | `command` (required) |
| `type` | `text` (required), `speed` (optional) |
| `press` | `key` (required) |
| `wait` | `pattern` (required), `timeout` (optional) |
| `pause` | `duration` (required) |
| `scroll` | `direction` (required), `amount` (optional) |
| `click` | `pattern` (required) |
| `screenshot` | `output` (required) |
| `resize` | `cols`, `rows` (both required) |
| `set-env` | `key`, `value` (both required) |

## Link Audit Results

### Stale Links Found (must fix)

| File | Line | Current URL | Correct URL | Confidence |
|------|------|------------|-------------|------------|
| `README.md` | 76 | `https://tuireel.dev` | `https://tuireel.micr.dev` | HIGH |

### Links Verified Clean (no action needed)

| Location | What was checked | Result |
|----------|-----------------|--------|
| `docs/*.mdx` (9 files) | All external URLs | Only `https://ffmpeg.org` found (correct) |
| `docs/docs.json` | All `href` values | GitHub links only (correct). No `seo`/`canonical` field yet (Phase 22 will add it) |
| `CONTRIBUTING.md` | All URLs | GitHub clone URL only (correct) |
| `packages/core/package.json` | `homepage` field | Not present (clean) |
| `packages/cli/package.json` | `homepage` field | Not present (clean) |
| Root `package.json` | `homepage` field | Points to `https://github.com/Microck/tuireel#readme` (correct, not stale) |

### Historical References (do NOT modify)

| Location | Reference | Why Leave It |
|----------|-----------|-------------|
| `.planning/quick/001-github-npm-publish/001-SUMMARY.md` | `tuireel.dev` | Historical planning record |
| `.planning/quick/001-github-npm-publish/001-PLAN.md` | `tuireel.dev` | Historical planning record |
| `.planning/phases/07-branding-repo-polish/07-VERIFICATION.md` | `tuireel.dev` | Historical verification record |
| `.planning/phases/07-branding-repo-polish/07-05-PLAN.md` | `tuireel.dev` | Historical planning record |


## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Feature-list README | CLI-reference-inline README (Webreel pattern) | Webreel (2025+) | Users can use the tool from README alone without visiting docs |
| `## Documentation` section | Inline doc link in opener | Webreel pattern | Less bureaucratic, more scannable |

## Open Questions

1. **Should badges be kept?**
   - What we know: Webreel has NO badges. Tuireel currently has 3 (npm version, CI, license).
   - What's unclear: Whether the user prefers badges (common in npm ecosystem) or the cleaner Webreel look.
   - Recommendation: Keep badges — they're standard for npm packages and provide at-a-glance trust signals. Webreel is a Vercel Labs project with different trust dynamics.

2. **Should example videos be included?**
   - What we know: Webreel has embedded `<video>` tags for every example. Tuireel doesn't appear to have pre-recorded example videos committed to the repo.
   - What's unclear: Whether example videos exist or will be created.
   - Recommendation: Skip example videos for this phase. The README rewrite should include a placeholder structure (or omit the section entirely) that can be filled in later. Don't block the README refresh on video creation.

3. **How detailed should the inline CLI reference be?**
   - What we know: Webreel includes FULL CLI reference (every command, every flag, every config option) in the README. Tuireel has comprehensive docs at `docs/cli-reference.mdx`.
   - What's unclear: Whether to duplicate everything or provide a condensed version with "see docs for full reference."
   - Recommendation: Include a condensed CLI reference (commands + most important flags + examples) in the README, with a link to full docs for the complete reference. This balances self-containment with maintainability. Webreel can afford full duplication because it's a single-package tool; Tuireel's docs are already comprehensive.

4. **Phase 22 dependency — is it complete?**
   - What we know: Phase 22 (Docs Domain Move) is listed as incomplete in ROADMAP.md. The `docs/docs.json` has no `seo.canonical` field yet.
   - What's unclear: Whether Phase 22 will be complete before Phase 24 executes.
   - Recommendation: Phase 24 should update the README link to `https://tuireel.micr.dev` regardless. If the domain isn't live yet, the link is still correct (it's the target domain). The link sweep verifies no stale domains remain in user-facing files.

## Sources

### Primary (HIGH confidence)
- `README.md` — Read directly from repo (84 lines, current state fully audited)
- `docs/cli-reference.mdx` — Read directly, 213 lines, all commands and flags verified
- `docs/steps-reference.mdx` — Read directly, 248 lines, all step types verified
- `docs/docs.json` — Read directly, 66 lines, all URLs checked
- `CONTRIBUTING.md` — Read directly, 84 lines, all URLs checked
- `package.json` (root + packages/) — Read directly, homepage fields checked
- Webreel README — Fetched from `raw.githubusercontent.com/vercel-labs/webreel/main/README.md` (full content retrieved)

### Secondary (MEDIUM confidence)
- Kagi search for Webreel repo location — confirmed at `github.com/vercel-labs/webreel`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- README structure pattern: HIGH — Webreel README read in full, structural analysis is direct
- Link audit: HIGH — grep sweep across entire repo, every match inspected
- CLI accuracy: HIGH — cross-referenced against docs/cli-reference.mdx and docs/steps-reference.mdx
- Stale field detection: HIGH — found `"value"` vs `"text"` mismatch in current README JSONC example

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable — README structure and CLI interface unlikely to change rapidly)
