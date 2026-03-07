# Summary 14: Support Any Type of TUI

## Status: Complete

## What was done

Created a terminal capability responder that sends proactive terminal query responses immediately after session creation. This unblocks modern TUI frameworks (Bubble Tea, Charm, Ink, OpenCode) that hang waiting for responses from ghostty-opentui's display-only terminal.

## Files changed

### New: `packages/core/src/terminal-responder.ts`

- `getTerminalResponses(cols, rows)` — builds a batch of standard terminal capability responses (DA1, DSR/CPR, DECRPM modes, kitty keyboard, secondary DA) as a single string for one `writeRaw()` call
- `getTerminalEnvOverrides()` — returns `TERM_PROGRAM=tuireel` and `TERM_PROGRAM_VERSION=1` to help TUI frameworks skip unnecessary probes

### Modified: `packages/core/src/session.ts`

- `createSession()`: merges env overrides before `launchTerminal`, sends proactive responses + 100ms settle after session construction

### Modified: `packages/core/src/preview.ts`

- `createPreviewSession()`: same integration — env overrides before launch, responses + settle after session construction
- Fallback path passes merged env to `createSession()` (which already handles responses)

## Verification

- `bun run build` — compiles cleanly
- `bun test packages/core/src/__tests__/ packages/core/test/compositor.test.ts packages/core/test/sound.test.ts packages/cli/test/` — all 28 tests pass
- Pre-existing failures (themes snapshot mismatch, set-env timeout, opensrc broken deps) are unrelated

## Responses sent

| Response       | Escape Sequence | Purpose                          |
| -------------- | --------------- | -------------------------------- |
| DA1            | `ESC[?62;22c`   | VT220 + ANSI color               |
| DSR/CPR        | `ESC[1;1R`      | Cursor at (1,1)                  |
| DECRPM 2004    | `ESC[?2004;1$y` | Bracketed paste enabled          |
| DECRPM 2027    | `ESC[?2027;2$y` | Grapheme clusters not recognized |
| DECRPM 2026    | `ESC[?2026;1$y` | Sync output enabled              |
| Kitty keyboard | `ESC[?0u`       | Protocol supported, no flags     |
| Secondary DA   | `ESC[>41;1;0c`  | xterm v1                         |
