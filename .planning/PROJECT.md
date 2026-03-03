# Tuireel

## What This Is

Tuireel is a scripted TUI demo recorder. Authors define terminal interactions in declarative JSONC, and Tuireel executes the flow in a virtual PTY, captures pixel-perfect terminal frames, and produces polished demo output (MP4, WebM, GIF). v1.0 shipped with optional overlays, optional sound, and workflow tooling for preview, watch mode, multi-video configs, and include reuse.

## Core Value

TUI tool authors can produce polished demo videos from a declarative script, without manual screen recording, editing, or post-production.

## Requirements

### Validated

- [x] Declarative JSONC config defining video steps (launch, type, press, wait, pause, scroll, click) — v1.0
- [x] CLI commands: `init`, `record`, `preview`, `composite`, `validate` — v1.0
- [x] Pixel-perfect terminal frame capture via tuistory screenshot rendering — v1.0
- [x] Video encoding via ffmpeg (MP4, WebM, GIF output formats) — v1.0
- [x] Two-pass pipeline: clean capture pass + overlay compositing pass — v1.0
- [x] Optional cursor overlay (animated, human-like movement) — v1.0
- [x] Optional keystroke HUD overlay (shows keys being pressed) — v1.0
- [x] Sound effects synced to actions (click/key sounds) — v1.0
- [x] Preview mode: run script in visible terminal without recording — v1.0
- [x] Watch mode: re-record on config changes — v1.0
- [x] Multi-video configs: one config file defines multiple videos — v1.0
- [x] Shared step includes: reusable step sequences across videos — v1.0
- [x] Terminal theming with built-in and custom themes — v1.0
- [x] JSON Schema for config files with IDE autocompletion — v1.0
- [x] Auto-download ffmpeg to `~/.tuireel` on first use — v1.0
- [x] Installation via npm (`npx tuireel`) and Bun (`bunx tuireel`) — v1.0

### Active

- [ ] Reliability hardening for long-running recordings and watch sessions
- [ ] Performance profiling and optimization for compositing throughput
- [ ] Release automation for package publishing and tagging workflow
- [ ] CI pipeline for regression suites across MP4/WebM/GIF outputs
- [ ] Better diagnostics for ffmpeg and tuistory runtime failures
- [ ] User-facing presets for polished overlays/audio combinations

### Out of Scope

- Browser recording — webreel already does this
- Live streaming — asciinema's domain
- asciicast/text-based recording format — video output only
- GUI terminal emulator integration — uses virtual PTY, not a visible terminal app
- Windows support — tuistory is Unix-only (PTY), same constraint applies
- Built-in video editor — produce files; use external tools to edit

## Context

**Current shipped state (v1.0):**
- Core stack: TypeScript monorepo (`@tuireel/core` + `tuireel` CLI), Bun runtime compatibility, pnpm workspace tooling.
- Capture/encode stack: tuistory automation + ffmpeg pipelines + Sharp compositing.
- Milestone output: 6 phases, 23 plans, 50 tasks completed.
- Delivery velocity: v1.0 shipped in a single execution window (2026-03-02 to 2026-03-03).

**Positioning:**
- webreel-equivalent workflow for terminal products.
- Focus on repeatable scripted output, not live recording.

**Known follow-up themes:**
- Stabilize edge-case capture/encode behavior.
- Improve release confidence with broader automated verification.

## Constraints

- **Runtime**: Bun primary; npm/npx and bunx execution must remain supported.
- **Dependency**: tuistory remains the terminal automation engine.
- **Video encoding**: ffmpeg is required and auto-downloaded.
- **Platform**: macOS + Linux (Windows unsupported due to PTY constraints).
- **Scope**: keep authoring model simple and declarative (JSONC + schema tooling).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use tuistory as dependency | Avoid rebuilding PTY and screenshot internals. | ✓ Good |
| Monorepo split (`@tuireel/core` + CLI) | Keep engine and command surface cleanly separated. | ✓ Good |
| Two-pass pipeline (`record` then `composite`) | Enable overlay re-renders without replaying scripts. | ✓ Good |
| JSONC + JSON Schema contract | Keep config readable and IDE-toolable. | ✓ Good |
| ffmpeg auto-download to local cache | Reduce setup friction and keep runtime explicit. | ✓ Good |
| Regex wait support in config contract | Unblock realistic script synchronization patterns. | ✓ Good |
| Shared overlay type contracts | Prevent cursor/HUD/compositor type drift. | ✓ Good |
| Sound is opt-in by config | Preserve silent-default behavior for existing users. | ✓ Good |
| Split authoring loader vs runtime loader | Support multi-video authoring without runtime ambiguity. | ✓ Good |
| Runtime `set-env` via shell export + idle wait | Make env mutation observable and deterministic in-session. | ✓ Good |

---
*Last updated: 2026-03-03 after v1.0 milestone completion*
