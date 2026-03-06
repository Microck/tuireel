---
phase: quick-012-rewrite-tuireel-skill-md
plan: 01
subsystem: docs
tags: [docs, skills, opencode]

requires: []
provides:
  - Rewrote skills/tuireel/SKILL.md as a standalone, user-facing OpenCode skill
  - Added a runnable init -> preview -> record author loop and clear artifact/gitignore guidance
  - Cross-checked commands, flags, step types, and env vars against repo sources
affects: [docs, skills]

tech-stack:
  added: []
  patterns:
    - Keep skill docs aligned with README command surface area and CLI sources
    - Prefer concrete, runnable snippets over monorepo architecture notes

key-files:
  created:
    - .planning/quick/012-rewrite-tuireel-skill-md/012-SUMMARY.md
  modified:
    - skills/tuireel/SKILL.md

key-decisions:
  - "Document TUIREEL_FFMPEG_PATH as not currently supported; do not imply an env override that is not wired"

completed: 2026-03-06
---

# Phase quick-012-rewrite-tuireel-skill-md Plan 01 Summary

**The tuireel skill now reads like a real OpenCode skill: clear triggers, a repeatable workflow, and concrete debugging guidance.**

## Accomplishments

- Replaced internal monorepo notes with a user-facing skill workflow (when to use, quick start, cli reference)
- Added concise config guidance (single vs multi-video, $include) and a step type table aligned with README
- Added troubleshooting with actionable next steps (`--verbose`, `--debug`, waits, ffmpeg download issues)
- Linked repo-local references for deeper step/config details

## Task Commits

1. **Task 1: Rewrite SKILL.md as a user-facing skill** - `d5d51f0` (docs)
2. **Task 2: Accuracy + drift pass against repo sources** - `3ef91f4` (docs)

## Verification

- `rg -n "^## (installation|prerequisites|\\.gitignore|quick start|cli commands|config structure|step types|tips|troubleshooting|reference files)$" skills/tuireel/SKILL.md`
- `rg -n "tuireel (init|record|preview|composite|validate)" skills/tuireel/SKILL.md README.md`
- `rg -n "TUIREEL_(HOME|FFMPEG_PATH)" skills/tuireel/SKILL.md packages/cli/src/commands/init.ts .planning/research/PITFALLS.md`

## Deviations from Plan

None - executed as planned.

## Self-Check: PASSED

- FOUND: `.planning/quick/012-rewrite-tuireel-skill-md/012-PLAN.md`
- FOUND: `.planning/quick/012-rewrite-tuireel-skill-md/012-SUMMARY.md`
- FOUND commits: `d5d51f0`, `3ef91f4`
