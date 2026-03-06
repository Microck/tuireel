---
phase: quick-13
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - assets/demos/meta-demo.tuireel.jsonc
  - assets/demos/meta-demo.mp4
  - README.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "User can watch the meta demo video showing tuireel creating itself"
    - "Video demonstrates the recursive loop concept (watching the creation of what you're watching)"
    - "Demo is linked from README hero section"
  artifacts:
    - path: "assets/demos/meta-demo.tuireel.jsonc"
      provides: "Tuireel script simulating OpenCode interaction"
      min_lines: 30
    - path: "assets/demos/meta-demo.mp4"
      provides: "Rendered meta demo video"
    - path: "README.md"
      provides: "Link to demo video in hero section"
      contains: "meta-demo.mp4"
  key_links:
    - from: "assets/demos/meta-demo.tuireel.jsonc"
      to: "tuireel record"
      via: "CLI execution"
      pattern: "tuireel record"
    - from: "README.md"
      to: "assets/demos/meta-demo.mp4"
      via: "markdown link or image"
      pattern: "assets/demos/meta-demo"
---

<objective>
Create a meta/recursive demo video for tuireel that shows the process of creating a tuireel demo video using OpenCode and the tuireel skill. The video demonstrates the self-referential loop: the viewer watches the creation of what they're watching.

Purpose: Showcase tuireel's capabilities through a conceptual, mind-bending demo that serves as both documentation and proof-of-concept.
Output: Tuireel script, rendered video, and README integration.
</objective>

<execution_context>
@/home/ubuntu/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/ubuntu/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/13-make-a-demo-video-for-tuireel-using-tuir/13-CONTEXT.md
@skills/tuireel/SKILL.md
@README.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create meta demo tuireel script</name>
  <files>assets/demos/meta-demo.tuireel.jsonc</files>
  <action>
Create a tuireel script at `assets/demos/meta-demo.tuireel.jsonc` that simulates an OpenCode session where a user asks to create a tuireel demo video.

Script flow (per user decisions):

1. Launch a shell
2. Type and execute: `opencode` (or simulate the prompt appearing)
3. Type the user prompt: "create a tuireel demo video" or similar meta phrasing
4. Press Enter
5. Show simulated "thinking" phase (typing dots, spinner, or status messages)
6. Show simulated result generation (progress indicators)
7. End with a message like "demo video created: meta-demo.mp4" or show the file

Use the "polished" preset for professional appearance. Keep timing conceptual and engaging (not too slow, not rushed). Use explicit `wait` steps where appropriate to sync with terminal output. Total duration should be 15-30 seconds for a quick, punchy demo.

Create the `assets/demos/` directory if it doesn't exist.

Discretion areas:

- Exact prompt text (make it clear and meta)
- Timing/pacing of each step
- Whether to use sound effects (polished preset includes them by default)
- Visual details (terminal size, colors are preset-controlled)
  </action>
  <verify>

```bash
tuireel validate assets/demos/meta-demo.tuireel.jsonc
```

Validation passes with no errors.
</verify>
<done>Script file exists, validates successfully, and contains the meta loop flow (opencode → prompt → thinking → result).</done>
</task>

<task type="auto">
  <name>Task 2: Record the meta demo video</name>
  <files>assets/demos/meta-demo.mp4</files>
  <action>
Record the video using tuireel:

```bash
tuireel record assets/demos/meta-demo.tuireel.jsonc
```

The output path is specified in the script's `output` field. If recording fails, use `--verbose` to debug and adjust the script as needed (common issues: wait timeouts, missing terminal output patterns).

Verify the generated MP4 exists and is playable (check file size > 0, optionally use `ffmpeg -i` to inspect metadata).
</action>
<verify>

```bash
ls -lh assets/demos/meta-demo.mp4
ffmpeg -i assets/demos/meta-demo.mp4 2>&1 | grep -E "(Duration|Video|Audio)"
```

File exists, has reasonable size (>100KB), and ffmpeg reports valid video stream.
</verify>
<done>Video file exists at assets/demos/meta-demo.mp4 and is a valid, playable MP4.</done>
</task>

<task type="auto">
  <name>Task 3: Link demo from README hero section</name>
  <files>README.md</files>
  <action>
Add a link or embedded video reference to the meta demo in the README hero section (near the top, after the logo and tagline, before "quick start").

Options:

- Markdown image link: `![Meta Demo](assets/demos/meta-demo.mp4)` (some viewers support this)
- HTML video tag for better control: `<video src="assets/demos/meta-demo.mp4" controls width="600"></video>`
- Link with description: `[Watch the meta demo →](assets/demos/meta-demo.mp4)`

Choose the approach that fits the existing README style (currently uses markdown with some HTML for badges). Keep it concise and visually integrated with the hero section.

Also add `assets/demos/` to `.gitignore` if we want to exclude generated videos from git (or commit them if they're meant to be versioned). Based on project conventions (logo.svg is committed), commit the demo video.
</action>
<verify>

```bash
grep -n "meta-demo" README.md
```

README contains reference to meta-demo.mp4 in the hero section.
</verify>
<done>README hero section includes a link or embedded reference to the meta demo video.</done>
</task>

</tasks>

<verification>
- [ ] Script validates without errors
- [ ] Video file exists and is playable
- [ ] README links to the demo
- [ ] Demo captures the meta/recursive loop concept
</verification>

<success_criteria>

- User can watch the meta demo video from the README
- Video shows the conceptual loop: OpenCode being used to create a tuireel demo (which is the video itself)
- Both script and video are committed to the repo
  </success_criteria>

<output>
After completion, create `.planning/quick/13-make-a-demo-video-for-tuireel-using-tuir/13-SUMMARY.md`
</output>
