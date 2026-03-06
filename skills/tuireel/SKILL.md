---
name: tuireel
description: Best practices and architecture reference for the tuireel monorepo. Use when working with tuireel source code, extending the CLI or @tuireel/core, or updating the JSONC config format and step types.
---

# tuireel

Record scripted terminal videos as MP4/WebM/GIF with optional cursor overlay, keystroke HUD, and sound effects. Steps are defined in `.tuireel.jsonc` (JSONC) and executed in a virtual PTY session.

## Project structure

pnpm monorepo with Turbo at the root:

```
packages/
  core/   # @tuireel/core - config/schema, session execution, recording, compositing
  cli/    # tuireel CLI
```

Both packages are ESM (`"type": "module"`) and compiled with `tsup`.

## @tuireel/core

Primary exports (see `packages/core/src/index.ts` and `packages/core/src/config/index.ts`):

| Area            | Exports                                                                                                                                                                   | Notes                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Config + schema | `generateJsonSchema`, `loadConfig`, `loadSingleConfig`, `validateConfig`, `ConfigValidationError`, `STEP_TYPES`, `OUTPUT_FORMATS`, Zod schemas + types                    | Schema lives in `packages/core/src/config/schema.ts` and is used by the CLI. |
| Runtime         | `record`, `preview`, `compose`, `watchAndRecord`, `resolveOutputPath`                                                                                                     | `record()` captures frames, then composes overlays into the final output.    |
| Sound           | `resolveSfxPath`, `ensureSoundAssets`, `extractSoundEvents`, `finalizeMp4WithSound`, `finalizeWebmWithSound`, `mixAudioTracks`, `buildAudioMixArgs`, `buildFullAudioArgs` | Sound effects + audio mixing helpers.                                        |
| Timeline        | `InteractionTimeline` + timeline types                                                                                                                                    | Timeline artifacts are written alongside raw recordings.                     |

### Recording artifacts

`record()` writes per-run artifacts in the current working directory (see `packages/core/src/recorder.ts`):

- `.tuireel/raw/<recordingName>.mp4`
- `.tuireel/timelines/<recordingName>.timeline.json`

`composite` reads those artifacts to re-render overlays without re-recording.

### ffmpeg

Tuireel downloads an ffmpeg binary on-demand and caches it under `~/.tuireel/bin/ffmpeg` (see `packages/core/src/ffmpeg/downloader.ts`).

## tuireel CLI

Built with Commander. Entry point: `packages/cli/src/index.ts`.

| Command     | Source                                   | Description                                                                          |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `init`      | `packages/cli/src/commands/init.ts`      | Create a starter `.tuireel.jsonc` config and generate a local JSON schema file.      |
| `validate`  | `packages/cli/src/commands/validate.ts`  | Validate a config file (includes JSONC parse errors with line/column when possible). |
| `preview`   | `packages/cli/src/commands/preview.ts`   | Run steps in a visible terminal without recording.                                   |
| `record`    | `packages/cli/src/commands/record.ts`    | Record a TUI session to video.                                                       |
| `composite` | `packages/cli/src/commands/composite.ts` | Composite overlays onto an existing recording.                                       |

### Default config path

Most commands accept an optional positional config path and default to `.tuireel.jsonc`.

### CLI flags (spot-check sources before documenting new ones)

- `init`: `-o, --output <path>`, `-f, --force`; generates schema at `$TUIREEL_HOME/schema.json` or `~/.tuireel/schema.json`
- `record`: `--format <mp4|webm|gif>`, `-w, --watch`, `--verbose`, `--debug`
- `preview`: `--verbose`, `--debug`
- `composite`: `-c, --config <path>` (override positional), `--format <mp4|webm|gif>`, `--cursor-size <n>`, `--no-cursor`, `--no-hud`, `--verbose`, `--debug`

## Config format

The config schema and loader live in:

- `packages/core/src/config/schema.ts`
- `packages/core/src/config/loader.ts`
- `packages/core/src/config/resolver.ts`

Configs are JSONC and are parsed with `jsonc-parser` using `allowTrailingComma: true`.

### Single-video config (.tuireel.jsonc)

Top-level fields (see `packages/core/src/config/schema.ts`):

