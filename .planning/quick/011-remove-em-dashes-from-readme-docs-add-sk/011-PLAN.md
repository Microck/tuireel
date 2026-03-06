---
phase: quick-011-remove-em-dashes-from-readme-docs-add-sk
plan: 011
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/cli-reference.mdx
  - docs/introduction.mdx
  - docs/multi-video.mdx
  - docs/presets.mdx
  - docs/quickstart.mdx
  - docs/sound.mdx
  - docs/themes.mdx
  - skills/tuireel/examples.md
  - skills/tuireel/steps-reference.md
autonomous: true

must_haves:
  truths:
    - "docs/*.mdx contain zero Unicode em dash (U+2014) characters"
    - "skills/tuireel/examples.md and skills/tuireel/steps-reference.md exist and reflect the real tuireel config + step schema"
    - "brand verifier still passes"
  artifacts:
    - path: "skills/tuireel/examples.md"
      provides: "copy-pasteable tuireel JSONC config examples"
    - path: "skills/tuireel/steps-reference.md"
      provides: "step type reference aligned to packages/core/src/config/schema.ts"
  key_links:
    - from: "skills/tuireel/steps-reference.md"
      to: "packages/core/src/config/schema.ts"
      via: "documents step types and required fields"
      pattern: "launch|type|press|wait|pause|scroll|click|screenshot|resize|set-env"
---

<objective>
remove all Unicode em dashes from docs, and add webreel-style skill reference companion docs (examples + step reference) for tuireel.

purpose: keep docs ASCII-clean and give agents two concrete, repo-accurate references for writing configs.
output: updated docs/_.mdx and new skills/tuireel/_.md files.
</objective>

<context>
@docs/cli-reference.mdx
@docs/introduction.mdx
@docs/multi-video.mdx
@docs/presets.mdx
@docs/quickstart.mdx
@docs/sound.mdx
@docs/themes.mdx
@packages/core/src/config/schema.ts
@skills/tuireel/SKILL.md
@scripts/verify-brand-system.ts
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>task 1: replace Unicode em dashes in docs/*.mdx</name>
  <files>
docs/cli-reference.mdx
docs/introduction.mdx
docs/multi-video.mdx
docs/presets.mdx
docs/quickstart.mdx
docs/sound.mdx
docs/themes.mdx
  </files>
  <action>
replace all U+2014 em dashes (`—`) in docs prose, headings, and frontmatter with ASCII punctuation.

rules:

- do not change code blocks or inline code.
- for prose, prefer `-` (space-hyphen-space) when used as punctuation.
- for markdown tables using `—` as a placeholder value, replace with `-`.
  </action>
  <verify>`rg "—" docs/*.mdx` returns zero matches</verify>
  <done>docs/\*.mdx contain zero `—` characters</done>
  </task>

<task type="auto">
  <name>task 2: add webreel-style skill companion docs for tuireel</name>
  <files>
skills/tuireel/examples.md
skills/tuireel/steps-reference.md
  </files>
  <action>
create two new files, modeled after webreel's skill docs, but accurate to tuireel:

- `skills/tuireel/examples.md`: a small set of copy-pasteable `.tuireel.jsonc` examples, including at least: minimal hello-world, wait with regex pattern, multi-video with defaults+videos array, and $include usage.
- `skills/tuireel/steps-reference.md`: step type reference aligned to `packages/core/src/config/schema.ts`, documenting each step's required + optional fields, plus the `$include` directive shape.

constraints:

- ASCII-only (no Unicode dashes).
- do not invent step types or fields; only those in `packages/core/src/config/schema.ts`.
  </action>
  <verify>
  `rg "—" skills/tuireel/*.md` returns zero matches
  and the step list matches `STEP_TYPES` in `packages/core/src/config/schema.ts`
  </verify>
  <done>
  new files exist and can be used by an agent to author a valid `.tuireel.jsonc` without guessing field names.
  </done>
  </task>

<task type="auto">
  <name>task 3: run brand-system verifier</name>
  <files>
docs/cli-reference.mdx
docs/introduction.mdx
docs/multi-video.mdx
docs/presets.mdx
docs/quickstart.mdx
docs/sound.mdx
docs/themes.mdx
skills/tuireel/examples.md
skills/tuireel/steps-reference.md
  </files>
  <action>run the repo's doc + branding drift gate.</action>
  <verify>`pnpm -s tsx scripts/verify-brand-system.ts`</verify>
  <done>command exits 0.</done>
</task>

</tasks>

<success_criteria>

- `rg "—" docs/*.mdx` returns zero matches.
- `skills/tuireel/examples.md` and `skills/tuireel/steps-reference.md` exist and are schema-accurate.
- `pnpm -s tsx scripts/verify-brand-system.ts` passes.

</success_criteria>

<output>
after completion, create `.planning/quick/011-remove-em-dashes-from-readme-docs-add-sk/011-SUMMARY.md` and update `.planning/STATE.md`.
</output>
