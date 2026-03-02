# Pitfalls Research: Tuireel

## Critical Pitfalls

### P1: Frame Timing Inconsistency
**Risk:** TUI apps render asynchronously. tuistory's idle detection (60ms debounce after last PTY write) may not always align with "frame complete." Fast TUI apps may produce partial frames. Slow apps may have long gaps between frames, leading to choppy video.
**Warning Signs:** Flickering/tearing in output video. Partial renders captured mid-update. Inconsistent frame durations.
**Prevention:**
- Use tuistory's `waitIdle()` before each screenshot, not just a fixed interval timer
- Implement frame deduplication: if consecutive frames are identical, skip (save encoding time)
- Implement frame duplication: if gap between frames exceeds target interval, duplicate previous frame to maintain smooth playback (webreel does this — `Math.round(elapsed / frameMs)` slots, capped at 3)
- Allow configurable idle timeout per step (some TUI apps are slower)
- Consider a "frame budget" approach: capture at fixed intervals but skip if terminal state hasn't changed
**Phase:** Phase 2 (Core Pipeline)

### P2: ffmpeg image2pipe Fragility
**Risk:** Piping JPEG frames to ffmpeg's stdin is powerful but fragile. If the pipe breaks (ffmpeg crashes, disk full, encoding too slow), frames are lost with no recovery. Color space mismatches between Sharp JPEG output and ffmpeg's expected input cause washed-out or incorrect colors.
**Warning Signs:** ffmpeg stderr errors about "invalid data" or "broken pipe." Color shifts in output. ffmpeg hanging or consuming excessive memory.
**Prevention:**
- Set explicit pixel format: `-pix_fmt yuv420p` for MP4 compatibility
- Set explicit color space in Sharp JPEG output and ffmpeg input flags
- Monitor ffmpeg stderr in real-time, abort on error patterns
- Use `-thread_queue_size` flag to buffer input frames
- Test with various terminal themes (dark/light/truecolor) to catch color issues early
- Implement frame write timeout — if ffmpeg can't consume fast enough, slow down capture instead of buffering unboundedly
**Phase:** Phase 2 (Core Pipeline)

### P3: GIF Quality vs File Size
**Risk:** GIF encoding is notoriously problematic. Default ffmpeg GIF output is terrible (256-color palette applied globally = banding, dithering artifacts). File sizes can explode for long recordings (10s recording → 50MB+ GIF).
**Warning Signs:** Banding in gradients/colors. Dithering noise. Files too large for GitHub README (usually <10MB target).
**Prevention:**
- Use ffmpeg's two-pass GIF approach: `palettegen` filter first, then `paletteuse` filter with `stats_mode=diff` for per-frame palette optimization
- Implement configurable GIF quality presets (e.g., "readme" = 15fps max 10MB, "high" = 30fps full quality)
- Add `--max-size` flag that adjusts fps/resolution to hit target file size
- Consider offering lossy GIF alternatives: suggest WebP animated or short MP4 for large recordings
- Default GIF fps to 15 (not 30) — halves file size with minimal perceived quality loss
**Phase:** Phase 3 (Output Quality)

### P4: tuistory API Stability
**Risk:** tuistory is v0.0.16 — young library, API may change. ghostty-opentui (its rendering engine) is also young. Breaking changes in either could break Tuireel with no warning.
**Warning Signs:** tuistory npm version bumps with changelog mentioning breaking changes. ghostty-opentui rendering differences between versions.
**Prevention:**
- Pin tuistory to exact version in package.json (no `^` prefix)
- Write integration tests that exercise every tuistory API we use (launch, type, press, wait, screenshot, close)
- Abstract tuistory behind our own `TerminalSession` interface — if tuistory breaks, we can swap implementation
- Monitor tuistory repo for breaking changes (watch releases)
- Consider vendoring critical tuistory code if API instability becomes a problem
**Phase:** Phase 1 (Foundation) — set up abstraction layer early

