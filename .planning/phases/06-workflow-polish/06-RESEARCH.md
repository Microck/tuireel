# Phase 6: Workflow & Polish - Research

**Researched:** 2025-07-26
**Domain:** Advanced step types, preview mode, watch mode, multi-video config, distribution
**Confidence:** HIGH

## Summary

Phase 6 completes the developer experience: advanced step types (scroll, click, screenshot, resize, set-env), preview mode, watch mode, multi-video configs with shared includes, and npm/Bun distribution. Most features are thin wrappers over tuistory APIs or config resolution logic. Watch mode uses file watching with debounced re-recording.

**Primary recommendation:** Implement advanced steps as new cases in the step executor, preview mode as a "run steps without capture/encode" flag, watch mode with chokidar, and multi-video as a config resolver that loops over video definitions.

## Standard Stack

### Core
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| chokidar | File watching for watch mode | De facto standard, handles OS quirks |
| tuistory | Advanced step APIs (scroll, click, resize) | Already the terminal automation engine |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| p-limit | Concurrency control for multi-video | Limit parallel recordings |

### Installation
```bash
pnpm add chokidar --filter @tuireel/core
pnpm add p-limit --filter @tuireel/core
```

## Architecture Patterns

### Pattern: Advanced Step Types
Each new step type maps to a tuistory API call:
```typescript
case "scroll": await session.scroll(step.direction, step.amount); break;
case "click": await session.clickText(step.pattern); break;
case "screenshot": await captureScreenshot(session, step.output); break;
case "resize": await session.resize(step.cols, step.rows); break;
case "set-env": session.env[step.key] = step.value; break;
```

### Pattern: Preview Mode
Preview runs the same step executor but:
1. Uses a visible terminal (if tuistory supports it) or logs step-by-step output
2. Skips frame capture loop entirely
3. Skips ffmpeg encoding entirely
4. Shows step execution progress in console

```typescript
async function preview(config: Config): Promise<void> {
  const session = await createTuistorySession(config, { visible: true });
  for (const step of config.steps) {
    console.log(`▶ ${step.type}: ${summarizeStep(step)}`);
    await executeStep(session, step);
    await session.waitForIdle();
  }
  await session.close();
}
```

### Pattern: Watch Mode
```typescript
async function watchMode(configPath: string): Promise<void> {
  const watcher = chokidar.watch(configPath, { ignoreInitial: true });
  let recording = false;
  
  watcher.on("change", debounce(async () => {
    if (recording) return; // Skip if already recording
    recording = true;
    try {
      const config = await loadConfig(configPath);
      await record(config);
      console.log("✓ Re-recorded successfully");
    } finally {
      recording = false;
    }
  }, 500));
}
```

### Pattern: Multi-Video Config
```typescript
// Config can be single video or array
const multiConfigSchema = z.union([
  configSchema,                    // Single video
  z.object({                       // Multi-video
    videos: z.array(z.object({
      name: z.string(),
      output: z.string(),
      steps: z.array(stepSchema),
      // ... other per-video config
    })),
    defaults: configSchema.partial().optional(), // Shared defaults
  }),
]);
```

### Pattern: Step Includes ($include)
```jsonc
{
  "steps": [
    { "type": "launch", "command": "my-app" },
    { "$include": "./shared/login-steps.jsonc" },
    { "type": "press", "key": "Enter" }
  ]
}
```
Config resolver flattens includes before validation:
```typescript
async function resolveIncludes(steps: StepOrInclude[]): Promise<Step[]> {
  const resolved: Step[] = [];
  for (const step of steps) {
    if ("$include" in step) {
      const included = await loadStepsFromFile(step.$include);
      resolved.push(...included);
    } else {
      resolved.push(step);
    }
  }
  return resolved;
}
```

### Anti-Patterns to Avoid
- **Recursive includes without cycle detection:** Could cause infinite loop. Track include chain, error on cycles.
- **Watch mode without debounce:** Rapid file saves trigger multiple recordings. Always debounce.
- **Parallel multi-video without limits:** Could exhaust system resources. Limit concurrency to 2-3.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File watching | fs.watch / fs.watchFile | chokidar | Cross-platform, handles rename/delete/create correctly |
| Debouncing | Custom timer logic | Simple debounce util (or lodash.debounce) | Edge cases with rapid triggers |
| JSON include resolution | Custom file loader | Simple recursive resolver | Straightforward, but add cycle detection |

## Common Pitfalls

### Pitfall 1: npx/bunx Compatibility
**What goes wrong:** Package works with one but not the other
**How to avoid:** Ensure package.json has correct `"bin"` field, `"type": "module"` if using ESM, and shebang `#!/usr/bin/env node` in entrypoint. Test both before publishing.

### Pitfall 2: Watch Mode File Lock
**What goes wrong:** Recording locks the config file, watcher triggers on lock
**How to avoid:** Use `awaitWriteFinish` option in chokidar. Ignore changes during active recording.

### Pitfall 3: Include Path Resolution
**What goes wrong:** Relative paths in included files resolve from wrong directory
**How to avoid:** Resolve include paths relative to the including file, not CWD. Track the "current file" context during resolution.

### Pitfall 4: Screenshot Step vs Frame Capture
**What goes wrong:** `screenshot` step conflicts with the frame capture loop
**How to avoid:** Screenshot step captures a separate high-res PNG to the specified output path. It's independent of the video frame capture.

## Code Examples

### Distribution package.json (CLI package)
```json
{
  "name": "tuireel",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "tuireel": "./dist/index.js"
  },
  "dependencies": {
    "@tuireel/core": "workspace:*"
  }
}
```

### Debounce Utility
```typescript
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
```

## Sources

### Primary (HIGH confidence)
- chokidar documentation — file watching API
- webreel reference — watch mode, multi-video, preview patterns
- npm documentation — bin entrypoint, package distribution

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — chokidar and distribution patterns are well-established
- Architecture: HIGH — feature set directly mirrors webreel
- Pitfalls: MEDIUM — npx/bunx compatibility needs real testing

**Research date:** 2025-07-26
**Valid until:** 60 days (stable patterns)
