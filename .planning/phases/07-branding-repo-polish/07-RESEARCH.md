# Phase 7: Branding & Repo Polish - Research

**Researched:** 2026-03-03
**Domain:** Open-source project branding, repository community assets, visual identity
**Confidence:** HIGH

## Summary

Phase 7 creates Tuireel's public identity from scratch: visual branding assets (logo, color palette, banner, OG card, favicon), a comprehensive README, Apache 2.0 licensing, contributor documentation, and GitHub issue/PR templates. The project currently has NONE of these assets — both package.json files say `"UNLICENSED"`, there is no README, no `.github` directory, and no `assets/` directory at the repo root.

This phase has no code dependencies (it's the first v1.1 phase) but its outputs feed Phase 10 (docs site needs logo, colors, favicon), Phase 11 (CI badge URL in README), and Phase 12 (license must exist for npm publish). The CI workflow badge in the README will reference a workflow that doesn't exist yet (created in Phase 11) — this is acceptable; shields.io returns a "no status" badge gracefully.

**Primary recommendation:** Create branding assets manually (SVG logo + programmatic PNG generation via Sharp, which is already a project dependency), write all markdown files directly, and use the modern YAML issue template format for GitHub.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Sharp | 0.34.x | Generate banner PNG and OG PNG from SVG/compositing | Already a project dependency in @tuireel/core |
| N/A (hand-written SVG) | - | Logo SVG creation | SVGs are simple enough to hand-write for geometric logos; no tooling needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shields.io | hosted service | Badge images for README | Always — standard for npm version, license, CI status badges |
| GitHub YAML templates | built-in | Issue and PR templates | Always — modern format replacing old markdown templates |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written SVG | Figma/Illustrator export | Heavier tooling for a simple geometric logo; hand-written gives exact control and smaller file size |
| Sharp for PNG generation | Canvas/Puppeteer screenshot | Sharp is already installed; no new dependencies needed |
| YAML issue templates | Markdown issue templates | YAML gives structured form fields, dropdowns, checkboxes; markdown is freeform text only. YAML is the current GitHub standard. |

**Installation:**

No new packages needed. Sharp is already in `@tuireel/core` dependencies.

## Architecture Patterns

### Recommended Project Structure

```
tuireel/
├── assets/
│   └── branding/
│       ├── logo.svg              # Primary logo (works dark/light, scales to 16px)
│       ├── logo-dark.svg         # Logo variant for dark backgrounds (if needed)
│       ├── logo-light.svg        # Logo variant for light backgrounds (if needed)
│       ├── banner.png            # 1280x640 README hero banner
│       ├── og-image.png          # 1200x630 social card
│       └── favicon.svg           # Favicon for docs site (derived from logo)
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug-report.yml        # Bug report form template
│   │   ├── feature-request.yml   # Feature request form template
│   │   └── config.yml            # Issue template chooser config
│   └── pull_request_template.md  # PR template
├── README.md                     # Branded README with badges
├── CONTRIBUTING.md               # Contributor guide
└── LICENSE                       # Apache 2.0 full text
```

### Pattern 1: GitHub Dark/Light Mode Logo Switching

**What:** Use HTML `<picture>` element to show different logo variants based on user's color scheme preference.
**When to use:** When the logo needs different versions for dark and light GitHub themes.
**Example:**

```html
<!-- Source: GitHub docs — supported since 2022 -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/branding/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/branding/logo-light.svg">
    <img alt="Tuireel" src="assets/branding/logo-light.svg" width="400">
  </picture>
</p>
```

**Alternative (simpler):** If the logo uses `currentColor` in SVG, a single SVG file adapts to both themes automatically. This is preferred when feasible.

### Pattern 2: Shields.io Badge URLs for Monorepo

**What:** Badge URLs that track the CLI package (user-facing) on npm.
**When to use:** Always in README header.
**Example:**

```markdown
[![npm version](https://img.shields.io/npm/v/tuireel)](https://www.npmjs.com/package/tuireel)
[![license](https://img.shields.io/npm/l/tuireel)](./LICENSE)
[![CI](https://github.com/tuireel/tuireel/actions/workflows/ci.yml/badge.svg)](https://github.com/tuireel/tuireel/actions/workflows/ci.yml)
```

**Note:** The CI badge will show "no status" until Phase 11 creates the workflow. This is fine — shields.io handles missing workflows gracefully.

### Pattern 3: README Section Order (CLI Tools)

**What:** Standard section order based on analysis of popular CLI tools (chalk, VHS, webreel, commander).
**When to use:** For the root README.md.

```
1. Logo/banner (centered)
2. One-line description
3. Badges row (npm, CI, license)
4. Quick install command
5. Quick start / minimal example
6. Feature highlights (3-5 bullet points)
7. Documentation link
8. Contributing link
9. License footer
```

### Pattern 4: Apache 2.0 License Structure

**What:** Standard Apache 2.0 LICENSE file with copyright appendix.
**When to use:** For the LICENSE file at repo root.

The LICENSE file must contain:
1. Full Apache 2.0 terms (sections 1-9)
2. "END OF TERMS AND CONDITIONS"
3. APPENDIX section with copyright notice
4. Copyright line: `Copyright 2026 Tuireel Contributors` (or project name)

Both `packages/cli/package.json` and `packages/core/package.json` must change `"license": "UNLICENSED"` to `"license": "Apache-2.0"`.

### Anti-Patterns to Avoid

- **Oversized README:** Don't put full documentation in the README. Keep it under ~150 lines. Link to docs for details.
- **Badge overload:** 3 badges max (npm version, CI, license). Avoid downloads, coverage, size, etc. at this stage.
- **Generic CONTRIBUTING.md:** Don't copy a boilerplate. Reference the actual commands (`pnpm install`, `pnpm test`, `turbo build`) and actual project structure.
- **Markdown issue templates (old format):** Use YAML `.yml` format, not `.md` format. YAML provides structured form fields with validation.
- **Missing `config.yml` in issue templates:** Without this file, GitHub still shows the old "blank issue" option alongside your templates.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Badge images | Custom SVG badges | shields.io hosted service | Automatically updates with npm publishes, CI status; universally recognized |
| License text | Paraphrased license | Official Apache 2.0 text from apache.org | Legal accuracy; GitHub auto-detects license from standard text |
| Issue template forms | Custom bot/webhook | GitHub YAML issue templates | Native GitHub UI; form validation; structured data; zero maintenance |
| OG image meta tags | Custom HTML injection | Mintlify `docs.json` og config (Phase 10) + GitHub repo social preview settings | GitHub uses uploaded social preview image; Mintlify handles docs OG tags |

**Key insight:** This phase is mostly content creation, not code. The "standard stack" is knowing the correct file formats, dimensions, and locations that GitHub and npm expect.

## Common Pitfalls

### Pitfall 1: SVG Logo That Breaks at Small Sizes
**What goes wrong:** Logo has fine details that become illegible at 16px favicon size.
**Why it happens:** Designing at large scale without testing small renders.
**How to avoid:** Design the logo icon-first at 16x16, then scale up. Use bold geometric shapes, not thin lines or small text. Test at 16px, 32px, 64px, 128px.
**Warning signs:** Logo relies on text readability or has strokes thinner than 2px at icon size.

### Pitfall 2: Dark Mode Logo Invisible on Dark Background
**What goes wrong:** Logo uses dark colors that disappear against GitHub's dark theme.
**Why it happens:** Only testing against light background.
**How to avoid:** Either: (a) use `currentColor` in SVG so it adapts, (b) provide dark/light variants and use `<picture>` element, or (c) ensure logo has sufficient contrast on both `#0d1117` (GitHub dark) and `#ffffff` (light).
**Warning signs:** Logo primary color has contrast ratio < 4.5:1 against either background.

### Pitfall 3: Wrong Package Name in Badges
**What goes wrong:** Badge shows `@tuireel/core` version instead of `tuireel` CLI version, or badge URL is wrong.
**Why it happens:** Monorepo has two packages; shields.io needs the npm package name.
**How to avoid:** Use `tuireel` (the CLI package) for the npm version badge — that's what users install. The core package is internal.

### Pitfall 4: LICENSE File Not Detected by GitHub
**What goes wrong:** GitHub doesn't show the license badge/icon in the repo header.
**Why it happens:** Non-standard license text formatting, or file named `LICENSE.md` instead of `LICENSE`.
**How to avoid:** Use the exact Apache 2.0 text from apache.org. Name the file `LICENSE` (no extension). GitHub's licensee gem does exact matching.

### Pitfall 5: CONTRIBUTING.md References Wrong Commands
**What goes wrong:** Contributor follows setup instructions and gets errors.
**Why it happens:** Copy-pasting from another project without adapting to this project's tooling.
**How to avoid:** Verify every command in CONTRIBUTING.md actually works. This project uses: `pnpm` (lockfile confirms), `turbo` for task running, `vitest` for testing, `tsup` for building.

### Pitfall 6: Issue Template YAML Syntax Errors
**What goes wrong:** Templates don't render in GitHub's issue creation UI.
**Why it happens:** YAML indentation errors, missing required fields, or using markdown template syntax in YAML files.
**How to avoid:** YAML templates need `name`, `description`, `body` at top level. Each body item needs `type` (markdown, input, textarea, dropdown, checkboxes). Test by creating a real issue on the repo.

### Pitfall 7: OG Image Wrong Dimensions
**What goes wrong:** Social preview is cropped or has wrong aspect ratio on Twitter/LinkedIn.
**Why it happens:** Using non-standard dimensions.
**How to avoid:** OG image must be exactly 1200x630 PNG. GitHub repo social preview must be 1280x640 PNG. These are different sizes for different purposes.

## Code Examples

### Apache 2.0 Copyright Appendix

```
Copyright 2026 Tuireel Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### GitHub Issue Template (YAML - Bug Report)

```yaml
# Source: Vite's bug_report.yml (adapted for Tuireel)
name: Bug report
description: Report an issue with Tuireel
labels: [bug]
body:
  - type: textarea
    id: bug-description
    attributes:
      label: Describe the bug
      description: A clear and concise description of what the bug is.
      placeholder: What I expected vs what actually happened...
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Config to reproduce
      description: Paste your .tuireel.jsonc config (or a minimal version).
      render: jsonc
    validations:
      required: true
  - type: textarea
    id: system-info
    attributes:
      label: System info
      description: "OS, Node version, tuireel version, ffmpeg version"
      render: shell
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Error output
      description: Paste any error messages or stderr output.
      render: shell
```

### GitHub Issue Template (YAML - Feature Request)

```yaml
# Source: Vite's feature_request.yml (adapted)
name: Feature request
description: Suggest an idea for Tuireel
labels: [enhancement]
body:
  - type: textarea
    id: feature-description
    attributes:
      label: Description
      description: Clear description of the problem or use case.
      placeholder: As a Tuireel user I want [goal] so that [benefit].
    validations:
      required: true
  - type: textarea
    id: suggested-solution
    attributes:
      label: Suggested solution
      description: How you think this could work.
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: Other approaches you've thought about.
```

### GitHub Issue Template Config

```yaml
# .github/ISSUE_TEMPLATE/config.yml
blank_issues_enabled: false
```

### GitHub PR Template

```markdown
## What

<!-- Brief description of what this PR does -->

## Why

<!-- Why is this change needed? Link to issue if applicable -->

## How to test

<!-- Steps for reviewer to verify the change -->
```

### package.json License Field

```jsonc
// In BOTH packages/cli/package.json AND packages/core/package.json:
// Change: "license": "UNLICENSED"
// To:     "license": "Apache-2.0"
```

### Mintlify Favicon/Branding Config (Preview for Phase 10)

```jsonc
// docs.json (Phase 10 will create this, but Phase 7 assets feed into it)
{
  "$schema": "https://mintlify.com/docs.json",
  "name": "Tuireel",
  "favicon": "/favicon.svg",
  "colors": {
    "primary": "#...",   // From BRND-02 color palette
    "light": "#...",
    "dark": "#..."
  },
  "logo": {
    "dark": "/logo-dark.svg",
    "light": "/logo-light.svg"
  }
}
```

## Branding Direction Recommendations

Since there are no existing brand ideas, here are researched recommendations:

### Logo Concept

**Recommendation:** A geometric "reel" or "film strip" icon that references both TUI (terminal) and reel (recording). Consider:
- A stylized terminal prompt cursor (`>_`) combined with a film/record circle
- A minimal "play" triangle inside a terminal bracket
- Keep it to 2-3 geometric shapes max for favicon legibility

**Constraints:**
- Must be recognizable at 16x16 pixels (favicon)
- Must work on both `#0d1117` (dark) and `#ffffff` (light) backgrounds
- SVG format for infinite scalability
- No text in the icon version (text can be in the full logo/banner)

### Color Palette

**Recommendation:** Terminal-inspired palette that feels modern and technical:

| Role | Color | Hex | Rationale |
|------|-------|-----|-----------|
| Primary | Vibrant teal/cyan | `#06B6D4` or similar | Terminal cursor/prompt feel; high visibility; works in both modes |
| Accent | Warm amber/orange | `#F59E0B` or similar | Contrast against primary; "record" button association |
| Dark background | Deep navy/charcoal | `#0F172A` | Matches terminal aesthetic; distinct from pure black |
| Light background | Off-white/warm gray | `#F8FAFC` | Easy on eyes; not harsh white |
| Text on dark | Light gray | `#E2E8F0` | High contrast on dark bg |
| Text on light | Dark slate | `#1E293B` | High contrast on light bg |

These are starting suggestions. The specific hex values should be chosen based on the final logo design.

### Banner Image (1280x640)

**Content:** Project name "Tuireel" + tagline "Scripted TUI demo recorder" + a visual showing a terminal recording being produced (could be a simplified terminal frame with a play button overlay). Dark background preferred for terminal tools.

### OG/Social Card (1200x630)

**Content:** Similar to banner but optimized for social sharing. Include: logo, project name, short tagline. Text must be readable at thumbnail size (~300px wide). Avoid fine details.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Markdown issue templates (.md) | YAML issue templates (.yml) | GitHub 2021 | Structured forms with validation, dropdowns, required fields |
| `#gh-dark-mode-only` hash | `<picture>` element with `<source>` | GitHub 2022 | More reliable dark/light switching; uses standard HTML |
| `mint.json` (Mintlify) | `docs.json` (Mintlify) | 2025 | Renamed config file; same structure |
| Manual badge SVGs | shields.io dynamic badges | Long-standing | Auto-updating; no maintenance |

**Deprecated/outdated:**
- Markdown issue templates (`.md`): Still work but YAML is preferred for structured input
- `mint.json`: Mintlify now uses `docs.json` (both may still work, but `docs.json` is current)

## Open Questions

1. **Logo design specifics**
   - What we know: Must be SVG, work at 16px, support dark/light modes
   - What's unclear: Exact visual concept, whether to use AI generation or hand-craft
   - Recommendation: Hand-craft a simple geometric SVG. AI-generated logos often have too much detail for favicon use. Keep it to 2-3 shapes.

2. **Copyright holder name**
   - What we know: Apache 2.0 requires a copyright line in the appendix
   - What's unclear: Should it be "Tuireel Contributors", a personal name, or an organization?
   - Recommendation: Use "Tuireel Contributors" — standard for community open-source projects

3. **Banner/OG image generation method**
   - What we know: Sharp is available as a dependency; images need to be PNG at specific sizes
   - What's unclear: Whether to write a generation script or create images manually
   - Recommendation: Create a small generation script using Sharp (already a dep) that composites the logo SVG onto a background with text. This makes future updates easy and keeps the branding reproducible.

4. **GitHub repo social preview upload**
   - What we know: GitHub uses a separately uploaded image (Settings > Social preview), not an og:image meta tag
   - What's unclear: Whether this should be automated or manually uploaded
   - Recommendation: Create the OG PNG file in `assets/branding/`, document the manual upload step. This is a one-time action.

## Sources

### Primary (HIGH confidence)
- Webreel repo (opensrc) — LICENSE file format, README structure, monorepo patterns
- VHS repo (charmbracelet/vhs) — CLI tool README structure, dark/light mode logo pattern
- Chalk repo (chalk/chalk) — Badge placement, centered logo pattern
- Apache Foundation (apache.org/licenses/LICENSE-2.0.txt) — Official Apache 2.0 license text
- Vite repo (vitejs/vite) — YAML issue template format, feature request template structure
- Mintlify starter repo — `docs.json` config structure, favicon/logo/color fields

### Secondary (MEDIUM confidence)
- GitHub docs — `<picture>` element support for dark/light mode (widely documented, verified via VHS example)
- Shields.io — Badge URL patterns (verified by service availability)

### Tertiary (LOW confidence)
- None — all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; file formats and locations are well-documented standards
- Architecture: HIGH — directory structure and file formats are industry conventions with multiple reference implementations
- Pitfalls: HIGH — based on verified GitHub behavior and real-world examples from popular repos
- Branding direction: MEDIUM — color palette and logo concepts are recommendations, not verified choices; user may have different preferences

**Research date:** 2026-03-03
**Valid until:** 2026-06-03 (90 days — these conventions are very stable)
