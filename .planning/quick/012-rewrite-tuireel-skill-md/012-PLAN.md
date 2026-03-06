---
phase: quick-012-rewrite-tuireel-skill-md
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - skills/tuireel/SKILL.md
autonomous: true

must_haves:
  truths:
    - "A user can tell when to use the tuireel skill (record/preview/validate/composite/config authoring)"
    - "A user can run a minimal init -> preview -> record loop without guessing commands or default paths"
    - "A user can identify where outputs/artifacts land and what to gitignore"
    - "A user can debug common failures via --verbose/--debug and the known env overrides"
  artifacts:
    - path: "skills/tuireel/SKILL.md"
      provides: "Skill triggers + repeatable workflow for tuireel"
      contains:
        - "## quick start"
        - "## cli commands"
        - "## config structure"
        - "## step types"
        - "## tips"
        - "## reference files"
  key_links:
    - from: "skills/tuireel/SKILL.md"
      to: "README.md"
      via: "commands/flags alignment"
      pattern: "tuireel (init|record|preview|composite|validate)"
    - from: "skills/tuireel/SKILL.md"
      to: "skills/tuireel/steps-reference.md"
      via: "reference link"
      pattern: "steps-reference\\.md"
    - from: "skills/tuireel/SKILL.md"
      to: "skills/tuireel/examples.md"
      via: "reference link"
      pattern: "examples\\.md"
---

<objective>
Rewrite `skills/tuireel/SKILL.md` so it reads like a real OpenCode skill: clear triggers, a repeatable workflow, and concrete success criteria.

Purpose: Make the tuireel skill immediately usable for end users (not internal monorepo notes).
Output: Updated `skills/tuireel/SKILL.md` aligned with the quality bar of webreel's skill.
</objective>

<execution_context>
@/home/ubuntu/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/ubuntu/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@skills/tuireel/SKILL.md
@README.md
@skills/tuireel/examples.md
@skills/tuireel/steps-reference.md

Reference structure/quality bar (do not copy verbatim):

- https://raw.githubusercontent.com/vercel-labs/webreel/main/skills/webreel/SKILL.md
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite SKILL.md as a user-facing skill</name>
  <files>skills/tuireel/SKILL.md</files>
  <action>
Replace the current internal-style content with a skill-style workflow modeled on the webreel structure, but specific to tuireel.

Requirements for the new `skills/tuireel/SKILL.md`:

- Keep the existing YAML frontmatter, but rewrite `description` to be user-facing (what tuireel does + when to use this skill).
- Add a clear "when to use" / trigger section early (copy-pasteable trigger phrases):
  - recording terminal demos, creating a `.tuireel.jsonc`, debugging a recording, using `tuireel record/preview/validate/composite`, adding a new step type.
- Add pragmatic sections with runnable snippets (ensure each command is real per `README.md`):
  - `## installation` (global install and `npx`/`bunx` usage from README)
  - `## prerequisites` (ffmpeg auto-download to `~/.tuireel/bin/ffmpeg`, mention `TUIREEL_FFMPEG_PATH` override; avoid promising more env vars than exist)
  - `## .gitignore` (recommend ignoring `.tuireel/` artifacts)
  - `## quick start` (init -> preview -> record; mention default config path)
  - `## cli commands` (init/record/preview/composite/validate; include flags shown in README)
  - `## config structure` (single-video + multi-video; `$include` pattern; keep tables concise)
  - `## step types` (table listing the step types and key fields; align to README list)
  - `## tips` (author loop: validate -> preview -> record; use `--watch`, `--verbose`, `--debug`; use `composite` to tweak overlays)
  - `## troubleshooting` (common failure modes: missing config path, waits timing out, ffmpeg download problems; what to try)
  - `## reference files` with links to repo-local references:
    - `skills/tuireel/steps-reference.md`
    - `skills/tuireel/examples.md`
    - `README.md`

Content boundaries:

- Do NOT keep the detailed monorepo architecture tables as the main body.
- If contributor-focused pointers are useful, add a short final section like "for repo contributors" that points to concrete files (no deep dive).
- Keep tone consistent with repo docs (lowercase, direct).
  </action>
  <verify>

1. Ensure SKILL.md contains all required sections: `rg -n "^## (installation|prerequisites|\\.gitignore|quick start|cli commands|config structure|step types|tips|troubleshooting|reference files)$" skills/tuireel/SKILL.md`
2. Spot-check commands/flags match README: `rg -n "tuireel (init|record|preview|composite|validate)" skills/tuireel/SKILL.md README.md`
   </verify>
   <done>
   `skills/tuireel/SKILL.md` reads like a standalone skill: clear triggers, runnable command snippets, config guidance, troubleshooting, and explicit success checks.
   </done>
   </task>

<task type="auto">
  <name>Task 2: Accuracy + drift pass against repo sources</name>
  <files>skills/tuireel/SKILL.md</files>
  <action>
Do an accuracy sweep to ensure the rewritten skill doesn't introduce drift:

- Cross-check CLI flags and defaults against `README.md` (treat README as user-facing source of truth for commands).
- Cross-check any environment variables mentioned:
  - `TUIREEL_HOME` (schema output path override in init)
  - `TUIREEL_FFMPEG_PATH` (ffmpeg override; referenced in `.planning/research/PITFALLS.md`)
- Ensure the step type list matches the README list (`launch`, `type`, `press`, `wait`, `pause`, `scroll`, `click`, `screenshot`, `resize`, `set-env`).
- Ensure references to `.tuireel/` artifacts are consistent with existing docs (raw/timeline artifacts) without over-specifying internal file names.
  </action>
  <verify>

1. `rg -n "TUIREEL_(HOME|FFMPEG_PATH)" skills/tuireel/SKILL.md packages/cli/src/commands/init.ts .planning/research/PITFALLS.md`
2. `rg -n "\\b(type):\\s*`" skills/tuireel/SKILL.md`(manual spot-check: step type table matches README)
  </verify>
  <done>
No obvious doc drift: every command, flag, and env var mentioned in`skills/tuireel/SKILL.md` exists in repo sources and matches user-facing docs.
   </done>
   </task>

</tasks>

<verification>
- `skills/tuireel/SKILL.md` is user-usable without reading internal source files.
- A new user can follow: install -> init -> preview -> record, and knows what to ignore/where outputs land.
</verification>

<success_criteria>

- The skill contains explicit triggers + a runnable author loop.
- The skill has clear troubleshooting guidance, including what `--verbose`/`--debug` are for.
- The skill links to repo-local reference docs for deeper details.
  </success_criteria>

<output>
After completion, create `.planning/quick/012-rewrite-tuireel-skill-md/012-SUMMARY.md`.
</output>
