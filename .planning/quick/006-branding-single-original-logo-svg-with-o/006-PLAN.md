---
phase: quick-006-branding-single-original-logo-svg-with-o
plan: 006
type: execute
wave: 1
depends_on: []
files_modified:
  - assets/branding/logo.svg
  - assets/branding/brand-system.md
  - assets/branding/logo-dark.svg
  - docs/docs.json
  - docs/images/logo.svg
  - docs/images/logo-dark.svg
  - README.md
  - scripts/verify-brand-system.ts
autonomous: true
must_haves:
  truths:
    - "Repo uses a single logo asset (assets/branding/logo.svg) with no light/dark variants"
    - "Logo outline is an outer silhouette effect (not per-path strokes)"
    - "README references only assets/branding/logo.svg (no <picture> / no logo-dark)"
    - "Docs reference a single logo (/images/logo.svg) and docs/images/logo.svg is byte-equal to assets/branding/logo.svg"
    - "Brand verification fails if deprecated logo variants exist or are referenced"
  artifacts:
    - path: "assets/branding/logo.svg"
      provides: "Single canonical logo SVG with filter-based outer outline"
    - path: "docs/images/logo.svg"
      provides: "Docs copy byte-equal to canonical logo"
    - path: "docs/docs.json"
      provides: "Mintlify logo wiring pointing to /images/logo.svg for both light/dark"
    - path: "scripts/verify-brand-system.ts"
      provides: "Contract enforcement for single-logo + no-variants + no stale references"
  key_links:
    - from: "assets/branding/logo.svg"
      to: "SVG filter outline"
      via: "feMorphology + feComposite over SourceAlpha"
      pattern: "feMorphology.*dilate"
    - from: "docs/images/logo.svg"
      to: "assets/branding/logo.svg"
      via: "assertFileByteEqual"
      pattern: "assertFileByteEqual\\(docsLogo, brandingLogo\\)"
    - from: "scripts/verify-brand-system.ts"
      to: "docs/docs.json"
      via: "docsJson.logo.light/dark assertion"
      pattern: "docs\\/docs\\.json\\.logo\\.(light|dark)"
---

<objective>
Collapse branding to a single logo (assets/branding/logo.svg) and implement an outer-outline-only effect (filter-based) so the logo remains readable on dark backgrounds without outlining internal lines.

Purpose: Simplify branding assets (no variants) while keeping README/docs rendering consistent and drift-resistant.
Output: Updated single logo SVG, docs + README rewired, deprecated variants deleted, and verify-brand-system contract updated.
</objective>

<execution_context>
@/home/ubuntu/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/ubuntu/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@assets/branding/logo.svg
@assets/branding/logo-dark.svg
@docs/images/logo-dark.svg
@docs/docs.json
@README.md
@assets/branding/brand-system.md
@scripts/verify-brand-system.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement filter-based outer outline in the single logo</name>
  <files>assets/branding/logo.svg</files>
  <action>
Replace the current root-level inherited stroke (which outlines every path) with an outer-outline-only filter applied to the overall rendered alpha.

- In `assets/branding/logo.svg`, remove the root `<svg>` stroke-related attributes (`stroke`, `stroke-width`, `stroke-linejoin`, `stroke-linecap`, `paint-order`) so paths are no longer individually stroked.
- Wrap the existing artwork content into a single wrapper group (e.g. `<g id="tuireel-mark">...</g>`), without changing any path data.
- Add a `<defs>` filter that creates an outline ring from `SourceAlpha`:
  - `feMorphology` with `operator="dilate"` to expand alpha outward by a small radius.
  - `feComposite` with `operator="out"` to subtract the original `SourceAlpha`, yielding ONLY the outside ring (do not apply a generic stroke on paths).
  - `feFlood` (or `feColorMatrix`) to color the ring using the existing secondary token color (`#F5ECD9`).
  - Composite the colored ring behind the original art.
- Render order:
  1. Outline layer using `<use href="#tuireel-mark" filter="url(#outer-outline)" />` (or equivalent wrapper `<g>` with the filter).
  2. Original `<g id="tuireel-mark">` on top.

Goal: The outline is computed from the overall silhouette alpha (so internal path boundaries are not stroked).
</action>
<verify>
rg -n "<filter" assets/branding/logo.svg
rg -n "feMorphology" assets/branding/logo.svg
rg -n "stroke=\"" assets/branding/logo.svg && exit 1 || true
</verify>
<done>

- `assets/branding/logo.svg` contains a filter-based outline and no longer has a root-level inherited stroke.
- The outline is applied to a wrapper group / `<use>` (not to individual paths).
  </done>
  </task>

