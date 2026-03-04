# Phase 2: Core Pipeline - Research

**Researched:** 2025-07-26
**Domain:** Terminal automation (tuistory), step execution, frame capture, ffmpeg MP4 encoding
**Confidence:** HIGH

## Summary

Phase 2 builds the end-to-end recording loop: config → step execution → frame capture → MP4. The critical dependency is tuistory which handles PTY spawning, key encoding, idle detection, and pixel-perfect screenshots via ghostty-opentui. The ffmpeg encoding follows webreel's proven image2pipe pattern.

**Primary recommendation:** Build a thin abstraction over tuistory's API, implement a step executor dispatch loop, and use ffmpeg image2pipe for frame-to-video encoding.

## Standard Stack

### Core
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| tuistory | Terminal automation engine | PTY, screenshots, idle detection — the foundation |
| ffmpeg (auto-downloaded) | Video encoding | image2pipe for frame sequence → MP4 |
| sharp | Image format conversion | Convert tuistory PNG screenshots to JPEG for ffmpeg pipe |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| execa | Process management | Spawn ffmpeg child process with pipe |

## Architecture Patterns

### Pattern: Step Executor Dispatch
```typescript
async function executeStep(session: TuistorySession, step: Step): Promise<void> {
  switch (step.type) {
    case "launch": await session.launch(step.command); break;
    case "type": await typeWithDelay(session, step.text, step.speed); break;
    case "press": await session.press(step.key); break;
    case "wait": await session.waitForText(step.pattern, step.timeout); break;
    case "pause": await sleep(step.duration); break;
  }
}
```

### Pattern: Frame Capture Loop
Run capture loop in parallel with step execution:
1. Start ffmpeg with image2pipe input (`-f image2 -i pipe:0`)
2. On each frame tick (1000/fps ms): take screenshot via tuistory, convert to JPEG, write to ffmpeg stdin
3. After all steps complete + idle, close ffmpeg stdin, await process exit

### Pattern: Human-Like Typing
Don't type all characters at same speed. Add per-character jitter:
```typescript
async function typeWithDelay(session, text: string, baseSpeed = 50) {
  for (const char of text) {
    await session.type(char);
    const jitter = baseSpeed * (0.5 + Math.random());
    await sleep(jitter);
  }
}
```

### Anti-Patterns to Avoid
- **Writing frames to disk then encoding:** Slow, disk-heavy. Use image2pipe streaming.
- **Fixed frame timing without idle detection:** Fast TUI updates will be missed. Use tuistory's idle detection.
- **Blocking capture on step execution:** Capture loop must run independently of step execution.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PTY management | Custom PTY spawning | tuistory | Key encoding, signal handling, platform differences |
| Terminal rendering | Custom ANSI parser | tuistory + ghostty-opentui | Pixel-perfect rendering is extremely complex |
| Video encoding | Custom encoder | ffmpeg image2pipe | Industry standard, handles codec complexity |
| Key encoding | Custom escape sequences | tuistory key API | Modifier combos, special keys, platform differences |

## Common Pitfalls

### Pitfall 1: Frame Timing Drift
**What goes wrong:** Frame timestamps drift from real time, causing speed-up/slow-down in output
**How to avoid:** Track wall-clock time per frame. If a frame takes longer to capture, skip the next tick rather than queuing. Duplicate frames for pauses (don't leave gaps).

### Pitfall 2: tuistory Idle Detection
**What goes wrong:** Screenshots taken during partial TUI render show incomplete state
**How to avoid:** After each step, wait for tuistory's idle signal before capturing the "key frame." Continue background capture at fps rate for smooth video.

### Pitfall 3: ffmpeg Pipe Backpressure
**What goes wrong:** Writing frames faster than ffmpeg can encode causes memory bloat
**How to avoid:** Respect Node.js stream backpressure — check `write()` return value, pause capture if drain needed.

### Pitfall 4: Process Cleanup
**What goes wrong:** Orphan ffmpeg or PTY processes on error/abort
**How to avoid:** Register cleanup handlers for SIGINT/SIGTERM. Use try/finally to always close tuistory session and ffmpeg process.

## Code Examples

### ffmpeg image2pipe Command
```typescript
const ffmpegArgs = [
  "-y",
  "-f", "image2pipe",
  "-framerate", String(fps),
  "-i", "pipe:0",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-preset", "fast",
  "-crf", "23",
  outputPath,
];
```

### Recording Pipeline (high-level)
```typescript
async function record(config: Config): Promise<void> {
  const ffmpegPath = await ensureFfmpeg();
  const session = await createTuistorySession(config);
  const encoder = spawnFfmpegEncoder(ffmpegPath, config);

  // Start capture loop
  const captureLoop = startFrameCapture(session, encoder, config.fps);

  // Execute steps sequentially
  for (const step of config.steps) {
    await executeStep(session, step);
    await session.waitForIdle();
  }

  // Finalize
  await captureLoop.stop();
  await encoder.finalize();
  await session.close();
}
```

## Open Questions

1. **tuistory API stability:** Need to pin version and verify screenshot API signature.
   - Recommendation: opensrc tuistory early in planning, create thin wrapper.

## Sources

### Primary (HIGH confidence)
- Project research summary (SUMMARY.md) — architecture decisions
- webreel reference — image2pipe encoding, frame timing patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tuistory is the designated engine, ffmpeg is industry standard
- Architecture: HIGH — two-pass pipeline proven by webreel
- Pitfalls: HIGH — frame timing and process management are well-documented concerns

**Research date:** 2025-07-26
**Valid until:** 30 days (tuistory API may evolve)
