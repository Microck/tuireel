# Phase 4: Overlay System - Research

**Researched:** 2025-07-26
**Domain:** Cursor animation, keystroke HUD, two-pass compositing, InteractionTimeline
**Confidence:** HIGH

## Summary

Phase 4 adds Tuireel's key differentiators: animated cursor overlay, keystroke HUD, and the two-pass compositing pipeline. The InteractionTimeline data structure (recording cursor positions, keystrokes, and events per frame) enables re-compositing without re-recording. Sharp handles per-frame image compositing; ffmpeg handles final overlay merging.

**Primary recommendation:** Design InteractionTimeline as a serializable JSON structure first (it's the contract between record and composite passes), then build cursor/HUD renderers as Sharp-based image generators, and wire the composite CLI command.

## Standard Stack

### Core
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| sharp | Per-frame overlay image generation | Fast libvips backend, proven in webreel |
| ffmpeg | Overlay filter compositing | Combines base video + overlay frames |

### No New Dependencies
Sharp is likely already in the project from Phase 2 (image conversion). ffmpeg is already downloaded.

## Architecture Patterns

### Pattern: InteractionTimeline Data Structure
```typescript
interface InteractionTimeline {
  fps: number;
  totalFrames: number;
  frames: FrameEvent[];
}

interface FrameEvent {
  frameIndex: number;
  timestamp: number;       // ms from start
  cursor?: CursorState;    // position, visibility
  keystroke?: KeystrokeState; // key label, opacity (for fade)
  sound?: SoundEvent;      // sound type, for Phase 5
}

interface CursorState {
  x: number;
  y: number;
  visible: boolean;
}

interface KeystrokeState {
  keys: string[];          // e.g. ["Ctrl", "C"]
  opacity: number;         // 0-1 for fade animation
}
```

### Pattern: Fitts's Law Bezier Cursor Movement
Human cursor movement follows Fitts's law — fast start, slow finish, slight overshoot.
```
Control points for cubic Bezier:
P0 = start position
P1 = start + 60% of distance (fast acceleration)
P2 = end - 10% of distance (deceleration) + small random offset
P3 = end position + micro-overshoot + settle
```
Add micro-jitter (1-2px random offset per frame) for realism.

### Pattern: Two-Pass Pipeline
```
Pass 1 (Record): Config → Steps → Screenshots → MP4 + InteractionTimeline.json
Pass 2 (Composite): MP4 + Timeline → Decode frames → Sharp overlay → Re-encode → Final output
```
The `composite` CLI command only runs Pass 2, reading a saved Timeline.

### Pattern: Keystroke HUD Rendering
- Render key badges as Sharp-generated images (rounded rect + text)
- Position in bottom-right (configurable)
- Fade-in over 3 frames, hold for step duration, fade-out over 5 frames
- Stack multiple simultaneous keys horizontally (e.g., "Ctrl" + "C")

### Anti-Patterns to Avoid
- **Rendering overlays in ffmpeg filter graphs only:** Complex filter chains are fragile. Render overlay images with Sharp, composite with simple ffmpeg overlay filter.
- **Coupling timeline to recording logic:** Timeline should be a pure data structure written independently. Record pass populates it, composite pass reads it.
- **Frame-by-frame ffmpeg decoding in Node:** Slow. Decode base video to frame images first, composite with Sharp, re-encode.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compositing | Canvas/pixel manipulation | Sharp composite() | Hardware-accelerated, handles alpha correctly |
| Bezier curves | Manual cubic math | Simple parametric function | Only need t=0..1 evaluation, 10 lines of code |
| Text rendering on images | Font rasterization | Sharp text overlay or SVG → Sharp | Font metrics, anti-aliasing |

## Common Pitfalls

### Pitfall 1: Cursor Position Mapping
**What goes wrong:** Cursor position doesn't match where text was typed in the terminal
**How to avoid:** Map cursor position from terminal cell coordinates (col, row) to pixel coordinates using font metrics. Must account for padding and font size from theme.

### Pitfall 2: Overlay Alpha Compositing
**What goes wrong:** Overlay edges look jagged or have dark halos
**How to avoid:** Use premultiplied alpha in Sharp. Ensure overlay images have proper alpha channels.

### Pitfall 3: Timeline Serialization Size
**What goes wrong:** Timeline JSON is huge for long recordings (every frame has an entry)
**How to avoid:** Only store frames where state changes. Interpolate between keyframes for cursor movement.

### Pitfall 4: Re-encoding Quality Loss
**What goes wrong:** Composite pass degrades video quality (double encoding)
**How to avoid:** Use high-quality intermediate format for record pass (high bitrate/lossless). Or: composite directly on frame images before first encode (preferred).

## Code Examples

### Sharp Cursor Overlay
```typescript
async function renderCursor(x: number, y: number, size = 20): Promise<Buffer> {
  // Create cursor image as SVG, convert to PNG via Sharp
  const svg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2-1}" fill="white" stroke="black" stroke-width="1"/>
    </svg>`
  );
  return sharp(svg).png().toBuffer();
}

async function compositeFrame(baseFrame: Buffer, overlays: OverlayImage[]): Promise<Buffer> {
  let pipeline = sharp(baseFrame);
  for (const overlay of overlays) {
    pipeline = pipeline.composite([{ input: overlay.buffer, left: overlay.x, top: overlay.y }]);
  }
  return pipeline.jpeg({ quality: 85 }).toBuffer();
}
```

## Open Questions

1. **Frame image approach for compositing:** Composite on decoded frames (Sharp per-frame) vs ffmpeg overlay filter on video stream?
   - Recommendation: Sharp per-frame gives more control. Generate overlay frame sequence, use ffmpeg overlay filter for final merge.

## Sources

### Primary (HIGH confidence)
- webreel reference — cursor animation, HUD overlay, two-pass pipeline
- Sharp documentation — composite(), SVG input, alpha handling
- ffmpeg — overlay filter documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Sharp and ffmpeg are proven for this exact use case
- Architecture: HIGH — webreel implements this exact pattern
- Pitfalls: MEDIUM — cursor positioning and alpha compositing need validation

**Research date:** 2025-07-26
**Valid until:** 60 days (stable libraries)
