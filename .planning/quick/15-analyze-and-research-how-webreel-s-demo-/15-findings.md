# WebReel Recording Pipeline Findings

## Scope

This note traces WebReel's demo pipeline from config to final output using upstream source and docs from `vercel-labs/webreel`.

Checked sources:

- `README.md`
- `skills/webreel/SKILL.md`
- `examples/hello-world/webreel.config.json`
- `packages/webreel/src/commands/record.ts`
- `packages/webreel/src/commands/preview.ts`
- `packages/webreel/src/commands/composite.ts`
- `packages/@webreel/core/src/recorder.ts`
- `packages/@webreel/core/src/compositor.ts`
- `packages/@webreel/core/src/ffmpeg.ts`
- `packages/@webreel/core/src/media.ts`
- `packages/@webreel/core/src/types.ts`
- `packages/webreel/src/lib/runner.ts` for the exact on-disk `record`/`preview` split

## Bottom Line

WebReel is not doing OS-level live screen recording. It drives Chrome through CDP, calls `Page.captureScreenshot(...)` repeatedly, pipes those JPEG frames into ffmpeg, stores a clean raw MP4 plus a timeline, then runs a second compositing pass for cursor/HUD/sfx overlays.

## 1. Config entry point

- `examples/hello-world/webreel.config.json` shows the config shape: a `videos` map, per-video `url`, `viewport`, optional `zoom`/`waitFor`, and scripted `steps`.
- `README.md` and `skills/webreel/SKILL.md` both describe the user model the same way: define steps in JSON, then run `webreel preview`, `webreel record`, or `webreel composite`.
- `skills/webreel/SKILL.md` adds two per-video fields that matter for this task: `fps` defaults to `60`, and `quality` defaults to `80`.

## 2. CLI command split

### `record`

- `packages/webreel/src/commands/record.ts` calls `runVideo(video, { record: true, ... })`.
- The `--frames` flag is explicit: it saves raw JPEG frames to `.webreel/frames/`.
- `--watch` just re-runs the same recording path when config/include files change.

### `preview`

- `packages/webreel/src/commands/preview.ts` calls `runVideo(video, { record: false, ... })`.
- Upstream text is consistent: preview runs the script in a visible browser without recording.

### `composite`

- `packages/webreel/src/commands/composite.ts` reads `.webreel/raw/<video>.mp4` and `.webreel/timelines/<video>.timeline.json`.
- If either file is missing, it throws and tells the user to run `webreel record` first.
- That proves compositing is intentionally a second pass over stored artifacts, not part of preview.

## 3. What `record` actually does

`packages/webreel/src/lib/runner.ts` is the clearest lifecycle source.

1. It launches Chrome with `launchChrome({ headless: shouldRecord })`.
2. It connects over CDP, sets viewport metrics, navigates, waits for `waitFor`, and executes scripted steps.
3. When `record` mode is on, it creates an `InteractionTimeline` and a `Recorder`.
4. After the steps finish, it writes timeline JSON to `.webreel/timelines/<name>.timeline.json`.
5. It moves the clean recorded MP4 to `.webreel/raw/<name>.mp4`.
6. It immediately calls `compose(rawVideoPath, timelineData, outputPath, { sfx: config.sfx })` to generate the final deliverable.
7. It optionally extracts a thumbnail PNG from the final output.

So "record" really means: automate browser actions + capture clean frames + persist timeline/raw artifacts + composite final overlays.

## 4. Capture model: screenshots, not live video

`packages/@webreel/core/src/recorder.ts` is definitive.

- The capture loop calls `client.Page.captureScreenshot({ format: "jpeg", quality: 60, optimizeForSpeed: true })`.
- The returned base64 JPEG is converted into a buffer and written to ffmpeg stdin.
- ffmpeg is spawned with `-f image2pipe -c:v mjpeg -i pipe:0`, which means the input is a stream of JPEG images, not a native browser video stream.
- When elapsed time exceeds one frame interval, the recorder duplicates frame buffers to fill missed frame slots. That is a frame-synthesis strategy around still captures, not live screen recording.

Conclusion: WebReel records by repeated still-frame capture plus ffmpeg assembly.

## 5. Where the FPS number comes from

- `README.md` says WebReel captures screenshots at "~60fps".
- `packages/@webreel/core/src/types.ts` exports `TARGET_FPS = 60` and `FRAME_MS = 1000 / TARGET_FPS`.
- `packages/@webreel/core/src/recorder.ts` uses `options?.fps ?? TARGET_FPS`, so the effective default is 60 unless a video config overrides `fps`.
- `skills/webreel/SKILL.md` also documents per-video `fps` defaulting to `60`.

