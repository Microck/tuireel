# Phase 14: Verify Ops Phases (10-12) - Research

**Researched:** 2026-03-04
**Domain:** GSD phase verification reports + v1.1 milestone audit gate
**Confidence:** HIGH

## User Constraints

- No Phase 14 `CONTEXT.md` found (no additional locked decisions for this phase).
- Phase 14 is gap-closure only: create missing verification artifacts for Phase 10/11/12 so `/gsd-audit-milestone v1.1` stops flagging them as "unverified phase".
- Known gaps in Phase 11/12 are intentionally deferred to later gap-closure phases (Phase 15/16). Phase 14 must not "fix" CI wiring or publish installability; it must report them accurately.

## Summary

Phase 14 is not about implementing Documentation/CI/Release features; those phases are already marked complete. The missing deliverable is verification coverage: numeric `10-VERIFICATION.md`, `11-VERIFICATION.md`, `12-VERIFICATION.md` under their phase directories. The milestone audit treats missing phase verification as a BLOCKER regardless of implementation state.

Phase 10 is expected to verify cleanly with a mix of artifact checks (docs site files) plus optional human validation (Mintlify dev server + page navigation). Phase 11 and Phase 12 should likely be marked `gaps_found` because the current milestone audit already identifies real integration breakages (type-check not actually type-checking; published package not installable), and Phase 14's job is to record those gaps (not to resolve them).

**Primary recommendation:** Create `10-VERIFICATION.md`, `11-VERIFICATION.md`, `12-VERIFICATION.md` using the canonical template, tie each phase's ROADMAP success criteria to explicit "observable truths" with concrete evidence, then re-run `/gsd-audit-milestone v1.1` and record proof that the missing-verification blocker strings are gone.

## Standard Stack

### Core

| Tool/Artifact                |    Version | Purpose                                                           | Why Standard                                        |
| ---------------------------- | ---------: | ----------------------------------------------------------------- | --------------------------------------------------- |
| GSD verification template    |        N/A | Canonical report structure + status semantics                     | Standardized terminology consumed by audit workflow |
| YAML frontmatter in Markdown |        N/A | Machine-parsable `phase`, `status`, `score`, `verified` timestamp | Used by audit flow to aggregate phase states        |
| pnpm + Turbo scripts         | repo-local | Repeatable build/lint/test/benchmark evidence                     | Repo is pinned to `pnpm@10.28.2` in `package.json`  |

### Supporting

| Tool                                 | Purpose                    | When to Use                                              |
| ------------------------------------ | -------------------------- | -------------------------------------------------------- |
| Mintlify dev server (`mintlify dev`) | Runtime docs-site evidence | Phase 10 truth: "docs site serves with navigation"       |
| ffprobe/ffmpeg                       | Video metadata evidence    | Only if verifying video smoke outputs locally (optional) |

**Installation:** None for Phase 14. Use existing repo tooling and the template at `/home/ubuntu/.config/opencode/get-shit-done/templates/verification-report.md`.

## Architecture Patterns

### Report Naming (Audit Gate)

- Use numeric filenames for these phases (matches `.planning/ROADMAP.md`):
  - `.planning/phases/10-documentation/10-VERIFICATION.md`
  - `.planning/phases/11-ci-linting/11-VERIFICATION.md`
  - `.planning/phases/12-release-performance/12-VERIFICATION.md`
- Write reports using goal-backward verification (truths -> artifacts -> wiring) per `/home/ubuntu/.config/opencode/get-shit-done/workflows/verify-phase.md`.

### Pattern 1: Verify Phase 10 (Documentation) via "Docs Site Contract"

**What:** Treat `docs/` as a product: config + content pages + navigation wiring.
**When to use:** Phase 10 truths about Mintlify serving, quickstart usability, and reference completeness.
**Evidence sources (artifacts):** `docs/docs.json`, all `docs/*.mdx` pages created in Phase 10 summaries.

### Pattern 2: Verify Phase 11/12 with "Honest Gaps" (Do Not Paper Over)

**What:** If ROADMAP truths depend on external systems (GitHub Actions, npm publish) or known broken wiring, mark them as `gaps_found` (or `human_needed` when appropriate) and explain exact reproduction steps.
**When to use:** Phase 11 truth about type-check, Phase 12 truth about `npx tuireel` installability.
**Evidence sources:** `.github/workflows/ci.yml`, `.github/workflows/video-smoke.yml`, `.github/workflows/release.yml`, `.planning/v1.1-MILESTONE-AUDIT.md`.

