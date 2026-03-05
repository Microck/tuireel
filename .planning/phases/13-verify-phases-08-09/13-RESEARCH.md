# Phase 13: Verify Runtime Phases (08-09) - Research

**Researched:** 2026-03-04
**Domain:** GSD phase verification reports + milestone audit gate
**Confidence:** HIGH

## User Constraints

- No Phase 13 `CONTEXT.md` found (no additional locked decisions for this phase).
- Prior milestone decisions (from STATE.md / upstream context): Mintlify for docs, GitHub Actions for CI, Apache 2.0 license.
- Phase 13 is gap-closure only: create missing verification artifacts for Phase 08 + Phase 09 so `/gsd-audit-milestone` stops flagging them as “unverified phase”.

## Summary

Phase 13 is not about implementing features; it is about producing 2 phase verification reports that follow the GSD verifier workflow: goal-backward “truths → artifacts → wiring → requirements → runtime evidence”. The milestone audit gate only needs the `*-VERIFICATION.md` files to exist, but to avoid future audit gaps these reports should aim for `status: passed` with concrete evidence.

**Primary recommendation:** Create `.planning/phases/08-presets-reliability/08-VERIFICATION.md` and `.planning/phases/09-diagnostics/09-VERIFICATION.md` using the official template, and back each phase’s ROADMAP success criteria with a mix of code refs + tests + minimal runtime CLI runs.

## Standard Stack

### Core
| Tool/Artifact | Version | Purpose | Why Standard |
|---|---:|---|---|
| GSD verification template | N/A | Canonical report structure + status semantics | Audit tooling expects this shape and terminology |
| YAML frontmatter in Markdown | N/A | Machine-parsable phase status + timestamp | Used by audit flow to extract `status`, `score`, and gaps |
| pnpm + Turbo scripts | repo-local | Build/test evidence | Existing monorepo package manager + task runner |
| `node packages/cli/dist/index.js` | repo-local | Runtime CLI evidence without global install | Avoids PATH/global bin assumptions |

### Supporting
| Tool | Purpose | When to Use |
|---|---|---|
| `ffprobe` / `ffmpeg` | Verify output streams (audio present, etc.) | When a success criterion is runtime-media related |

**Installation:** None for this phase (docs-only). Use existing repo tooling.

## Architecture Patterns

### Report Naming (Audit Gate)

- The verifier workflow writes `${PHASE_DIR}/${PHASE_NUM}-VERIFICATION.md`.
- For Phase 08 and 09, the ROADMAP success criteria explicitly require:
  - `.planning/phases/08-presets-reliability/08-VERIFICATION.md`
  - `.planning/phases/09-diagnostics/09-VERIFICATION.md`

Source: `/home/ubuntu/.config/opencode/get-shit-done/workflows/verify-phase.md` (REPORT_PATH logic) and `.planning/ROADMAP.md`.

### Pattern 1: Goal-Backward Verification
**What:** Derive 3-7 “observable truths” from ROADMAP success criteria and/or plan frontmatter `must_haves`, then prove each truth by checking artifacts and wiring.
**When to use:** Always for phase verification reports.
**Example (Phase 09 flags):**
```text
Truth: `tuireel record --verbose` shows step-by-step progress.
Artifacts: `packages/core/src/logger.ts`, `packages/cli/src/commands/record.ts`, `packages/core/src/recorder.ts`.
Wiring: CLI flag -> LogLevel -> createLogger -> recorder/compositor log calls.
Runtime: run record with --verbose and quote representative output lines.
```

### Anti-Patterns to Avoid
- **Wrong filename:** using `08-presets-reliability-VERIFICATION.md` instead of `08-VERIFICATION.md` (ROADMAP and `verify-phase.md` expect the numeric filename).
- **Evidence without reruns:** citing plan summaries only; prefer fresh `pnpm test` / `pnpm build` output and at least one runtime CLI command per phase.
- **Status inflation:** claiming `passed` when key ROADMAP truths still require human/runtime checks; if a truth can’t be verified, mark `human_needed` and list the exact test.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Verification report structure | Custom ad-hoc Markdown format | `/home/ubuntu/.config/opencode/get-shit-done/templates/verification-report.md` | Audit/verifier terminology is standardized |
| Stub detection heuristics | New bespoke checklist | `/home/ubuntu/.config/opencode/get-shit-done/references/verification-patterns.md` | Prevents missing common “exists but stub” failures |

## Common Pitfalls

### Pitfall 1: Missing the Phase-Level Truths
**What goes wrong:** Report lists implementation details (files/commits) but does not explicitly verify ROADMAP success criteria.
**How to avoid:** Copy Phase 08 and Phase 09 success criteria from `.planning/ROADMAP.md` and map each criterion to at least one truth row.

