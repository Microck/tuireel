---
phase: quick-004-logo-remove-light-variant-add-beige-stro
plan: 004
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
  - assets/branding/brand-system.md
  - assets/branding/logo.svg
  - assets/branding/logo-dark.svg
  - scripts/verify-brand-system.ts
  - docs/images/logo-dark.svg
autonomous: true
must_haves:
  truths:
    - "README renders the logo correctly without any logo-light.svg usage"
    - "Brand drift verification passes without expecting a logo-light.svg variant"
    - "Remaining logo SVG(s) have a beige (#F5ECD9) outline"
  artifacts:
    - path: "assets/branding/logo.svg"
      provides: "Canonical logo (used for light backgrounds) with beige outline"
    - path: "assets/branding/logo-dark.svg"
      provides: "Dark-background logo variant with beige outline"
    - path: "scripts/verify-brand-system.ts"
      provides: "Drift checks that no longer reference logo-light.svg"
  key_links:
    - from: "README.md"
      to: "assets/branding/logo.svg"
      via: "<picture> light source + fallback <img>"
      pattern: "assets/branding/logo\\.svg"
    - from: "README.md"
      to: "assets/branding/logo-dark.svg"
      via: "<picture> dark source"
      pattern: "assets/branding/logo-dark\\.svg"
    - from: "scripts/verify-brand-system.ts"
      to: "docs/images/logo-dark.svg"
      via: "assertFileByteEqual"
      pattern: "assertFileByteEqual\\(docsLogoDark, brandingLogoDark\\)"
---

<objective>
Remove the light logo variant from all usage and drift checks, and add a beige (#F5ECD9) outline to the remaining logo SVGs.

Purpose: Keep the brand system drift-resistant while reducing redundant assets.
Output: Updated logo SVGs + updated README and verification script with no logo-light references.
</objective>

<execution_context>
@/home/ubuntu/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/ubuntu/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@assets/branding/logo.svg
@assets/branding/logo-dark.svg
@assets/branding/logo-light.svg
@docs/images/logo-dark.svg
@docs/images/logo-light.svg
@assets/branding/palette.json
@assets/branding/brand-system.md
@README.md
@scripts/verify-brand-system.ts
@docs/docs.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add beige outline to remaining logo SVGs</name>
  <files>assets/branding/logo.svg, assets/branding/logo-dark.svg, docs/images/logo-dark.svg</files>
  <action>
Add a beige outline using the palette secondary color (#F5ECD9) without rewriting path data.

- In `assets/branding/logo.svg` and `assets/branding/logo-dark.svg`, add root-level stroke styling (on the `<svg>` element or a top-level `<g>`) so all paths inherit it:
  - `stroke="#F5ECD9"`
  - a modest `stroke-width` (start around 10-14 in the current 990x989 viewBox)
  - `stroke-linejoin="round"` and `stroke-linecap="round"`
  - `paint-order="stroke fill"` so the outline sits behind fills
- Keep the existing SVG 1.1 doctype and formatting as-is (minimize diffs).
- Sync `docs/images/logo-dark.svg` to be byte-equal to the updated `assets/branding/logo-dark.svg`.
  </action>
  <verify>
  rg -n 'stroke="#F5ECD9"' assets/branding/logo.svg assets/branding/logo-dark.svg
  cmp -s docs/images/logo-dark.svg assets/branding/logo-dark.svg
  </verify>
  <done>
- Both remaining logos include a beige outline.
- Docs logo-dark copy is byte-equal to canonical.
  </done>
  </task>

<task type="auto">
  <name>Task 2: Remove logo-light variant usage and drift checks</name>
  <files>README.md, assets/branding/brand-system.md, scripts/verify-brand-system.ts, assets/branding/logo-light.svg (delete), docs/images/logo-light.svg (delete)</files>
  <action>
Remove the redundant light logo variant from all consumption points and enforce that it stays removed.

- Update `README.md` `<picture>`:
  - Use `assets/branding/logo-dark.svg` for `(prefers-color-scheme: dark)`.
  - Use `assets/branding/logo.svg` for `(prefers-color-scheme: light)` and the fallback `<img>`.
  - Ensure there are no remaining references to `assets/branding/logo-light.svg`.
- Update `assets/branding/brand-system.md`:
  - In "Logo assets", list only `assets/branding/logo.svg` (canonical) and `assets/branding/logo-dark.svg`.
  - In "Docs theming", remove `docs/images/logo-light.svg` from the drift list.
- Update `scripts/verify-brand-system.ts`:
  - Remove `brandingLogoLight` / `docsLogoLight` constants and the `assertFileByteEqual` check for them.
  - Update README assertions to require `assets/branding/logo.svg` and `assets/branding/logo-dark.svg`.
  - Add a grep-friendly failure if README contains `assets/branding/logo-light.svg`.
  - Optionally (recommended), fail if `assets/branding/logo-light.svg` or `docs/images/logo-light.svg` still exist to prevent reintroducing the deprecated variant.
- Delete `assets/branding/logo-light.svg` and `docs/images/logo-light.svg`.
  </action>
  <verify>
  pnpm -s tsx scripts/verify-brand-system.ts
  rg -n "logo-light\\.svg" README.md assets/branding/brand-system.md scripts/verify-brand-system.ts docs/docs.json
  </verify>
  <done>
- `logo-light.svg` is not referenced by README/docs/verification.
- Brand system verification passes.
  </done>
  </task>

</tasks>

<verification>
- `pnpm -s tsx scripts/verify-brand-system.ts` passes.
- README `<picture>` shows `logo.svg` for light scheme and `logo-dark.svg` for dark scheme.
</verification>

<success_criteria>

- No runtime/verification file references `logo-light.svg`.
- `assets/branding/logo.svg` and `assets/branding/logo-dark.svg` both include a beige (#F5ECD9) outline.
  </success_criteria>

<output>
After completion, create `.planning/quick/004-logo-remove-light-variant-add-beige-stro/004-SUMMARY.md`.
</output>
