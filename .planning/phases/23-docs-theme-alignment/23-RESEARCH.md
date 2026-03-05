# Phase 23: Docs Theme Alignment - Research

**Researched:** 2026-07-18
**Domain:** Mintlify docs.json theming / brand alignment verification
**Confidence:** HIGH

## Summary

Phase 23 is largely a **verification and gap-fill phase**, not a greenfield theming effort. Phase 20 already wired the core brand tokens (colors, background, logo paths, favicon paths) into `docs/docs.json`, and the `scripts/verify-brand-system.ts` drift checker confirms everything passes today. The docs assets (`docs/images/logo-light.svg`, `logo-dark.svg`, `favicon.svg`) are byte-equal to their canonical counterparts in `assets/branding/`.

However, there are **two concrete gaps** that constitute real work:

1. **Missing `theme` field.** Current Mintlify docs list `theme` as a **required** field in `docs.json`. The repo's `docs/docs.json` omits it entirely. Without an explicit `theme`, Mintlify either defaults to `"mint"` or may produce a validation warning. The planner must choose a theme (from: `mint`, `maple`, `palm`, `willow`, `linden`, `almond`, `aspen`, `sequoia`, `luma`) and add it.

2. **Visual verification against a running Mintlify dev server.** The success criteria require the docs UI to be "visibly consistent with the README" — this can only be verified by actually running Mintlify locally and eyeballing the result (or screenshotting). No automated tooling currently validates the _rendered_ appearance.

Everything else (colors, logo, favicon, background) is already wired correctly and passing drift checks.

**Primary recommendation:** Add the `theme` field to `docs/docs.json`, run Mintlify dev locally to visually verify the rendered result matches the brand system, and update the drift-check script to assert the `theme` field exists. This is a small, focused phase.

## Standard Stack

### Core

| Tool/Config                      | Version           | Purpose                      | Why Standard                              |
| -------------------------------- | ----------------- | ---------------------------- | ----------------------------------------- |
| Mintlify `docs/docs.json`        | `mintlify@latest` | Docs site theming + branding | Mintlify's required configuration surface |
| `scripts/verify-brand-system.ts` | N/A               | Automated drift prevention   | Already exists from Phase 20              |

### Supporting

| Tool                                      | Purpose                    | When to Use                            |
| ----------------------------------------- | -------------------------- | -------------------------------------- |
| `mintlify dev` (from `docs/package.json`) | Local preview of docs site | Visual verification of brand alignment |

### Alternatives Considered

| Instead of                   | Could Use                       | Tradeoff                                                    |
| ---------------------------- | ------------------------------- | ----------------------------------------------------------- |
| Visual verification by human | Automated screenshot comparison | Overkill for a one-time verification; no framework in place |

## Current State Audit

### What's Already Wired (from Phase 20)

All of these pass `scripts/verify-brand-system.ts`:

| docs.json Field          | Value                    | Maps To (palette.json)                         | Status  |
| ------------------------ | ------------------------ | ---------------------------------------------- | ------- |
| `colors.primary`         | `#18AAA7`                | `primary`                                      | CORRECT |
| `colors.light`           | `#18AAA7`                | `primary` (emphasis in dark mode)              | CORRECT |
| `colors.dark`            | `#C1263B`                | `accent` (buttons/hover)                       | CORRECT |
| `background.color.light` | `#F5ECD9`                | `secondary`                                    | CORRECT |
| `background.color.dark`  | `#141015`                | `background`                                   | CORRECT |
| `logo.light`             | `/images/logo-light.svg` | byte-equal to `assets/branding/logo-light.svg` | CORRECT |
| `logo.dark`              | `/images/logo-dark.svg`  | byte-equal to `assets/branding/logo-dark.svg`  | CORRECT |
| `favicon.light`          | `/images/favicon.svg`    | byte-equal to `assets/branding/favicon.svg`    | CORRECT |
| `favicon.dark`           | `/images/favicon.svg`    | byte-equal to `assets/branding/favicon.svg`    | CORRECT |

### What's Missing

| Gap                 | Severity                                                   | Details                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `theme` field       | **HIGH** — required by Mintlify schema                     | Not present in `docs/docs.json`. Mintlify's official docs mark this as required. Available values: `mint`, `maple`, `palm`, `willow`, `linden`, `almond`, `aspen`, `sequoia`, `luma` |
| `description` field | LOW — optional, but good for SEO                           | Not present; adds site-wide SEO metadata                                                                                                                                             |
| Visual verification | **MEDIUM** — success criteria require "visibly consistent" | No one has actually run `mintlify dev` and confirmed the rendered output looks correct with this palette                                                                             |

