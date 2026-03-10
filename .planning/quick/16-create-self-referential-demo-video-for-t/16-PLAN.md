# Plan 16: Create Self-Referential Demo Video for Tuireel

## Task 1: Polish the meta-demo config

**File:** `assets/demos/meta-demo.tuireel.jsonc`

Update the rough draft to match opencode-demo production quality:

1. **Copy all production settings** from `opencode-demo.tuireel.jsonc`:
   - `fps: 60`, `captureFps: 8`
   - `cols: 128`, `rows: 30`
   - `cursor: { visible: false }`
   - `trim: { leadingStatic: true }`
   - `outputSize: { width: 1920, height: 1080, padding: 180 }`
   - Full Dracula theme block
   - `sound: {}`

2. **Replace the steps** with a polished sequence:

   ```
   launch → wait("Ask anything", 20s) → pause(1500ms)
   → type prompt (speed: 55) → pause(400ms)
   → press Enter → wait for thinking indicator (~10s timeout)
   → pause(6000ms) for cinematic "thinking" hold
   → screenshot (keep for thumbnail)
   ```

3. **Prompt text** — short, punchy, self-referential:

   ```
   Use the Tuireel skill to generate a demo video of this exact session
   ```

   This is concise enough to type smoothly on screen and nails the recursive concept.

4. **After Enter**, wait for a partial response indicator. Use `wait` with a generous timeout pattern like `pattern: "thinking"` or a common OpenCode output marker (e.g., a tool call indicator). If no pattern matches, the timeout fallback keeps the recording moving. Then hold a long cinematic pause so the video ends while the AI is visibly "working" — preserving the recursive mystique.

5. **Output path** stays `assets/demos/meta-demo.mp4`.

**Verification:** The config is valid JSONC, uses the project schema, and all step types exist in the schema. Can dry-run with `pnpm tuireel record assets/demos/meta-demo.tuireel.jsonc` if desired.
