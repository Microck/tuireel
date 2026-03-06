---
phase: quick-011-remove-em-dashes-from-readme-docs-add-sk
plan: 011
subsystem: docs
tags: [docs, skills, ascii, hygiene]

requires: []
provides:
  - Removed all Unicode em dashes (U+2014) from user-facing docs (*.mdx)
  - Added webreel-style companion skill docs for tuireel (config examples + step reference)
  - Kept brand-system verifier passing
affects: [docs, skills]

tech-stack:
  added: []
  patterns:
    - Keep user-facing docs ASCII-clean (no Unicode em dashes)
    - Skill docs should mirror real schema (packages/core/src/config/schema.ts)

key-files:
  created:
    - skills/tuireel/examples.md
    - skills/tuireel/steps-reference.md
  modified:
    - docs/cli-reference.mdx
    - docs/introduction.mdx
    - docs/multi-video.mdx
    - docs/presets.mdx
    - docs/quickstart.mdx
    - docs/sound.mdx
    - docs/themes.mdx

key-decisions:
  - "Replace em dashes with ASCII punctuation; use '-' as table placeholder"
  - "Create skill examples and step reference as plain markdown, not a generated artifact"

completed: 2026-03-06
---

# Phase quick-011-remove-em-dashes-from-readme-docs-add-sk Plan 011 Summary

**Docs are now free of Unicode em dashes, and the tuireel skill folder includes two practical companion references for configs and step types.**

## Accomplishments

- Replaced all `—` characters in `docs/*.mdx` with ASCII punctuation (and `-` placeholders in tables)
- Added `skills/tuireel/examples.md` with copy-pasteable `.tuireel.jsonc` examples (single + multi-video + $include)
- Added `skills/tuireel/steps-reference.md` aligned to `packages/core/src/config/schema.ts`
- Verified `pnpm -s tsx scripts/verify-brand-system.ts` passes

## Task Commits

1. **Task 1: Replace Unicode em dashes in docs** - `99bacfd` (docs)
2. **Task 2: Add skill examples + step reference** - `6785264` (docs)

## Verification

- `rg "—" README.md docs/*.mdx skills/tuireel/*.md` returns zero matches
- `pnpm -s tsx scripts/verify-brand-system.ts` exits 0

## Deviations from Plan

None - executed as planned.
