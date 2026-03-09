# Project Milestones: Tuireel

## v1.2 Human Demo Feel (Shipped: 2026-03-09)

**Delivered:** Tuireel demos now carry explicit timing contracts, deterministic pacing, readable 1080p defaults, denser real-state capture, artifact-backed diagnostics, and automated acceptance gates that prove the milestone on representative outputs.

**Phases completed:** 25-35 (24 plans total)

**Key accomplishments:**

- Split raw capture cadence from delivery cadence and made saved recordings recomposite-safe through persisted timing contracts.
- Added pacing profiles, beat injection, and real preview/record wiring so authors get more human-feeling demos without hand-tuning every step.
- Shipped `readable-1080p` defaults that keep terminal text legible and naturally framed inside a 1920x1080 canvas.
- Increased visible motion fidelity by capturing more authentic terminal states and preserving authored wall-clock timing in final output.
- Added `tuireel inspect`, `tuireel dump-frames`, and artifact-backed acceptance coverage for pacing, readability, and smooth-output continuity.
- Re-closed the milestone with pacing provenance, exported-artifact readability proof, final-output continuity assertions, and repeated-run stability automation.

**Stats:**

- 11 phases, 24 plans, 47 tasks
- 70 files changed, 6,901 insertions, 312 deletions
- 13 of 13 scoped requirements complete
- 2 days from kickoff to completion (2026-03-08 -> 2026-03-09)

**Git range:** `c6f53d0` -> `46ac79f`

**Audit:** `.planning/milestones/v1.2-MILESTONE-AUDIT.md`

**What's next:** Define the next milestone; phases 36-37 remain as carry-over Nyquist cleanup outside the shipped v1.2 scope.

---

## v1.1 Branding, Docs & Hardening (Shipped: 2026-03-05)

**Delivered:** Tuireel shipped as a polished open-source release with full branding/docs, hardened runtime behavior, and deterministic CI/release smoke gates across npm and Bun install paths.

**Phases completed:** 7-19 (38 plans total)

**Key accomplishments:**

- Shipped complete project identity and community surface (logo system, banner/OG assets, README, contributing and issue/PR templates).
- Delivered Mintlify docs covering quickstart, full config/steps/CLI references, and feature guides (themes, presets, sound, multi-video/includes).
- Added preset/reliability/diagnostics hardening with verbose/debug logging, actionable errors, and improved process/timeout handling.
- Closed CI/release integration gaps with deterministic type-check wiring, multi-format smoke assertions, and failure artifact handling.
- Fixed publish/installability regressions (`workspace:*` removal, package-version sourcing, npx/bunx smoke validation).
- Hardened Bun publish smoke with tarball equivalence checks, nested-core detection, export-surface probing, and robust cleanup.

**Stats:**

- 157 files modified
- 23,687 insertions, 1,058 deletions
- 13 phases, 38 plans, 65 tasks
- 3 days from v1.1 kickoff to archive (2026-03-03 -> 2026-03-05)

**Git range:** `0d7b2a9` -> `fb9a4b8`

**What's next:** Start v1.2 milestone planning and convert carried tech debt checks into explicit requirement-level closure work.

---

## v1.0 MVP (Shipped: 2026-03-03)

**Delivered:** Scripted terminal recording reached production scope with format exports (MP4/WebM/GIF), overlay compositing, audio mixing, and workflow automation.

**Phases completed:** 1-6 (23 plans total)

**Key accomplishments:**

- Built monorepo foundation with JSONC config schema, CLI init/validate flows, and ffmpeg auto-download caching.
- Implemented end-to-end recording pipeline from step execution to frame capture and encoding.
- Added production output quality features: WebM, two-pass GIF generation, and built-in/custom terminal themes.
- Delivered two-pass overlay system with InteractionTimeline persistence, animated cursor, HUD, and recomposite CLI.
- Added optional synced sound effects plus custom audio track mixing for record/composite flows.
- Completed workflow polish with preview mode, watch mode, multi-video config support, reusable step includes, and npm/Bun packaging.

**Stats:**

- 113 files created/modified
- 13,306 lines added (TypeScript + docs)
- 6 phases, 23 plans, 50 tasks
- <1 day from kickoff to ship (2026-03-02 -> 2026-03-03)

**Git range:** `561c662` -> `4029d42`

**What's next:** v1.1 reliability and release-hardening milestone (stability, performance, and publishing automation).

---
