# Research Summary: Tuireel

## One-Line Summary

Tuireel fills a clear gap: no existing tool combines scripted terminal automation + pixel-perfect rendering + polished video output with overlays. The architecture is proven (webreel), the terminal automation layer exists (tuistory), and the video pipeline is standard (ffmpeg).

## Stack Recommendation

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Bun + TypeScript | Matches tuistory, fast, native TS |
| Terminal automation | tuistory (pinned) | PTY, screenshots, idle detection — no rebuild needed |
| Terminal rendering | ghostty-opentui (via tuistory) | Pixel-perfect, themed, production-grade |
| Video encoding | ffmpeg (auto-downloaded) | Industry standard, image2pipe + overlay filters |
| Image compositing | Sharp | Proven in webreel, fast libvips backend |
| Config | JSONC (jsonc-parser) + zod | IDE-completable, validated, matches webreel |
| CLI | Commander.js | Mature, subcommand support, matches webreel |
| Monorepo | pnpm + Turborepo | Proven setup from webreel |
| Testing | vitest | Matches both reference projects |

## Feature Priorities

### Table Stakes (must ship in v1)
- Scripted steps: launch, type, press, wait, pause
- Frame capture → MP4/WebM/GIF output
- Declarative JSONC config with JSON Schema
- CLI: record, preview, validate, init
- Terminal theming (built-in + custom)
- Auto-download ffmpeg

### Key Differentiators (what makes Tuireel special)
- **Cursor overlay** — animated, human-like movement (Fitts's law Bézier)
- **Keystroke HUD** — show pressed keys as visual overlay
- **Two-pass re-compositable pipeline** — change overlays without re-recording
- **Sound effects** — synced to actions

### Defer
- Custom audio track overlay
- Window chrome (macOS-style frame)
- Advanced steps: click, scroll, resize, set-env

## Architecture Summary

**Two-pass pipeline** (proven by webreel):
1. **Record pass:** Config → step executor → tuistory → screenshots → ffmpeg → intermediate video + InteractionTimeline
2. **Composite pass:** Timeline → Sharp overlay rendering → ffmpeg overlay filter → final video + audio

**Monorepo:** `@tuireel/core` (engine library) + `tuireel` (CLI wrapper)

**Build order:**
1. Foundation: monorepo, config schema, ffmpeg download
2. Core pipeline: step executor, frame capture, basic encoding
3. Output quality: GIF, WebM, theming, frame timing
4. Overlay system: timeline, cursor, HUD, two-pass compositing
5. Sound: effects, audio mixing
6. Workflow: preview, watch, multi-video, includes

## Top Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Frame timing inconsistency | High | Idle detection + dedup + duplication (webreel pattern) |
| ffmpeg pipeline fragility | High | Follow webreel's proven approach, explicit color space |
| GIF quality/size | Medium | Two-pass palettegen, quality presets, fps cap |
| tuistory API instability | High | Pin version, abstraction layer, integration tests |
| Capture performance | Medium | Benchmark early, JPEG quality 60-70, profile |

## Key Insight

The hardest engineering is already done:
- **Terminal automation** → tuistory (PTY, input encoding, idle detection, screenshots)
- **Terminal rendering** → ghostty-opentui (pixel-perfect images with theming)
- **Video encoding patterns** → webreel (two-pass pipeline, image2pipe, overlay compositing)

Tuireel's job is to **glue these together** with a clean config format, polished overlay system, and solid developer experience. The risk is in the integration and polish, not in fundamental technical unknowns.
