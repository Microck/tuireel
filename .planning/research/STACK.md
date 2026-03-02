# Stack Research: Tuireel

## Recommended Stack

### Core Runtime

| Component | Choice | Version | Rationale | Confidence |
|-----------|--------|---------|-----------|------------|
| Runtime | **Bun** | 1.2+ | Primary runtime. Matches tuistory. Fast startup, native TS, good npm compat. | High |
| Language | **TypeScript** | 5.9+ | Matches webreel + tuistory. Strict mode. | High |
| Node compat | npm/npx install works | — | Bun runs TS natively, but package must also work via `npx` for Node users | High |

### Terminal Automation

| Component | Choice | Version | Rationale | Confidence |
|-----------|--------|---------|-----------|------------|
| PTY + automation | **tuistory** | 0.0.16+ | Handles PTY spawning, key encoding (CSI u), idle detection (60ms debounce), text snapshots, pixel screenshots. No need to rebuild this. | High |
| Terminal emulator | **ghostty-opentui** | 1.4.4+ | Used by tuistory internally. Production-grade xterm-truecolor support, structured span data, pixel-accurate rendering with font/theme config. | High (transitive) |
| PTY layer | **node-pty** / Bun.spawn | via tuistory | Dual-runtime PTY adapters handled by tuistory's conditional exports. | High (transitive) |

### Video Pipeline

| Component | Choice | Version | Rationale | Confidence |
|-----------|--------|---------|-----------|------------|
| Video encoder | **ffmpeg** | 7.x (auto-downloaded) | Industry standard. webreel uses it. image2pipe stdin for frames, overlay filter for compositing, audio mixing. | High |
| ffmpeg download | **@ffmpeg-installer/ffmpeg** or custom download | — | webreel auto-downloads Chrome + ffmpeg to ~/.webreel. We should download ffmpeg binary to ~/.tuireel. Options: use existing npm package, or custom downloader (more control over version/arch). Custom preferred for Bun compat. | Medium |
| Encoding strategy | **Two-pass** (from webreel) | — | Pass 1: JPEG frames piped to ffmpeg stdin → intermediate MP4 (libx264 ultrafast). Pass 2: composite overlays via ffmpeg overlay filter → final output. | High |
| Frame format | **JPEG via Sharp** | — | tuistory screenshots are PNG. Convert to JPEG for pipeline speed (smaller, faster encode). Sharp handles this. | High |

### Image Processing

| Component | Choice | Version | Rationale | Confidence |
|-----------|--------|---------|-----------|------------|
| Overlay compositing | **Sharp** | 0.34.5+ | Same as webreel. Per-frame PNG overlay generation (cursor + HUD), fast libvips backend. Proven for this exact use case. | High |
| Cursor rendering | Custom (Sharp-based) | — | Draw animated cursor as PNG overlay per frame. Position from interaction timeline. Human-like Bézier movement (adapt webreel's Fitts's law easing). | High |
| HUD rendering | Custom (Sharp-based) | — | Keystroke HUD overlay as PNG per frame. Show pressed keys with styling. | Medium |

### CLI & Config

| Component | Choice | Version | Rationale | Confidence |
|-----------|--------|---------|-----------|------------|
| CLI framework | **Commander.js** | 14.0+ | Same as webreel. Mature, well-typed, subcommand support (init, record, preview, composite, validate). | High |
| JSONC parsing | **jsonc-parser** | 3.3+ | Same as webreel. Handles comments in JSON config. VS Code's parser. | High |
| Schema validation | **zod** | 4.x | Runtime validation of config. Generate JSON Schema from zod for IDE autocompletion. tuistory also uses zod. | High |
| JSON Schema | **zod-to-json-schema** or manual | — | For `$schema` reference in config files enabling IDE autocompletion. | Medium |
| File watching | **chokidar** | 4.x | For watch mode (re-record on config change). De facto standard, cross-platform. | High |

### Sound & Audio

