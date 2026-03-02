# Features Research: Tuireel

## Competitive Landscape

| Tool | Approach | Strengths | Weaknesses |
|------|----------|-----------|------------|
| **webreel** | Scripted browser → video | Polished output, declarative config, human-like cursor, two-pass pipeline | Browser only, no terminal support |
| **VHS** (Charm) | Scripted terminal → GIF/video | Simple tape format, popular, Go-based | No overlay compositing, basic cursor, no sound, limited theming |
| **asciinema** | Live terminal → .cast text | Tiny files, web player, live streaming | Text-only output (no video), no scripting, no overlays |
| **terminalizer** | Live terminal → GIF/web | Configurable, web player | Live capture only (not scripted), GIF quality issues, unmaintained |
| **t-rec** | Live terminal → GIF | Fast, Rust-based | macOS-only screen capture, not scriptable, basic output |
| **svg-term-cli** | asciinema .cast → SVG | Vector output, small files | Depends on asciinema, no video output, static rendering |

**Tuireel's gap:** No tool combines scripted automation + pixel-perfect terminal rendering + polished video output with overlays. VHS comes closest but lacks compositing, sound, human-like cursor, and re-compositable pipeline.

## Table Stakes

### Recording Core
- **Launch and drive TUI app** — Start a command, type text, press keys, wait for output | Complexity: M | Ref: VHS, tuistory
  - Dependencies: tuistory session management
- **Capture terminal frames as images** — Pixel-perfect screenshots of terminal state at each step | Complexity: M | Ref: tuistory (ghostty-opentui)
  - Dependencies: tuistory screenshot API
- **Encode frames to video** — Produce MP4/WebM from captured frames | Complexity: M | Ref: webreel, VHS
  - Dependencies: ffmpeg pipeline
- **GIF output** — Produce animated GIF (most common for READMEs) | Complexity: M | Ref: VHS, terminalizer
  - Dependencies: ffmpeg with palette generation
- **Configurable frame rate** — 30fps default, adjustable | Complexity: L | Ref: webreel
  - Dependencies: frame capture loop
- **Configurable viewport** — Terminal columns/rows (affects frame size) | Complexity: L | Ref: VHS, tuistory
  - Dependencies: tuistory session config

### Configuration
- **Declarative config format** — JSON/JSONC file defining steps | Complexity: M | Ref: webreel (JSON), VHS (tape format)
  - Dependencies: jsonc-parser, zod
- **JSON Schema for IDE autocompletion** — `$schema` reference in config | Complexity: L | Ref: webreel
  - Dependencies: schema generation
- **Config validation** — `tuireel validate` to catch errors before recording | Complexity: L | Ref: webreel
  - Dependencies: zod schema
- **Init scaffolding** — `tuireel init` generates starter config | Complexity: L | Ref: webreel
  - Dependencies: CLI, templates

### CLI
- **record command** — Execute config and produce video | Complexity: H (orchestrates everything) | Ref: webreel, VHS
- **preview command** — Run steps in visible terminal without recording | Complexity: M | Ref: webreel
- **validate command** — Check config for errors | Complexity: L | Ref: webreel
- **init command** — Scaffold new config file | Complexity: L | Ref: webreel

### Step Types
- **type** — Type text character by character with configurable speed | Complexity: L | Ref: webreel, VHS
- **press** — Press key/chord (Enter, Ctrl+C, arrow keys, etc.) | Complexity: L | Ref: webreel, VHS
- **wait** — Wait for text/pattern to appear | Complexity: M | Ref: tuistory, VHS
- **pause** — Wait fixed duration | Complexity: L | Ref: webreel, VHS
- **launch** — Start a command in PTY | Complexity: M | Ref: VHS

### Auto-Setup
- **Auto-download ffmpeg** — Download on first use, cache locally | Complexity: M | Ref: webreel
  - Dependencies: platform detection, download logic

## Differentiators

