# Phase 28: Capture Fidelity and Final Motion - Research

**Researched:** 2026-03-08
**Domain:** semantic frame capture, terminal-frame expansion, smooth playback packaging
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Capture policy

- Smoother playback should come from capturing more real terminal states at meaningful visible transitions.
- Tuireel should not brute-force raw capture at final-output FPS just to appear smooth.
- Capture density should increase specifically where users can see motion, such as short typing bursts and other visible state changes.

#### Final-motion contract

- Final output may play at the target delivery FPS while preserving the authored wall-clock timing of the run.
- Tuireel may package and repeat real captured terminal states to reach smooth playback.
- Tuireel must not invent fake in-between terminal glyph frames.

#### Short-interaction behavior

- Short typing bursts should show intermediate real states instead of collapsing into a single jump.
- Other visible transitions should follow the same principle: more authentic intermediate states where they materially improve perception.

#### Relationship to earlier phases

- Phase 25's saved timing contract remains authoritative during final motion packaging.
- Phase 26's pacing intent should be preserved, not reshaped during playback smoothing.

### Claude's Discretion

- Exact semantic-capture heuristics and which step types force extra capture points.
- Exact raw-to-final frame expansion strategy, as long as it uses real captured states only.
- Exact capture-density budgeting and artifact compaction strategy.

### Deferred Ideas (OUT OF SCOPE)

- Advanced terminal-safe smoothing experiments beyond repeated real frame states - future phase (CAP-05).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                                                              | Research Support                                                                                                                                                                                                                                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAP-02 | Recorded demos capture extra real terminal states during typing and other visible transitions so short interactions do not collapse into one visual jump | Current `shouldCaptureTypedCharacter()` in `recorder.ts:159` already selects which chars get extra captures; this phase widens it to capture ALL typed characters and adds capture hooks for press/scroll/wait-resolved steps via the existing `onStepStart`/`onStepComplete` callbacks and `captureNow()` on `FrameCapturer` |
| CAP-03 | Final output plays back at smooth target FPS without changing authored wall-clock timing                                                                 | Current `resolveTerminalFrameFileIndex()` in `compositor.ts:199` already maps timeline frame indices to source terminal-frame file indices; this phase makes it hold (repeat) each real captured frame until the next one arrives, producing smooth output at `fps` while keeping wall-clock duration identical               |

</phase_requirements>

## Summary

This phase addresses two tightly coupled problems in Tuireel's existing capture-to-playback pipeline.

**Problem 1 (CAP-02): Sparse capture during visible transitions.** The current `recorder.ts` already has a semantic capture mechanism: during `type` steps, the polling capturer is paused (`capturer.pause()` at line 369), and only specific characters trigger explicit `captureNow()` calls (gated by `shouldCaptureTypedCharacter()` at line 417). The heuristic at line 159-174 is conservative --- for a 3-character text, only the midpoint gets a capture; for longer text, only every 4th character plus the midpoint and final character. This means short typing bursts (1-3 chars) may produce zero or one extra captured frame between the pre-type and post-type polling frames. Other visible transitions (press, scroll, wait resolution) have NO explicit capture hooks at all --- they rely entirely on the background polling interval catching the visual change.

**Problem 2 (CAP-03): Frame expansion in the compositor.** The compositor at `compositor.ts:547` uses `resolveTerminalFrameFileIndex()` to map each output frame to a source decoded-frame file. The existing logic (lines 199-225) walks the `terminalFrames` array to find the latest terminal frame at or before the current output frame index. This mechanism already implements frame-holding semantics: it selects the most recent real captured frame and uses it until a newer one exists. The gap is that today the compositor operates at `fps` (the timeline fps), and the decoded raw frames are produced at `captureFps`. When `captureFps < fps`, the compositor may need more frames than exist in the decoded set. The terminal-frame index-to-file-index mapping must correctly bridge the captureFps-sourced decoded files with the fps-targeted output frame sequence.

The changes are surgical: (1) widen `shouldCaptureTypedCharacter` to always return true and add explicit `captureNow()` calls after press/scroll/wait steps, (2) ensure the compositor's frame expansion correctly repeats real captured frames to fill the output fps target while preserving wall-clock timing from the timeline.

**Primary recommendation:** Widen the capture heuristic to always capture after every typed character and add post-step capture hooks for press/scroll/wait steps. In the compositor, ensure `resolveTerminalFrameFileIndex` and the frame-compositing loop correctly hold-repeat real frames to produce smooth output at target fps without inventing new terminal states.

