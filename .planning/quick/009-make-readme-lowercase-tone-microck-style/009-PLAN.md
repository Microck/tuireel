---
phase: quick-009-make-readme-lowercase-tone-microck-style
plan: 009
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
autonomous: true

must_haves:
  truths:
    - "all README headings and prose read in a lowercase tone"
    - "all commands and config examples stay byte-for-byte the same"
    - "brand verifier passes (README references logo.svg + banner.png; no <picture> blocks)"
  artifacts:
    - path: "README.md"
      provides: "lowercase tone while preserving content/structure"
  key_links:
    - from: "README.md"
      to: "scripts/verify-brand-system.ts"
      via: "string checks for assets/branding/logo.svg + assets/branding/banner.png"
      pattern: "assets/branding/(logo\\.svg|banner\\.png)"
---

<objective>
make the repo README read in a microck-style lowercase tone while keeping sections, ordering, and examples the same.

purpose: keep docs voice consistent without breaking existing brand-system contracts.
output: updated `README.md` + passing `scripts/verify-brand-system.ts` checks.
</objective>

<context>
@README.md
@scripts/verify-brand-system.ts
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>task 1: convert headings + prose to lowercase (keep examples intact)</name>
  <files>README.md</files>
  <action>
edit `README.md` to shift tone to lowercase while preserving content/sections/examples:

- headings: convert all markdown headings (`##`, `###`) to lowercase (same words, same structure).
- prose: convert normal paragraphs + list item text to lowercase, including sentence starts.
- keep intact: do not change anything inside fenced code blocks (`bash, `jsonc, etc.), and do not change commands/flags/JSON examples anywhere.
- keep intact: do not change inline code spans (backticks) that represent commands, flags, package names, paths, JSON keys, or literals.

brand-system contract (must keep passing `scripts/verify-brand-system.ts`):

- README must include the literal strings `assets/branding/logo.svg` and `assets/branding/banner.png`.
- README must not contain `<picture>`.
- if `assets/branding/banner.png` is not already referenced, add a non-rendered reference (preferred: an HTML comment like `<!-- assets/branding/banner.png -->`) near the top so visible content/sections remain the same.
  </action>
  <verify>
  open `README.md` diff and confirm: only casing changes in prose/headings; fenced blocks unchanged; `assets/branding/logo.svg` + `assets/branding/banner.png` present; no `<picture>`.
  </verify>
  <done>
  `README.md` reads in a lowercase tone; code blocks/commands/json examples are unchanged.
  </done>
  </task>

<task type="auto">
  <name>task 2: run brand-system drift verifier</name>
  <files>README.md</files>
  <action>run the repo verifier to ensure README still satisfies branding drift rules.</action>
  <verify>`pnpm -s tsx scripts/verify-brand-system.ts`</verify>
  <done>command exits 0 and prints "Brand system verification passed."</done>
</task>

</tasks>

<success_criteria>

- `README.md` keeps the same section structure and examples, but reads in a lowercase voice.
- `pnpm -s tsx scripts/verify-brand-system.ts` passes.
  </success_criteria>