## Architecture Patterns

### Mintlify Theme Selection

**What:** The `theme` field controls the overall layout/structure of the docs site. Colors/logo/favicon are independent of theme choice.

**Key insight:** Theme selection affects layout (sidebar position, card vs list nav, font defaults), NOT color palette. The `colors`, `background`, `logo`, `favicon` fields override theme defaults. So any theme will render with the v1.15 palette — the choice is about layout aesthetics.

**Recommended theme:** `mint` (the classic default). Rationale:

- Most battle-tested and widely used
- Tuireel docs are simple (6 pages, single tab, no API playground)
- No reason to pick a more opinionated layout
- If the site was already rendering without a `theme` field, it was likely defaulting to `mint`

### docs.json Change Pattern

The only structural change needed:

```json
{
  "$schema": "https://mintlify.com/docs.json",
  "theme": "mint",
  "name": "Tuireel",
  ...
}
```

This is a one-line addition at the top level.

## Mintlify Visual Customization Knobs (Complete Reference)

From official docs (verified 2026-07-18 via mintlify.com/docs/organize/settings):

| Field                    | Type       | Required | Currently Set     | Notes                                           |
| ------------------------ | ---------- | -------- | ----------------- | ----------------------------------------------- |
| `theme`                  | enum       | **YES**  | **NO**            | Must add                                        |
| `name`                   | string     | YES      | YES (`"Tuireel"`) | OK                                              |
| `colors.primary`         | hex        | YES      | YES               | OK                                              |
| `colors.light`           | hex        | no       | YES               | OK                                              |
| `colors.dark`            | hex        | no       | YES               | OK                                              |
| `background.color.light` | hex        | no       | YES               | OK                                              |
| `background.color.dark`  | hex        | no       | YES               | OK                                              |
| `background.decoration`  | enum       | no       | NO                | Optional: `"gradient"` / `"grid"` / `"windows"` |
| `background.image`       | string/obj | no       | NO                | Not needed                                      |
| `logo`                   | string/obj | no       | YES (obj)         | OK                                              |
| `favicon`                | string/obj | no       | YES (obj)         | OK                                              |
| `description`            | string     | no       | NO                | Nice-to-have for SEO                            |
| `fonts`                  | object     | no       | NO                | Uses theme default; no brand font specified     |
| `appearance.default`     | enum       | no       | NO                | Defaults to `"system"` which is fine            |
| `appearance.strict`      | boolean    | no       | NO                | Toggle visible by default, which is fine        |
| `styling.eyebrows`       | enum       | no       | NO                | Defaults to `"section"`                         |
| `styling.codeblocks`     | enum/obj   | no       | NO                | Defaults to `"system"`                          |
| `thumbnails`             | object     | no       | NO                | Optional social card theming                    |

**Conclusion:** The only required-but-missing field is `theme`. All other optional fields have sensible defaults.

## Don't Hand-Roll

| Problem                              | Don't Build                     | Use Instead                                      | Why                                                                     |
| ------------------------------------ | ------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| Palette drift detection              | Custom diffing logic            | `scripts/verify-brand-system.ts`                 | Already exists and is comprehensive                                     |
| Visual testing                       | Screenshot comparison framework | Human visual check via `mintlify dev`            | One-time verification for 6 pages; automation is overkill               |
| Theme customization beyond docs.json | Custom CSS injection            | Mintlify's built-in `colors`/`background` fields | Mintlify doesn't support arbitrary CSS; `docs.json` is the only surface |

## Common Pitfalls

### Pitfall 1: Mintlify `theme` Field Omission

**What goes wrong:** Mintlify may render with a default theme but could produce build warnings or fail validation against the `$schema`.
**Why it happens:** Phase 20 focused on colors/logo/favicon and didn't add `theme` because it was previously optional or the build succeeded without it.
**How to avoid:** Add `"theme": "mint"` (or chosen theme) to `docs/docs.json`.
**Warning signs:** Mintlify CLI warnings during `mintlify dev`, or schema validation errors in IDE.

### Pitfall 2: Assuming "Wired Correctly" = "Looks Correct"