## Standard Stack

### Core

| Library                       | Version  | Purpose                              | Why Standard                                                                                                        |
| ----------------------------- | -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| In-repo `FrameCapturer`       | existing | Polling + explicit `captureNow()`    | Already the capture engine; `captureNow()` at line 144 is the exact hook needed for semantic capture points         |
| In-repo `InteractionTimeline` | existing | Terminal-frame index tracking        | `markTerminalFrame()` at line 202 already records which timeline frames correspond to real captured terminal states |
| In-repo `compositor.ts`       | existing | Frame expansion and hold-repeat      | `resolveTerminalFrameFileIndex()` at line 199 already implements the mapping from output frame to source file       |
| `sharp`                       | existing | PNG frame I/O during compositing     | Already used for frame decode, composite overlays, and file copy optimization                                       |
| `ffmpeg` (bundled)            | existing | Raw video decode into per-frame PNGs | `decodeRawFrames()` at line 235 extracts frames that become the source pool for hold-repeat                         |

### Supporting

| Library  | Version  | Purpose                      | When to Use                                                                                         |
| -------- | -------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `vitest` | existing | Unit and integration testing | Test `shouldCaptureTypedCharacter` behavior change, `resolveTerminalFrameFileIndex` expansion logic |

### Alternatives Considered

| Instead of                     | Could Use                                      | Tradeoff                                                                  |
| ------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Always-capture for typed chars | Keep selective heuristic, just lower threshold | Simpler change but still misses some intermediate states for short bursts |
| Hold-repeat in compositor      | Generate duplicate PNG files during capture    | Wastes disk and capture time; compositor already has the mechanism        |
| Post-step capture hooks        | Raise captureFps globally                      | Violates locked decision against brute-force high-fps capture             |

**Installation:** No new dependencies. All changes are within existing `@tuireel/core` code.

## Architecture Patterns

### Current Data Flow (as-is)

```
record() -> FrameCapturer.start() [polling at captureFps]
          -> executeSteps()
             -> onStepStart(type) -> capturer.pause()
             -> onTypeCharacter -> shouldCaptureTypedCharacter() gate -> captureNow()
             -> onStepComplete(type) -> capturer.resume()
          -> Each captured frame -> encoder.writeFrame() + timeline.markTerminalFrame()
          -> timeline.save() [terminalFrames array = indices of real captures]

compose() -> decodeRawFrames() -> list of PNG files (one per raw captured frame)
          -> for each output frame:
               resolveTerminalFrameFileIndex(terminalFrames, frameIndex, maxIndex)
               -> selects source PNG file index
               -> composites overlays (cursor, hud)
          -> encodeFrames() at fps
```

### Target Data Flow (to-be)

```
record() -> FrameCapturer.start() [polling at captureFps]
          -> executeSteps()
             -> onStepStart(type) -> capturer.pause()
             -> onTypeCharacter -> ALWAYS captureNow() (no gate)
             -> onStepComplete(type) -> captureNow() + capturer.resume()
             -> onStepComplete(press) -> captureNow()
             -> onStepComplete(scroll) -> captureNow()
             -> onStepComplete(wait) -> captureNow()
          -> Each captured frame -> encoder.writeFrame() + timeline.markTerminalFrame()
          -> timeline.save() [denser terminalFrames array]

compose() -> decodeRawFrames() -> list of PNG files (more files now due to denser capture)
          -> for each output frame at target fps:
               resolveTerminalFrameFileIndex(terminalFrames, frameIndex, maxIndex)
               -> holds most recent real captured frame until next one
               -> wall-clock timing preserved because timeline frameCount is unchanged
          -> encodeFrames() at fps
```

### Pattern 1: Semantic Capture Points

**What:** Inject explicit `captureNow()` calls at moments of visible terminal change, not just on a timer.
**When to use:** During any step that visibly changes the terminal: typed characters, key presses, scrolls, wait pattern resolution.

**Current code (recorder.ts onTypeCharacter callback, lines 413-423):**

```typescript
onTypeCharacter: async ({ charIndex, step }) => {
  timeline.advanceToTimeMs(Date.now() - recordingStart);
  timeline.addEvent("key");

  if (!shouldCaptureTypedCharacter(charIndex, step.text.length)) {
    return;
  }

  await capturer?.waitForIdle();
  await capturer?.captureNow();
},
```

**Target: remove the gate, always capture:**

