---
phase: 17-fix-multi-format-record-outputs
verified: 2026-03-04T16:31:42Z
status: passed
score: 5/5 must-haves verified
---

# Phase 17: Fix Multi-Format Record Outputs (CI Smoke) Verification Report

**Phase Goal:** `tuireel record --format` produces format-consistent outputs so CI can reliably record and validate MP4, WebM, and GIF in one job.
**Verified:** 2026-03-04T16:31:42Z
**Status:** passed

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                 | Status   | Evidence                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `record --format mp4\|webm\|gif` writes to filenames ending with matching extensions                                                  | VERIFIED | `packages/cli/src/commands/record.ts` normalizes `output` via `resolveOutputPath()`; local smoke produced `smoke-output.mp4`, `smoke-output.webm`, `smoke-output.gif` |
| 2   | Watch mode applies same output-path normalization                                                                                     | VERIFIED | `packages/core/src/watch.ts` applies `resolveOutputPath(config.output, selectedFormat)` in `resolveRecordConfig()`                                                    |
| 3   | Composite uses shared `resolveOutputPath` helper (no duplicated logic)                                                                | VERIFIED | `packages/cli/src/commands/composite.ts` imports `resolveOutputPath` from `@tuireel/core` and uses it for `outputPath`                                                |
| 4   | CI smoke workflow is deterministic: clears stale outputs, guards file existence, validates codec+resolution+duration for mp4/webm/gif | VERIFIED | `.github/workflows/video-smoke.yml` has `rm -f smoke-output.*`, `test -s smoke-output.<ext>`, and per-format `ffprobe` + node assertions                              |
| 5   | Docs document output filename normalization for record/composite                                                                      | VERIFIED | `docs/cli-reference.mdx` explicitly states extension normalization rule + examples for `record` and `composite`                                                       |

**Score:** 5/5 truths verified

## Required Artifacts

| Artifact                                          | Expected                                        | Status   | Details                                                                                     |
| ------------------------------------------------- | ----------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `packages/core/src/utils/output-path.ts`          | shared helper                                   | VERIFIED | Exports `resolveOutputPath()` using `node:path` `extname()`                                 |
| `packages/core/src/__tests__/output-path.test.ts` | unit tests for normalization                    | VERIFIED | Table-driven cases cover replace/append/idempotence                                         |
| `packages/core/src/index.ts`                      | core exports helper for CLI use                 | VERIFIED | `export { resolveOutputPath } from "./utils/output-path.js";`                               |
| `packages/cli/src/commands/record.ts`             | record normalizes output for selected format    | VERIFIED | `output: selectedFormat ? resolveOutputPath(config.output, selectedFormat) : config.output` |
| `packages/core/src/watch.ts`                      | watch record normalizes output                  | VERIFIED | `output: selectedFormat ? resolveOutputPath(...) : ...`                                     |
| `packages/cli/src/commands/composite.ts`          | composite normalizes output using shared helper | VERIFIED | Uses imported `resolveOutputPath()` (no local duplicate helper present)                     |
| `.github/workflows/video-smoke.yml`               | deterministic multi-format record + validate    | VERIFIED | Explicit per-ext record + `ffprobe` validations + artifact upload on failure                |
| `docs/cli-reference.mdx`                          | docs reflect runtime naming contract            | VERIFIED | Record + composite sections describe extension rewrite when format selected                 |

## Key Link Verification

| From                                     | To                                       | Via                                              | Status | Details                                                                     |
| ---------------------------------------- | ---------------------------------------- | ------------------------------------------------ | ------ | --------------------------------------------------------------------------- |
| `packages/cli/src/commands/record.ts`    | `packages/core/src/utils/output-path.ts` | `@tuireel/core` export                           | WIRED  | `packages/core/src/index.ts` exports helper; CLI imports it                 |
| `packages/core/src/watch.ts`             | `packages/core/src/utils/output-path.ts` | local import                                     | WIRED  | `import { resolveOutputPath } from "./utils/output-path.js";`               |
| `packages/cli/src/commands/composite.ts` | `packages/core/src/utils/output-path.ts` | `@tuireel/core` export                           | WIRED  | CLI imports helper and applies it to composite output                       |
| `.github/workflows/video-smoke.yml`      | `smoke-output.mp4/webm/gif`              | record + `test -s` + `ffprobe` + node assertions | WIRED  | Explicit file paths and validations per format                              |
| `docs/cli-reference.mdx`                 | record/composite contract                | prose                                            | WIRED  | Documents filename normalization triggered by `--format` or config `format` |

## Requirements Coverage

| Requirement | Status    | Blocking Issue               |
| ----------- | --------- | ---------------------------- |
| CI-04       | SATISFIED | None found in Phase 17 scope |

## Evidence (Commands Run)

Unit tests:

```bash
pnpm -w test
```

Local smoke recording (creates three distinct outputs):

```bash
pnpm -w build
rm -f smoke-output.*
node packages/cli/dist/index.js record packages/core/test/fixtures/smoke.tuireel.jsonc --format mp4
node packages/cli/dist/index.js record packages/core/test/fixtures/smoke.tuireel.jsonc --format webm
node packages/cli/dist/index.js record packages/core/test/fixtures/smoke.tuireel.jsonc --format gif
ls -la smoke-output.*
```

Observed outputs (non-empty):

- `smoke-output.mp4` (non-empty)
- `smoke-output.webm` (non-empty)
- `smoke-output.gif` (non-empty)

Local ffprobe validation (codec + width/height + duration fallback chain):

```bash
ffprobe -v quiet -print_format json -show_format -show_streams smoke-output.mp4 > mp4-probe.json
ffprobe -v quiet -print_format json -show_format -show_streams smoke-output.webm > webm-probe.json
ffprobe -v quiet -print_format json -show_format -show_streams smoke-output.gif > gif-probe.json
node -e "/* parse probes; assert codecs h264/vp8|vp9/gif, width/height > 0, duration > 0 */"
```

Observed probe results:

- `mp4-probe.json`: codec `h264`, resolution `336x252`, duration `~5.8s`
- `webm-probe.json`: codec `vp9`, resolution `336x252`, duration `~5.8s`
- `gif-probe.json`: codec `gif`, resolution `336x252`, duration `~5.81s`

## Anti-Patterns Found

No blockers found during targeted review of Phase 17 artifacts (no placeholder/stub behavior observed in the output normalization and CI validation wiring).

---

Verified: 2026-03-04T16:31:42Z
Verifier: gsd-verifier
