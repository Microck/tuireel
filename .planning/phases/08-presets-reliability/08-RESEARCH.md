# Phase 8: Presets & Reliability - Research

**Researched:** 2026-03-03
**Domain:** Config presets system + process reliability / graceful shutdown
**Confidence:** HIGH

## Summary

Phase 8 has two distinct sub-domains: (1) a named presets system that provides default config bundles users can reference by name, and (2) reliability hardening for signal handling, error reporting, and long-running recording stability.

The codebase already has strong foundations for both. The config system already supports a `defaults` merge pattern in multi-video configs (`resolver.ts` lines 127-140), providing a proven template for preset-to-config merging. Signal handling already exists in `recorder.ts` (lines 176-226) with SIGINT/SIGTERM listeners, child process cleanup, and an interrupted-signal racing pattern. The compositor already cleans up temp dirs in a `finally` block. The main work is formalizing these patterns into a preset registry, extending signal handling to the composite command, adding configurable timeouts to wait steps, and improving error messages.

**Primary recommendation:** Build presets as a thin layer on top of the existing `defaults` merge pattern. For reliability, extend the existing signal handling pattern from `recorder.ts` to `compositor.ts` and improve error context wrapping.

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | (workspace) | Config schema validation, preset field | Already used for all schema validation |
| commander | (workspace) | CLI command registration, init prompts | Already used for all CLI commands |
| sharp | ^0.34.5 | Image compositing | Already used in compositor |
| chokidar | (workspace) | File watching | Already used in watch mode |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsonc-parser | (workspace) | Config parsing with comments | Already used in loader.ts |

### New Dependencies: NONE
No new dependencies are needed. The preset system is pure TypeScript config merging. Signal handling uses Node.js built-ins. Interactive prompts for `tuireel init` can use Node.js `readline` (built-in) or commander's built-in prompt capabilities.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node readline for init prompts | @inquirer/prompts | Adds dependency for a single prompt; readline suffices |
| Custom deep merge | deepmerge, lodash.merge | Config is shallow (1 level deep); spread operator suffices |

## Architecture Patterns

### Preset System Architecture

The preset system should follow the existing `defaults` merge pattern from `resolver.ts`:

```
User Config (highest priority)
    ↓ overrides
Preset Defaults (medium priority)
    ↓ overrides
Schema Defaults (lowest priority - Zod .default())
```

### Recommended File Structure (new files only)
```
packages/core/src/
├── presets/
│   ├── index.ts           # exports resolvePreset, PRESET_NAMES
│   ├── built-in.ts        # preset definitions (polished, minimal, demo, silent)
│   └── schema.ts          # preset name Zod enum/union
```

### Pattern 1: Preset Definition as Partial Config
**What:** Each preset is a `Partial<TuireelConfig>` (minus `steps` and `output`)
**When to use:** Always - presets define defaults for config fields, not behavior
**Example:**
```typescript
// Source: Modeled on existing resolver.ts mergeVideoWithDefaults pattern
import type { TuireelConfig } from "../config/schema.js";

type PresetConfig = Partial<Omit<TuireelConfig, "steps" | "output" | "$schema">>;

const presets: Record<string, PresetConfig> = {
  polished: {
    theme: "catppuccin",
    sound: { effects: { click: 1, key: 1 } },
    // cursor: visible by default (already the default)
    // HUD: enabled by default (already the default)
  },
  minimal: {
    theme: "tokyo-night",
    // cursor only, no sound, no HUD - but HUD disable needs
    // to be expressible in config (currently CLI-only --no-hud)
  },
  demo: {
    theme: "dracula",
    sound: { effects: { click: 1, key: 1 } },
  },
  silent: {
    // No overlays, no sound - needs cursor/HUD disable in config
  },
};
```

### Pattern 2: Shallow Merge (Spread-based)
**What:** Preset defaults are spread under user config, user values win
**When to use:** Config merging - the config object is shallow enough that spread works
**Example:**
```typescript
// Source: Based on existing resolver.ts line 134
function applyPreset(
  userConfig: Record<string, unknown>,
  presetName: string,
): Record<string, unknown> {
  const preset = presets[presetName];
  if (!preset) {
    throw new Error(`Unknown preset "${presetName}". Available: ${PRESET_NAMES.join(", ")}`);
  }
  // Preset is the base, user config overrides
  return { ...preset, ...userConfig };
}
```

### Pattern 3: Signal Handler with Cleanup Registry
**What:** Register cleanup callbacks, run them on SIGINT/SIGTERM
**When to use:** Any long-running process with child processes or temp files
**Example:**
```typescript
// Source: Based on existing recorder.ts lines 176-226
const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
let interruptedSignal: NodeJS.Signals | null = null;

const handleSignal = (signal: NodeJS.Signals): void => {
  if (interruptedSignal) return; // Prevent double-cleanup
  interruptedSignal = signal;
  // Kill child processes, resolve interrupt promise
};

for (const signal of signals) {
  process.once(signal, handleSignal);
}

try {
  // ... main work ...
} finally {
  for (const signal of signals) {
    process.off(signal, handleSignal);
  }
}
```

