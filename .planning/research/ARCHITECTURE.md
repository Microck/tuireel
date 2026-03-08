# Architecture Research

**Domain:** Human-feeling timing and capture-fidelity upgrades for an existing terminal demo recorder
**Researched:** 2026-03-08
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
+------------------------------------------------------------------+
| Config + Execution Contract                                       |
|  config/schema.ts   presets   JSONC steps   render/timing options |
+---------------------------+--------------------------------------+
                            |
+---------------------------v--------------------------------------+
| Record Orchestrator (modified)                                    |
| recorder.ts: resolves profiles, runs PTY session, coordinates     |
| step execution, capture cadence, timeline metadata, raw encode    |
+-----------+--------------------------+---------------------------+
            |                          |
            |                          |
+-----------v-----------+   +----------v-------------------------+
| PTY Execution Layer   |   | Capture Planning Layer             |
| step-executor.ts      |   | frame-capturer.ts                  |
| type.ts + timing.ts   |   | cadence planner (new)              |
| pause/wait/scroll/... |   | burst capture + idle holds         |
+-----------+-----------+   +----------+-------------------------+
            |                          |
            +-------------+------------+
                          |
+-------------------------v---------------------------------------+
| Timeline + Render Intent Layer                                   |
| interaction-timeline.ts / timeline/types.ts                      |
| terminal frame map + semantic beats + overlay motion intents     |
+-------------------------+---------------------------------------+
                          |
