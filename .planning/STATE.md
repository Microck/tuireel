---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Human Demo Feel
current_phase: 30
current_phase_name: pacing provenance and acceptance
current_plan: 02
status: in_progress
stopped_at: Completed 30-01-PLAN.md
last_updated: "2026-03-09T03:06:47.493Z"
last_activity: 2026-03-09
progress:
  total_phases: 8
  completed_phases: 5
  total_plans: 19
  completed_plans: 17
  percent: 98
---

# Project State: Tuireel

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-08)
**Core value:** TUI tool authors can produce polished demo videos from a declarative script, without manual screen recording, editing, or post-production.
**Current focus:** Phase 30 pacing provenance and acceptance is in progress; saved artifact truth now carries pacing provenance and the remaining gap-closure work moves to inspect plus paced acceptance evidence

## Current Position

**Current Phase:** 30
**Current Phase Name:** pacing provenance and acceptance
**Total Phases:** 32
**Current Plan:** 02
**Total Plans in Phase:** 3
**Status:** In Progress
**Last Activity:** 2026-03-09
**Last Activity Description:** Completed 30-01-PLAN.md

**Progress:** [██████████] 98%

## Performance Metrics

**Velocity:**

- Total plans completed: 83
- Current milestone plans completed: 15
- Total execution time: 86 min

**By Milestone:**

| Milestone    | Plans  | Status   |
| ------------ | ------ | -------- | ------- |
| v1.0         | 23/23  | Complete |
| v1.1         | 38/38  | Complete |
| v1.15        | 5/5    | Complete |
| v1.2         | 12/12  | Complete |
| Phase 25 P02 | 4 min  | 3 tasks  | 8 files |
| Phase 25 P03 | 10 min | 2 tasks  | 7 files |
| Phase 25 P04 | 10 min | 2 tasks  | 3 files |
| Phase 25 P05 | 4 min  | 2 tasks  | 2 files |
| Phase 26 P01 | 4 min  | 2 tasks  | 7 files |
| Phase 26 P02 | 5 min  | 2 tasks  | 6 files |
| Phase 27 P01 | 7 min  | 2 tasks  | 9 files |
| Phase 28 P01 | 4 min  | 2 tasks  | 2 files |
| Phase 28 P02 | 4 min  | 2 tasks  | 2 files |
| Phase 29 P01 | 5 min  | 1 tasks  | 7 files |
| Phase 29 P02 | 12 min | 2 tasks  | 3 files |
| Phase 29 P03 | 7 min  | 2 tasks  | 4 files |
| Phase 29 P04 | 7 min  | 2 tasks  | 3 files |
| Phase 29 P05 | 29 min | 1 tasks  | 1 files |
| Phase 30 P01 | 6 min  | 2 tasks  | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in `.planning/PROJECT.md`.
Recent decisions affecting v1.2:

