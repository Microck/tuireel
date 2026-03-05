# Phase 20: Brand System Integration - Research

**Researched:** 2026-03-05
**Domain:** Repo-wide brand token + logo wiring (GitHub README + Mintlify docs)
**Confidence:** HIGH

## User Constraints

No `.planning/phases/20-brand-system-integration/*-CONTEXT.md` exists in-repo yet. Constraints captured verbatim from the user prompt:

### Locked decisions

- Milestone v1.15: Brand Refresh & Docs Hosting
- New palette tokens:
  - background: #141015
  - surface: #1C346D
  - primary: #18AAA7
  - secondary: #F5ECD9
  - accent: #C1263B
- New logo source SVG: https://litter.catbox.moe/85n31pje628rin49.svg

### Current implementation state (already in repo)

- assets/branding/palette.json exists with those tokens
- docs/docs.json colors/background set
- docs/images/logo-_.svg and assets/branding/logo-_.svg updated

### Constraints

- Do not propose core recording/engine changes.
- Do not run git commands or create commits.

## Summary

Phase 20 is mostly about preventing drift: there are now multiple brand “consumers” (GitHub README, Mintlify docs UI, branding generation scripts, and internal planning docs) that can silently diverge. The repo already has a canonical palette file at `assets/branding/palette.json` and updated logo SVGs under both `assets/branding/` and `docs/images/`, and `docs/docs.json` is already set to the new colors.

The planning-critical work is understanding Mintlify’s `docs.json` semantics so the palette tokens map correctly (Mintlify supports `colors.primary`, `colors.light`, `colors.dark` and a `background.color.light/dark`; it does not directly accept a full 5-token palette). The plan should explicitly choose how to map `accent` vs `primary` into Mintlify’s “button/hover” color (`colors.dark` per Mintlify docs), and should add a lightweight sync mechanism (script or documented manual process) so `assets/branding/palette.json` remains the single source-of-truth while `docs/docs.json` and `scripts/generate-branding.ts` stay consistent.

**Primary recommendation:** Treat `assets/branding/palette.json` as the canonical token source, and enforce consistency by (a) documenting it in README/docs and (b) syncing Mintlify `docs/docs.json` + `docs/images/*` + branding generation script inputs from it.

## Standard Stack

### Core

| Tool/Config                    |                                          Version | Purpose                                   | Why Standard                                                    |
| ------------------------------ | -----------------------------------------------: | ----------------------------------------- | --------------------------------------------------------------- |
| Mintlify `docs/docs.json`      | `mintlify` CLI is `latest` (`docs/package.json`) | Docs site theming + navigation + branding | Mintlify’s required configuration surface for brand colors/logo |
| `assets/branding/palette.json` |                                              N/A | Canonical palette token registry          | Simple, diffable, easy to consume in scripts                    |
| `README.md` `<picture>` swap   |                                              N/A | GitHub dark/light logo switching          | Supported pattern for README-rendered assets                    |

### Supporting

| Tool/Config                              |                 Version | Purpose                                                                | When to Use                                        |
| ---------------------------------------- | ----------------------: | ---------------------------------------------------------------------- | -------------------------------------------------- |
| `scripts/generate-branding.ts` + `sharp` | `sharp` already in repo | Generate `assets/branding/banner.png` + `assets/branding/og-image.png` | When regenerating social/banner assets from tokens |

## Mintlify `docs.json` Knobs (Brand-Relevant)

Verified via Mintlify schema at `https://mintlify.com/docs.json` and Mintlify “Global settings” docs.

**Current repo wiring:** `docs/docs.json` sets `colors.primary` + `colors.light` to `#18AAA7`, `colors.dark` to `#C1263B`, and `background.color.light`/`dark` to `#F5ECD9`/`#141015`.

### Colors

- `colors.primary` (required): primary emphasis color.
- `colors.light`: emphasis color in dark mode.
- `colors.dark`: used for buttons + hover states across light and dark modes (Mintlify docs wording).

### Background

- `background.color.light` / `background.color.dark`: background colors per mode.
- `background.decoration`: `"gradient" | "grid" | "windows"`.
- `background.image`: string or `{ light, dark }`.

### Logo/Favicon

- `logo`: either a single string path OR `{ light, dark, href? }`.
- `favicon`: either a single string path OR `{ light, dark }`.

### Variables

- `variables`: key/value strings usable in MDX via `{{variableName}}` replacement.
- Mintlify docs note: build fails if a referenced variable is missing; values are sanitized; variable names can include alphanumerics, hyphens, and periods.

## Architecture Patterns

### Single Source-of-Truth Tokens

**What:** Keep palette tokens in one canonical file and derive all consumers from it.
**Use:** `assets/branding/palette.json` is already in place.
**Why:** Mintlify, the README, and asset generation otherwise become three separate color authorities.

### Docs Asset Duplication (Mintlify Local Paths)