### Anti-Patterns to Avoid
- **Deep merge libraries for shallow config:** The config object has at most 2 levels of nesting (`sound.effects`). Using lodash.merge or deepmerge is overkill and introduces surprising behavior with arrays.
- **Presets that include steps:** Presets should only set presentation defaults (theme, sound, overlays). Including steps in presets would create confusing behavior.
- **process.exit() in signal handlers:** Already avoided in the codebase. Use process.exitCode and let the event loop drain naturally.
- **Mutable global state for cleanup:** The existing pattern of closure-scoped cleanup is correct. Don't create a global cleanup registry.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config schema validation | Custom validator | Zod (already used) | Already validates all config; just add preset field |
| JSON Schema generation | Manual schema | `z.toJSONSchema()` (already used) | Preset field auto-appears in generated schema |
| Theme resolution | Custom theme lookup | `resolveTheme()` (already exists) | Already handles built-in name -> ThemeConfig |
| Child process killing | Custom process tree walker | Direct `.kill()` on tracked processes | Tuireel only spawns direct children (ffmpeg, tuistory) |

## Common Pitfalls

### Pitfall 1: Preset Sound Config vs User Sound Config Merge
**What goes wrong:** User sets `"sound": { "effects": { "key": 2 } }` but preset also sets sound. Shallow merge at top level replaces the entire sound object.
**Why it happens:** Sound config is nested. `{ ...presetSound, ...userSound }` at the config level replaces the preset's full sound object with the user's partial one.
**How to avoid:** Merge `sound` specifically at one level deeper: `sound: { ...presetSound, ...userSound }`. Only `sound` needs this treatment - all other config fields are primitives or strings.
**Warning signs:** User says "I set preset polished but overrode key sound, and now click sounds disappeared."

### Pitfall 2: HUD/Cursor Disable Not Expressible in Config
**What goes wrong:** The `silent` and `minimal` presets need to disable cursor/HUD, but currently cursor visibility and HUD are only controllable via CLI flags (`--no-cursor`, `--no-hud`), not in the config schema.
**Why it happens:** The config schema (`schema.ts`) has no fields for `cursor` or `hud` visibility. These are `ComposeOptions` passed at the CLI level.
**How to avoid:** Add optional `cursor` and `hud` fields to the config schema so presets can set them. The CLI flags should override config values.
**Warning signs:** Can't define a `silent` preset that disables overlays without CLI flags.

### Pitfall 3: Double Signal Handler Registration
**What goes wrong:** If `record()` calls `compose()` internally (it does, line 332), and both register SIGINT handlers, the second handler might not fire or might conflict.
**Why it happens:** `process.once(signal, handler)` only fires once. If recorder's handler fires first, compositor's handler never runs.
**How to avoid:** The recorder already handles signal cleanup before calling compose (line 336-344). The pattern is correct: recorder catches the signal, cleans up, then re-throws. Compositor's signal handling should be for standalone `tuireel composite` only.
**Warning signs:** Zombie ffmpeg processes after Ctrl+C during the compose phase of a recording.

### Pitfall 4: Wait Step Without Timeout Hangs Forever
**What goes wrong:** A `wait` step with no `timeout` field waits indefinitely for a pattern that never appears.
**Why it happens:** `session.waitForText(pattern)` delegates to tuistory which may have no default timeout.
**How to avoid:** Add a configurable default timeout (e.g., `defaultWaitTimeout` in config) and apply it when no per-step timeout is specified. The schema already supports per-step `timeout`.
**Warning signs:** Recording hangs with no output, user has to force-kill.

### Pitfall 5: Memory Growth During Long Recordings
**What goes wrong:** 1000+ frame recordings accumulate buffers or event listeners.
**Why it happens:** The `FrameCapturer` creates a new screenshot buffer every interval tick. If ffmpeg backpressure causes frames to queue, memory grows.
**How to avoid:** The existing `FrameCapturer` already handles backpressure (skips frames when behind), and the encoder's drain mechanism prevents unbounded queuing. The main risk is the `InteractionTimeline` storing every frame's state - this is serialized to JSON at the end. For 1000+ frames this is fine (each frame is ~100 bytes of JSON). Verify with a stress test.
**Warning signs:** Node.js heap growing linearly during recording.

