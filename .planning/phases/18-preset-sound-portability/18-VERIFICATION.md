---
phase: 18-preset-sound-portability
verified: 2026-03-05T02:05:00Z
status: passed
score: 7/7 must-haves verified
human_verification:
  - test: Run publish smoke end-to-end from a clean shell
    expected: pnpm -w publish:smoke completes with passing npx polished/demo record checks, audio stream checks, and bunx checks when bun is installed
    result: passed
  - test: Record polished/demo from a non-repo directory and check audible SFX
    expected: Both outputs contain an audio stream and audible click/key effects during interaction steps
    result: approved-without-test
approval_note: "User approved phase completion without running audible SFX quality check."
---

# Phase 18: Preset Sound Portability Verification Report

**Phase Goal:** Built-in preset sound effects work in typical installed usage (not repo-CWD dependent), so `polished`/`demo` presets reliably include sound.
**Verified:** 2026-03-05T02:05:00Z
**Status:** passed
**Re-verification:** Yes - user approved human checkpoint

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                  | Status   | Evidence                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `@tuireel/core` tarball includes built-in SFX assets                                   | VERIFIED | `packages/core/package.json:29` includes `assets` in `files`; pack verification listed `package/assets/sounds/click-1.mp3` and `package/assets/sounds/key-1.mp3`                          |
| 2   | Built-in SFX resolve package-relatively first (not repo-CWD dependent)                 | VERIFIED | `packages/core/src/sound.ts:18` resolves from `import.meta.url`; `packages/core/src/sound.ts:23` resolves from `__dirname`; CWD candidates are fallback (`packages/core/src/sound.ts:28`) |
| 3   | Default SFX path resolution works in both ESM and CJS builds                           | VERIFIED | `packages/core/tsup.config.ts:5` builds `esm` + `cjs`; runtime checks from `dist/index.js` and `dist/index.cjs` both resolved to `packages/core/assets/sounds/*.mp3`                      |
| 4   | `publish:smoke` fails when packed core tarball is missing required SFX assets          | VERIFIED | `scripts/publish-smoke.ts:141` reads tar entries, `scripts/publish-smoke.ts:151` marks missing entries as failures, `scripts/publish-smoke.ts:254` exits non-zero when failures exist     |
| 5   | `publish:smoke` runs temp non-repo `npx tuireel record` checks for `polished` + `demo` | VERIFIED | `scripts/publish-smoke.ts:178` creates temp install dir, `scripts/publish-smoke.ts:194` runs `npx tuireel record` for each smoke config                                                   |
| 6   | `publish:smoke` validates MP4 outputs include an audio stream                          | VERIFIED | `scripts/publish-smoke.ts:98` runs ffmpeg `-map 0:a:0` assertion for each preset output; failures are captured via `fail()`                                                               |
| 7   | When bun exists, `publish:smoke` also records via `bunx` in temp non-repo dir          | VERIFIED | `scripts/publish-smoke.ts:202` detects bun, `scripts/publish-smoke.ts:229` runs `bunx --no-install tuireel record`; explicit skip path at `scripts/publish-smoke.ts:236`                  |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact                                  | Expected                                                  | Status   | Details                                                                                     |
| ----------------------------------------- | --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `packages/core/package.json`              | Publish allowlist includes built-in assets                | VERIFIED | Exists; substantive manifest; `files` includes `dist` + `assets`                            |
| `packages/core/assets/sounds/click-1.mp3` | Built-in click SFX present in package source              | VERIFIED | Exists in repo and appears in packed tarball listing                                        |
| `packages/core/assets/sounds/key-1.mp3`   | Built-in key SFX present in package source                | VERIFIED | Exists in repo and appears in packed tarball listing                                        |
| `packages/core/src/sound.ts`              | Package-relative SFX resolver and sound helpers           | VERIFIED | Exists, substantive implementation, exported API wired into core/index + compositor         |
| `scripts/publish-smoke.ts`                | Installed-usage smoke checks for preset sound portability | VERIFIED | Exists, substantive checks for tarball assets, npx/bunx record, and audio stream assertions |
| `package.json`                            | Root script wiring for publish smoke gate                 | VERIFIED | `publish:smoke` runs `tsx scripts/publish-smoke.ts` (`package.json:16`)                     |

### Key Link Verification

| From                                 | To                                     | Via                                         | Status | Details                                                                           |
| ------------------------------------ | -------------------------------------- | ------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `packages/core/package.json`         | `packages/core/assets/sounds/*`        | `files` allowlist                           | WIRED  | Assets are included in pack surface and confirmed by tar listing                  |
| `packages/core/src/sound.ts`         | Packaged `assets/sounds`               | `import.meta.url` / `__dirname` resolution  | WIRED  | Module-relative candidates are checked before CWD fallback                        |
| `packages/core/src/config/loader.ts` | `packages/core/src/presets/resolve.ts` | `resolvePreset()` before schema parse       | WIRED  | Preset defaults are applied during config load (`loader.ts:173`, `loader.ts:221`) |
| `packages/core/src/recorder.ts`      | `packages/core/src/compositor.ts`      | `sound: config.sound` passthrough           | WIRED  | Recorder passes resolved sound config into compose (`recorder.ts:380`)            |
| `scripts/publish-smoke.ts`           | `pnpm --filter "@tuireel/core" pack`   | tarball packing step                        | WIRED  | Core tarball built before smoke assertions (`publish-smoke.ts:116`)               |
| `scripts/publish-smoke.ts`           | Installed `tuireel record`             | temp install + `npx`/`bunx` record commands | WIRED  | Both package-manager paths call record in temp non-repo dirs                      |
| `scripts/publish-smoke.ts`           | Audio stream proof                     | ffmpeg `-map 0:a:0` command                 | WIRED  | Record output is validated for audio stream presence                              |

### Requirements Coverage

| Requirement | Status    | Blocking Issue                                                                                                                                                                                      |
| ----------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRST-03     | SATISFIED | Built-in presets include `polished`/`demo` sound defaults (`packages/core/src/presets/built-in.ts:18`, `packages/core/src/presets/built-in.ts:29`); portability checks are wired into publish smoke |

### Anti-Patterns Found

| File                         | Line | Pattern       | Severity | Impact                                                              |
| ---------------------------- | ---- | ------------- | -------- | ------------------------------------------------------------------- |
| `packages/core/src/sound.ts` | 242  | `return null` | INFO     | Intentional no-audio branch (`FullAudioArgs` or `null`), not a stub |

### Human Verification Outcome

### 1. Publish Smoke Completion

**Test:** Run `pnpm -w publish:smoke` and allow full completion.
**Outcome:** Passed (user-confirmed).

### 2. Audible Preset Quality

**Test:** From a non-repo temp directory, run `tuireel record` with `{ "preset": "polished" }` and `{ "preset": "demo" }`, then play outputs.
**Outcome:** Not executed; user approved phase completion without this check.

### Gaps Summary

No code-level gaps found in Phase 18 must-haves. Packaging, path resolution, and publish-smoke wiring for preset sound portability are present and connected. Phase closure approved by user after confirming publish smoke passed.

---

_Verified: 2026-03-05T02:05:00Z_
_Verifier: Claude (gsd-verifier)_