**What goes wrong:** Color values in `docs.json` are correct but the rendered result looks off (e.g., `colors.dark` = `#C1263B` makes all buttons/links red, which may read as "error" or "destructive").
**Why it happens:** Mintlify applies colors with opacity/gradient treatments that can shift perception.
**How to avoid:** Must visually verify by running `mintlify dev` and checking both light and dark modes.
**Warning signs:** Buttons/hover states feeling "angry" rather than "branded".

### Pitfall 3: Logo Light/Dark Naming Convention Confusion

**What goes wrong:** The Mintlify `logo.light` field means "logo shown in dark mode" (light-colored logo for dark backgrounds), and vice versa.
**Why it happens:** Counterintuitive naming from Mintlify's perspective — the logo variant is named for its own color, not the background it sits on.
**How to avoid:** Already correctly wired. `logo.light` = `/images/logo-light.svg` (light-colored, for dark backgrounds). Just don't accidentally swap them.
**Warning signs:** Logo invisible or hard to read against the background in one mode.

### Pitfall 4: Modifying verify-brand-system.ts Without Understanding Its Assertions

**What goes wrong:** Adding `theme` check that's too rigid or doesn't match the existing assertion style.
**Why it happens:** The script uses a specific pattern (`assertEqual`/`assertTruthy`).
**How to avoid:** Follow existing patterns in the script: use `assertTruthy` for "field exists" or `assertEqual` for exact value.

## Code Examples

### Adding `theme` to docs.json

```json
{
  "$schema": "https://mintlify.com/docs.json",
  "theme": "mint",
  "name": "Tuireel",
  "colors": {
    "primary": "#18AAA7",
    "light": "#18AAA7",
    "dark": "#C1263B"
  }
}
```

### Adding theme assertion to verify-brand-system.ts

Following the existing pattern in the script:

```typescript
// After the existing docsJson checks:
if (docsJson) {
  assertTruthy("docs/docs.json.theme", (docsJson as Record<string, unknown>).theme);
}
```

### Running local Mintlify preview

```bash
# From repo root:
pnpm -C docs dev
# or:
cd docs && npx mintlify dev
```

## Open Questions

1. **Theme choice confirmation**
   - What we know: `mint` is the safe default and the likely implicit current behavior. The docs are simple (6 pages, no API playground).
   - What's unclear: Whether the user has a preference for a different theme aesthetic (e.g., `linden` for retro terminal vibes could fit a TUI tool).
   - Recommendation: Default to `"mint"` unless user specifies otherwise. This is a Claude's discretion item.

2. **`description` field**
   - What we know: It's optional but improves SEO/AI indexing.
   - What's unclear: Whether Phase 23 scope includes SEO improvements or strictly brand visual alignment.
   - Recommendation: Add a brief `description` like `"Scripted TUI demo recorder — produce polished terminal demo videos from declarative configs."` since it's one line and clearly brand-aligned. But it's not required by the success criteria.

3. **`background.decoration`**
   - What we know: Mintlify supports `"gradient"`, `"grid"`, or `"windows"` decorative overlays.
   - What's unclear: Whether any decoration would improve brand consistency.
   - Recommendation: Skip it. The success criteria don't mention decoration, and the current background colors alone are sufficient for brand alignment.

## Sources

### Primary (HIGH confidence)

- Mintlify official docs: https://www.mintlify.com/docs/organize/settings — Full `docs.json` reference (verified 2026-07-18, all field names/types/required status confirmed)
- Mintlify theme gallery: https://www.mintlify.com/docs/customize/themes — Available theme values confirmed
- In-repo `docs/docs.json` — Current configuration read directly
- In-repo `scripts/verify-brand-system.ts` — Drift check logic read directly
- In-repo `assets/branding/palette.json` — Canonical palette tokens read directly
- In-repo Phase 20 research/summaries — Prior work documented

### Secondary (MEDIUM confidence)

- DeepWiki mintlify/themes analysis: https://deepwiki.com/mintlify/themes/4.3-visual-customization — Cross-referenced with official docs

## Metadata

**Confidence breakdown:**

- Current state audit: HIGH — verified by reading files + running `verify-brand-system.ts` (passes)
- Missing `theme` field: HIGH — confirmed required by official Mintlify docs schema reference
- Mintlify knobs completeness: HIGH — full reference fetched from official docs
- Theme recommendation: MEDIUM — `mint` is the safe default but user preference unknown

**Research date:** 2026-07-18
**Valid until:** 30 days (Mintlify schema stable but `mintlify@latest` can change)
