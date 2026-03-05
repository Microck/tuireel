# Phase 17: Fix Multi-Format Record Outputs (CI Smoke) - Research

**Researched:** 2026-03-04
**Domain:** CLI/core output-path normalization for record --format
**Confidence:** HIGH

## User Constraints

- Goal: `tuireel record --format` produces format-consistent outputs so CI can reliably record and validate MP4, WebM, and GIF in one job.
- Gap: `record --format` overwrites output path; MP4/WebM/GIF flow broken; audit observed WebM container written to `smoke-output.mp4`.
- Current hotspots:
  - `packages/cli/src/commands/record.ts` sets `format` but does not adjust `output`.
  - `packages/core/src/watch.ts` sets `format` but does not adjust `output`.
  - `packages/cli/src/commands/composite.ts` already rewrites output extension via `resolveOutputPath(configOutputPath, format)`.
  - `.github/workflows/video-smoke.yml` expects distinct `smoke-output.mp4`, `smoke-output.webm`, `smoke-output.gif`.
- Constraints: keep backward compatibility in mind, but prioritize deterministic CI/video outputs; use existing pnpm workspace + vitest; no mocks in tests.

## Summary

The core pipeline selects the encoding branch from `format` (override) rather than from the output filename extension (see `packages/core/src/compositor.ts` `resolveFormat(outputPath, override)`). This means `--format webm` can legitimately write WebM bytes into a path ending in `.mp4` without failing. CI then probes the wrong filename and the multi-format job overwrites artifacts.

Primary recommendation: define a single contract that treats `format` as authoritative and normalizes the `output` path extension to match the selected format (auto-rewrite, not error), implemented once as a shared helper and used in both CLI and core watch (and optionally core record) so logs and behavior stay consistent.

## Standard Stack

### Core

| Library | Version | Purpose                  | Why Standard              |
| ------- | ------- | ------------------------ | ------------------------- |
| pnpm    | 10.28.2 | monorepo package manager | repo lock + CI uses pnpm  |
| vitest  | ^3.2.4  | unit tests               | already used in workspace |

## Recommended Contract: output + format

Contract (prescriptive):

1. `format` is authoritative for container/codec selection.
2. When a `format` override is present (CLI `--format` or API option), the effective output path MUST be normalized to end with `.<format>`.
3. Normalization rule:
   - If `output` has no extension: append `.<format>`.
   - Else: replace the last path extension with `.<format>`.
4. No hard error on mismatch (backward-compat + CI determinism); optionally emit a verbose/debug log like `Rewriting output path: smoke-output.mp4 -> smoke-output.webm`.
5. When `format` is not provided: preserve current behavior (format inferred by extension in compositor; defaults to mp4).

Rationale (local evidence):

- `packages/core/src/compositor.ts` chooses the finalize path by resolved `format` and writes to `outputPath` regardless of its extension; extension mismatch is therefore a real footgun in multi-format runs.

## Architecture Patterns

### Single shared helper

Use one helper to avoid duplicated logic and keep CLI/core behavior identical.

Recommended placement: `packages/core/src/utils/output-path.ts` exported from `packages/core/src/index.ts`.

Then:

- CLI: `packages/cli/src/commands/record.ts` applies helper when building the per-video `resolvedConfig` so pre/post logs reference the actual filename.
- Core watch: `packages/core/src/watch.ts` applies helper in `resolveRecordConfig()` for the same reason.
- CLI composite: replace local `resolveOutputPath()` with the shared helper (delete duplication).

Optional hardening (MEDIUM confidence, but recommended):

- Core `packages/core/src/recorder.ts` (or exported `record()` wrapper) can normalize internally as a last line of defense for non-CLI callers.

## Don't Hand-Roll

| Problem                    | Don't Build                                   | Use Instead                                       | Why                                    |
| -------------------------- | --------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| Multi-format output naming | ad-hoc string replaces in multiple call sites | single shared `resolveOutputPath(output, format)` | prevents drift; keeps CI deterministic |

## Common Pitfalls

### Pitfall: “format changes encoding, not filename”

What goes wrong: `--format webm` writes WebM bytes to `smoke-output.mp4`; downstream tooling probes/archives the wrong path.
How to avoid: normalize the output filename extension whenever `format` is set.

### Pitfall: fixing only one entrypoint

What goes wrong: CLI non-watch path fixed, but watch mode (or other core callers) still overwrites.
How to avoid: apply helper at least in `packages/cli/src/commands/record.ts` and `packages/core/src/watch.ts`, and consider core-level normalization too.

## Test Strategy (no mocks)

### Unit tests (preferred)

Add tests for the helper in core:

- New test file: `packages/core/src/utils/__tests__/output-path.test.ts`
- Table-driven cases:
  - `smoke-output.mp4` + `webm` -> `smoke-output.webm`
  - `smoke-output` + `gif` -> `smoke-output.gif`
  - `dir/name.webm` + `mp4` -> `dir/name.mp4`
  - `name.tar.gz` + `webm` -> `name.tar.webm` (documented behavior: replace last extension)

### Minimal runtime verification (optional)

Rely on existing CI video-smoke steps rather than adding heavy record/compositor tests (recording uses real terminal session + ffmpeg).

## Impacted Files (expected)

- `packages/cli/src/commands/record.ts`
- `packages/core/src/watch.ts`
- `packages/cli/src/commands/composite.ts` (dedupe helper)
- `packages/core/src/utils/output-path.ts` (new)
- `packages/core/src/index.ts` (export helper)
- `packages/core/src/utils/__tests__/output-path.test.ts` (new)

## Verification Commands

Local (matches CI intent):

```bash
pnpm install
pnpm -w build
node packages/cli/dist/index.js record packages/core/test/fixtures/smoke.tuireel.jsonc --format mp4
node packages/cli/dist/index.js record packages/core/test/fixtures/smoke.tuireel.jsonc --format webm
node packages/cli/dist/index.js record packages/core/test/fixtures/smoke.tuireel.jsonc --format gif
ls -la smoke-output.*
ffprobe -v quiet -print_format json -show_format -show_streams smoke-output.mp4 | head -n 5
ffprobe -v quiet -print_format json -show_format -show_streams smoke-output.webm | head -n 5
ffprobe -v quiet -print_format json -show_format -show_streams smoke-output.gif | head -n 5
pnpm -w test
```

## Open Questions

1. Should verbose/debug logging explicitly warn on rewritten output paths?
   - What we know: rewrite is desirable for CI determinism.
   - Recommendation: log only when rewrite occurs; show in normal mode (one line) or verbose/debug (more detail).

## Sources

Primary (repo-local):

- `.planning/v1.1-MILESTONE-AUDIT.md` (evidence + CI-04 gap)
- `.github/workflows/video-smoke.yml` (expected filenames)
- `packages/cli/src/commands/record.ts` (format set, output untouched)
- `packages/core/src/watch.ts` (format set, output untouched)
- `packages/cli/src/commands/composite.ts` (existing extension rewrite helper)
- `packages/core/src/compositor.ts` (format override controls encode/finalize)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH (verified in `package.json`)
- Architecture/entrypoints: HIGH (verified by reading call sites)
- ffmpeg/muxer gotcha: MEDIUM (observed via audit + consistent with code path using `format` override)

**Valid until:** 2026-04-03 (30 days)
