# Plan 14: Support Any Type of TUI

## Problem

tuireel uses `tuistory` → `ghostty-opentui` which uses a display-only terminal (`stream_readonly.zig`). This terminal drops ALL terminal query actions:

- DA1 (`ESC[c`) — device attributes / terminal identification
- DSR (`ESC[6n`) — cursor position reports
- DECRPM (`ESC[?Xp`) — mode reports (bracketed paste 2004, kitty keyboard 2017/2027, etc.)
- Kitty keyboard query (`ESC[?u`)
- Window size report (`ESC[14t`)

Modern TUI frameworks (Bubble Tea, Charm, Ink, OpenCode, etc.) send these queries on startup and wait for responses. With no responses, they hang, render garbage, or fall back to degraded modes.

## Architecture Constraint

tuistory's `Session.pty` is **private** — we cannot intercept `pty.onData` from tuireel. However:

1. The child process writes queries to stdout → `pty.onData` fires → ghostty drops the action
2. We can write responses via `session.writeRaw()` → `pty.write()` → child's stdin
3. After `launchTerminal()` returns, the TUI app is already running and waiting for responses
4. Most TUI frameworks use non-blocking event loops — late responses still get processed

## Approach

Create a terminal query responder that:

1. Sends a batch of common terminal capability responses via `writeRaw()` immediately after session creation
2. Adds a small delay to let the TUI app's query-reading event loop pick them up
3. Sets additional env vars to help TUI frameworks skip unnecessary probes

The responses are sent "proactively" — the TUI already sent queries during startup (before `launchTerminal` returned), and is now polling stdin for responses.

---

## Task 1: Create terminal responder and integrate into session

**File changes:**

### New: `packages/core/src/terminal-responder.ts`

Create a module that generates a batch of terminal query responses:

```
DA1 response:       ESC[?62;22c          (VT220, ANSI color, no sixel — conservative)
DSR/CPR response:   ESC[1;1R             (cursor at row 1, col 1)
DECRPM responses:
  - Mode 2004 (bracketed paste):  ESC[?2004;1$y  (mode set/enabled)
  - Mode 2027 (grapheme clusters): ESC[?2027;2$y  (mode not recognized — safe default)
  - Mode 2026 (sync output):       ESC[?2026;1$y  (mode set/enabled)
Kitty keyboard:     ESC[?0u              (kitty keyboard flags = 0, protocol supported but no flags active)
Primary DA:         ESC[>41;1;0c         (secondary DA — xterm v1)
```

Export a function:

```ts
export function getTerminalResponses(cols: number, rows: number): string;
```

This concatenates all responses into a single string for one `writeRaw()` call.

Also export:

```ts
export function getTerminalEnvOverrides(): Record<string, string>;
```

Returns env vars that help TUIs skip probes:

- `TERM_PROGRAM=tuireel`
- `TERM_PROGRAM_VERSION=1` (prevents app-specific detection heuristics)

### Modify: `packages/core/src/session.ts`

In `createSession()`, after session creation:

1. Before calling `launchTerminal`, merge `getTerminalEnvOverrides()` into the env
2. After `launchTerminal` returns and TuireelSession is constructed:
   - Call `session.writeRaw(getTerminalResponses(cols, rows))`
   - `await session.waitIdle({ timeout: 100 })` — brief settle time for TUI to process responses

### Modify: `packages/core/src/preview.ts`

Same integration in `createPreviewSession()`:

1. Merge env overrides
2. After session creation, send responses + brief settle

**Verification:**

- Existing tests still pass (the responder adds responses that simple shell sessions will ignore)
- Manual test: create a `.tuireel.jsonc` that launches a Bubble Tea app (or any modern TUI) and verify it doesn't hang

**Risks:**

- Proactive responses arrive as unexpected data for apps that DON'T query (e.g., plain `bash`). However, bash and most shells ignore unrecognized escape sequences on stdin, so this should be benign.
- Some TUIs may send queries with specific IDs and reject responses that don't match. For DA1/DSR this is unlikely since the response format is standardized.
- The 100ms settle delay adds slight latency to session creation. This is acceptable.
