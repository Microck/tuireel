---
phase: quick-15
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md
  - .planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-summary.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "Maintainer can explain whether WebReel records the browser as a live video stream or as repeated screenshots/composited frames"
    - "Maintainer can cite WebReel's effective/default FPS, output formats, and binary dependencies from upstream evidence"
    - "Maintainer can explain what gets stored during recording and how record vs composite are separated"
  artifacts:
    - path: ".planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md"
      provides: "Evidence-backed breakdown of WebReel's recording pipeline"
      min_lines: 40
    - path: ".planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-summary.md"
      provides: "Concise answers to the FPS/ffmpeg/recording-model questions"
      min_lines: 15
  key_links:
    - from: ".planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md"
      to: "vercel-labs/webreel upstream source files"
      via: "quoted repo paths and evidence notes"
      pattern: "packages/@webreel/core/src/recorder.ts"
    - from: ".planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-summary.md"
      to: ".planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md"
      via: "summary conclusions grounded in findings"
      pattern: "15-findings.md"
---

<objective>
Analyze how WebReel's demos are produced and capture the answer in repo-local notes.

Purpose: Get source-backed clarity on FPS, capture strategy, ffmpeg usage, and what "records everything" actually means so Tuireel decisions can stay grounded.
Output: A detailed findings note plus a short summary with direct answers.
</objective>

<execution_context>
@/home/ubuntu/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/ubuntu/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@README.md
@.planning/quick/13-make-a-demo-video-for-tuireel-using-tuir/13-SUMMARY.md

<interfaces>
Upstream evidence already verified during planning:

- `README.md` says WebReel "drives a headless Chrome instance, captures screenshots at ~60fps, and encodes the result with ffmpeg."
- `packages/@webreel/core/src/types.ts` exports `TARGET_FPS = 60`.
- `packages/@webreel/core/src/recorder.ts` uses `client.Page.captureScreenshot(...)` in a loop and pipes frames into ffmpeg.
- `packages/@webreel/core/src/compositor.ts` recomposites overlays from stored timeline data onto the clean video.
- `packages/@webreel/core/src/ffmpeg.ts` downloads ffmpeg into `~/.webreel/bin/ffmpeg` when no system/custom binary is available.
- `packages/webreel/src/commands/record.ts` exposes `--frames` to save raw JPEG frames in `.webreel/frames/`.
  </interfaces>
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Write evidence-backed WebReel pipeline findings</name>
  <files>.planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md</files>
  <action>
Inspect the upstream WebReel repo and capture the pipeline in a single findings doc. Use raw GitHub content or `gh api` for these exact sources: `README.md`, `skills/webreel/SKILL.md`, `examples/hello-world/webreel.config.json`, `packages/webreel/src/commands/record.ts`, `packages/webreel/src/commands/preview.ts`, `packages/webreel/src/commands/composite.ts`, `packages/@webreel/core/src/recorder.ts`, `packages/@webreel/core/src/compositor.ts`, `packages/@webreel/core/src/ffmpeg.ts`, `packages/@webreel/core/src/media.ts`, and `packages/@webreel/core/src/types.ts`.

Document, with evidence and repo paths, the full lifecycle: config -> CLI record command -> Chrome/CDP automation -> screenshot capture loop -> ffmpeg clean video assembly -> overlay/timeline compositing -> final MP4/GIF/WebM output. Answer explicitly whether WebReel is doing live screen recording or repeated still-frame capture, where the ~60fps claim comes from, what gets written to `.webreel/`, what `--frames` adds, and how `preview` differs from `record`. Do not guess; if a detail is ambiguous, mark it as unresolved and say what source was checked.
</action>
<verify>
<automated>test -f .planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md &amp;&amp; rg -n "TARGET_FPS|captureScreenshot|ffmpeg|\.webreel|~/.webreel|composite|preview" .planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md</automated>
</verify>
<done>`15-findings.md` exists and contains source-backed sections covering FPS, capture method, ffmpeg, storage artifacts, and record/composite separation.</done>
</task>

<task type="auto">
  <name>Task 2: Produce direct-answer summary and Tuireel comparison notes</name>
  <files>.planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-findings.md, .planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-summary.md</files>
  <action>
Create a short summary for maintainers that answers the original questions in plain language: default/effective FPS, whether WebReel "records everything", whether it uses ffmpeg, what intermediate assets exist, and how much of the pipeline is browser automation versus post-processing. Base every answer on `15-findings.md`.

Include a final "What matters for Tuireel" section that compares WebReel's browser pipeline with Tuireel's terminal pipeline at a high level only where the evidence supports it. Call out which parts are analogous (two-pass record/composite, ffmpeg-backed outputs) and which are fundamentally different (Chrome screenshots/CDP vs PTY terminal frames). Keep this short, decisive, and evidence-backed.
</action>
<verify>
<automated>test -f .planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-summary.md &amp;&amp; rg -n "fps|ffmpeg|records everything|Chrome|timeline|composite|Tuireel" .planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-summary.md</automated>
</verify>
<done>`15-summary.md` gives direct answers to the user's questions and includes a brief, accurate WebReel-vs-Tuireel comparison grounded in `15-findings.md`.</done>
</task>

</tasks>

<verification>
- `15-findings.md` cites upstream repo paths for every major claim.
- `15-summary.md` answers FPS, ffmpeg, recording-model, and storage questions directly.
- No claims rely on vague guesses or uncited intuition.
</verification>

<success_criteria>

- A maintainer can read `15-summary.md` and immediately understand how WebReel records demos.
- A maintainer can open `15-findings.md` and trace each conclusion back to upstream code or docs.
- The notes clearly distinguish source-verified facts from any unresolved unknowns.
  </success_criteria>

<output>
After completion, create `.planning/quick/15-analyze-and-research-how-webreel-s-demo-/15-SUMMARY.md`
</output>