```typescript
onTypeCharacter: async ({ charIndex, step }) => {
  timeline.advanceToTimeMs(Date.now() - recordingStart);
  timeline.addEvent("key");

  await capturer?.waitForIdle();
  await capturer?.captureNow();
},
```

### Pattern 2: Post-Step Capture for Non-Type Steps

**What:** Add `captureNow()` calls in `onStepComplete` for step types that visibly change the terminal.
**When to use:** After press, scroll, and wait steps complete.

**Current code (recorder.ts onStepComplete, lines 398-411):**

```typescript
onStepComplete: (step, index) => {
  timeline.advanceToTimeMs(Date.now() - recordingStart);
  const startTime = stepTimings[index];
  if (startTime !== undefined) {
    log.timing(`step ${index + 1}`, Date.now() - startTime);
  }

  if (step.type === "type") {
    capturer?.resume();
  }

  if (step.type === "type" || step.type === "press") {
    timeline.hideHud();
  }
},
```

**Target: add explicit capture after visible-change steps:**

```typescript
onStepComplete: async (step, index) => {
  timeline.advanceToTimeMs(Date.now() - recordingStart);
  const startTime = stepTimings[index];
  if (startTime !== undefined) {
    log.timing(`step ${index + 1}`, Date.now() - startTime);
  }

  if (step.type === "type") {
    await capturer?.waitForIdle();
    await capturer?.captureNow();
    capturer?.resume();
  }

  if (step.type === "press" || step.type === "scroll" || step.type === "wait") {
    await capturer?.waitForIdle();
    await capturer?.captureNow();
  }

  if (step.type === "type" || step.type === "press") {
    timeline.hideHud();
  }
},
```

Note: `onStepComplete` must become `async` since it now awaits `captureNow()`. The `ExecuteStepsOptions` type already allows `Promise<void>` return (line 20 of step-executor.ts).

### Pattern 3: Hold-Repeat Frame Expansion

**What:** The compositor holds each real captured frame until the next one arrives, repeating it across output frames to fill the target fps without inventing new terminal content.
**When to use:** During compositing when `terminalFrames.length < outputFrameCount`.

**Current implementation already does this.** `resolveTerminalFrameFileIndex()` at compositor.ts:199-225 walks `terminalFrames` and picks the latest one at or before the current frame index. The frame file is then reused for all output frames until the next terminal frame. This is the correct hold-repeat behavior.

**The critical insight:** The compositor loop iterates `outputFrameCount` times (line 538). `outputFrameCount` is `Math.max(effectiveFrameFiles.length, effectiveFrames.length, 1)` (line 536). With denser capture (more terminal frames), `effectiveFrameFiles.length` grows, but the timeline's `frameCount` (and thus `effectiveFrames.length`) stays the same because timing is preserved. The output frame count should be driven by `effectiveFrames.length` (timeline frame count at output fps), not by `effectiveFrameFiles.length` (number of raw captured frames). This may need a small adjustment to ensure the compositor outputs at the timeline fps rate regardless of how many raw frames were captured.

### Anti-Patterns to Avoid

- **Brute-force high captureFps:** Locked out by user decision. Do not set `captureFps = fps` as a default.
- **Interpolating terminal glyphs:** Locked out. The compositor must only repeat real captured frames, never synthesize intermediate glyph states.
- **Capturing during pause steps:** A `pause` step is intentionally static --- no terminal change occurs. Capturing extra frames adds no visual information.
- **Making onStepStart capture-heavy:** Capturing at step START risks capturing the pre-change state, which is the same as the previous frame. Capture at step COMPLETION, when the terminal has the new state.

## Don't Hand-Roll

| Problem                 | Don't Build                         | Use Instead                                                                   | Why                                                          |
| ----------------------- | ----------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Frame hold-repeat logic | Custom frame duplication in capture | Existing `resolveTerminalFrameFileIndex()` in compositor                      | Already implements sample-and-hold; just needs correct input |
| Explicit capture calls  | Custom capture timing system        | `FrameCapturer.captureNow()`                                                  | Already handles retry, idle-waiting, error propagation       |
| Timeline frame tracking | Separate frame metadata store       | `InteractionTimeline.markTerminalFrame()`                                     | Already deduplicates, stores in serializable format          |
| Async step callbacks    | Manual promise coordination         | Existing `onStepComplete` callback pattern (already supports `Promise<void>`) | Type system already allows async callbacks                   |