### Pitfall 6: Temp File Leak on Crash
**What goes wrong:** If the process crashes (not signal, but unhandled exception), temp files in `/tmp/tuireel-compositor-*` remain.
**Why it happens:** The `finally` block in `compose()` cleans up, but an OOM or segfault bypasses it.
**How to avoid:** Use `os.tmpdir()` (already done) so OS-level temp cleanup handles it. For extra safety, clean old tuireel temp dirs on startup.
**Warning signs:** `/tmp` fills up with `tuireel-*` directories after repeated crashes.

## Code Examples

### Example 1: Adding Preset Field to Config Schema
```typescript
// In schema.ts - add to baseConfigFields
const PRESET_NAMES = ["polished", "minimal", "demo", "silent"] as const;

const baseConfigFields = {
  $schema: z.string().optional(),
  preset: z.enum(PRESET_NAMES).optional(), // NEW
  format: z.enum(outputFormats).default("mp4"),
  output: z.string().default("output.mp4"),
  theme: z.union([z.string(), themeSchema]).optional(),
  sound: soundSchema,
  cursor: z.object({ visible: z.boolean().optional() }).optional(), // NEW for presets
  hud: z.object({ visible: z.boolean().optional() }).optional(),    // NEW for presets
  fps: z.number().int().positive().default(30),
  cols: z.number().int().positive().default(80),
  rows: z.number().int().positive().default(24),
};
```

### Example 2: Preset Resolution in Config Loader
```typescript
// In loader.ts or a new presets/resolve.ts
function resolvePresetDefaults(rawConfig: unknown): unknown {
  if (!isRecord(rawConfig) || typeof rawConfig.preset !== "string") {
    return rawConfig;
  }

  const preset = builtInPresets[rawConfig.preset];
  if (!preset) {
    // Validation will catch this via Zod enum
    return rawConfig;
  }

  const { preset: _preset, ...userOverrides } = rawConfig;

  // Sound needs special 1-level-deep merge
  const mergedSound = userOverrides.sound !== undefined
    ? userOverrides.sound
    : preset.sound;

  return {
    ...preset,
    ...userOverrides,
    sound: mergedSound,
  };
}
```

### Example 3: Compositor Signal Handling (for standalone composite command)
```typescript
// In compositor.ts compose() - add signal handling similar to recorder.ts
export async function compose(
  rawVideoPath: string,
  timelineData: TimelineData,
  outputPath: string,
  options: ComposeOptions = {},
): Promise<void> {
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  let interrupted = false;

  const handleSignal = (): void => {
    interrupted = true;
  };

  for (const signal of signals) {
    process.once(signal, handleSignal);
  }

  const tempDirectory = await mkdtemp(join(tmpdir(), "tuireel-compositor-"));
  try {
    // ... existing compositing logic ...
    if (interrupted) {
      throw new Error("Compositing interrupted by signal");
    }
  } finally {
    for (const signal of signals) {
      process.off(signal, handleSignal);
    }
    // Temp cleanup already happens here
    await rm(tempDirectory, { recursive: true, force: true });
  }
}
```

### Example 4: Enhanced Error Wrapping for ffmpeg
```typescript
// Improve existing error messages in compositor.ts runFfmpeg
async function runFfmpeg(
  ffmpegPath: string,
  args: string[],
  operationDescription: string,
): Promise<void> {
  try {
    await execFileAsync(ffmpegPath, args, {
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const exitCode = (error as { code?: number }).code ?? "unknown";
    const stderr = getErrorStderr(error);
    const command = `${ffmpegPath} ${args.join(" ")}`;
    throw new Error(
      `ffmpeg failed to ${operationDescription} (exit code: ${exitCode}).\n` +
      `Command: ${command}${stderr}`
    );
  }
}
```

### Example 5: Init Command Preset Selection
```typescript
// Using Node.js readline for minimal dependency
import { createInterface } from "node:readline";

async function promptPreset(): Promise<string | undefined> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const presetChoices = [
    "1. polished  - catppuccin + sound + cursor + HUD",
    "2. minimal   - tokyo-night + cursor only",
    "3. demo      - dracula + sound + cursor + HUD",
    "4. silent    - no overlays, no sound",
    "5. none      - start from scratch",
  ];

  return new Promise((resolve) => {
    console.log("\nChoose a preset:");
    for (const choice of presetChoices) {
      console.log(`  ${choice}`);
    }
    rl.question("\nPreset [1-5, default: 5]: ", (answer) => {
      rl.close();
      const index = parseInt(answer.trim(), 10);
      const presets = ["polished", "minimal", "demo", "silent"];
      resolve(presets[index - 1]); // undefined if 5 or invalid
    });
  });
}
```

## Codebase Analysis: What Exists vs What's Needed

