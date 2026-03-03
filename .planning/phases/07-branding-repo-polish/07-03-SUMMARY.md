---
phase: 07-branding-repo-polish
plan: 03
subsystem: repo-templates
tags: [github, issue-templates, pr-template, community]

requires:
  - phase: none
    provides: standalone
provides:
  - "YAML issue templates for structured bug reports and feature requests"
  - "PR template with What/Why/How to test sections"
  - "Blank issues disabled via config.yml"
affects: [contributing-guide, community-health]

tech-stack:
  added: []
  patterns: ["YAML form-based issue templates (not markdown)"]

key-files:
  created:
    - ".github/ISSUE_TEMPLATE/bug-report.yml"
    - ".github/ISSUE_TEMPLATE/feature-request.yml"
    - ".github/ISSUE_TEMPLATE/config.yml"
    - ".github/pull_request_template.md"
  modified: []

key-decisions:
  - "Used YAML form templates instead of markdown templates for structured validation"
  - "Kept PR template minimal (3 sections, no checklists)"

patterns-established:
  - "YAML issue forms with required field validation"

duration: 1min
completed: 2026-03-03
---

# Phase 7 Plan 3: GitHub Issue & PR Templates Summary

**YAML issue forms (bug report + feature request) with field validation, and minimal What/Why/How PR template**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-03T21:13:58Z
- **Completed:** 2026-03-03T21:15:14Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- Bug report form with 4 structured fields (3 required): description, config repro, system info, error output
- Feature request form with 3 fields (2 required): description, suggested solution, alternatives
- Blank issues disabled — all issues must use a template
- Clean PR template with What/Why/How to test sections

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GitHub issue templates (YAML format)** - `ff4a1ab` (feat)
2. **Task 2: Create GitHub PR template** - `942f1fd` (feat)

## Files Created/Modified

- `.github/ISSUE_TEMPLATE/bug-report.yml` - Structured bug report form with jsonc/shell render blocks
- `.github/ISSUE_TEMPLATE/feature-request.yml` - Feature request form with user story placeholder
- `.github/ISSUE_TEMPLATE/config.yml` - Disables blank issues
- `.github/pull_request_template.md` - What/Why/How to test sections with HTML comment placeholders

## Decisions Made

- Used YAML form templates (not markdown) for structured field validation and required fields
- Kept PR template to 3 sections with no checklists — guides without creating paperwork

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Issue templates and PR template ready for community use
- Ready for plan 07-04

## Self-Check: PASSED

- All 4 created files exist on disk
- Both task commits verified in git history (ff4a1ab, 942f1fd)

---
*Phase: 07-branding-repo-polish*
*Completed: 2026-03-03*
