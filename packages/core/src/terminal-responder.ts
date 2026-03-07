/**
 * Terminal capability responder for TUI framework compatibility.
 *
 * Modern TUI frameworks (Bubble Tea, Charm, Ink, OpenCode, etc.) send terminal
 * query escape sequences on startup and wait for responses to determine
 * capabilities. tuireel's underlying terminal (ghostty-opentui) is display-only
 * and drops all query actions — causing TUI apps to hang or degrade.
 *
 * This module provides proactive responses that are written to the child
 * process's stdin immediately after session creation. The TUI app has already
 * sent its queries during startup and is polling stdin for responses, so these
 * "late" responses still get picked up by non-blocking event loops.
 *
 * For apps that don't send queries (e.g. plain bash), these escape sequences
 * arrive as unsolicited input on stdin and are harmlessly ignored.
 */

const ESC = "\x1b";

/**
 * Build a batch of standard terminal capability responses.
 *
 * Each response matches what a real terminal would send back when queried.
 * We send them all at once via a single writeRaw() call for efficiency.
 */
export function getTerminalResponses(_cols: number, _rows: number): string {
  // NOTE: cols/rows are accepted for future use (e.g. window size reports)
  // but are not yet needed by the current response set.

  return [
    // DA1 (Primary Device Attributes) — response to ESC[c
    // Reports: VT220 (62), ANSI color support (22). Conservative — no sixel.
    `${ESC}[?62;22c`,

    // DSR / CPR (Cursor Position Report) — response to ESC[6n
    // Reports cursor at row 1, col 1 (top-left, the expected initial position).
    `${ESC}[1;1R`,

    // DECRPM (DEC Private Mode Report) — responses to ESC[?{mode}$p
    // Mode 2004 (bracketed paste): 1 = set/enabled
    `${ESC}[?2004;1$y`,
    // Mode 2027 (grapheme clusters): 2 = not recognized (safe default)
    `${ESC}[?2027;2$y`,
    // Mode 2026 (synchronized output): 1 = set/enabled
    `${ESC}[?2026;1$y`,

    // Kitty keyboard protocol — response to ESC[?u
    // Flags = 0: protocol is supported but no enhanced flags are active.
    `${ESC}[?0u`,

    // Secondary DA (Device Attributes) — response to ESC[>c
    // Reports: xterm (41), version 1, no firmware revision.
    `${ESC}[>41;1;0c`,
  ].join("");
}

/**
 * Environment variable overrides that help TUI frameworks identify the
 * terminal and skip unnecessary capability probes.
 */
export function getTerminalEnvOverrides(): Record<string, string> {
  return {
    TERM_PROGRAM: "tuireel",
    TERM_PROGRAM_VERSION: "1",
  };
}
