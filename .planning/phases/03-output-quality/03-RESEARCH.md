# Phase 3: Output Quality - Research

**Researched:** 2025-07-26
**Domain:** WebM encoding, GIF optimization, terminal theming
**Confidence:** HIGH

## Summary

Phase 3 extends the MP4 pipeline to WebM and GIF formats, and adds terminal theming. WebM uses VP9 via ffmpeg. GIF requires two-pass palettegen for quality. Theming passes through to tuistory's ghostty-opentui renderer which already supports theme configuration.

**Primary recommendation:** Add format-specific ffmpeg profiles (WebM VP9, GIF two-pass palettegen). For theming, define a theme schema in Zod and pass it through to tuistory's screenshot renderer.

## Standard Stack

### Core
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| ffmpeg | VP9 WebM encoding, GIF palettegen | Same binary, different codec profiles |
| tuistory/ghostty-opentui | Themed terminal rendering | Already supports color themes for screenshots |

### No New Dependencies
This phase primarily adds ffmpeg encoding profiles and a theme data layer. No new npm packages needed beyond what Phase 1-2 established.

## Architecture Patterns

### Pattern: Format-Specific Encoder Profiles
```typescript
type EncoderProfile = {
  args: string[];
  twoPass?: boolean;
};

const profiles: Record<OutputFormat, EncoderProfile> = {
  mp4: { args: ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-crf", "23"] },
  webm: { args: ["-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-pix_fmt", "yuv420p"] },
  gif: { twoPass: true, args: [] }, // Special two-pass handling
};
```

### Pattern: GIF Two-Pass Palettegen
```bash
# Pass 1: Generate palette
ffmpeg -i input.mp4 -vf "fps=15,palettegen=stats_mode=diff" palette.png

# Pass 2: Apply palette
ffmpeg -i input.mp4 -i palette.png -lavfi "fps=15[x];[x][1:v]paletteuse=dither=bayer" output.gif
```
In code, run pass 1 to temp file, then pass 2 with palette input.

### Pattern: Theme Registry
```typescript
const builtInThemes: Record<string, ThemeConfig> = {
  dracula: { background: "#282a36", foreground: "#f8f8f2", /* ... */ },
  catppuccin: { background: "#1e1e2e", foreground: "#cdd6f4", /* ... */ },
  // 8 total built-in themes
};
```

### Anti-Patterns to Avoid
- **Single-pass GIF encoding:** Produces terrible color banding. Always use two-pass palettegen.
- **High FPS GIF:** GIFs at 30fps are enormous. Cap at 10-15fps for GIF format.
- **Hardcoding theme colors:** Theme must be a data structure passed to renderer, not CSS/styles.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color palette optimization | Custom dithering | ffmpeg palettegen/paletteuse | Years of optimization, handles edge cases |
| VP9 encoding | Custom WebM muxing | ffmpeg libvpx-vp9 | Codec complexity is enormous |
| Terminal color rendering | ANSI-to-image conversion | tuistory ghostty-opentui | Already produces themed pixel-perfect images |

## Common Pitfalls

### Pitfall 1: GIF File Size
**What goes wrong:** GIF output is 50MB+ for a 10-second recording
**How to avoid:** Cap GIF fps at 10-15. Use `stats_mode=diff` in palettegen. Offer quality presets (small/medium/large). Consider max-width scaling.

### Pitfall 2: WebM Browser Compatibility
**What goes wrong:** VP9 WebM doesn't play in Safari
**How to avoid:** Document that WebM is for web embedding (Chrome/Firefox). MP4 (H.264) for universal playback. This is an expected tradeoff.

### Pitfall 3: Theme Color Space
**What goes wrong:** Theme colors look wrong in video output due to color space conversion
**How to avoid:** Ensure ffmpeg output uses consistent color space. Add `-colorspace bt709 -color_primaries bt709 -color_trc bt709` flags.

### Pitfall 4: Custom Theme Validation
**What goes wrong:** User provides invalid hex colors or missing required fields
**How to avoid:** Zod schema validates all 16 ANSI colors + foreground + background + optional padding/font.

## Code Examples

### Theme Schema
```typescript
const themeSchema = z.object({
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  foreground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  cursor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colors: z.object({
    black: z.string(), red: z.string(), green: z.string(), yellow: z.string(),
    blue: z.string(), magenta: z.string(), cyan: z.string(), white: z.string(),
    brightBlack: z.string(), brightRed: z.string(), brightGreen: z.string(),
    brightYellow: z.string(), brightBlue: z.string(), brightMagenta: z.string(),
    brightCyan: z.string(), brightWhite: z.string(),
  }),
  padding: z.number().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
});
```

## Sources

### Primary (HIGH confidence)
- ffmpeg documentation — VP9, palettegen, paletteuse filters
- webreel reference — encoding profiles and format selection
- ghostty-opentui — theme configuration support

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — ffmpeg encoding is well-documented
- Architecture: HIGH — format profiles are a clean extension of Phase 2
- Pitfalls: HIGH — GIF quality/size is a known, well-solved problem

**Research date:** 2025-07-26
**Valid until:** 60 days (ffmpeg APIs are stable)