| Field                | Type                     | Notes                                                                 |
| -------------------- | ------------------------ | --------------------------------------------------------------------- |
| `$schema`            | string                   | Optional; `tuireel init` writes a `file://.../schema.json` reference. |
| `preset`             | one of `PRESET_NAMES`    | Optional preset resolver applies before validation.                   |
| `format`             | `mp4` \| `webm` \| `gif` | Default `mp4`.                                                        |
| `output`             | string                   | Default `output.mp4`.                                                 |
| `theme`              | string or theme object   | Optional.                                                             |
| `sound`              | object                   | Optional sound config.                                                |
| `cursor`             | object                   | Optional; currently `{ visible?: boolean }`.                          |
| `hud`                | object                   | Optional; currently `{ visible?: boolean }`.                          |
| `defaultWaitTimeout` | number                   | Optional default for `wait.timeout` (ms).                             |
| `fps`                | number                   | Default 30.                                                           |
| `cols` / `rows`      | number                   | Default 80x24.                                                        |
| `steps`              | array                    | Required; may include `$include` directives (see below).              |

### Multi-video config

For multiple recordings in one file (see `packages/core/src/config/schema.ts`):

```jsonc
{
  "defaults": {
    "preset": "polished",
    "cols": 120,
    "rows": 30,
  },
  "videos": [
    {
      "name": "install",
      "output": "videos/install.mp4",
      "steps": [
        { "type": "type", "text": "npm install tuireel" },
        { "type": "press", "key": "Enter" },
      ],
    },
  ],
}
```

`defaults` is merged into each item in `videos`, and per-video fields override defaults.

### $include

Inside any `steps` array, you can include steps from another JSONC file by adding an object like:

```jsonc
{ "$include": "./common.steps.jsonc" }
```

The include file must itself be a JSONC object with a `steps` array:

```jsonc
{ "steps": [{ "type": "press", "key": "Enter" }] }
```

Resolution details (see `packages/core/src/config/resolver.ts`):

- Include paths are resolved relative to the including file.
- Includes can nest.
- Circular includes are rejected.

### Step types

Step types are a discriminated union on `step.type` (see `STEP_TYPES` in `packages/core/src/config/schema.ts`).

| Type         | Required fields | Optional fields | Notes                                                                                  |
| ------------ | --------------- | --------------- | -------------------------------------------------------------------------------------- |
| `launch`     | `command`       | -               | Must appear at least once; used to start the session.                                  |
| `type`       | `text`          | `speed`         | `speed` is ms per char (default 50).                                                   |
| `press`      | `key`           | -               | Key combos are strings like `Ctrl+C` (passed through to the session).                  |
| `wait`       | `pattern`       | `timeout`       | `pattern` can be a string or `{ "regex": string, "flags"?: string }`. Timeouts are ms. |
| `pause`      | `duration`      | -               | Milliseconds.                                                                          |
| `scroll`     | `direction`     | `amount`        | `direction` is `up` or `down`; `amount` defaults to 3.                                 |
| `click`      | `pattern`       | -               | Clicks matching text in the terminal view.                                             |
| `screenshot` | `output`        | -               | Writes a PNG at this point in the run.                                                 |
| `resize`     | `cols`, `rows`  | -               | Resizes terminal dimensions mid-run.                                                   |
| `set-env`    | `key`, `value`  | -               | `key` must match `/^[A-Za-z_][A-Za-z0-9_]*$/`.                                         |

## Adding a new step type

To add a new step type, keep schema, execution, and docs in lockstep:

1. Update `packages/core/src/config/schema.ts`:
   - Extend `STEP_TYPES` (the `stepTypes` tuple)
   - Add a Zod schema for the new step
   - Add the schema to `stepSchema` (discriminated union)
2. Update execution:
   - Add a case in `packages/core/src/executor/step-executor.ts`
   - Implement the step in `packages/core/src/executor/steps/`
3. Update docs/examples:
   - `README.md` step types + config examples
   - Any CLI help text that should mention the new capability

## Testing

- Root: `pnpm test` (Turbo runs package tests)
- Lint: `pnpm lint`
- Build: `pnpm build`

## Conventions

- Prefer describing config formats by pointing at `packages/core/src/config/schema.ts` and `packages/core/src/config/loader.ts`.
- Default config filename is `.tuireel.jsonc`.
- Repo-local artifacts are written under `.tuireel/` in the current working directory.
