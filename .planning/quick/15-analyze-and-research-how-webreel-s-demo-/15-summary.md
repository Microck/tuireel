# WebReel Demo Capture Summary

This summary is based on `.planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md`.

## Direct Answers

- Default/effective FPS: WebReel targets 60fps by default. The upstream code sets `TARGET_FPS = 60`, and recordings use `config.fps ?? TARGET_FPS`.
- Does it "record everything"? Not as a live screen video stream. It repeatedly captures JPEG screenshots from Chrome via CDP, records interaction timeline data, and later rebuilds overlays from that stored metadata.
- Does it use ffmpeg? Yes, heavily. ffmpeg assembles the clean video from JPEG frames, composites overlay frames, mixes sound, and finalizes MP4/WebM/GIF outputs.
- What intermediate assets exist? Project-local `.webreel/raw/<video>.mp4` and `.webreel/timelines/<video>.timeline.json` are the key persistent intermediates. `--frames` adds `.webreel/frames/<video>/frame-xxxxx.jpg`. User-cache `~/.webreel/` stores ffmpeg/Chrome binaries plus temporary working MP4s.
- How much is browser automation vs post-processing? Browser automation drives Chrome, navigates, waits, clicks, types, scrolls, and captures screenshots. Post-processing takes over once the clean raw MP4 and timeline JSON exist, then composites cursor/HUD overlays and packages the final output.

## Record vs Preview

- `preview` runs the scripted browser flow visibly and stops there.
- `record` runs the same browser automation headlessly, captures frames, writes `.webreel/raw` + `.webreel/timelines`, then composites the final deliverable.
- `composite` can re-render from those stored artifacts without re-running the browser session.

## What Matters for Tuireel

- WebReel and Tuireel are analogous where the pipeline is two-pass: first capture a clean base recording plus metadata, then composite overlays and encode final outputs with ffmpeg.
- They differ at the capture layer. WebReel automates Chrome over CDP and samples browser screenshots; Tuireel automates a PTY/terminal session and renders terminal frames.
- The useful takeaway is architectural, not medium-specific: separate capture from compositing so overlay/theme changes do not require re-running the scripted session.

## Source Trail

- Detailed evidence note: `.planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md`
- Key upstream files cited there include `packages/@webreel/core/src/recorder.ts`, `packages/@webreel/core/src/compositor.ts`, `packages/@webreel/core/src/media.ts`, `packages/@webreel/core/src/types.ts`, `packages/webreel/src/commands/record.ts`, `packages/webreel/src/commands/preview.ts`, `packages/webreel/src/commands/composite.ts`, and `packages/webreel/src/lib/runner.ts`