## Don't Hand-Roll

| Problem                    | Don't Build               | Use Instead                                                                       | Why                                                 |
| -------------------------- | ------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| Verification report format | Ad-hoc Markdown structure | `/home/ubuntu/.config/opencode/get-shit-done/templates/verification-report.md`    | Standard status + evidence sections                 |
| Stub detection heuristics  | Custom checklists         | `/home/ubuntu/.config/opencode/get-shit-done/references/verification-patterns.md` | Reusable patterns prevent "exists but stub" reports |

## Common Pitfalls

### Pitfall 1: Wrong filename (phase-name vs numeric)

**What goes wrong:** Report is created as `10-documentation-VERIFICATION.md` and audit still flags missing numeric file per ROADMAP expectations.
**How to avoid:** Always write `10-VERIFICATION.md`, `11-VERIFICATION.md`, `12-VERIFICATION.md` in their phase dirs.

### Pitfall 2: Marking Phase 11/12 as passed despite known blockers

**What goes wrong:** Verification claims `passed` while `.planning/v1.1-MILESTONE-AUDIT.md` already documents broken type-check and broken `npx` install.
**How to avoid:** Treat those as Phase 15/16 gaps; record them in the Phase 11/12 reports as `gaps_found` with concrete evidence and links to the audit items.

### Pitfall 3: Treating `/gsd-audit-milestone` as a bash command

**What goes wrong:** Plan attempts to run `/gsd-audit-milestone` inside an automated bash executor.
**How to avoid:** Use a checkpoint/human-action step (same pattern as `.planning/phases/13-verify-phases-08-09/13-03-PLAN.md`).

## Code Examples

### Minimal Evidence Commands (Recommended)

```bash
# Phase 11/12 baseline evidence
pnpm lint
pnpm build
pnpm test

# Phase 12 performance evidence (local)
pnpm benchmark

# Phase 10 docs server evidence (runtime; likely human-needed to browse)
pnpm -C docs dev
```

### Navigation Coverage Check (Docs)

```bash
node -e "const fs=require('fs'); const cfg=JSON.parse(fs.readFileSync('docs/docs.json','utf8')); const slugs=new Set(); const walk=(x)=>{ if(!x) return; if(Array.isArray(x)) return x.forEach(walk); if(typeof x==='string') slugs.add(x); else if(typeof x==='object') Object.values(x).forEach(walk); }; walk(cfg.navigation); const missing=[...slugs].filter(s=>!fs.existsSync('docs/'+s+'.mdx')); console.log('nav slugs', slugs.size); if(missing.length){ console.error('missing mdx for', missing); process.exit(1); }"
```

## Open Questions

1. **Should Phase 10's "Quickstart produces first recording" be treated as human verification?**
   - What we know: It depends on external deps (ffmpeg, capture environment) and actual user experience.
   - Recommendation: Mark as `human_needed` unless a full local record run is reproducible; still cite the Quickstart doc completeness as artifact evidence.

## Sources

### Primary (HIGH confidence)

- `/home/ubuntu/.config/opencode/get-shit-done/templates/verification-report.md` - canonical report shape and status values
- `/home/ubuntu/.config/opencode/get-shit-done/workflows/verify-phase.md` - report naming + verification method
- `/home/ubuntu/.config/opencode/get-shit-done/workflows/audit-milestone.md` - audit gate behavior for missing VERIFICATION.md
- `/home/ubuntu/.config/opencode/get-shit-done/references/verification-patterns.md` - stub/wiring checks
- `.planning/ROADMAP.md` - Phase 10/11/12 success criteria and Phase 14 goals
- `.planning/v1.1-MILESTONE-AUDIT.md` - known Phase 10/11/12 verification gaps + integration issues
- `.planning/phases/10-documentation/*-PLAN.md` + `*-SUMMARY.md` - doc artifacts and intended truths
- `.planning/phases/11-ci-linting/*-PLAN.md` + `*-SUMMARY.md` - CI artifacts and intended truths
- `.planning/phases/12-release-performance/*-PLAN.md` + `*-SUMMARY.md` - release/perf artifacts and intended truths

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - all requirements and tooling are local and explicitly defined
- Architecture: HIGH - verify/audit workflows define required structure and naming
- Pitfalls: HIGH - directly derived from audit blockers and existing Phase 13 gap-closure patterns

**Research date:** 2026-03-04
**Valid until:** 2026-04-03 (re-check if GSD workflows or audit gate change)