**Key insight:** The entire infrastructure for semantic capture and hold-repeat playback already exists. The gap is a too-conservative capture heuristic and missing capture hooks for non-type steps.

## Common Pitfalls

### Pitfall 1: Capturing Before Terminal Settles

**What goes wrong:** Calling `captureNow()` immediately after writing a character may capture the terminal before the PTY has processed the input and rendered the glyph.
**Why it happens:** PTY rendering is asynchronous. `session.writeRaw(char)` returns before the terminal has drawn.
**How to avoid:** The current `typeStep` already calls `charDelay()` BEFORE `onCharacter()`, giving the terminal time to render. Additionally, `session.waitIdle()` is called after all characters at line 28 of type.ts. For post-step captures, `step-executor.ts:128` already calls `session.waitIdle()` before `onStepComplete`, so the terminal has settled.
**Warning signs:** Captured frames showing the previous state instead of the current one.

### Pitfall 2: outputFrameCount Driven by Wrong Source

**What goes wrong:** With denser capture, `effectiveFrameFiles.length` grows. If `outputFrameCount` is driven by `max(effectiveFrameFiles.length, ...)`, the output video becomes longer than the authored wall-clock timing.
**Why it happens:** The `Math.max` at compositor.ts:536 takes the maximum of file count and frame count. With more captured frames than timeline frames, file count dominates.
**How to avoid:** `outputFrameCount` should be driven by timeline frame count (which represents authored wall-clock timing at output fps), not by the number of raw captured files. The raw files are a pool to sample from, not a sequence to play linearly.
**Warning signs:** Output video duration exceeds `timeline.frameCount / fps`.

### Pitfall 3: Capture-Time vs Timeline-Time Drift

**What goes wrong:** `markTerminalFrame()` records the current `frameCount - 1` from the timeline. If `advanceToTimeMs()` hasn't been called recently, the frame index may be stale.
**Why it happens:** Timeline frame count advances via `advanceToTimeMs(Date.now() - recordingStart)` which is called at various points. If a capture happens between advance calls, the terminal frame index may not reflect the actual wall-clock time.
**How to avoid:** Always call `timeline.advanceToTimeMs()` immediately before `markTerminalFrame()`. The current `onFrame` callback in recorder.ts:352 already does this. New capture points in `onStepComplete` should follow the same pattern (which they already do via the existing `timeline.advanceToTimeMs()` call at line 399).
**Warning signs:** Terminal frame indices clustered at wrong timeline positions.

### Pitfall 4: Async onStepComplete Breaking Step Sequencing

**What goes wrong:** If `onStepComplete` becomes async and takes significant time (due to `captureNow()`), subsequent steps may be delayed beyond their intended timing.
**Why it happens:** `executeSteps` at step-executor.ts:130 awaits `onStepComplete` before moving to the next step.
**How to avoid:** `captureNow()` typically takes the same time as one screenshot (tens of ms). Since steps already include delays (charDelay, pauseStep), the additional capture time is negligible. However, monitor total recording time to confirm no regression.
**Warning signs:** Recording duration increasing significantly compared to pre-change recordings.

### Pitfall 5: Removing shouldCaptureTypedCharacter Without Understanding Impact

**What goes wrong:** Long `type` steps (e.g., 200-character commands) now capture a frame for every character, massively increasing raw video size and recording time.
**Why it happens:** Each `captureNow()` call takes a screenshot (PNG encode + pipe to ffmpeg).
**How to avoid:** This is an acceptable tradeoff per the locked decision ("capture density should increase where users can see motion"). For very long type steps, the charDelay between characters still spaces captures out. A 200-char type at 50ms/char produces ~200 extra frames over 10 seconds, which is a capture rate of 20fps --- well within normal video rates. The raw MP4 encoder handles this efficiently since consecutive similar frames compress well.
**Warning signs:** Raw video file sizes growing 5-10x for long type steps. If this becomes a problem, a future phase could reintroduce a lighter heuristic.

## Code Examples

### Example 1: Current shouldCaptureTypedCharacter Behavior

```typescript
// Source: packages/core/src/recorder.ts:159-174
function shouldCaptureTypedCharacter(charIndex: number, textLength: number): boolean {
  if (textLength <= 2) {
    return true; // Short text: capture every char
  }

  const midpointIndex = Math.floor((textLength - 1) / 2);
  if (textLength <= 5) {
    return charIndex === midpointIndex; // 3-5 chars: only midpoint
  }

  if (charIndex === textLength - 1 || charIndex === midpointIndex) {
    return true; // Always capture last char and midpoint
  }

  return textLength > 8 && charIndex > 0 && charIndex % 4 === 0; // Every 4th char for long text
}
```

