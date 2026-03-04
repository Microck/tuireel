# Phase 5: Sound - Research

**Researched:** 2025-07-26
**Domain:** Sound effects, audio mixing, ffmpeg audio pipeline
**Confidence:** HIGH

## Summary

Phase 5 adds opt-in sound effects synced to terminal interactions and custom audio track mixing. Sound events are already captured in the InteractionTimeline (Phase 4). The implementation uses ffmpeg's audio manipulation: place short sound clips at exact timestamps, optionally mix with a user-provided background track.

**Primary recommendation:** Bundle small WAV/OGG sound assets, extract sound events from InteractionTimeline with timestamps, generate an ffmpeg audio filter graph to place sounds, and mix into the final video.

## Standard Stack

### Core
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| ffmpeg | Audio placement, mixing, muxing | Already available, handles all audio needs |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| Bundled sound assets | Key click, enter, backspace sounds | Ship as .wav files in package |

### No New Dependencies
ffmpeg handles all audio manipulation. Sound assets are bundled static files.

## Architecture Patterns

### Pattern: Sound Event Extraction
```typescript
function extractSoundEvents(timeline: InteractionTimeline): SoundEvent[] {
  return timeline.frames
    .filter(f => f.sound)
    .map(f => ({
      type: f.sound!.type,       // "keyclick", "enter", "backspace"
      timestamp: f.timestamp,     // ms from video start
    }));
}
```

### Pattern: ffmpeg Audio Filter Graph
For N sound events, generate a complex filter graph:
```
[0:a] base audio (silence or custom track)
[1:a] keyclick.wav (adelay=1200ms)
[2:a] keyclick.wav (adelay=1500ms)
[3:a] enter.wav (adelay=2000ms)
amix=inputs=N+1
```

Or use the `concat` + `adelay` approach:
1. Create silence track matching video duration
2. For each sound event: `adelay` to offset, `amix` to combine
3. Mux audio into video

### Pattern: Sound Asset Bundle
```
packages/core/assets/sounds/
├── keyclick.wav      # Subtle mechanical key sound
├── enter.wav         # Slightly different for Enter
├── backspace.wav     # Softer deletion sound
└── click.wav         # Mouse click (for Phase 6 click step)
```
Assets are small WAV files (< 50KB each). Ship with the npm package.

### Anti-Patterns to Avoid
- **Generating audio in Node.js:** Complex, unnecessary. ffmpeg handles audio natively.
- **One ffmpeg call per sound:** Extremely slow. Batch all sounds into a single filter graph.
- **Sounds enabled by default:** Must be opt-in. Users who don't configure sound should get silent output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio mixing | Web Audio API / node audio libs | ffmpeg amix filter | Already have ffmpeg, handles mixing natively |
| Audio delay/placement | Manual sample offset | ffmpeg adelay filter | Sample-accurate, handles any audio format |
| Audio format conversion | Custom decoder | ffmpeg | Handles WAV, OGG, MP3, AAC transparently |

## Common Pitfalls

### Pitfall 1: Audio Sync Drift
**What goes wrong:** Sound effects are slightly out of sync with visual actions
**How to avoid:** Use millisecond timestamps from InteractionTimeline directly. Don't round to frame boundaries — ffmpeg adelay accepts milliseconds.

### Pitfall 2: ffmpeg Filter Graph Complexity
**What goes wrong:** Filter graph with 100+ sound events exceeds ffmpeg's filter limit or becomes extremely slow
**How to avoid:** Pre-mix sound events into a single audio track using a multi-step approach: batch sounds in groups of 20-30, mix groups, then mix group outputs.

### Pitfall 3: Sound Asset Licensing
**What goes wrong:** Bundled sounds have restrictive licenses
**How to avoid:** Use CC0/public domain sounds or generate simple synthetic sounds. Keep assets minimal and clearly licensed.

### Pitfall 4: Custom Audio Track Duration
**What goes wrong:** Background music is shorter/longer than video
**How to avoid:** For shorter: pad with silence. For longer: fade out at video end. Use ffmpeg `-shortest` flag or explicit duration trim.

## Code Examples

### Sound Config Schema Addition
```typescript
const soundConfigSchema = z.object({
  enabled: z.boolean().default(false),
  effects: z.object({
    keyclick: z.boolean().default(true),
    enter: z.boolean().default(true),
    volume: z.number().min(0).max(1).default(0.5),
  }).optional(),
  track: z.string().optional(),        // Path to custom audio file
  trackVolume: z.number().min(0).max(1).default(0.3),
});
```

### ffmpeg Audio Mixing Command
```typescript
// Simplified: merge sound effects track with custom audio + video
const args = [
  "-i", videoPath,           // Input video (silent)
  "-i", effectsTrackPath,   // Pre-mixed sound effects
  "-i", customTrackPath,    // User's background music (optional)
  "-filter_complex", "[1:a][2:a]amix=inputs=2:duration=first[a]",
  "-map", "0:v", "-map", "[a]",
  "-c:v", "copy",           // Don't re-encode video
  "-c:a", "aac",
  outputPath,
];
```

## Sources

### Primary (HIGH confidence)
- ffmpeg documentation — adelay, amix, concat filters
- webreel reference — sound effect system architecture

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — ffmpeg audio is well-documented
- Architecture: HIGH — straightforward event-to-audio-placement pipeline
- Pitfalls: MEDIUM — filter graph complexity at scale needs testing

**Research date:** 2025-07-26
**Valid until:** 60 days (ffmpeg audio API is stable)
