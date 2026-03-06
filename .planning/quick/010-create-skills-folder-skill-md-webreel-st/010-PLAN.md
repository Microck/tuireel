---
phase: quick-010-create-skills-folder-skill-md-webreel-st
plan: 010
type: execute
wave: 1
depends_on: []
files_modified:
  - skills/tuireel/SKILL.md
autonomous: true

must_haves:
  truths:
    - "a tuireel skill doc exists at skills/tuireel/SKILL.md with frontmatter name + description"
    - "the skill doc accurately describes tuireel's monorepo structure, CLI commands, and JSONC config format"
    - "brand verifier still passes"
  artifacts:
    - path: "skills/tuireel/SKILL.md"
      provides: "agent skill reference for working in the tuireel repo"
  key_links:
    - from: "skills/tuireel/SKILL.md"
      to: "packages/core/src/config/schema.ts"
      via: "documents step types + config shape"
      pattern: "\\.tuireel\\.jsonc|step types|multi-video"
    - from: "skills/tuireel/SKILL.md"
      to: "packages/cli/src/index.ts"
      via: "documents commander CLI entry point"
      pattern: "commander|register.*Command|tuireel"
---

<objective>
create a `skills/tuireel/SKILL.md` modeled after webreel's skill doc, but accurate to the tuireel monorepo and its JSONC config format.

purpose: give agents a single, repo-specific reference for tuireel structure, core exports, CLI commands, and config schema.
output: new `skills/tuireel/SKILL.md` generated from gemini (headless) and then corrected against source.
</objective>

<context>
@opensrc/repos/github.com/vercel-labs/webreel/skills/webreel/SKILL.md
@packages/core/src/index.ts
@packages/core/src/config/schema.ts
@packages/core/src/config/loader.ts
@packages/cli/src/index.ts
@packages/cli/src/commands/init.ts
@packages/cli/src/commands/record.ts
@packages/cli/src/commands/preview.ts
@packages/cli/src/commands/composite.ts
@packages/cli/src/commands/validate.ts
@README.md
@scripts/verify-brand-system.ts
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>task 1: generate initial skills/tuireel/SKILL.md via gemini (headless)</name>
  <files>skills/tuireel/SKILL.md</files>
  <action>
create the skills folder and generate the initial `skills/tuireel/SKILL.md` content using gemini CLI in non-interactive mode.

requirements:

- output must be a single markdown file.
- use the same frontmatter format as the webreel skill doc: `---` block containing only `name:` and `description:`.
- set `name: tuireel`.
- description should mention that it's a best-practices + architecture reference for the tuireel monorepo and covers the CLI, core, and JSONC config format.
- model the section structure on `opensrc/.../webreel/SKILL.md` (project structure, core API/exports, CLI, config format, conventions).

generate with a command shaped like this (headless mode):