**Capture density examples with current heuristic:**

- `"ls"` (2 chars): captures char 0, char 1 = 2 captures
- `"git"` (3 chars): captures char 1 (midpoint) = 1 capture
- `"npm i"` (5 chars): captures char 2 (midpoint) = 1 capture
- `"npm install"` (11 chars): captures chars 4, 5, 8, 10 = 4 captures

**After change (always capture):**

- `"ls"` (2 chars): 2 captures (same)
- `"git"` (3 chars): 3 captures (was 1)
- `"npm i"` (5 chars): 5 captures (was 1)
- `"npm install"` (11 chars): 11 captures (was 4)

### Example 2: resolveTerminalFrameFileIndex Hold-Repeat

```typescript
// Source: packages/core/src/compositor.ts:199-225
// Given terminalFrames = [0, 3, 7, 12] and maxIndex = 3 (4 decoded files)
// Output frame 0 -> terminalFrames[0] = 0 -> file index 0
// Output frame 1 -> terminalFrames[0] = 0 -> file index 0 (held)
// Output frame 2 -> terminalFrames[0] = 0 -> file index 0 (held)
// Output frame 3 -> terminalFrames[1] = 3 -> file index 1
// Output frame 4 -> terminalFrames[1] = 3 -> file index 1 (held)
// ...
// Output frame 7 -> terminalFrames[2] = 7 -> file index 2
// Output frame 12 -> terminalFrames[3] = 12 -> file index 3
```

### Example 3: The Capture-During-Type Flow

```typescript
// Source: packages/core/src/recorder.ts:359-424 (simplified)
// Current flow during type step:

// 1. onStepStart("type") -> capturer.pause()  (stop polling)
// 2. typeStep() iterates chars:
//    a. session.writeRaw(char)     // send to PTY
//    b. sleep(charDelay(...))      // wait realistic typing delay
//    c. onTypeCharacter callback:
//       - timeline.advanceToTimeMs()
//       - timeline.addEvent("key")
//       - IF shouldCapture -> captureNow()  // explicit screenshot
// 3. session.waitIdle()           // terminal finishes rendering
// 4. onStepComplete("type") -> capturer.resume()  (restart polling)

// Gap: between pause and resume, only gated chars get captured.
// With dense capture, every char gets a screenshot showing
// the terminal after each character is rendered.
```

## State of the Art

| Old Approach                              | Current Approach                                | When Changed        | Impact                                                               |
| ----------------------------------------- | ----------------------------------------------- | ------------------- | -------------------------------------------------------------------- |
| Poll-only capture                         | Poll + selective `captureNow()` for typed chars | Already in codebase | Partially addresses sparse typing capture                            |
| No explicit capture for press/scroll/wait | Poll-only for these steps                       | Current state       | These steps may miss their visual change if poll interval is unlucky |
| `outputFrameCount = max(files, frames)`   | Same                                            | Current state       | Works when files <= frames, but may break with denser capture        |

**Current state summary:**

- `shouldCaptureTypedCharacter` was added to reduce capture overhead for long type steps, but it's too aggressive for short ones.
- Press/scroll/wait steps have zero explicit capture hooks --- they depend entirely on the background polling catching the terminal change.
- The compositor's hold-repeat mechanism works correctly when `terminalFrames` accurately represents the capture density. The main risk is `outputFrameCount` being driven by file count instead of timeline frame count.

## Open Questions

1. **Should `shouldCaptureTypedCharacter` be fully removed or replaced?**
   - What we know: The locked decision says "short typing bursts should show intermediate real states." Always-capture satisfies this.
   - What's unclear: Whether always-capture causes performance issues for very long type steps (200+ chars).
   - Recommendation: Remove the gate entirely (always capture). Monitor raw video sizes. If regression is severe, reintroduce a lighter heuristic in a future phase (but per locked decision, denser capture is the goal).

2. **Does `outputFrameCount` in the compositor need adjustment?**
   - What we know: Currently `Math.max(effectiveFrameFiles.length, effectiveFrames.length, 1)`. With denser capture, `effectiveFrameFiles.length` could exceed `effectiveFrames.length`.
   - What's unclear: Whether this causes wall-clock timing drift in practice.
   - Recommendation: Change to use `effectiveFrames.length` (timeline-derived) as the authoritative output frame count. The decoded files are a pool, not a sequence.

