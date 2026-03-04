# Phase 1: Foundation - Research

**Researched:** 2025-07-26
**Domain:** Monorepo scaffold, config system, CLI skeleton, ffmpeg management
**Confidence:** HIGH

## Summary

Phase 1 establishes infrastructure all subsequent phases build on. The stack is well-proven — pnpm workspaces + Turborepo for monorepo, Zod + jsonc-parser for config, Commander.js for CLI, and a platform-aware ffmpeg downloader. webreel provides a direct reference implementation for every component.

**Primary recommendation:** Follow webreel's monorepo structure closely. The patterns are proven and directly applicable.

## Standard Stack

### Core
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| pnpm | Package manager + workspaces | Fast, strict, used by webreel |
| turborepo | Monorepo build orchestration | Caching, task graph, used by webreel |
| typescript ~5.x | Type safety | Project standard |
| zod | Config schema validation | Runtime validation + type inference |
| jsonc-parser | JSONC parsing | VS Code's parser, handles comments correctly |
| commander | CLI framework | Mature subcommand support, used by webreel |
| zod-to-json-schema | JSON Schema generation from Zod | IDE autocompletion via $schema |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| vitest | Testing | Unit tests for config validation, CLI commands |
| tsup | Bundling | Build @tuireel/core and tuireel CLI packages |

### Installation
```bash
pnpm add -w turborepo typescript vitest tsup -D
pnpm add zod jsonc-parser commander zod-to-json-schema --filter @tuireel/core
pnpm add commander --filter tuireel
```

## Architecture Patterns

### Monorepo Structure
```
tuireel/
├── packages/
│   ├── core/              # @tuireel/core - engine library
│   │   ├── src/
│   │   │   ├── config/    # Schema, parser, validator
│   │   │   ├── ffmpeg/    # Download, detect, cache
│   │   │   └── index.ts   # Public API exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/               # tuireel - CLI binary
│       ├── src/
│       │   ├── commands/  # init, validate, record (stub), preview (stub), composite (stub)
│       │   └── index.ts   # Commander setup + bin entrypoint
│       ├── package.json
│       └── tsconfig.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── package.json           # Root workspace config
```

### Pattern: Config Schema with JSONC + Zod + JSON Schema
1. Define Zod schema as single source of truth
2. Parse JSONC files with jsonc-parser (preserves comments)
3. Validate parsed object against Zod schema
4. Generate JSON Schema from Zod for IDE $schema reference
5. `tuireel init` writes starter .tuireel.jsonc with `$schema` pointing to generated schema

### Pattern: ffmpeg Auto-Download
1. Check `~/.tuireel/ffmpeg` exists and is executable
2. If missing: detect platform (darwin-arm64, darwin-x64, linux-x64)
3. Download from ffmpeg static builds (evermeet.cx for macOS, johnvansickle for Linux)
4. Extract, chmod +x, verify with `ffmpeg -version`
5. Return path to binary for pipeline use

### Anti-Patterns to Avoid
- **Bundling ffmpeg in npm package:** Too large, platform-specific. Download on first use.
- **Using require() for config loading:** JSONC needs dedicated parser, not JSON.parse or require.
- **Flat package structure:** Monorepo separation is critical for @tuireel/core reusability.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSONC parsing | Custom comment stripper | jsonc-parser | Edge cases with strings containing // |
| Config validation | Manual type checks | Zod schema | Type inference, error messages, transforms |
| JSON Schema generation | Hand-written schema | zod-to-json-schema | Stays in sync with Zod schema automatically |
| CLI argument parsing | Process.argv parsing | Commander.js | Subcommands, help generation, validation |

## Common Pitfalls

### Pitfall 1: pnpm workspace protocol
**What goes wrong:** Internal packages can't resolve each other
**How to avoid:** Use `workspace:*` protocol in package.json dependencies. Ensure packages/cli/package.json has `"@tuireel/core": "workspace:*"`.

### Pitfall 2: TypeScript project references
**What goes wrong:** Types not available across packages during development
**How to avoid:** Use tsconfig project references or tsup with watch mode for dev. Keep tsconfig.base.json at root with shared compiler options.

### Pitfall 3: Bin entrypoint
**What goes wrong:** `npx tuireel` fails because bin isn't properly configured
**How to avoid:** In packages/cli/package.json, set `"bin": { "tuireel": "./dist/index.js" }` and ensure `#!/usr/bin/env node` shebang in output.

### Pitfall 4: ffmpeg download race condition
**What goes wrong:** Multiple concurrent invocations download ffmpeg simultaneously
**How to avoid:** Use a lockfile (`.tuireel/ffmpeg.lock`) during download. Check for existing binary after acquiring lock.

## Code Examples

### Zod Config Schema (starter)
```typescript
import { z } from "zod";

export const stepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("launch"), command: z.string() }),
  z.object({ type: z.literal("type"), text: z.string(), speed: z.number().optional() }),
  z.object({ type: z.literal("press"), key: z.string() }),
  z.object({ type: z.literal("wait"), pattern: z.string(), timeout: z.number().optional() }),
  z.object({ type: z.literal("pause"), duration: z.number() }),
]);

export const configSchema = z.object({
  $schema: z.string().optional(),
  output: z.string().default("output.mp4"),
  fps: z.number().default(30),
  cols: z.number().default(80),
  rows: z.number().default(24),
  steps: z.array(stepSchema).min(1),
});
```

### JSONC Parsing
```typescript
import { parse as parseJsonc } from "jsonc-parser";
import { readFile } from "fs/promises";

export async function loadConfig(path: string) {
  const raw = await readFile(path, "utf-8");
  const errors: any[] = [];
  const parsed = parseJsonc(raw, errors, { allowTrailingComma: true });
  if (errors.length > 0) throw new ConfigParseError(errors);
  return configSchema.parse(parsed);
}
```

## Open Questions

1. **JSON Schema hosting:** Where does the generated schema file live for $schema reference?
   - Recommendation: Generate to packages/core/schema.json, reference via relative path or publish URL later.

## Sources

### Primary (HIGH confidence)
- Project research summary (SUMMARY.md) — stack decisions
- webreel reference — monorepo structure, ffmpeg download pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are established, used by reference project
- Architecture: HIGH — direct reference from webreel
- Pitfalls: HIGH — well-known monorepo/tooling issues

**Research date:** 2025-07-26
**Valid until:** 60 days (stable tooling, no fast-moving APIs)
