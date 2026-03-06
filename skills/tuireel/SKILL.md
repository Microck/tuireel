---
name: tuireel
description: Expert developer guidance for the tuireel monorepo, a TUI recording and composition tool.
---

# Tuireel Developer Skill

Welcome to the Tuireel development environment. Tuireel is a monorepo containing a core library and a CLI for recording and compositing Terminal User Interface (TUI) sessions.

## High-Level Architecture

Tuireel is a `pnpm` monorepo using `turbo` at the root.

### Packages
- **`packages/core`** (`@tuireel/core`): The underlying engine for configuration parsing, TUI recording, video composition, and sound processing.
- **`packages/cli`** (`tuireel`): The Commander-based CLI tool.
  - **Entry point:** `packages/cli/src/index.ts`
  - **Commands directory:** `packages/cli/src/commands/*.ts`
  - **Default config file:** `.tuireel.jsonc`

## CLI Commands

The CLI exposes the following commands (sourced from `packages/cli/src/commands/*.ts`):

- **`init`**: Creates a starter `.tuireel.jsonc` config and writes a JSON schema file to `$TUIREEL_HOME` or `~/.tuireel/schema.json`.
- **`validate`**: Validates a config file. Reports JSONC parse errors with line and column numbers when possible.
- **`preview`**: Runs the configured steps in a visible terminal without recording.
- **`record`**: Records a TUI session to video.
  - *Supported flags:* `--format` (`mp4` | `webm` | `gif`), `--watch`, `--verbose`, `--debug`
- **`composite`**: Composites overlays onto an existing recording.
  - *Supported flags:* `-c, --config`, `--format`, `--cursor-size`, `--no-cursor`, `--no-hud`, `--verbose`, `--debug`

## Configuration Format

Configuration parsing and schema validation are handled in `packages/core/src/config/schema.ts` and `packages/core/src/config/loader.ts`.

- **Format:** JSONC (trailing commas are allowed).
- **Top-level fields:** `$schema`, `preset`, `output`, `format`, `theme`, `sound`, `cursor`, `hud`, `fps`, `cols`, `rows`, `defaultWaitTimeout`, `steps`.
- **Multi-Video Format:** Supports recording multiple videos from a single config using an array of video definitions:
  ```jsonc
  {
    "defaults": { /* shared settings */ },
    "videos": [
      {
        "name": "example",
        "output": "example.mp4",
        "steps": [ /* ... */ ]
        // ...overrides
      }
    ]
  }
  ```
- **Includes:** `$include` is supported inside `steps` arrays via objects like `{"$include": "path/to/file.jsonc"}`. The included file must contain a `steps` array (`{ "steps": [...] }`).

### Step Types

Steps use a discriminated union on `step.type`. Valid types are:
`launch`, `type`, `press`, `wait`, `pause`, `scroll`, `click`, `screenshot`, `resize`, `set-env`.

## Core API (`@tuireel/core`)

The main entry point for the core package is `packages/core/src/index.ts`. It exports:

- **Config exports:** `generateJsonSchema`, `loadConfig`, `loadSingleConfig`, `ConfigValidationError`, and schema constants/types.
- **Main runtime exports:** `record`, `preview`, `compose`, `watchAndRecord`, `resolveOutputPath`.
- **Sound helpers:** `resolveSfxPath`, `ensureSoundAssets`, `extractSoundEvents`, `finalizeMp4WithSound`, `finalizeWebmWithSound`, `buildAudioMixArgs`, `buildFullAudioArgs`.
- **Timeline:** `InteractionTimeline` and related types.

## Adding a New Step Type

To add a new step type to Tuireel, follow these steps:

1. **Update Schema:** Modify `packages/core/src/config/schema.ts` to include the new type in `STEP_TYPES` and update the Zod schema.
2. **Implement Logic:** Update any relevant runner or executor in the `core` package to handle the new step type behavior.
3. **Update Documentation:** Document the new step type in the CLI docs and `README.md` as needed.