**What:** Keep docs-consumed images under `docs/images/` and reference them as `/images/...` in `docs/docs.json`.
**Why:** This repo already established the convention that Mintlify expects assets local to the docs directory (`docs/images/`), not `../assets/...`.

### Sync Script Pattern (Recommended)

**What:** A small script reads `assets/branding/palette.json` and updates:

- `docs/docs.json` (`colors`, `background.color`, optionally `variables`)
- `scripts/generate-branding.ts` constants (or makes the script read palette.json directly)
- copies `assets/branding/logo-*.svg` + `favicon.svg` into `docs/images/` (to avoid drift)

**Why:** Prevents “updated palette.json but forgot docs.json” regressions.

## Key Questions To Answer In The Plan

1. **Mintlify color mapping:** Should `colors.dark` use `accent` (`#C1263B`, current state) or remain `primary` (`#18AAA7`) so buttons/hover match the primary brand color?
2. **Docs token exposure:** Do docs pages need to _display_ the palette (e.g., a short “Brand tokens” section), or is it sufficient to document the canonical source in README + keep docs.json wired?
3. **Drift prevention:** Should the plan add a sync script (preferred) or rely on manual updates + verification steps?
4. **“surface” token usage:** Since Mintlify has no direct “surface” knob, where is `surface: #1C346D` intended to be applied (social assets only, later docs theme tweaks, etc.)?
5. **Canonical logo source:** Is `assets/branding/logo.svg` the canonical source-of-truth, or should the plan store the upstream source SVG separately (e.g., `assets/branding/logo-source.svg`) for provenance?

## Common Pitfalls / Risks

### Mintlify semantics mismatch

- `colors.light`/`colors.dark` names are not “light mode vs dark mode” colors; Mintlify docs describe them as emphasis/button/hover colors with theme-specific meaning.
- Choosing `accent` for `colors.dark` makes buttons/hover states red across both modes; this may be desired or may read as “error/destructive” depending on theme.

### Invalid `docs.json` keys

- Mintlify schema uses `additionalProperties: false` in many objects; adding a non-schema key causes build/validation failures.

### Variable replacement hazards

- Any `{{...}}` sequence in MDX can be treated as a variable; if it’s referenced but not defined in `docs/docs.json.variables`, the build fails.
- If docs need to show literal `{{variable}}` examples, the plan must ensure an escaping strategy (or avoid that syntax in docs content).

### Drift between duplicated logo assets

- Logo SVGs exist under both `assets/branding/` and `docs/images/`. Without a sync rule, it is easy to update one and forget the other.

### Planning docs drift (internal)

- `.planning/STATE.md` currently still documents the old palette (teal/navy/amber). If left stale, it will mislead future planning.

## Concrete File Touchpoints

Brand token + asset sources:

- `assets/branding/palette.json`
- `assets/branding/logo.svg`
- `assets/branding/logo-light.svg`
- `assets/branding/logo-dark.svg`
- `assets/branding/favicon.svg`
- `assets/branding/banner.png`
- `assets/branding/og-image.png`

Docs branding consumers:

- `docs/docs.json`
- `docs/images/logo-light.svg`
- `docs/images/logo-dark.svg`
- `docs/images/favicon.svg`

Repo surface consumers:

- `README.md`

Brand generation/sync tooling:

- `scripts/generate-branding.ts`

Internal planning truth:

- `.planning/STATE.md`
- `.planning/ROADMAP.md` (Phase 20 success criteria)
- `.planning/REQUIREMENTS.md` (BRND-06, BRND-07)

## Verification Ideas

Docs UI checks (human):

- Run Mintlify locally from `docs/` (`pnpm -C docs dev` or `npx mintlify dev`). Verify:
  - logo renders in header for both modes
  - background colors match `docs/docs.json.background.color.*`
  - link/button/hover colors match the chosen mapping for `colors.*`
  - no console/build errors from invalid `docs.json`

Repo surface checks:

- Open `README.md` on GitHub and verify the `<picture>` logo switches in light/dark mode and that `assets/branding/banner.png` renders.

Drift checks (automatable):

- Scripted assertion that the 5 palette tokens in `assets/branding/palette.json` are the only source of hex values and that:
  - `docs/docs.json.colors.*` and `docs/docs.json.background.color.*` match the intended mapping
  - `docs/images/logo-*.svg` match `assets/branding/logo-*.svg` (byte-equal, or at least contain the expected token hexes)

## Sources

### Primary (HIGH confidence)

- Mintlify schema: `https://mintlify.com/docs.json` (used to confirm available keys + types)
- Mintlify docs: `https://www.mintlify.com/docs/organize/settings` (used to confirm semantics for `colors.*`, `background.*`, and `variables`)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH (verified in-repo via `docs/package.json`, `docs/docs.json`, and branding assets)
- Mintlify knobs/semantics: HIGH (verified via official schema + official docs page)
- Repo touchpoints: HIGH (verified via file reads/greps)

**Valid until:** 30 days (Mintlify schema and `mintlify@latest` can change)