3. **Should resize and click steps also get post-step capture?**
   - What we know: Resize changes terminal dimensions (visible). Click is a UI interaction (may or may not be visible).
   - What's unclear: Whether the terminal state actually changes after these steps in typical demos.
   - Recommendation: Start with press/scroll/wait. Resize and click can be added later if needed --- they're less common and the polling capturer may catch them.

## Validation Architecture

### Test Framework

| Property           | Value                                       |
| ------------------ | ------------------------------------------- |
| Framework          | vitest (existing)                           |
| Config file        | `packages/core/vitest.config.ts`            |
| Quick run command  | `pnpm --filter @tuireel/core test -- --run` |
| Full suite command | `pnpm --filter @tuireel/core test -- --run` |

### Phase Requirements to Test Map

| Req ID | Behavior                                                                       | Test Type   | Automated Command                                                                  | File Exists?                                                  |
| ------ | ------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| CAP-02 | shouldCaptureTypedCharacter always returns true (or is removed)                | unit        | `pnpm --filter @tuireel/core test -- --run src/__tests__/capture-fidelity.test.ts` | Wave 0                                                        |
| CAP-02 | Post-step capture hooks fire for press/scroll/wait                             | unit        | `pnpm --filter @tuireel/core test -- --run src/__tests__/capture-fidelity.test.ts` | Wave 0                                                        |
| CAP-03 | resolveTerminalFrameFileIndex correctly holds frames with dense terminalFrames | unit        | `pnpm --filter @tuireel/core test -- --run src/__tests__/compositor.test.ts`       | Partial (existing test exists but doesn't test dense capture) |
| CAP-03 | Output frame count is driven by timeline frameCount, not decoded file count    | unit        | `pnpm --filter @tuireel/core test -- --run src/__tests__/compositor.test.ts`       | Wave 0                                                        |
| CAP-03 | Output video duration matches timeline wall-clock duration                     | integration | `pnpm --filter @tuireel/core test -- --run src/__tests__/compositor.test.ts`       | Wave 0                                                        |

### Sampling Rate

- **Per task commit:** `pnpm --filter @tuireel/core test -- --run`
- **Per wave merge:** `pnpm --filter @tuireel/core test -- --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/core/src/__tests__/capture-fidelity.test.ts` -- covers CAP-02 (unit tests for capture heuristic and hook behavior)
- [ ] Additional cases in `packages/core/src/__tests__/compositor.test.ts` -- covers CAP-03 (dense terminalFrames, frame count driven by timeline)
- [ ] Extract `shouldCaptureTypedCharacter` and `resolveTerminalFrameFileIndex` to be independently testable if not already exported

## Sources

### Primary (HIGH confidence)

- `packages/core/src/recorder.ts` -- Full recording pipeline, `shouldCaptureTypedCharacter`, capture pause/resume during type steps, `onTypeCharacter` callback
- `packages/core/src/capture/frame-capturer.ts` -- `captureNow()` API, polling interval, idle waiting, retry logic
- `packages/core/src/timeline/interaction-timeline.ts` -- `markTerminalFrame()`, `terminalFrames` storage, `advanceToTimeMs()`, serialization
- `packages/core/src/compositor.ts` -- `resolveTerminalFrameFileIndex()`, `outputFrameCount` calculation, frame compositing loop
- `packages/core/src/executor/steps/type.ts` -- `charDelay` timing, `onCharacter` callback invocation order
- `packages/core/src/executor/step-executor.ts` -- `onStepComplete` callback type (supports `Promise<void>`), `waitIdle()` before callback
- `packages/core/src/executor/timing.ts` -- `charDelay()` implementation, deterministic jitter

### Secondary (MEDIUM confidence)

- `.planning/phases/25-timing-contract-and-profiles/25-RESEARCH.md` -- Phase 25 timing contract design (not yet implemented but defines `fps` vs `captureFps` semantics)
- `.planning/phases/28-capture-fidelity-and-final-motion/28-CONTEXT.md` -- User decisions and locked constraints

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all changes use existing in-repo infrastructure, no new dependencies
- Architecture: HIGH -- patterns directly derived from reading the actual codebase, not speculation
- Pitfalls: HIGH -- each pitfall tied to specific code lines and verified against actual implementation

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable, internal codebase changes only)
