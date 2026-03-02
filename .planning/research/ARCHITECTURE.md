# Architecture Research: Tuireel

## System Overview

Tuireel is structured as a monorepo with two packages:

- **@tuireel/core** — The recording engine. Handles config parsing, step execution, frame capture, overlay compositing, and video encoding. Usable as a library.
- **tuireel** — The CLI wrapper. Provides `init`, `record`, `preview`, `composite`, `validate` commands. Thin layer over @tuireel/core.

The system follows webreel's proven two-pass architecture adapted for terminal context:
1. **Pass 1 (Record):** Drive TUI via tuistory → capture clean terminal screenshots → pipe to ffmpeg → intermediate video. Simultaneously build an InteractionTimeline logging cursor position, keystrokes, and sound events per frame.
2. **Pass 2 (Composite):** Read InteractionTimeline → render per-frame PNG overlays (cursor + HUD) via Sharp → composite onto intermediate video via ffmpeg overlay filter → final output with optional audio.

## Component Map

### @tuireel/core (Engine)

```
@tuireel/core/
├── config/
│   ├── parser.ts          — JSONC parsing + schema validation
│   ├── schema.ts          — Zod schema defining config structure
│   ├── resolver.ts        — Resolve includes, multi-video, defaults
│   └── types.ts           — TypeScript types for config
├── executor/
│   ├── step-executor.ts   — Drives tuistory session through steps
│   ├── steps/             — Individual step implementations
│   │   ├── type.ts        — Character-by-character typing
│   │   ├── press.ts       — Key/chord press
│   │   ├── wait.ts        — Wait for text/pattern
│   │   ├── pause.ts       — Fixed delay
│   │   ├── launch.ts      — Start command in PTY
│   │   ├── scroll.ts      — Mouse scroll
│   │   ├── click.ts       — Click on text
│   │   └── screenshot.ts  — Capture PNG at point
│   └── timing.ts          — Human-like timing (typing speed, pause jitter)
├── capture/
│   ├── frame-capturer.ts  — Screenshot loop, frame timing, pipe to ffmpeg
│   ├── timeline.ts        — InteractionTimeline data structure
│   └── frame-buffer.ts    — Frame deduplication, timing normalization
├── overlay/
│   ├── compositor.ts      — Orchestrates overlay pass
│   ├── cursor.ts          — Cursor overlay rendering (Sharp)
│   ├── hud.ts             — Keystroke HUD rendering (Sharp)
│   ├── window-chrome.ts   — Optional window frame rendering
│   └── easing.ts          — Bézier + Fitts's law cursor movement
├── encoding/
│   ├── encoder.ts         — ffmpeg process management
│   ├── formats.ts         — MP4/WebM/GIF encoding profiles
│   ├── audio-mixer.ts     — Sound effect synchronization
│   └── ffmpeg-download.ts — Auto-download ffmpeg binary
├── theme/
│   ├── themes.ts          — Built-in theme definitions
│   ├── custom-theme.ts    — Custom theme resolution
│   └── types.ts           — Theme type definitions
├── recorder.ts            — Main orchestrator: config → pass 1 → pass 2 → output
├── previewer.ts           — Preview mode: execute steps without capture
└── index.ts               — Public API exports
```

### tuireel (CLI)

```
tuireel/
├── commands/
│   ├── init.ts            — Scaffold config file
│   ├── record.ts          — Full recording pipeline
│   ├── preview.ts         — Preview mode
│   ├── composite.ts       — Re-composite from saved timeline
│   └── validate.ts        — Validate config
├── watcher.ts             — Watch mode (chokidar → re-record)
├── cli.ts                 — Commander.js setup, argument parsing
└── index.ts               — Entry point (bin)
```

## Data Flow

### Full Recording Pipeline

```
tuireel.config.jsonc
        │
        ▼
┌─────────────────┐
│  Config Parser   │  jsonc-parser → zod validation → resolve includes
└────────┬────────┘
         │ ValidatedConfig
         ▼
┌─────────────────┐     ┌──────────────┐
│  Step Executor   │────▶│   tuistory   │  Launch PTY, type, press, wait
└────────┬────────┘     │   session    │
         │              └──────┬───────┘
         │                     │ terminal state changes
         ▼                     ▼
┌─────────────────┐     ┌──────────────┐
│ Frame Capturer   │◀───│  tuistory    │  Screenshot (ghostty-opentui)
│                  │    │  .screenshot │
│ - capture loop   │    └──────────────┘
│ - JPEG convert   │
│ - pipe to ffmpeg │
│ - build timeline │
└────────┬────────┘
         │
         ├──▶ InteractionTimeline (JSON, saved to disk)
         │
         ▼
┌─────────────────┐
│  ffmpeg Pass 1   │  image2pipe stdin → libx264 ultrafast → intermediate.mp4
└────────┬────────┘
         │ intermediate.mp4
         ▼
┌─────────────────┐
│  Overlay Pass    │  Timeline → Sharp renders per-frame PNG overlays
│  (Compositor)    │  (cursor position + HUD state)
└────────┬────────┘
         │ overlay stream
         ▼
┌─────────────────┐
│  ffmpeg Pass 2   │  intermediate.mp4 + overlay + audio → final output
│  (overlay filter)│
└────────┬────────┘
         │
         ▼
    output.mp4 / output.webm / output.gif
```

### Pass 1: Recording (Detail)