### Pitfall 2: Interactive `init` Prompt Evidence
**What goes wrong:** `tuireel init` preset prompt is TTY-gated, so non-interactive runs won’t show it.
**How to avoid:** Treat this as human verification unless you can run in a real TTY. Evidence source in code: `packages/cli/src/commands/init.ts` (`process.stdin.isTTY` + `promptPreset()` + `preset` insertion).

### Pitfall 3: “Ctrl+C Cleanup” is Hard to Prove
**What goes wrong:** Signal handling exists but partial outputs or temp dirs remain, or ffmpeg processes linger.
**How to avoid:** Verify both recorder and compositor signal handlers exist and cleanup paths run:
- `packages/core/src/recorder.ts` includes `SIGINT`/`SIGTERM` handlers.
- `packages/core/src/compositor.ts` includes `SIGINT`/`SIGTERM` handlers and best-effort `rm(outputPath, { force: true })` on interrupt.

## Code Examples

### Minimal Verification Commands (Recommended)
```bash
# Baseline build + tests (evidence for both phases)
pnpm build
pnpm test

# Phase 09 runtime evidence (verbose/debug output exists)
node packages/cli/dist/index.js record --verbose /tmp/tuireel-verify-09.jsonc
node packages/cli/dist/index.js record --debug /tmp/tuireel-verify-09.jsonc

# Phase 09 error guidance evidence ("Try:" pattern)
node packages/cli/dist/index.js validate /tmp/tuireel-invalid.jsonc

# Phase 08 runtime evidence (preset affects output) - keep minimal
node packages/cli/dist/index.js record /tmp/tuireel-preset-polished.jsonc
```

### Key Code Anchors To Cite In Reports

- Presets: `packages/core/src/presets/built-in.ts`, `packages/core/src/presets/resolve.ts`, `packages/core/src/config/loader.ts`, `packages/core/src/config/schema.ts`, `packages/cli/src/commands/init.ts`.
- Reliability: `packages/core/src/recorder.ts` (signals), `packages/core/src/compositor.ts` (signals + partial output cleanup), `packages/core/src/executor/step-executor.ts` + `packages/core/src/executor/steps/wait.ts` (defaultWaitTimeout).
- Diagnostics: `packages/core/src/logger.ts`, `packages/core/src/recorder.ts`, `packages/core/src/compositor.ts`, `packages/cli/src/commands/record.ts`/`preview.ts`/`composite.ts` (flags).
- Actionable errors: `packages/core/src/**` error messages with `Try:` (Phase 09 plan 02).

## State of the Art

| Old Approach | Current Approach | Evidence | Impact |
|---|---|---|---|
| Phase verification files named `{phase-name}-VERIFICATION.md` | Phase verification files expected to be `{PHASE_NUM}-VERIFICATION.md` for new phases | `/home/ubuntu/.config/opencode/get-shit-done/workflows/verify-phase.md` | Audit gap-closure phases (08+) should follow numeric naming to match ROADMAP requirements |

## Open Questions

1. **Should Phase 08’s “1000+ frames” truth be proven by a real runtime run or treated as architecture-only?**
   - What we know: Plan 08-04 includes architectural justification for long recordings; ROADMAP success criterion is explicitly runtime.
   - Recommendation: Do one runtime run producing 1000+ frames (e.g. ~18s @ 60fps) and cite completion + no lingering ffmpeg processes (best-effort check).

## Sources

### Primary (HIGH confidence)
- `/home/ubuntu/.config/opencode/get-shit-done/workflows/verify-phase.md` - report naming + verification procedure
- `/home/ubuntu/.config/opencode/get-shit-done/workflows/audit-milestone.md` - audit gate behavior for missing VERIFICATION.md
- `/home/ubuntu/.config/opencode/get-shit-done/templates/verification-report.md` - canonical report format
- `/home/ubuntu/.config/opencode/get-shit-done/references/verification-patterns.md` - stub/wiring checks
- `.planning/ROADMAP.md` - Phase 08/09 success criteria; Phase 13 gap-closure requirements
- `.planning/v1.1-MILESTONE-AUDIT.md` - current gaps (“Phase 08/09 missing VERIFICATION.md”)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all sourced from repo + GSD workflow docs
- Architecture: HIGH - explicit verifier/audit workflows define required structure
- Pitfalls: HIGH - directly observed in ROADMAP + prior phase verification patterns

**Research date:** 2026-03-04
**Valid until:** 2026-04-03 (workflow conventions stable, but re-check if GSD updated)
