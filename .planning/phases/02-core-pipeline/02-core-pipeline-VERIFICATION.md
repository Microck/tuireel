---
phase: 02-core-pipeline
verified: 2026-03-03T00:50:42Z
status: passed
score: 11/11 must-haves verified
re_verification:
  previous_status: human_needed
  previous_score: 11/11
  gaps_closed:
    - "Completed required human runtime checks (regex wait behavior, MP4 decode/playback proxy, fps/viewport fidelity)"
  gaps_remaining: []
  regressions: []
---

# Phase 2: Core Pipeline Verification Report

**Phase Goal:** Drive a TUI app through scripted steps and produce a basic MP4 video - the minimum end-to-end recording loop.
**Verified:** 2026-03-03T00:50:42Z
**Status:** passed
**Re-verification:** Yes - after human check completion

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A tuistory session can be launched with configured command, cols, and rows | VERIFIED | `createSession()` calls `launchTerminal({ command, cols, rows })` in `packages/core/src/session.ts:68`; recorder passes launch command + viewport in `packages/core/src/recorder.ts:84` and `packages/core/src/recorder.ts:86`. |
| 2 | Text can be typed character-by-character with human-like jitter timing | VERIFIED | Type loop writes each character and sleeps per-char jitter in `packages/core/src/executor/steps/type.ts:13`; jitter formula is `baseMs * (0.5 + Math.random())` in `packages/core/src/executor/timing.ts:1`. |
| 3 | Keys and chords (Ctrl+C, Enter, arrows, etc.) can be pressed | VERIFIED | Chord parsing splits `+` combinations in `packages/core/src/executor/steps/press.ts:5`; parsed key(s) are sent through `session.press()` in `packages/core/src/executor/steps/press.ts:24`. |
| 4 | Executor can wait for a text/regex pattern to appear in terminal | VERIFIED | Wait schema now accepts string or regex-object patterns in `packages/core/src/config/schema.ts:40`; regex payloads are validated in `packages/core/src/config/schema.ts:26`; dispatcher compiles to `RegExp` in `packages/core/src/executor/step-executor.ts:30` and passes to `waitStep` in `packages/core/src/executor/step-executor.ts:61`; regression coverage in `packages/core/test/config.test.ts:111` and `packages/cli/test/commands.test.ts:151`. |
| 5 | Executor can pause for a fixed duration | VERIFIED | Pause handler delegates directly to `sleep(durationMs)` in `packages/core/src/executor/steps/pause.ts:4`. |
| 6 | Steps execute sequentially via a dispatch loop | VERIFIED | Sequential `for (const [index, step] of steps.entries())` dispatch remains in `packages/core/src/executor/step-executor.ts:43`. |
| 7 | Running `tuireel record` with a valid config produces an MP4 pipeline output path | VERIFIED | CLI record command loads config and invokes core recorder in `packages/cli/src/commands/record.ts:13`; recorder orchestrates ffmpeg/session/capture lifecycle in `packages/core/src/recorder.ts:80`. |
| 8 | MP4 frames come from terminal screenshots produced from tuistory data | VERIFIED | Screenshot path is `getTerminalData()` -> `renderTerminalToImage()` in `packages/core/src/session.ts:24`; capturer streams screenshot buffers to encoder in `packages/core/src/capture/frame-capturer.ts:72`. |
| 9 | Frame rate in config controls capture interval and ffmpeg output fps | VERIFIED | Recorder derives fps from config in `packages/core/src/recorder.ts:83`; capturer interval uses `1000 / fps` in `packages/core/src/capture/frame-capturer.ts:40`; encoder sets both `-framerate` and `-r` from fps in `packages/core/src/encoding/encoder.ts:41` and `packages/core/src/encoding/encoder.ts:60`. |
| 10 | Viewport cols/rows in config control terminal dimensions in output | VERIFIED | Recorder forwards `cols`/`rows` to session creation in `packages/core/src/recorder.ts:88`; session launch uses those values in `packages/core/src/session.ts:70`; screenshot render height uses terminal rows in `packages/core/src/session.ts:25`. |
| 11 | Recording handles idle detection so settled UI states are captured between scripted steps | VERIFIED | Step executor waits idle after each step in `packages/core/src/executor/step-executor.ts:78`; recorder waits final idle after step run in `packages/core/src/recorder.ts:109`. |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/core/src/config/schema.ts` | Wait pattern contract supports text + regex payloads | VERIFIED | Exists (68 lines); substantive union + regex validation (`waitRegexPatternSchema`); wired via parser (`packages/core/src/config/parser.ts:109`) and executor step typing (`packages/core/src/executor/step-executor.ts:1`). |
| `packages/core/src/executor/step-executor.ts` | Sequential dispatch + wait pattern compilation | VERIFIED | Exists (81 lines); substantive `compileWaitPattern()` + typed switch; wired via recorder invocation at `packages/core/src/recorder.ts:108`. |
| `packages/core/test/config.test.ts` | Config parser/schema regression coverage for wait text+regex | VERIFIED | Exists (274 lines); adds acceptance/rejection tests for regex waits and schema alternative assertions (`packages/core/test/config.test.ts:111`, `packages/core/test/config.test.ts:250`). |
| `packages/cli/test/commands.test.ts` | Init-generated schema parity includes wait text+regex alternatives | VERIFIED | Exists (271 lines); validates persisted schema includes string + regex object wait pattern alternatives (`packages/cli/test/commands.test.ts:151`). |
| `packages/core/src/session.ts` | Session wrapper + screenshot bridge | VERIFIED | Quick regression check passed: exists (76 lines), exports `TuireelSession`/`createSession`, still imported/used across executor/capture/recorder paths. |
| `packages/core/src/capture/frame-capturer.ts` | FPS screenshot loop to encoder | VERIFIED | Quick regression check passed: exists (117 lines), captures via `session.screenshot()` and writes frames to encoder. |
| `packages/core/src/encoding/encoder.ts` | ffmpeg image2pipe encoder | VERIFIED | Quick regression check passed: exists (163 lines), ffmpeg args and finalize/abort lifecycle remain intact. |
| `packages/core/src/recorder.ts` | End-to-end orchestration | VERIFIED | Quick regression check passed: exists (145 lines), still wires ffmpeg/session/capture/steps and cleanup. |
| `packages/cli/src/commands/record.ts` | CLI `record` command wiring | VERIFIED | Quick regression check passed: exists (22 lines), still calls `loadConfig()` then `record()`. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `packages/core/src/config/schema.ts` | `packages/core/src/config/parser.ts` | `configSchema.safeParse(parsedConfig)` | WIRED | Wait pattern union and regex validation are enforced during config validation (`packages/core/src/config/parser.ts:109`). |
| `packages/core/src/executor/step-executor.ts` | `packages/core/src/executor/steps/wait.ts` | `compileWaitPattern(step.pattern)` -> `waitStep(...)` | WIRED | Regex object config values are compiled to runtime `RegExp` before wait execution (`packages/core/src/executor/step-executor.ts:30` and `packages/core/src/executor/step-executor.ts:61`). |
| `packages/core/src/executor/steps/wait.ts` | `packages/core/src/session.ts` | `session.waitForText(pattern, ...)` | WIRED | Wait step passes `string | RegExp` into session wait API (`packages/core/src/executor/steps/wait.ts:5` and `packages/core/src/session.ts:58`). |
| `packages/core/src/session.ts` | `packages/core/src/capture/frame-capturer.ts` | `screenshot()` call in capture tick | WIRED | Capturer consumes session screenshots every tick (`packages/core/src/capture/frame-capturer.ts:72`). |
| `packages/core/src/capture/frame-capturer.ts` | `packages/core/src/encoding/encoder.ts` | `encoder.writeFrame(frame)` | WIRED | Captured image buffer is streamed directly into ffmpeg encoder (`packages/core/src/capture/frame-capturer.ts:73`). |
| `packages/cli/src/commands/record.ts` | `packages/core/src/recorder.ts` | `record as runRecord` import/invocation | WIRED | CLI still triggers the recorder pipeline entry point (`packages/cli/src/commands/record.ts:1` and `packages/cli/src/commands/record.ts:14`). |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
| --- | --- | --- |
| REC-01 (launch in virtual PTY) | SATISFIED | None |
| REC-02 (capture terminal frames via tuistory) | SATISFIED | None |
| REC-03 (encode frames to MP4) | SATISFIED | Runtime evidence passed: record run produced MP4 and ffmpeg decode probe succeeded. |
| REC-06 (configurable fps) | SATISFIED | None |
| REC-07 (configurable viewport cols/rows) | SATISFIED | None |
| STEP-01 (char-by-char typing) | SATISFIED | None |
| STEP-02 (press keys/chords) | SATISFIED | None |
| STEP-03 (wait for text/regex) | SATISFIED | Previous regex gap is closed via schema + executor + tests. |
| STEP-04 (fixed pause) | SATISFIED | None |
| CLI-03 (`tuireel record` command) | SATISFIED | Human run succeeded: `node packages/cli/dist/index.js record /tmp/tuireel-human-check.jsonc` produced MP4 output. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `packages/cli/src/commands/stubs.ts` | 22 | "Not yet implemented. Coming in Phase ..." placeholder output | INFO | Non-blocking for Phase 2 goal; applies to phase-gated commands (`preview`, `composite`) outside this phase scope. |

### Human Verification Completed

### 1. Regex wait runtime behavior

**Test:** Run `node packages/cli/dist/index.js record /tmp/tuireel-human-check.jsonc` with a config that uses `wait.pattern` as a `{ regex, flags }` object.
**Expected:** Execution pauses until regex match appears, then proceeds with no config/runtime errors.
**Evidence:** Command succeeded and produced `/tmp/tuireel-human-check.mp4`.
**Result:** PASSED.

### 2. End-to-end MP4 generation and playback proxy

**Test:** Run an ffmpeg decode probe on `/tmp/tuireel-human-check.mp4`.
**Expected:** Decode probe succeeds, indicating MP4 output is structurally playable.
**Evidence:** ffmpeg decode probe succeeded for `/tmp/tuireel-human-check.mp4`.
**Result:** PASSED.

### 3. FPS + viewport fidelity

**Test:** Compare stream metadata from a custom config (`fps:12, cols:100, rows:30`) against default config output.
**Expected:** Output pacing and viewport dimensions reflect configured values.
**Evidence:** Custom config reported `840x630, 12 fps`; default config reported `672x504, 30 fps`.
**Result:** PASSED.

### Gaps Summary

Automated verification was already complete, and all required runtime/manual checks now pass with concrete evidence. No gaps remain; the phase goal is achieved.

### Verification Commands Run

- `pnpm --filter @tuireel/core build`
- `pnpm --filter @tuireel/core test -- test/config.test.ts`
- `pnpm --filter tuireel test -- test/commands.test.ts`
- `node packages/cli/dist/index.js record /tmp/tuireel-human-check.jsonc`
- `ffmpeg` decode probe on `/tmp/tuireel-human-check.mp4`
- Stream metadata check: custom (`840x630, 12 fps`) vs default (`672x504, 30 fps`)

---

_Verified: 2026-03-03T00:50:42Z_
_Verifier: OpenCode (gpt-5.3-codex)_
