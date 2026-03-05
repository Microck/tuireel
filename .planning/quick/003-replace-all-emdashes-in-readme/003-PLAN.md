---
phase: quick-003
plan: 003
type: execute
wave: 1
depends_on: []
files_modified: [README.md]
autonomous: true
must_haves:
  truths:
    - "README contains no Unicode emdashes"
  artifacts:
    - path: "README.md"
      provides: "Project documentation"
  key_links: []
---

<objective>
Replace all Unicode emdashes in README.md with ASCII-safe punctuation.

Purpose: Keep README ASCII-friendly and avoid typographic punctuation that can be hard to type/search.
Output: README.md with zero `—` characters.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Replace emdashes in README.md</name>
  <files>README.md</files>
  <action>
  Replace every `—` in README.md with ` - ` (space hyphen space) where it is used as punctuation.
  Do not introduce `--` sequences.
  </action>
  <verify>`rg "—" README.md` returns zero matches</verify>
  <done>README.md contains no emdash characters</done>
</task>

</tasks>

<output>
After completion, create `.planning/quick/003-replace-all-emdashes-in-readme/003-SUMMARY.md`.
</output>
