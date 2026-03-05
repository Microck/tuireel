---
phase: quick-005-fix-logo-dark-stroke-ensure-dark-variant
plan: 005
type: execute
wave: 1
depends_on: []
files_modified:
  - assets/branding/logo-dark.svg
  - docs/images/logo-dark.svg
  - scripts/verify-brand-system.ts
autonomous: true
must_haves:
  truths:
    - "assets/branding/logo-dark.svg has a visible outline (stroke does not match the #F5ECD9 fill)"
    - "assets/branding/logo-dark.svg is provably the dark-background variant (fill uses #F5ECD9, not #141015)"
    - "Brand drift verification fails fast if logo.svg and logo-dark.svg are swapped"
    - "docs/images/logo-dark.svg stays byte-equal to assets/branding/logo-dark.svg"
  artifacts:
    - path: "assets/branding/logo-dark.svg"
      provides: "Dark-background logo variant with contrasting outline stroke"
    - path: "scripts/verify-brand-system.ts"
      provides: "Drift assertion that locks logo.svg vs logo-dark.svg fill colors"
    - path: "docs/images/logo-dark.svg"
      provides: "Docs copy byte-equal to canonical dark logo"
  key_links:
    - from: "scripts/verify-brand-system.ts"
      to: "assets/branding/logo.svg"
      via: "new fill-color drift assertion"
      pattern: "logo\\.svg.*fill=\"#141015\""
    - from: "scripts/verify-brand-system.ts"
      to: "assets/branding/logo-dark.svg"
      via: "new fill-color drift assertion"
      pattern: "logo-dark\\.svg.*fill=\"#F5ECD9\""
    - from: "scripts/verify-brand-system.ts"
      to: "docs/images/logo-dark.svg"
      via: "assertFileByteEqual"
      pattern: "assertFileByteEqual\\(docsLogoDark, brandingLogoDark\\)"
---

<objective>
Fix the dark logo outline visibility (stroke contrast) and lock in the correct light-vs-dark SVG variant colors so the assets cannot be accidentally swapped.

Purpose: Ensure the README/docs always render the intended logo variant and keep the brand assets drift-resistant.
Output: Updated `assets/branding/logo-dark.svg` + synced docs copy + stronger drift checks in `scripts/verify-brand-system.ts`.
</objective>

<execution_context>
@/home/ubuntu/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/ubuntu/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@assets/branding/palette.json
@assets/branding/logo.svg
@assets/branding/logo-dark.svg
@docs/images/logo-dark.svg
@README.md
@scripts/verify-brand-system.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make logo-dark stroke visible via contrasting beige</name>
  <files>assets/branding/logo-dark.svg, docs/images/logo-dark.svg</files>
  <action>
Keep the existing root-level inherited stroke approach, but change the stroke color so it contrasts with the main light fill (#F5ECD9).

- In `assets/branding/logo-dark.svg`, change ONLY the root `<svg>` `stroke` attribute value from `#F5ECD9` to a new darker beige (use `#DCC9A8`).
- Keep `stroke-width`, line join/cap, and `paint-order="stroke fill"` unchanged (do not rewrite any path data).
- Sync `docs/images/logo-dark.svg` to be byte-equal to the updated `assets/branding/logo-dark.svg`.
  </action>
  <verify>
  rg -n 'stroke="#DCC9A8"' assets/branding/logo-dark.svg
  rg -n 'fill="#F5ECD9"' assets/branding/logo-dark.svg
  cmp -s docs/images/logo-dark.svg assets/branding/logo-dark.svg
  </verify>
  <done>
  - `assets/branding/logo-dark.svg` has `stroke="#DCC9A8"` and retains `fill="#F5ECD9"` on the light paths.
  - `docs/images/logo-dark.svg` is byte-equal to `assets/branding/logo-dark.svg`.
    </done>
    </task>

<task type="auto">
  <name>Task 2: Add drift assertion locking logo vs logo-dark fill colors</name>
  <files>scripts/verify-brand-system.ts</files>
  <action>
Prevent accidental swapping of `logo.svg` and `logo-dark.svg` by asserting expected fill colors for each variant.

- In `scripts/verify-brand-system.ts`, read both SVG files as UTF-8 (use existing `readUtf8`).
- Add grep-friendly assertions:
  - `assets/branding/logo-dark.svg` MUST contain `fill="#F5ECD9"`.
  - `assets/branding/logo-dark.svg` MUST NOT contain `fill="#141015"`.
  - `assets/branding/logo.svg` MUST contain `fill="#141015"`.
  - `assets/branding/logo.svg` MUST NOT contain `fill="#F5ECD9"`.
- Keep the existing `assertFileByteEqual(docsLogoDark, brandingLogoDark)` drift check; do not relax byte-equality.
  </action>
  <verify>
  pnpm -s tsx scripts/verify-brand-system.ts
  </verify>
  <done>
  - Swapping the two logo files causes `scripts/verify-brand-system.ts` to fail with a clear error message.
  - With correct variants, `pnpm -s tsx scripts/verify-brand-system.ts` passes.
    </done>
    </task>

</tasks>

<verification>
- `pnpm -s tsx scripts/verify-brand-system.ts` passes.
- `cmp -s docs/images/logo-dark.svg assets/branding/logo-dark.svg` confirms byte-equality.
</verification>

<success_criteria>

- The outline on `assets/branding/logo-dark.svg` is visible (stroke differs from fill on the light (#F5ECD9) paths).
- A drift assertion prevents `assets/branding/logo.svg` and `assets/branding/logo-dark.svg` from being swapped.
  </success_criteria>

<output>
After completion, create `.planning/quick/005-fix-logo-dark-stroke-ensure-dark-variant/005-SUMMARY.md`.
</output>