1. **Config loaded** → validated → resolved (includes, defaults, theme)
2. **tuistory session launched** with configured command, cols, rows
3. **Step executor iterates steps:**
   - For each step: execute via tuistory API (type, press, wait, etc.)
   - After each step: wait for idle (tuistory's 60ms debounce)
   - During execution: frame capture loop runs concurrently
4. **Frame capture loop:**
   - Runs at target FPS (default 30)
   - Calls `tuistory.screenshot()` → JPEG buffer (via Sharp)
   - Pipes JPEG to ffmpeg stdin (image2pipe)
   - Records frame metadata in InteractionTimeline:
     - Frame number, timestamp
     - Cursor position (from terminal state)
     - Active keystrokes (what keys are being pressed)
     - Sound events (click/key triggers)
5. **On completion:**
   - Close tuistory session
   - Close ffmpeg stdin → intermediate video written
   - Save InteractionTimeline to disk (JSON)

### Pass 2: Compositing (Detail)

1. **Load InteractionTimeline** from disk
2. **For each frame in timeline:**
   - Compute cursor overlay position (Bézier easing from previous to current)
   - Compute HUD state (which keys to show, fade animations)
   - Render transparent PNG overlay via Sharp (cursor + HUD composited)
3. **Pipe overlays to ffmpeg:**
   - Input 1: intermediate.mp4
   - Input 2: overlay PNG stream (image2pipe)
   - Filter: `overlay=0:0` (composite overlay on top)
   - Optional: audio tracks mixed via `amix`/`amerge`
4. **Output:** Final video in requested format(s)

## Component Boundaries

| Component | Inputs | Outputs | Talks To |
|-----------|--------|---------|----------|
| Config Parser | JSONC file | ValidatedConfig | Step Executor, Frame Capturer |
| Step Executor | ValidatedConfig | Step events | tuistory session, Frame Capturer |
| tuistory session | Commands (type/press/etc.) | Terminal state, screenshots | Frame Capturer |
| Frame Capturer | Screenshots, step events | JPEG stream, InteractionTimeline | ffmpeg (Pass 1) |
| ffmpeg Pass 1 | JPEG stream | Intermediate video | — |
| Compositor | InteractionTimeline | Overlay PNG stream | ffmpeg (Pass 2) |
| ffmpeg Pass 2 | Intermediate video, overlays, audio | Final video | — |
| Previewer | ValidatedConfig | Visual terminal output | tuistory session (no capture) |
| Watcher | File system events | Re-trigger pipeline | Recorder |

**Key interface: tuistory session API**
```typescript
// What we need from tuistory:
session.launch(command, { cols, rows })  // Start PTY
session.type(text)                        // Type characters
session.press(key)                        // Press key/chord
session.waitForText(pattern, timeout)     // Wait for output
session.screenshot({ format, theme })     // Capture frame
session.text()                            // Get terminal text
session.close()                           // End session
```

## Build Order

**Phase 1: Foundation** (must exist first)
1. Monorepo setup (pnpm + turborepo + packages)
2. Config schema + parser (JSONC → validated config)
3. ffmpeg auto-download

**Phase 2: Core Pipeline** (basic recording works)
4. Step executor (drives tuistory through steps)
5. Frame capture loop (screenshot → JPEG → ffmpeg pipe)
6. Basic video encoding (MP4 output)

**Phase 3: Output Quality** (production-quality output)
7. GIF encoding (palette generation, optimization)
8. WebM encoding
9. Terminal theming (built-in + custom)
10. Frame timing refinement (deduplication, smooth playback)

**Phase 4: Overlay System** (the differentiator)
11. InteractionTimeline data structure
12. Cursor overlay renderer (Sharp)
13. Keystroke HUD renderer (Sharp)
14. Two-pass compositing pipeline
15. `composite` CLI command

**Phase 5: Sound** (audio mixing)
16. Sound effect assets
17. Sound timeline from InteractionTimeline
18. ffmpeg audio mixing

**Phase 6: Workflow** (developer experience)
19. Preview mode
20. Watch mode
21. Multi-video configs
22. Shared step includes
23. CLI polish (init, validate)

## Key Patterns from webreel

### Replicate Directly
- **Two-pass pipeline** — Clean capture + overlay compositing. This is the core architectural insight.
- **InteractionTimeline** — Frame-by-frame log of cursor/key/sound state. Enables re-compositing.
- **image2pipe to ffmpeg** — JPEG frames piped to stdin, not written to disk. Memory efficient.
- **Fitts's law cursor easing** — `180 + 16 * sqrt(distance)` ms duration, asymmetric Bézier, micro-jitter.
- **Frame timing normalization** — Duplicate frames based on elapsed time to maintain correct timing when capture is slow.
- **JSON Schema for IDE autocompletion** — `$schema` reference in config.
- **Auto-download dependencies** — ffmpeg downloaded on first use, cached in ~/.tuireel.

### Adapt for Terminal
- **CDP → tuistory** — webreel uses Chrome DevTools Protocol. We use tuistory's session API.
- **Browser screenshots → terminal screenshots** — webreel calls CDP `Page.captureScreenshot`. We call `tuistory.screenshot()`.
- **Mouse cursor → terminal cursor** — Web cursor is a pointer moving between elements. Terminal cursor is a blinking block/beam at a text position. Different rendering needed.
- **Click targets → text patterns** — webreel clicks by visible text in DOM. We click by text pattern in terminal (tuistory already supports this).
- **DOM readiness → idle detection** — webreel uses Chrome's frame control flags for deterministic rendering. We use tuistory's 60ms idle debounce. May need tuning for recording use case.
- **Viewport pixels → terminal cols/rows** — Web viewport is pixel-based. Terminal viewport is character-based. Frame pixel size comes from cols×rows × font metrics.

### Don't Replicate
- **Chrome binary management** — webreel downloads Chrome for Testing. We don't need a browser.
- **Dual-layer input dispatch** — webreel's CDP + synthetic JS events hack. tuistory handles input encoding correctly.
- **begin-frame-control** — Chrome-specific deterministic frame timing flag. Not applicable to terminal screenshots.