## Moderate Pitfalls

### P5: Terminal Font Rendering Inconsistency
**Risk:** ghostty-opentui renders terminal state to images using a specific font (JetBrains Mono by default). Unicode characters, emoji, CJK characters, ligatures may render differently or break layout. Font metrics affect frame pixel dimensions.
**Warning Signs:** Missing glyphs (□ boxes). Misaligned text. Different frame sizes than expected. Emoji rendering as placeholder.
**Prevention:**
- Test with diverse terminal content early (ASCII, Unicode, emoji, CJK, box-drawing characters)
- Document supported character sets and known limitations
- Ship a default font (JetBrains Mono) to ensure consistency across machines
- Allow font override in theme config but warn about rendering differences
**Phase:** Phase 3 (Output Quality — Theming)

### P6: Performance — Frame Capture Rate
**Risk:** tuistory's screenshot() calls ghostty-opentui image rendering, which has overhead. If screenshot takes >33ms, we can't hit 30fps. Sharp JPEG conversion adds more time. Total per-frame budget may be tight.
**Warning Signs:** Dropped frames logged. Video playback stuttering. "Capture took Xms, exceeds frame budget" warnings.
**Prevention:**
- Benchmark tuistory screenshot latency early (target: <20ms for 80x24 terminal)
- Use JPEG quality 60-70 (not max) for pipeline speed (same as webreel)
- Consider capturing in a separate thread/worker to decouple from step execution
- For large terminals (200+ cols), profile and optimize
- Track capture metrics: frames captured vs target, drop rate
**Phase:** Phase 2 (Core Pipeline)

### P7: ffmpeg Auto-Download Reliability
**Risk:** Auto-downloading ffmpeg binary involves platform detection (Linux x86/ARM, macOS x86/ARM), download from external URL (may be slow/blocked/down), architecture mismatches (Rosetta on M1 Macs).
**Warning Signs:** Download failures on first use. Wrong architecture binary downloaded. "ffmpeg not found" after download. Slow first-run experience.
**Prevention:**
- Support multiple download sources (GitHub releases, johnvansickle static builds)
- Verify download with SHA256 checksum
- Detect architecture correctly (process.arch + process.platform, handle Rosetta/WSL)
- Allow `TUIREEL_FFMPEG_PATH` environment variable to skip download (use system ffmpeg)
- Cache in `~/.tuireel/ffmpeg-<version>-<arch>` with version check
- Print clear progress during download ("Downloading ffmpeg... 45MB")
**Phase:** Phase 1 (Foundation)

### P8: Sound Synchronization Precision
**Risk:** Sound effects must sync precisely to frame timestamps. ffmpeg audio mixing operates on different time bases than video frames. Off-by-one-frame sync issues are noticeable at 30fps (33ms error).
**Warning Signs:** Click sounds playing slightly before/after the visual action. Audio drift over longer recordings.
**Prevention:**
- Use InteractionTimeline timestamps (not frame numbers) for audio event placement
- Generate a silent audio track of exact video duration, then overlay sound events at precise timestamps using ffmpeg's `adelay` filter
- Test with slow-motion playback to verify sync
- Keep sound effects short (<100ms) to mask minor sync imprecision
**Phase:** Phase 5 (Sound)

### P9: Config Complexity Creep
**Risk:** webreel's config grew to include many options (viewport, cursor style, HUD style, sound, output formats, encoding quality, timing...). Complex configs are hard to learn, document, and maintain. Schema versioning becomes necessary.
**Warning Signs:** Users confused by config options. Frequent "how do I..." questions. Config files becoming long and hard to read.
**Prevention:**
- Strong defaults for everything — minimal config should just be `{ "command": "htop", "steps": [...] }`
- Progressive disclosure: basic config is 5-10 lines, advanced features are opt-in
- `tuireel init` generates minimal config with comments explaining available options
- Group advanced options under namespaces (`overlay: { cursor: {...}, hud: {...} }`)
- Version the config schema from day 1 (`"version": 1`)
**Phase:** Phase 1 (Foundation — schema design)