<task type="auto">
  <name>Task 2: Remove logo-dark, rewire README + docs to the single logo, and sync docs copy</name>
  <files>assets/branding/logo-dark.svg (delete), docs/images/logo-dark.svg (delete), docs/images/logo.svg (add), docs/docs.json, README.md, assets/branding/brand-system.md</files>
  <action>
Make the single-logo contract true across the repo.

- Delete `assets/branding/logo-dark.svg` and `docs/images/logo-dark.svg`.
- Create `docs/images/logo.svg` as a byte-equal copy of `assets/branding/logo.svg`.
- Update `docs/docs.json`:
  - Set `logo.light` to `/images/logo.svg`.
  - Set `logo.dark` to `/images/logo.svg`.
  - Do not introduce additional logo variants.
- Update `README.md` to reference ONLY the single logo:
  - Remove the `<picture>` block and replace with a single `<img>` pointing at `assets/branding/logo.svg`.
  - Ensure no references to `assets/branding/logo-dark.svg` remain.
- Update `assets/branding/brand-system.md` "Logo assets" section to document ONLY `assets/branding/logo.svg` and update the docs copy path to `docs/images/logo.svg`.
  </action>
  <verify>
  test ! -f assets/branding/logo-dark.svg
  test ! -f docs/images/logo-dark.svg
  cmp -s docs/images/logo.svg assets/branding/logo.svg
  rg -n "\"logo\"\s*:\s*\{" -n docs/docs.json
  rg -n "\"(light|dark)\"\s*:\s*\"/images/logo\\.svg\"" docs/docs.json
  rg -n "logo-dark\\.svg|logo-light\\.svg" README.md docs/docs.json assets/branding/brand-system.md && exit 1 || true
  rg -n "<picture>" README.md && exit 1 || true
  </verify>
  <done>
  - Deprecated logo variant files are removed.
  - README and docs only reference the single logo.
  - `docs/images/logo.svg` is byte-equal to `assets/branding/logo.svg`.
    </done>
    </task>

<task type="auto">
  <name>Task 3: Update brand verification to enforce single-logo contract</name>
  <files>scripts/verify-brand-system.ts</files>
  <action>
Update `scripts/verify-brand-system.ts` to enforce the new single-logo, no-variants contract and to fail loudly if deprecated files or references reappear.

- Remove all `logo-dark`-specific logic:
  - Remove `brandingLogoDark`/`docsLogoDark` constants.
  - Remove `assertFileByteEqual(docsLogoDark, brandingLogoDark)`.
  - Remove `verifyLogoVariantFills(...)` and its call.
- Add new canonical logo paths:
  - `docsLogo = docs/images/logo.svg`
  - Assert `assertFileByteEqual(docsLogo, brandingLogo)`.
- Update docs.json assertions:
  - `docs/docs.json.logo.light === "/images/logo.svg"`
  - `docs/docs.json.logo.dark === "/images/logo.svg"`
- Add "deprecated files must not exist" checks:
  - `assets/branding/logo-dark.svg`
  - `assets/branding/logo-light.svg`
  - `docs/images/logo-dark.svg`
  - `docs/images/logo-light.svg`
- Tighten README drift checks:
  - Must reference `assets/branding/logo.svg`.
  - Must NOT reference `assets/branding/logo-dark.svg` or `assets/branding/logo-light.svg`.
  - Must NOT contain a `<picture>` logo block.

Keep output grep-friendly (existing `ERROR:` prefix pattern) and avoid adding new dependencies.
</action>
<verify>
pnpm -s tsx scripts/verify-brand-system.ts
</verify>
<done>

- `pnpm -s tsx scripts/verify-brand-system.ts` passes with the new single-logo contract.
- Re-introducing any deprecated logo variant or referencing it from README/docs causes the script to fail.
  </done>
  </task>

</tasks>

<verification>
- `pnpm -s tsx scripts/verify-brand-system.ts` passes.
- `rg -n "logo-dark\\.svg|logo-light\\.svg" README.md docs/docs.json assets/branding/brand-system.md scripts/verify-brand-system.ts` returns no matches.
</verification>

<success_criteria>

- Only `assets/branding/logo.svg` remains as the logo asset; no logo variant files exist.
- README and docs render a single logo path with no dark/light switching.
- The logo outline is computed as an outer silhouette (filter-based), not per-path strokes.
- The brand verification script enforces all of the above.
  </success_criteria>

<output>
After completion, create `.planning/quick/006-branding-single-original-logo-svg-with-o/006-SUMMARY.md`.
</output>
