# Tuireel

## What This Is

Tuireel is a scripted TUI demo recorder. You define a sequence of terminal interactions in a declarative JSON config — launch a command, type text, press keys, wait for output — and Tuireel drives the TUI app in a virtual terminal, captures pixel-perfect frames, and produces polished video output (MP4, WebM, GIF). It's webreel but for terminal user interfaces: automated, repeatable, production-quality demo videos for CLI/TUI tools.

## Core Value

TUI tool authors can produce polished demo videos from a declarative script, without manual screen recording, editing, or post-production.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Declarative JSONC config defining video steps (launch, type, press, wait, pause, scroll, click)
- [ ] CLI commands: `init`, `record`, `preview`, `composite`, `validate`
- [ ] Pixel-perfect terminal frame capture via tuistory screenshot rendering
- [ ] Video encoding via ffmpeg (MP4, WebM, GIF output formats)
- [ ] Two-pass pipeline: clean capture pass + overlay compositing pass
- [ ] Optional cursor overlay (animated, human-like movement)
- [ ] Optional keystroke HUD overlay (shows keys being pressed)
- [ ] Sound effects synced to actions (click/key sounds)
- [ ] Preview mode: run script in visible terminal without recording
- [ ] Watch mode: re-record on config changes
- [ ] Multi-video configs: one config file defines multiple videos
- [ ] Shared step includes: reusable step sequences across videos
- [ ] Terminal theming: built-in themes (Dracula, Catppuccin, One Dark, etc.) + full custom theme support (colors, font, padding, background)
- [ ] JSON Schema for config files with IDE autocompletion
- [ ] Auto-download ffmpeg to `~/.tuireel` on first use
- [ ] Installation via npm (`npx tuireel`) and Bun (`bunx tuireel`)

### Out of Scope

- Web browser recording — webreel already does this
- Live streaming — asciinema's domain
- asciicast/text-based recording format — video output only
- GUI terminal emulator integration — uses virtual PTY, not a visible terminal app
- Windows support — tuistory is Unix-only (PTY), same constraint applies

## Context

**Prior art and positioning:**
- **webreel** (Vercel Labs) — scripted browser recorder. Same concept but for web. Key patterns to replicate: declarative JSON config, two-pass pipeline (clean + composite), ffmpeg encoding, human-like cursor, keystroke HUD, preview mode, watch mode, JSON Schema config.
- **tuistory** (remorses) — "Playwright for terminals." Handles PTY spawning, key encoding, idle detection, text/screenshot capture. Used as the terminal automation engine (dependency).
- **asciinema** — terminal recorder producing text-based .cast files. Different output format and use case (lightweight replay vs polished video).

**Architecture approach:**
- Monorepo: `@tuireel/core` (engine) + `tuireel` (CLI), pnpm workspaces
- TypeScript, runs on Bun
- tuistory as dependency for terminal automation (session management, PTY, screenshots)
- ffmpeg for video encoding (auto-downloaded)
- Sharp (or similar) for per-frame overlay compositing
- Two-pass pipeline mirroring webreel: record clean frames with interaction timeline, then composite overlays in a separate pass

**Target audience:** TUI library/tool authors who need demo GIFs/videos for READMEs, landing pages, documentation, and social media.

## Constraints

- **Runtime**: Bun primary, but npm/npx must also work for installation
- **Dependency**: tuistory as terminal automation engine — inherits its platform support (Linux, macOS)
- **Video encoding**: ffmpeg required — auto-downloaded, not bundled
- **Terminal rendering**: tuistory's ghostty-opentui for pixel-perfect frame rendering
- **Feature scope**: Parity with webreel's feature set, adapted for terminal context

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use tuistory as dependency | Avoids rebuilding PTY handling, key encoding, idle detection, screenshot rendering. Focus on the recording/compositing pipeline instead. | — Pending |
| Monorepo (@tuireel/core + tuireel) | Clean separation between engine (library) and CLI. Allows programmatic use of the engine. | — Pending |
| Two-pass pipeline (clean + composite) | Decouples recording from overlay rendering. Allows re-compositing without re-recording. Proven pattern from webreel. | — Pending |
| Declarative JSONC config | Accessible to non-developers, IDE-completable via JSON Schema, proven pattern from webreel. | — Pending |
| Bun as primary runtime | Matches tuistory's runtime, fast startup, modern TS support. | — Pending |
| Auto-download ffmpeg | Zero-install experience (besides npm/bun). Proven pattern from webreel. | — Pending |

---
*Last updated: 2025-07-26 after initialization*