### Already Exists (leverage, don't rebuild)
| Feature | Location | Status |
|---------|----------|--------|
| Config schema with Zod | `config/schema.ts` | Complete - add `preset`, `cursor`, `hud` fields |
| Defaults merge for multi-video | `resolver.ts` lines 127-140 | Template for preset merge |
| Signal handling in recorder | `recorder.ts` lines 176-226 | Complete - extend pattern to compositor |
| Temp file cleanup in compositor | `compositor.ts` finally block | Complete - already cleans up |
| Built-in themes | `themes/built-in.ts` | Complete - presets reference these by name |
| Error wrapping in step executor | `step-executor.ts` lines 97-101 | Complete - wraps step errors with context |
| ffmpeg error stderr capture | `compositor.ts` lines 48-61 | Partial - add command string and exit code |
| FfmpegEncoder abort/terminate | `encoding/encoder.ts` lines 223-238 | Complete |
| Wait step timeout support | `schema.ts` line 88, `wait.ts` | Partial - per-step only, no global default |
| Init command scaffolding | `cli/commands/init.ts` | Complete - add preset prompt |
| JSON Schema generation | `config/generate-schema.ts` | Complete - auto-updates with schema changes |

### Needs Building
| Feature | Location | Complexity |
|---------|----------|------------|
| Preset definitions (`builtInPresets`) | `core/src/presets/built-in.ts` (new) | Low |
| Preset schema field | `core/src/config/schema.ts` (modify) | Low |
| Cursor/HUD config fields in schema | `core/src/config/schema.ts` (modify) | Low |
| Preset resolution in loader | `core/src/config/loader.ts` (modify) | Medium |
| Init preset prompt | `cli/src/commands/init.ts` (modify) | Low |
| Compositor signal handling | `core/src/compositor.ts` (modify) | Medium |
| Global default wait timeout | `core/src/config/schema.ts` + `step-executor.ts` | Low |
| Enhanced ffmpeg error messages | `core/src/compositor.ts` (modify) | Low |
| Enhanced tuistory error messages | `core/src/session.ts` or `step-executor.ts` | Low |
| Long-running recording stress test | `core/test/` (new) | Medium |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `process.on("exit")` for cleanup | SIGINT/SIGTERM handlers with `finally` blocks | Node.js best practice | Exit handlers can't do async work; signal handlers can |
| Deep merge libraries | Spread operator for shallow configs | Always for simple configs | No dependency, predictable behavior |
| process.exit() in handlers | Set exitCode + let event loop drain | Node.js 12+ best practice | Allows async cleanup to complete |
| AbortController for child processes | Direct signal forwarding | Node.js 16+ | AbortController is for AbortSignal-aware APIs; child_process.kill() is more direct |

## Open Questions

1. **Should `cursor` and `hud` be top-level config fields or nested?**
   - What we know: CLI flags are `--no-cursor` and `--no-hud`. The compositor takes `CursorConfig` and `HudConfig` objects.
   - What's unclear: Whether to add simple boolean fields (`cursorVisible`, `hudVisible`) or nested objects (`cursor: { visible: true, size: 20 }`, `hud: { visible: true }`)
   - Recommendation: Use nested objects matching existing `CursorConfig`/`HudConfig` types for consistency. This allows presets to also set cursor size, HUD position, etc.

2. **Should presets be extensible (user-defined presets)?**
   - What we know: Requirements only mention 4 built-in presets.
   - What's unclear: Whether users should be able to define custom presets.
   - Recommendation: Build only built-in presets for now. The architecture (preset = partial config object) naturally supports future user-defined presets if needed.

3. **What should the global default wait timeout be?**
   - What we know: Per-step `timeout` already exists in schema. No global default.
   - What's unclear: What's a reasonable default? 30s? 60s? Infinity?
   - Recommendation: Add `defaultWaitTimeout` to config schema with a default of 30000ms (30 seconds). This prevents infinite hangs while being generous enough for most use cases.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `packages/core/src/config/schema.ts` - current config schema
- Codebase analysis: `packages/core/src/config/resolver.ts` - existing defaults merge pattern
- Codebase analysis: `packages/core/src/recorder.ts` - existing signal handling
- Codebase analysis: `packages/core/src/compositor.ts` - existing temp cleanup, ffmpeg error handling
- Codebase analysis: `packages/core/src/themes/built-in.ts` - theme names available for presets
- Codebase analysis: `packages/core/src/encoding/encoder.ts` - FfmpegEncoder abort/terminate
- Codebase analysis: `opensrc/repos/github.com/vercel-labs/webreel` - upstream webreel patterns

### Secondary (MEDIUM confidence)
- Node.js documentation: `process` signal handling, `child_process` module (training data, consistent with observed codebase patterns)

### Tertiary (LOW confidence)
- None - all findings are based on direct codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing libraries
- Architecture: HIGH - patterns directly derived from existing codebase code
- Pitfalls: HIGH - identified from concrete code analysis, not speculation

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable - internal codebase patterns, no external API dependencies)
