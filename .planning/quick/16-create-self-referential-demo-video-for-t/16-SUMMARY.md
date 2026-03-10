# Summary 16: Create Self-Referential Demo Video for Tuireel

## Task 1: Polish the meta-demo config

**Status:** Complete

**What changed:**

`assets/demos/meta-demo.tuireel.jsonc` was upgraded from a rough draft (dummy bash echo steps, small terminal, no production settings) to a production-quality config matching `opencode-demo.tuireel.jsonc`.

**Changes made:**

1. **Production settings copied from opencode-demo:**
   - `fps: 60`, `captureFps: 8`
   - `cols: 128`, `rows: 30`
   - `cursor: { visible: false }`
   - `trim: { leadingStatic: true }`
   - `outputSize: { width: 1920, height: 1080, padding: 180 }`
   - Full Dracula theme block
   - `sound: {}`

2. **Steps replaced with polished sequence:**
   - `launch` → OpenCode via demo launch script
   - `wait("Ask anything", 20s)` → proper readiness detection
   - `pause(1500ms)` → settle before typing
   - `type` at speed 55 → self-referential prompt: "Use the Tuireel skill to generate a demo video of this exact session"
   - `pause(400ms)` → beat before Enter
   - `press Enter` → submit prompt
   - `wait` with regex pattern `Tool|Thinking|skill|tuireel|Searching|Reading` (10s timeout) → detect AI response
   - `pause(6000ms)` → cinematic hold while AI is working (the recursive payoff)
   - `screenshot` → capture thumbnail mid-thought

3. **Validation:** Config passes `tuireel validate` and JSONC parsing.

**Commit:** `feat: polish meta-demo config to production quality`