- Keep Tuireel PTY-native and two-pass; do not pivot toward browser recording.
- Keep the milestone deterministic and testable; no random jitter as default humanization.
- Improve motion by capturing more real terminal states, not by optical-flow or glyph interpolation.
- [Phase 25]: Keep `preset` visual-only and add a separate `deliveryProfile` field for timing/readability defaults. — This preserves the shipped preset mental model while giving Phase 25 one authoritative timing/readability layer.
- [Phase 25]: Resolve delivery profiles in the shared loader so single-video and multi-video flows keep the same precedence rules. — Applying resolution in one loader path avoids drift between record, watch, preview, and future composite timing enforcement.
- [Phase 25]: Treat explicit `fps`, `captureFps`, and readability fields as authoritative over profile defaults. — Authors need named profiles for fast setup without losing direct control over raw capture cadence or final delivery cadence.
- [Phase 25]: Default tuireel init to readable-1080p so delivery profiles become the first author-facing workflow.
- [Phase 25]: Prompt for delivery profile before optional preset so timing intent is chosen before visual polish.
- [Phase 25]: Keep README, docs, and skill examples aligned on stacked preset plus deliveryProfile examples and corrected cadence language.
- [Phase 25]: Keep TimelineData.fps as the backward-compatible output cadence alias while adding a versioned timingContract object for explicit inspection. — This preserves existing artifact readers while giving later composite and diagnostics flows one explicit timing contract boundary.
- [Phase 25]: Compare only timing-affecting fields in the shared compatibility helper and return an explicit legacy fallback when saved artifacts predate timingContract. — Packaging-only changes should stay recomposite-safe, and legacy artifacts need an explicit non-guessing path for later CLI enforcement.
- [Phase 25]: Validate recomposite requests against saved timingContract metadata before compose() runs. — Composite should preserve recorded pacing by default and fail before packaging work when timing intent drifts.
- [Phase 25]: Treat explicit legacy fps, captureFps, or deliveryProfile requests as timing changes that require a fresh record. — Legacy timelines do not encode enough timing metadata to safely adopt new pacing settings during recomposition.
- [Phase 25]: Use saved timingContract-backed fixtures in compositor tests so packaging-only recomposition is proven outside the CLI path. — This closes the verification gap at the core compose boundary without moving timing enforcement into compose().
- [Phase 25]: Lock the legacy helper message and allow-packaging-only fallback semantics in core tests while treating captureFps drift as a timing mismatch. — CLI and future diagnostics need one conservative shared timing contract for legacy artifacts and capture cadence changes.
- [Phase 26]: Support both named pacing profiles and inline pacing objects in the config schema.
- [Phase 26]: Keep charDelay backward compatible by preserving the legacy constants whenever no pacing profile is provided.
- [Phase 26]: Keep automatic beats opt-in through ExecuteStepsOptions.pacing so scripts without pacing stay unchanged.
- [Phase 26]: Resolve type speed per step as speed override first, then profile baseSpeedMs, then the legacy default.
- [Phase 27]: Delivery profiles now carry typography defaults through config and session render options so readable-1080p works with named themes.
- [Phase 27]: Readable-1080p compositor tests import the built-in profile and assert the exact 1920x1080 inset filter output.
- [Phase 28]: Keep shouldCaptureTypedCharacter as an exported semantic hook but make it trivially return true so future phases can retune capture density without changing recorder call sites.
- [Phase 28]: Capture the final typed state before resuming polling, and apply the same explicit post-step capture flow to press, scroll, and wait while leaving pause untouched.
- [Phase 28]: Export resolveTerminalFrameFileIndex directly so dense and sparse frame-hold behavior is testable without introducing a helper clone.
- [Phase 28]: Drive compositor outputFrameCount from effectiveFrames.length so dense capture increases fidelity without stretching authored wall-clock timing.
- [Phase 29]: Keep compositor internals private and reimplement the raw frame decode wrapper inside diagnostics. — Diagnostics only needs a narrow decode helper, so duplicating the ffmpeg wrapper avoids turning compositor internals into public API.
- [Phase 29]: Fallback to ffprobe on PATH when the cached ffmpeg binary has no sibling ffprobe binary. — The workspace ships ffmpeg without a colocated ffprobe, so diagnostics must resolve the system binary to stay usable.
- [Phase 29]: Keep diagnostics CLI helpers local to the new command files instead of widening shared CLI infrastructure during this plan.
- [Phase 29]: Make tuireel inspect --json emit the raw core report while human-readable mode adds formatted sections and artifact paths.
- [Phase 29]: Keep acceptance fixtures recording fresh artifacts in temp workdirs and assert on tolerant ranges instead of exact timings. — Real recordings provide milestone evidence, and range-based checks stay stable under PTY and encoder variance.
- [Phase 29]: Teach Vitest to discover .acceptance.ts files so the acceptance suite runs through normal package and workspace test commands. — The new acceptance gates must participate in targeted and full-suite verification without special-case discovery.
- [Phase 29]: Keep final output probing caller-driven in core by accepting `outputVideoPath` instead of inferring artifact paths inside `inspectRecording()`. — This preserves a narrow core boundary and keeps config/output resolution in the CLI layer that already knows the user-facing config path.
- [Phase 29]: Resolve inspect final output metadata from `config.output` in the CLI and keep `--json` aligned with the raw `InspectReport` shape. — Authors get full inspection context in one command without adding CLI-only data reshaping to the JSON contract.
- [Phase 29]: Keep smooth-output continuity scoring local to the acceptance file with sharp-based adjacent PNG comparisons.
- [Phase 29]: Use a deterministic slow-print fixture command so the continuity gate measures a real visible transition without depending on shell echo behavior.
- [Phase 30]: Keep pacing provenance inside the existing timingContract instead of creating a parallel artifact store.
- [Phase 30]: Persist both pacing source metadata and the resolved cadence snapshot used at record time so config drift cannot erase artifact truth.

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 28 likely needs fixture-driven capture budget validation before the policy is locked.

## Session Continuity

Last session: 2026-03-09T03:06:47.486Z
Stopped at: Completed 30-01-PLAN.md
Resume file: None