```bash
mkdir -p skills/tuireel

gemini -o text -p "$(cat <<'EOF'
you are writing a repo skill doc.

write skills/tuireel/SKILL.md for the tuireel monorepo.

hard constraints:
- output markdown only, no surrounding commentary.
- start with yaml frontmatter exactly like:
  ---
  name: tuireel
  description: ...
  ---

model it after webreel's skill doc (structure + level of detail), but make it accurate to tuireel:

tuireel high-level:
- pnpm monorepo (turbo at root) with packages:
  - packages/core (package @tuireel/core)
  - packages/cli (package tuireel)
- cli is commander-based, entry: packages/cli/src/index.ts
- default config file path used by commands: .tuireel.jsonc

cli commands (source packages/cli/src/commands/*.ts):
- init: creates a starter .tuireel.jsonc and writes a json schema file to $TUIREEL_HOME or ~/.tuireel/schema.json
- validate: validates a config file (reports jsonc parse errors with line/column when possible)
- preview: runs steps in a visible terminal without recording
- record: records a TUI session to video; supports --format (mp4/webm/gif), --watch, --verbose, --debug
- composite: composites overlays onto an existing recording; supports -c/--config, --format, --cursor-size, --no-cursor, --no-hud, --verbose, --debug

config format (source packages/core/src/config/schema.ts + loader.ts):
- JSONC parsing (trailing commas allowed)
- top-level fields include: $schema, preset, output, format, theme, sound, cursor, hud, fps, cols, rows, defaultWaitTimeout, steps
- step types (discriminated union on step.type): launch, type, press, wait, pause, scroll, click, screenshot, resize, set-env
- $include is supported inside steps arrays via objects like { "\$include": "path/to/file.jsonc" } where the include file has { "steps": [...] }
- multi-video format uses { defaults?: {...}, videos: [{ name, output, steps, ...overrides }] } (videos is an array, not an object)

@tuireel/core exports (source packages/core/src/index.ts):
- config exports: generateJsonSchema, loadConfig/loadSingleConfig, ConfigValidationError, schema constants/types
- main runtime exports: record, preview, compose, watchAndRecord, resolveOutputPath
- sound helpers: resolveSfxPath, ensureSoundAssets, extractSoundEvents, finalizeMp4WithSound/finalizeWebmWithSound, buildAudioMixArgs/buildFullAudioArgs
- timeline: InteractionTimeline + types

include a short 'adding a new step type' section tailored to tuireel:
- update packages/core/src/config/schema.ts (STEP_TYPES + zod schema)
- update any runner/executor in core (if relevant)
- update cli docs/readme as needed

avoid invention: if you mention a filename, command flag, env var, config field, or step type, it must match the details above.
EOF
)" > skills/tuireel/SKILL.md
```

after generating, open the file and ensure it is valid markdown with correct frontmatter and a reasonable section layout.
</action>
<verify>
`test -f skills/tuireel/SKILL.md` and the file begins with a `---` frontmatter block containing `name: tuireel`.
</verify>
<done>
`skills/tuireel/SKILL.md` exists and is a complete first draft produced by gemini headless mode.
</done>
</task>

<task type="auto">
  <name>task 2: correct the generated skill doc against tuireel source</name>
  <files>skills/tuireel/SKILL.md</files>
  <action>
review `skills/tuireel/SKILL.md` for accuracy and alignment with the repo.

must be accurate (do not guess):

- monorepo structure: pnpm + turbo at root, packages/core and packages/cli naming.
- @tuireel/core exports and file references reflect `packages/core/src/index.ts`.
- config format reflects `packages/core/src/config/schema.ts` + `packages/core/src/config/loader.ts`:
  - step types list matches `STEP_TYPES`.
  - `$include` syntax is documented correctly.
  - multi-video config uses `defaults` + `videos` array with `name` fields.
  - default config file name is `.tuireel.jsonc`.
- cli command list and flags reflect `packages/cli/src/index.ts` + command files.
- keep the doc modeled after webreel's SKILL structure, but remove any webreel-specific claims (chrome/cdp, browser selectors, etc.).

style constraints:

- keep it plain markdown, ASCII-only.
- no emojis.
- keep tables concise (ok to use markdown tables, like webreel).
  </action>
  <verify>
  spot-check the doc by grepping for: `.tuireel.jsonc`, `$include`, and the full step type list, then cross-check with `packages/core/src/config/schema.ts`.
  </verify>
  <done>
  the skill doc reads like a repo-native reference and all concrete claims match the referenced source files.
  </done>
  </task>

<task type="auto">
  <name>task 3: run brand-system verifier</name>
  <files>skills/tuireel/SKILL.md</files>
  <action>run the existing verification gate to ensure nothing drifted.</action>
  <verify>`pnpm -s tsx scripts/verify-brand-system.ts`</verify>
  <done>command exits 0.</done>
</task>

</tasks>

<success_criteria>

- `skills/tuireel/SKILL.md` exists and has correct frontmatter (`name:` + `description:` only).
- the content accurately reflects tuireel's packages, CLI commands, and config schema.
- `pnpm -s tsx scripts/verify-brand-system.ts` passes.
  </success_criteria>

<output>
after completion, create `.planning/quick/010-create-skills-folder-skill-md-webreel-st/010-SUMMARY.md`.
</output>
