---
phase: quick-002
plan: 002
type: execute
wave: 1
depends_on: []
files_modified: [README.md]
autonomous: true
---

<objective>
Expand README.md following webreel's structure with comprehensive sections, up-to-date CI/CD badges, npm info, and full feature documentation.

Purpose: Current README is functional but sparse compared to webreel's. Needs expanded examples, config docs, and accurate project metadata.
Output: Comprehensive README.md matching webreel's depth and structure.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite README.md with expanded structure</name>
  <files>README.md</files>
  <action>
  Rewrite README.md following webreel's structure but adapted for Tuireel (terminal recorder, not browser).

Structure to follow:

1. Logo/banner (keep existing)
2. Tagline + badges (keep existing, verify accuracy)
3. One-paragraph description explaining what Tuireel does
4. Links: Documentation + GitHub
5. Quick Start with init/record flow
6. Usage section with all 5 CLI commands (init, record, preview, composite, validate) each with multiple example invocations
7. Step Types table (all 10 types with fields and descriptions)
8. Config Options split into Top-level and Per-video sections (matching webreel's depth)
9. Presets section (polished, minimal, demo, silent)
10. Themes section (8 built-in themes listed)
11. Sound Effects section (built-in SFX, background tracks)
12. Multi-video configs section
13. Development section (prerequisites, setup, common commands table)
14. Packages table
15. License

Keep all existing accurate content. Add depth, not fluff.
</action>
<verify>README.md exists, has all sections, no broken badge URLs</verify>
<done>README.md has comprehensive documentation matching webreel's depth with all Tuireel features documented</done>
</task>

</tasks>
