# Tuireel

## What This Is

Tuireel is a scripted TUI demo recorder. Authors define terminal interactions in declarative JSONC, Tuireel executes the flow in a virtual PTY, captures terminal frames, and renders polished videos (MP4/WebM/GIF) with optional overlays and sound.

## Core Value

TUI tool authors can produce polished demo videos from a declarative script, without manual screen recording, editing, or post-production.

## Current State

- **Shipped milestones:**
  - `v1.0` MVP (phases 1-6)
  - `v1.1` Branding, Docs & Hardening + gap closure (phases 7-19)
  - `v1.15` Brand Refresh & Docs Hosting (phases 20-24)
  - `v1.2` Human Demo Feel (phases 25-35)
- **Current quality posture:** core recording, compositing, docs, branding, and human-feeling demo fidelity milestones are shipped; Tuireel now has timing contracts, pacing, readability, capture-fidelity, diagnostics, and automated acceptance coverage for polished terminal recordings.
- **Execution posture:** no active milestone is defined yet; `v1.2` is archived, and phases 36-37 remain optional carry-over Nyquist cleanup outside the shipped scope.

## Latest Shipped Milestone: v1.2 Human Demo Feel

**Goal:** Make Tuireel demos feel human by improving typing cadence, pause behavior, capture fidelity, and final-motion quality for polished 1080p terminal recordings.

**Target features:**

- Human-looking typing speed and cadence in recorded demos
- Natural pauses and timing beats between actions and states
- Readable, properly scaled 1080p terminal output
- Smooth final motion without sacrificing terminal-specific capture correctness

## Requirements

### Validated

- [x] v1.0 core recording pipeline + CLI workflow + overlays + sound + package distribution
- [x] BRND-01..BRND-05 (project branding package) - v1.1
- [x] REPO-01..REPO-05 (repo polish/community assets) - v1.1
- [x] DOCS-02..DOCS-10 (docs coverage) - v1.1
- [x] PRST-01..PRST-03 (preset schema/defaults/behavior) - v1.1
- [x] RELY-03..RELY-05 (timeout + actionable runtime errors) - v1.1
- [x] DIAG-01..DIAG-03 (verbose/debug diagnostics) - v1.1
- [x] CI-01..CI-05 (CI/video smoke pipeline) - v1.1
- [x] REL-01, REL-04, REL-05 (release/installability gating) - v1.1
- [x] PERF-01..PERF-03 (benchmark + optimization) - v1.1

### Recently Completed

- [x] Define v1.2 milestone scope and requirements for human-feeling demos and capture fidelity
- [x] Improve typing, pause timing, and pacing so terminal demos stop feeling robotic
- [x] Improve capture fidelity so 1080p demos stay readable, properly scaled, and smooth in motion
- [x] Prove the shipped pacing/readability/smoothness surface on exported artifacts and automate the repeated-run acceptance gate

### Out of Scope

- Browser recording (webreel scope)
- Live streaming/asciicast output (non-video scope)
- Built-in video editor (external tooling expected)
- Windows PTY support (tuistory Unix constraint)

## Context

- TypeScript monorepo (`@tuireel/core` + `tuireel` CLI), pnpm workspace, Bun-compatible runtime paths.
- Capture/encode stack: tuistory + ffmpeg + Sharp compositing.
- Milestone archives hold complete historical roadmap/requirements/audit records for shipped versions.

## Key Decisions

| Decision                                                         | Rationale                                                    | Outcome   |
| ---------------------------------------------------------------- | ------------------------------------------------------------ | --------- |
| Use tuistory as PTY automation backend                           | Avoid rebuilding terminal automation internals               | ✓ Good    |
| Monorepo split (`@tuireel/core` + CLI)                           | Clear boundary between engine and command surface            | ✓ Good    |
| Two-pass pipeline (`record` then `composite`)                    | Re-render overlays without rerunning scripts                 | ✓ Good    |
| JSONC + JSON Schema contract                                     | Human-readable configs with IDE support                      | ✓ Good    |
| ffmpeg auto-download cache (`~/.tuireel`)                        | Lower setup friction, deterministic binary path              | ✓ Good    |
| Package-relative SFX resolution and shipped sound assets         | Installed usage must not depend on repo CWD                  | ✓ Good    |
| Deterministic publish smoke (npx + bunx + export-surface checks) | Catch registry/tarball mismatches before release             | ✓ Good    |
| Close v1.1 with explicit tech-debt audit status                  | Preserve shipping momentum while documenting deferred checks | ⚠ Revisit |

## Next Milestone Goals

1. Choose the next product gap now that human-feeling demo fidelity is shipped.
2. Decide whether the next milestone should extend storytelling polish, publishing workflow depth, or a different product surface.
3. Preserve the v1.2 verification surface instead of reopening timing/readability ambiguity.

<details>
<summary>Historical project narrative (pre-v1.1 completion)</summary>

Historical roadmap, requirements, and audit details are archived in:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.2-ROADMAP.md`
- `.planning/milestones/v1.2-REQUIREMENTS.md`
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md`

</details>

---

_Last updated: 2026-03-09 after v1.2 milestone completion_
