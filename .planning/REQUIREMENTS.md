# Requirements: Tuireel

**Defined:** 2025-07-26
**Core Value:** TUI tool authors can produce polished demo videos from a declarative script, without manual screen recording, editing, or post-production.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Recording Core

- [ ] **REC-01**: User can define a terminal command to launch in a virtual PTY
- [ ] **REC-02**: User can capture pixel-perfect terminal frames as images via tuistory
- [ ] **REC-03**: User can encode frames to MP4 video
- [ ] **REC-04**: User can encode frames to WebM video
- [ ] **REC-05**: User can encode frames to animated GIF with optimized palette
- [ ] **REC-06**: User can configure frame rate (default 30fps)
- [ ] **REC-07**: User can configure terminal viewport (cols/rows)
- [ ] **REC-08**: ffmpeg is auto-downloaded to ~/.tuireel on first use

### Step Types

- [ ] **STEP-01**: User can type text character-by-character with configurable speed
- [ ] **STEP-02**: User can press keys/chords (Enter, Ctrl+C, arrow keys, etc.)
- [ ] **STEP-03**: User can wait for text/regex pattern to appear in terminal
- [ ] **STEP-04**: User can pause for a fixed duration
- [ ] **STEP-05**: User can scroll within the TUI (mouse scroll events)
- [ ] **STEP-06**: User can click on a text pattern in the terminal
- [ ] **STEP-07**: User can capture a PNG screenshot at any point
- [ ] **STEP-08**: User can resize terminal dimensions mid-recording
- [ ] **STEP-09**: User can set environment variables mid-script

### Overlay System

- [ ] **OVR-01**: User can enable animated cursor overlay with human-like Bezier movement
- [ ] **OVR-02**: User can enable keystroke HUD showing pressed keys as visual overlay
- [ ] **OVR-03**: User can re-composite overlays without re-recording (composite command)
- [ ] **OVR-04**: InteractionTimeline is saved to disk enabling re-compositing

### Terminal Theming

- [ ] **THM-01**: User can select from built-in themes (Dracula, Catppuccin, One Dark, Monokai, Solarized, Tokyo Night, Nord, Gruvbox)
- [ ] **THM-02**: User can define custom themes (colors, font, padding, background)

### Sound

- [ ] **SND-01**: User can enable click/key sound effects synced to actions
- [ ] **SND-02**: User can mix in a custom audio track

### Config & CLI

- [ ] **CLI-01**: User can define videos in JSONC config with comments
- [ ] **CLI-02**: Config files have JSON Schema for IDE autocompletion
- [ ] **CLI-03**: User can run `tuireel record` to produce video
- [ ] **CLI-04**: User can run `tuireel preview` to execute steps without recording
- [ ] **CLI-05**: User can run `tuireel validate` to check config for errors
- [ ] **CLI-06**: User can run `tuireel init` to scaffold a starter config
- [ ] **CLI-07**: User can run `tuireel composite` to re-render overlays from saved timeline
- [ ] **CLI-08**: Config re-records automatically in watch mode on file change
- [ ] **CLI-09**: One config file can define multiple videos
- [ ] **CLI-10**: Step sequences can be shared/included across videos

### Infrastructure

- [ ] **INF-01**: Package installable via npm (npx tuireel) and Bun (bunx tuireel)
- [ ] **INF-02**: Monorepo with @tuireel/core (engine) and tuireel (CLI)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Visual Enhancements

- **VIS-01**: Window chrome — optional macOS-style window frame around terminal (traffic lights)
- **VIS-02**: Background blur/gradient effects behind terminal window
- **VIS-03**: Animated intro/outro sequences

### Advanced Workflow

- **WRK-01**: Programmatic TypeScript API for complex scripting (conditionals, loops)
- **WRK-02**: CI/CD integration (headless recording in GitHub Actions)
- **WRK-03**: Config migration tool for version upgrades

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Live/interactive recording | Defeats scripted repeatability. Use asciinema. |
| asciicast/.cast output | Different paradigm. We produce video, not text recordings. |
| Web player | We produce video files that play anywhere. |
| Live streaming | Out of scope. asciinema handles this. |
| Browser recording | webreel does this. We do terminals. |
| Windows support | tuistory is Unix-only (PTY). macOS + Linux only. |
| Built-in video editor | Produce files; use external tools to edit. |
| Custom scripting language | VHS created "tape" format. JSONC is simpler and toolable. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REC-01 | Phase 2 | Pending |
| REC-02 | Phase 2 | Pending |
| REC-03 | Phase 2 | Pending |
| REC-04 | Phase 3 | Pending |
| REC-05 | Phase 3 | Pending |
| REC-06 | Phase 2 | Pending |
| REC-07 | Phase 2 | Pending |
| REC-08 | Phase 1 | Pending |
| STEP-01 | Phase 2 | Pending |
| STEP-02 | Phase 2 | Pending |
| STEP-03 | Phase 2 | Pending |
| STEP-04 | Phase 2 | Pending |
| STEP-05 | Phase 6 | Pending |
| STEP-06 | Phase 6 | Pending |
| STEP-07 | Phase 6 | Pending |
| STEP-08 | Phase 6 | Pending |
| STEP-09 | Phase 6 | Pending |
| OVR-01 | Phase 4 | Pending |
| OVR-02 | Phase 4 | Pending |
| OVR-03 | Phase 4 | Pending |
| OVR-04 | Phase 4 | Pending |
| THM-01 | Phase 3 | Pending |
| THM-02 | Phase 3 | Pending |
| SND-01 | Phase 5 | Pending |
| SND-02 | Phase 5 | Pending |
| CLI-01 | Phase 1 | Pending |
| CLI-02 | Phase 1 | Pending |
| CLI-03 | Phase 2 | Pending |
| CLI-04 | Phase 6 | Pending |
| CLI-05 | Phase 1 | Pending |
| CLI-06 | Phase 1 | Pending |
| CLI-07 | Phase 4 | Pending |
| CLI-08 | Phase 6 | Pending |
| CLI-09 | Phase 6 | Pending |
| CLI-10 | Phase 6 | Pending |
| INF-01 | Phase 6 | Pending |
| INF-02 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2025-07-26*
*Last updated: 2025-07-26 after roadmap creation*