The "~" in the README is honest: WebReel targets 60fps, but because it is screenshot-driven, real capture cadence can drift and the recorder may duplicate frames to maintain output timing.

## 6. What gets written during recording

Project-local `.webreel/` artifacts proven by source:

- `.webreel/raw/<video>.mp4` from `packages/webreel/src/lib/runner.ts`
- `.webreel/timelines/<video>.timeline.json` from `packages/webreel/src/lib/runner.ts`
- `.webreel/frames/<video>/frame-00001.jpg` etc. when `--frames` is enabled, from `packages/webreel/src/lib/runner.ts` + `packages/@webreel/core/src/recorder.ts`

User-cache `~/.webreel/` artifacts proven by source:

- `~/.webreel/bin/ffmpeg/...` from `packages/@webreel/core/src/ffmpeg.ts`
- Temporary capture/composite MP4s like `~/.webreel/_rec_<timestamp>.mp4` and `~/.webreel/_composed_<timestamp>.mp4` from `packages/@webreel/core/src/recorder.ts` and `packages/@webreel/core/src/compositor.ts`
- `README.md` and `skills/webreel/SKILL.md` also say Chrome and ffmpeg are auto-downloaded to `~/.webreel`

## 7. What `--frames` adds

- `packages/webreel/src/commands/record.ts` exposes `--frames` as "Save raw frames as JPEGs in .webreel/frames/".
- `packages/webreel/src/lib/runner.ts` resolves that to `.webreel/frames/<video-name>`.
- `packages/@webreel/core/src/recorder.ts` writes each captured JPEG as `frame-xxxxx.jpg`.

This does not replace the normal MP4/timeline pipeline. It adds per-frame JPEG dumps for inspection or debugging.

## 8. How compositing is separated from recording

- During `record`, `runner.ts` stores a clean raw MP4 and a timeline JSON before calling `compose(...)`.
- `packages/webreel/src/commands/composite.ts` can later re-run `compose(...)` from those stored artifacts alone.
- `packages/@webreel/core/src/compositor.ts` reads the raw clean video, renders overlay PNG frames with Sharp from timeline data, pipes those PNGs into ffmpeg, and then finalizes MP4/WebM/GIF.

That separation means record pass = browser capture and artifact generation, composite pass = overlay rendering and output packaging.

## 9. Output formats and ffmpeg's role

- `README.md` and `skills/webreel/SKILL.md` say the primary outputs are MP4, GIF, and WebM.
- `packages/@webreel/core/src/media.ts` has separate `finalizeMp4`, `finalizeWebm`, and `finalizeGif` functions.
- `packages/@webreel/core/src/recorder.ts` first creates a clean MP4 temp video with ffmpeg from JPEG frames.
- `packages/@webreel/core/src/compositor.ts` then uses ffmpeg again to overlay PNG frames onto that clean video.
- `packages/@webreel/core/src/media.ts` uses ffmpeg again for audio mixing, WebM transcoding, GIF palette generation, and thumbnail extraction.

So yes, ffmpeg is central to WebReel. It is not a minor post-step; it is the assembly and packaging backend.

## 10. `preview` vs `record`

- `preview` launches visible Chrome (`headless: false` via `runner.ts` because `shouldRecord` is false), injects overlays live, runs steps, and exits with `Preview complete`.
- `preview` does not create a `Recorder`, does not write `.webreel/raw`, does not write `.webreel/timelines`, and cannot feed `webreel composite`.
- `record` launches headless Chrome, creates the recorder/timeline, writes persistent artifacts, composites the final video, and can optionally save raw JPEGs.

## 11. Resolved answers

- Live video stream or screenshots? Repeated screenshots via CDP `captureScreenshot`, then ffmpeg.
- Default FPS? 60 by default, configurable per video.
- Does it "record everything"? Not literally. It records the scripted browser session as sampled JPEG frames plus a separate interaction timeline, then rebuilds overlays later.
- What is stored? Clean raw MP4, timeline JSON, optional JPEG frames, thumbnails, and cached Chrome/ffmpeg binaries/temp files.
- Is `composite` separate from `record`? Yes. `record` produces the artifacts; `composite` reuses them.

## 12. Unresolved / ambiguity check

No major ambiguity remains for the questions in this task. The only soft wording upstream uses is "~60fps" in `README.md`; the code-backed interpretation is "target/default 60fps, with real capture cadence smoothed by duplicated frames when needed."