### Overlay System (from webreel, unique for terminal)
- **Cursor overlay** — Animated cursor composited on top of clean frames. Human-like movement with Bézier easing and micro-jitter. | Complexity: H
  - Dependencies: Sharp, interaction timeline, cursor assets
  - Note: Terminal cursor is different from mouse cursor. Need both: terminal cursor (block/beam in the terminal) and optional pointer cursor (for click actions)
- **Keystroke HUD** — Show pressed keys as overlay (like "⌘+C" appearing on screen) | Complexity: H
  - Dependencies: Sharp, interaction timeline, HUD rendering
- **Re-compositable** — Overlays are separate from recording. Change cursor style or HUD theme without re-recording. `tuireel composite` command. | Complexity: M
  - Dependencies: two-pass pipeline, saved timeline data

### Terminal Theming
- **Built-in themes** — Ship popular themes: Dracula, Catppuccin, One Dark, Monokai, Solarized, Tokyo Night, Nord, Gruvbox | Complexity: M
  - Dependencies: ghostty-opentui theme config
- **Custom themes** — Full control: colors (16 ANSI + truecolor), font family/size, padding, background color/image, border radius | Complexity: M
  - Dependencies: ghostty-opentui theme config
- **Window chrome** — Optional macOS-style window frame around terminal (traffic lights) | Complexity: M
  - Dependencies: Sharp compositing

### Sound
- **Sound effects** — Click/key sounds synced to actions | Complexity: M | Ref: webreel
  - Dependencies: ffmpeg audio mixing, bundled WAV assets, interaction timeline
- **Custom audio track** — Mix in user-provided audio file | Complexity: L
  - Dependencies: ffmpeg audio mixing

### Workflow
- **Watch mode** — Re-record on config file change | Complexity: M | Ref: webreel
  - Dependencies: chokidar, record pipeline
- **Multi-video configs** — One config defines multiple videos | Complexity: M | Ref: webreel
  - Dependencies: config parsing, CLI orchestration
- **Shared step includes** — Reusable step sequences across videos | Complexity: M | Ref: webreel
  - Dependencies: config resolution, file loading
- **Composite command** — Re-render overlays without re-recording | Complexity: M | Ref: webreel
  - Dependencies: saved timeline, overlay pipeline

### Advanced Steps
- **scroll** — Scroll within TUI (mouse scroll events) | Complexity: L | Ref: tuistory
- **click** — Click on text pattern (mouse event) | Complexity: M | Ref: tuistory
- **screenshot** — Capture PNG at arbitrary point | Complexity: L | Ref: webreel
- **set-env** — Set environment variables mid-script | Complexity: L
- **resize** — Change terminal dimensions mid-recording | Complexity: M

## Anti-Features

| Feature | Why Exclude | Reference |
|---------|-------------|-----------|
| Live/interactive recording | Defeats the purpose of scripted, repeatable demos. Use asciinema for that. | asciinema |
| asciicast/.cast output | Different output paradigm. We produce video, not text-based recordings. | asciinema |
| Web player | We produce video files that play anywhere. No custom player needed. | asciinema |
| Live streaming | Out of scope. asciinema does this. | asciinema |
| Browser recording | webreel does this. We do terminals. | webreel |
| Windows support | tuistory is Unix-only (PTY). macOS + Linux only. | tuistory |
| Built-in editor/trimming | Produce video files; use ffmpeg/iMovie/etc. to edit. Keep tool focused. | — |
| Custom scripting language | VHS created a custom "tape" format. JSONC is simpler, toolable, IDE-supported. | VHS |

## Feature Dependencies

```
Config Parsing ──→ Step Executor ──→ Frame Capture ──→ Video Encoding
                        │                  │
                        ▼                  ▼
                 Interaction Timeline → Overlay Compositing ──→ Final Video
                        │
                        ▼
                   Sound Timeline ──→ Audio Mixing ──→ Final Video

Preview Mode = Step Executor only (no capture/encoding)
Watch Mode = File watcher → full pipeline re-trigger
Validate = Config Parsing only (no execution)
Init = Template generation (no pipeline)
Composite = Overlay Compositing from saved timeline (no re-recording)
```