| Component | Choice | Version | Rationale | Confidence |
|-----------|--------|---------|-----------|------------|
| Sound effects | **Bundled WAV files** | — | Ship click/key sounds as assets. Mix into video via ffmpeg's amix/amerge filters. | Medium |
| Audio mixing | **ffmpeg** | — | Use ffmpeg's audio filter chain to sync sound events to frame timestamps. No separate audio library needed. | High |

### Build & Monorepo

| Component | Choice | Version | Rationale | Confidence |
|-----------|--------|---------|-----------|------------|
| Monorepo tool | **Turborepo** | 2.5+ | Same as webreel. Caching, task orchestration, dependency-aware builds. | High |
| Package manager | **pnpm** | 10.x | Same as webreel. Workspace protocol, strict dependency resolution. | High |
| Workspaces | **pnpm workspaces** | — | `packages/@tuireel/core` + `packages/tuireel` | High |
| Build | **tsc** (TypeScript compiler) | — | Same as webreel. Simple, no bundler needed for library + CLI. | High |
| Testing | **vitest** | 4.x | Same as webreel + tuistory. Fast, native ESM, good TS support. | High |
| Linting | **eslint** + **prettier** | — | Same as webreel. Standard tooling. | Medium |
| Versioning | **changesets** | — | Same as webreel. Monorepo-aware version management + changelogs. | Medium |

## Rejected Alternatives

| Alternative | Why Rejected |
|-------------|-------------|
| Puppeteer/Playwright for terminal | Overkill. tuistory already provides the terminal automation layer. These are browser tools. |
| canvas (node-canvas) for overlays | Sharp is faster and simpler for static image compositing. Canvas would add native dependency complexity. |
| fluent-ffmpeg | Abstraction over ffmpeg CLI. Adds indirection without value — we need precise control over ffmpeg flags (image2pipe, overlay filters). Direct spawning is better. |
| Ink (React for CLI) | Commander.js is simpler for our needs. We don't need interactive terminal UI in the CLI itself. |
| YAML config | JSONC is closer to JSON (more tooling support), has JSON Schema ecosystem, matches webreel. |
| esbuild/rollup bundler | tsc is sufficient. We're shipping a library + CLI, not a frontend bundle. |
| Bun's built-in test runner | vitest has better ecosystem, snapshot testing, and matches both reference projects. |

## Open Questions

- **ffmpeg auto-download strategy**: Use @ffmpeg-installer/ffmpeg npm package, or build custom downloader? Custom gives more control but more maintenance. Need to verify @ffmpeg-installer works well with Bun.
- **Sharp + Bun compatibility**: Sharp uses native bindings (libvips). Verify it works reliably under Bun, not just Node. May need to test early.
- **tuistory screenshot format**: ghostty-opentui renders to PNG/JPEG/WebP. Need to confirm JPEG output quality at various settings for frame pipeline.
- **Cursor asset format**: webreel uses SVG cursor rendered to PNG via Sharp. For terminal, cursor is simpler (block/line/underline). May just draw with Sharp primitives.

## Confidence Levels

| Decision | Confidence | Notes |
|----------|-----------|-------|
| Bun + TypeScript | High | Matches ecosystem, fast, proven |
| tuistory dependency | High | Purpose-built for this; saves months of PTY work |
| ffmpeg for encoding | High | No real alternative for this use case |
| Sharp for compositing | High | Proven in webreel, fast, well-maintained |
| Commander.js for CLI | High | Proven in webreel, mature |
| jsonc-parser | High | Same as webreel, VS Code's parser |
| pnpm + Turborepo | High | Proven monorepo setup from webreel |
| zod for validation | High | Used by tuistory, good TS integration |
| chokidar for watch | High | De facto standard |
| ffmpeg auto-download | Medium | Strategy TBD — test @ffmpeg-installer vs custom |
| Sound mixing via ffmpeg | Medium | Straightforward but needs timing precision testing |