+-------------------------v---------------------------------------+
| Compositor + Encoder Layer                                       |
| compositor.ts   overlay/*   encoder-profiles.ts   ffmpeg         |
| 1080p canvas fit + repeated frame mapping + smooth final output   |
+------------------------------------------------------------------+
```

### Component Responsibilities

| Component                        | Responsibility                                                                                    | Typical Implementation                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `recorder.ts` (modified)         | Central coordinator for record flow, profile resolution, raw capture, and final composite handoff | Existing orchestration extended with timing/render/cadence policies |
| PTY step execution (modified)    | Execute declarative steps while exposing semantic timing hooks                                    | `step-executor.ts`, `steps/type.ts`, `executor/timing.ts`           |
| Capture cadence planner (new)    | Decide when periodic capture is enough and when burst/manual capture is required                  | New policy module under `capture/`                                  |
| Timeline intent model (modified) | Persist overlay motion, beat timing, and terminal-frame mapping independently from raw frames     | Extend `timeline/types.ts` and `interaction-timeline.ts`            |
| Render profile resolver (new)    | Convert "readable 1080p" settings into font, padding, canvas, and output fps choices              | New module under `render/` or `capture/`                            |
| Compositor/encoder (modified)    | Turn discrete terminal frames plus timeline intents into smooth, readable final output            | `compositor.ts`, `overlay/*`, `encoder-profiles.ts`, ffmpeg filters |

## Recommended Project Structure

```text
packages/core/src/
|- capture/
|  |- frame-capturer.ts        # Existing low-level screenshot loop
|  |- cadence-planner.ts       # NEW: hybrid periodic/burst capture decisions
|  |- capture-profile.ts       # NEW: resolves capture fps, burst windows, idle holds
|- executor/
|  |- timing.ts                # Existing char timing utilities, expanded for human cadence
|  |- human-timing-profile.ts  # NEW: pause/typing heuristics and deterministic jitter
|  |- step-executor.ts         # Existing step orchestration with semantic callbacks
|  `- steps/type.ts            # Existing type step using human timing profile
|- render/
|  |- render-profile.ts        # NEW: readable 1080p defaults and scaling rules
|  `- canvas-fit.ts            # NEW: terminal-to-output sizing helpers
|- timeline/
|  |- interaction-timeline.ts  # Existing overlay/timing timeline, extended
|  `- types.ts                 # Existing serialized timeline contract, extended
|- compositor.ts               # Existing final assembly, consumes richer timeline data
|- recorder.ts                 # Existing top-level pipeline orchestrator
|- session.ts                  # Existing terminal screenshot/render configuration
`- config/schema.ts            # Existing user contract for new timing/render options
```

### Structure Rationale

- **`capture/`:** keeps screenshot cadence logic separate from PTY step semantics so capture policy can evolve without rewriting step execution.
- **`executor/`:** owns human-feeling behavior because typing and pauses are authored here, not in ffmpeg.
- **`render/`:** isolates 1080p readability decisions from encode details; this avoids baking canvas math into `compositor.ts` and `session.ts`.
- **`timeline/`:** remains the interchange layer between recording and compositing; new behavior should be serialized here instead of inferred later from raw frames.

## Architectural Patterns

### Pattern 1: Semantic Timing Policy Over Raw Sleep Calls

**What:** Resolve a deterministic human timing profile once, then let steps ask for beat durations like `charDelay`, `thinkingPause`, and `postActionSettle`.
**When to use:** For typing cadence, natural pauses, and action-to-action pacing.
**Trade-offs:** More config surface and more timeline metadata, but far safer than scattering ad hoc sleeps through step handlers.

**Example:**

```typescript
const profile = resolveHumanTimingProfile(config.human);

for (const char of text) {
  session.writeRaw(char);
  await sleep(profile.charDelay({ text, char, index }));
  await onCharacter?.(char, index);
}

await sleep(profile.postTypePause({ text }));
```

### Pattern 2: Hybrid Capture Cadence

**What:** Keep a base periodic capture loop, but allow the recorder to request burst captures around high-change moments like typing, scroll, resize, and prompt transitions.
**When to use:** When smoothness matters but global `captureFps=60` would be wasteful and still not guarantee readable 1080p output.
**Trade-offs:** Slightly more state in `FrameCapturer`, but preserves terminal correctness and keeps raw encode cost bounded.

**Example:**

```typescript
capturer.startBaseLoop();

await executeSteps(session, steps, {
  onTypeCharacter: async (payload) => {
    await capturer.captureBurst(cadence.forTypedCharacter(payload));
    timeline.markTerminalBeat("typed-char");
  },
});
```

### Pattern 3: Discrete Terminal Source, Continuous Overlay Timeline

**What:** Treat PTY screenshots as source-of-truth terminal states, but render cursor/HUD/motion on a denser output timeline.
**When to use:** Always for smooth final output; terminal glyph states should never be hallucinated.
**Trade-offs:** The compositor becomes smarter, but the PTY capture model stays trustworthy.

**Example:**

```typescript
const sourceFrameIndex = resolveTerminalFrameForOutputFrame(frameIndex);
const terminalFrame = decodedFrames[sourceFrameIndex];
const overlayState = timeline.resolveFrame(frameIndex);

return composite(terminalFrame, overlayState);
```

## Data Flow

### Request Flow

```text
JSONC config
    -> schema + profile resolution
    -> recorder
    -> step executor + PTY session
    -> capture planner / frame capturer
    -> raw terminal video + enriched timeline JSON
    -> compositor
    -> ffmpeg final output
```

### State Management

```text
Config contract
    -> profile resolvers
    -> recorder runtime state
    -> timeline snapshots / terminal frame indices
    -> compositor frame mapping
    -> encoded output
```

### Key Data Flows

1. **Human typing flow:** `config.human` -> timing profile -> `steps/type.ts` -> `onTypeCharacter` -> burst capture + timeline beat markers.
2. **Readable 1080p flow:** render profile -> `session.ts` screenshot sizing/theme font config -> `timeline` dimensions -> `compositor.ts` canvas fit/padding -> encoder profile.
3. **Smooth motion flow:** recorder emits semantic events and denser terminal-frame markers -> compositor expands timeline at output fps while reusing last valid PTY frame until the next real terminal change.

## Scaling Considerations

| Scale                            | Architecture Adjustments                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Short demos, single output       | Monolith is fine; profile resolution and hybrid capture fit inside existing `record()` flow                                                    |
| Longer recordings, 1080p presets | Optimize decoded frame reuse, avoid unnecessary burst windows, add regression fixtures for duration and size growth                            |
| Batch or multi-video pipelines   | Reuse render/capture profile resolvers across videos; consider parallel compositing later, but keep recording single-session and deterministic |

### Scaling Priorities

1. **First bottleneck:** Raw frame volume from over-capturing during typing; fix with event-driven bursts and minimum-change thresholds instead of raising `captureFps` globally.
2. **Second bottleneck:** Compositor cost at 1080p; fix with overlay caching, frame reuse, and keeping terminal interpolation out of Sharp/ffmpeg.

## Anti-Patterns

### Anti-Pattern 1: Human Feel Implemented as Random Sleeps Everywhere

**What people do:** Add `Math.random()` delays inside step handlers until the demo "looks human".
**Why it's wrong:** Breaks determinism, makes tests flaky, and hides timing rules in too many places.
**Do this instead:** Resolve one deterministic human timing profile and feed it through step execution and timeline events.

### Anti-Pattern 2: Smoothness Implemented by Blindly Raising Capture FPS

**What people do:** Set `captureFps` and output fps to 60 for every recording.
**Why it's wrong:** Bloats raw encodes, slows compositing, and still does not solve glyph readability or pause quality.
**Do this instead:** Use base capture fps plus bursts around terminal changes, then let the compositor render a denser output timeline.

### Anti-Pattern 3: Motion Interpolation Applied to Terminal Pixels

**What people do:** Ask ffmpeg to invent in-between terminal states.
**Why it's wrong:** Creates smeared text and fake PTY states, which is the opposite of capture fidelity.
**Do this instead:** Repeat real terminal frames and interpolate only overlay motion and output timing.

## Integration Points

### External Services

| Service                 | Integration Pattern                         | Notes                                                                          |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| `tuistory` PTY session  | Direct step execution and idle detection    | Human timing stays above this layer; do not fork PTY behavior                  |
| `ghostty-opentui/image` | Terminal screenshot rendering               | 1080p readability starts here via font size, line height, and padding defaults |
| `sharp`                 | Overlay rasterization and frame compositing | Keep overlay generation cached; avoid using it to invent terminal motion       |
| `ffmpeg`                | Raw encode, final encode, scaling/padding   | Use for canvas fit and delivery fps, not for PTY-state interpolation           |

### Internal Boundaries

| Boundary                                 | Communication                | Notes                                                                              |
| ---------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| `config/schema.ts` <-> profile resolvers | Typed config objects         | Add new config blocks first so later work shares one contract                      |
| `executor/*` <-> `capture/*`             | Recorder callbacks           | Step logic should request semantic capture moments, not manipulate ffmpeg directly |
| `recorder.ts` <-> `timeline/*`           | Direct API + serialized JSON | Timeline is the contract between record and composite passes                       |
| `session.ts` <-> `render/*`              | Function calls               | Screenshot sizing rules should be resolved once, not recomputed in every caller    |
| `timeline/*` <-> `compositor.ts`         | Serialized frame intent data | Any new smoothness feature should be persisted here to keep two-pass flow stable   |

### New vs Modified Components

| Type     | Component                                                                                      | Why                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Modified | `packages/core/src/config/schema.ts`                                                           | Add explicit config for human timing, render/readability presets, and output motion profile |
| Modified | `packages/core/src/executor/timing.ts` and `packages/core/src/executor/steps/type.ts`          | Replace simple char jitter with a reusable human timing policy                              |
| Modified | `packages/core/src/capture/frame-capturer.ts`                                                  | Support burst capture and policy-driven cadence, not just fixed interval polling            |
| Modified | `packages/core/src/recorder.ts`                                                                | Resolve profiles, route semantic events, and persist richer timeline metadata               |
| Modified | `packages/core/src/timeline/types.ts` and `packages/core/src/timeline/interaction-timeline.ts` | Store beat markers, capture hints, and output-timeline intent                               |
| Modified | `packages/core/src/session.ts`                                                                 | Apply render profile defaults for readable screenshots before compositing                   |
| Modified | `packages/core/src/compositor.ts` and `packages/core/src/encoding/encoder-profiles.ts`         | Map discrete PTY frames to smooth final output at 1080p                                     |
| New      | `packages/core/src/executor/human-timing-profile.ts`                                           | Deterministic cadence rules for typing and pauses                                           |
| New      | `packages/core/src/capture/cadence-planner.ts`                                                 | Converts semantic events into capture behavior                                              |
| New      | `packages/core/src/render/render-profile.ts`                                                   | Central place for 1080p readability and canvas-fit rules                                    |

### Safest Build Order

1. **Contract first** - extend `packages/core/src/config/schema.ts` and add fixture configs for human timing/render settings; this stabilizes every downstream integration.
2. **Human timing engine** - add the timing profile module, wire it into `steps/type.ts`, and cover deterministic typing/pause tests before touching capture cadence.
3. **Readable render profile** - add screenshot/canvas profile resolution in `session.ts` plus compositor sizing tests for 1080p readability.
4. **Hybrid capture cadence** - upgrade `frame-capturer.ts` and `recorder.ts` so typing/scroll bursts create better source frames without changing final encode logic yet.
5. **Timeline contract expansion** - persist semantic beats, terminal-frame markers, and any output-fps mapping needed for smoothing.
6. **Smooth final output** - teach `compositor.ts` to consume the richer timeline and render denser output safely from real PTY frames.
7. **Regression verification** - add tests and fixtures for typing cadence, raw frame counts, 1080p dimensions, and a smoke clip that checks readability/smoothness together.

## Sources

- `packages/core/src/recorder.ts`
- `packages/core/src/capture/frame-capturer.ts`
- `packages/core/src/executor/timing.ts`
- `packages/core/src/executor/steps/type.ts`
- `packages/core/src/session.ts`
- `packages/core/src/timeline/interaction-timeline.ts`
- `packages/core/src/timeline/types.ts`
- `packages/core/src/compositor.ts`
- `packages/core/src/encoding/encoder-profiles.ts`
- `packages/core/src/config/schema.ts`
- `packages/core/src/__tests__/compositor.test.ts`
- `packages/core/test/frame-capturer.test.ts`
- `packages/core/test/timing.test.ts`

---

_Architecture research for: Tuireel human-feeling terminal demo recording_
_Researched: 2026-03-08_