## Low-Risk Pitfalls

### P10: macOS vs Linux PTY Differences
**Risk:** PTY behavior differs slightly between macOS and Linux (signal handling, terminal capabilities, default shell init). tuistory handles most of this, but edge cases exist.
**Warning Signs:** Recording works on one OS but not the other. Different terminal output for same command.
**Prevention:**
- CI testing on both macOS and Linux (GitHub Actions matrix)
- Set explicit TERM=xterm-256color in PTY environment
- Don't rely on shell-specific behavior in step execution
**Phase:** Phase 2 (Core Pipeline — testing)

### P11: Sharp Native Dependency
**Risk:** Sharp uses libvips native bindings. Prebuilt binaries exist for most platforms, but edge cases (Alpine Linux, exotic architectures) may fail. Bun compatibility is good but not as battle-tested as Node.
**Warning Signs:** `npm install` failures related to sharp. "Could not load sharp" errors on specific platforms.
**Prevention:**
- Test Sharp installation on clean environments early (macOS ARM, Linux x86, Linux ARM)
- Document Sharp requirements in README
- Have a fallback: if Sharp fails, could use canvas or even ffmpeg filters for basic overlays
**Phase:** Phase 1 (Foundation — verify early)

### P12: Long Recording Memory Usage
**Risk:** For long recordings (>60s), the InteractionTimeline grows large, and buffering frames in memory before writing could cause high memory usage.
**Warning Signs:** Node/Bun process memory exceeding 1GB. OOM kills for long recordings.
**Prevention:**
- Stream frames to ffmpeg stdin immediately (don't buffer in memory) — webreel does this
- Write InteractionTimeline entries incrementally (append to file, not hold in memory)
- Set configurable max recording duration with warning
**Phase:** Phase 2 (Core Pipeline)

## Lessons from Existing Tools

| Tool | Issue | Lesson for Tuireel |
|------|-------|-------------------|
| VHS | GIF output quality complaints (charmbracelet/vhs#325, #456) | Use ffmpeg palettegen/paletteuse two-pass. Offer quality presets. |
| VHS | No overlay/compositing system | Our overlay system is the key differentiator. Get it right. |
| VHS | Custom tape format requires learning | JSONC + JSON Schema = zero learning curve for anyone who's used JSON. IDE autocompletion helps. |
| asciinema | No scripting — must manually perform actions | Scripted approach is our core value. Repeatability matters. |
| terminalizer | Unmaintained, GIF-only focus | Build for multiple output formats from day 1. |
| webreel | Two-pass pipeline proven successful | Copy the architecture. It works. |
| webreel | Frame timing via Chrome begin-frame-control | We don't have this luxury. Idle detection + frame deduplication must compensate. |

## Risk Matrix

| Pitfall | Likelihood | Impact | Mitigation Effort |
|---------|-----------|--------|-------------------|
| P1: Frame Timing | High | High | Medium — needs tuning but patterns exist |
| P2: ffmpeg Pipeline | Medium | High | Low — follow webreel's proven approach |
| P3: GIF Quality | High | Medium | Low — known ffmpeg techniques |
| P4: tuistory Stability | Medium | High | Medium — abstraction layer + pinning |
| P5: Font Rendering | Medium | Medium | Low — test early, document limits |
| P6: Capture Performance | Medium | Medium | Medium — benchmark early |
| P7: ffmpeg Download | Low | Medium | Medium — multiple sources + env override |
| P8: Sound Sync | Low | Low | Low — short sounds mask imprecision |
| P9: Config Complexity | Medium | Medium | Low — strong defaults, progressive disclosure |
| P10: macOS vs Linux | Low | Low | Low — CI matrix |
| P11: Sharp Native | Low | Medium | Low — test early |
| P12: Memory Usage | Low | Medium | Low — stream, don't buffer |
