---
name: tuireel
description: Record scripted terminal demo videos with tuireel. Generates mp4/webm/gif from a .tuireel.jsonc script, with optional cursor overlay, keystroke hud, and sound effects. Use when you want to author a config, record/preview/validate/composite a demo, or debug a recording.
---

# tuireel

tuireel executes scripted terminal interactions in a virtual pty, captures frames, and renders videos (mp4, webm, gif). you define steps in a jsonc config, then iterate on the script until the recording looks right.

## when to use

use this skill when the user says things like:

- "record a terminal demo video"
- "create a .tuireel.jsonc"
- "tuireel init" / "tuireel record" / "tuireel preview" / "tuireel validate" / "tuireel composite"
- "my recording is failing" / "wait step times out" / "ffmpeg download is stuck"
- "add a new step type" / "how do i write a click/wait/resize step"

## installation

```bash
npm install -g tuireel

# or run without installing globally
npx tuireel --help
bunx tuireel --help
```

## prerequisites

- supported platforms: macos and linux (on windows, use wsl)
- ffmpeg: tuireel auto-downloads an ffmpeg binary on first run and caches it at `~/.tuireel/bin/ffmpeg`
- archive tools: the ffmpeg download path requires either `unzip` (macos zip) or `tar` (linux .tar.xz)

env overrides:

- `TUIREEL_HOME` controls where `tuireel init` writes `schema.json` (default: `~/.tuireel/schema.json`)

note: `.planning/research/PITFALLS.md` mentions `TUIREEL_FFMPEG_PATH` as a possible ci override, but tuireel does not currently read that env var. if you need to avoid downloads, install ffmpeg via your system package manager and make sure `ffmpeg` is on `PATH`.

## .gitignore

recording runs create a `.tuireel/` folder in your project (raw recordings + timelines for composite). ignore it:

```
.tuireel/
```

## quick start

minimal author loop: init -> preview -> record.

```bash
tuireel init

# edit .tuireel.jsonc

tuireel preview            # run the script in a visible terminal
tuireel record             # record to your configured output
```

defaults:

- default config path is `.tuireel.jsonc` (most commands accept an optional positional path)
- default output is `output.mp4` unless you set `output` in the config

## cli commands

all commands accept an optional positional config path (default: `.tuireel.jsonc`) unless noted.

### init

scaffold a starter config and generate a local json schema for editor autocomplete.

```bash
tuireel init
tuireel init -o my-demo.tuireel.jsonc
tuireel init --force
```

flags: `-o, --output <path>`, `-f, --force`

### validate

check a config file for errors without running it.

```bash
tuireel validate
tuireel validate my-demo.tuireel.jsonc
```

### preview

run steps in a visible terminal without recording.

```bash
tuireel preview
tuireel preview my-demo.tuireel.jsonc
tuireel preview --verbose
tuireel preview --debug
```

### record

record one or more videos from config.

```bash
tuireel record
tuireel record my-demo.tuireel.jsonc
tuireel record --format webm
tuireel record --watch
tuireel record --verbose
tuireel record --debug
```

flags: `--format <mp4|webm|gif>`, `-w, --watch`, `--verbose`, `--debug`

### composite

re-render overlays on an existing recording without re-recording (useful for tweaking cursor/hud/sound settings).

```bash
tuireel composite
tuireel composite -c my-demo.tuireel.jsonc
tuireel composite --format gif
tuireel composite --cursor-size 4
tuireel composite --no-cursor --no-hud
tuireel composite --verbose
tuireel composite --debug
```

flags: `-c, --config <path>`, `--format <mp4|webm|gif>`, `--cursor-size <n>`, `--no-cursor`, `--no-hud`, `--verbose`, `--debug`

## config structure

configs are jsonc (comments and trailing commas allowed). there are two formats.

single-video config:

```jsonc
{
  "preset": "polished",
  "output": "demo.mp4",
  "steps": [
    { "type": "launch", "command": "bash" },
    { "type": "type", "text": "echo 'hello from tuireel'" },
    { "type": "press", "key": "Enter" },
    { "type": "pause", "duration": 1200 },
  ],
}
```

multi-video config (defaults + videos array):

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
        { "type": "launch", "command": "bash" },
        { "type": "type", "text": "npm install tuireel" },
        { "type": "press", "key": "Enter" },
      ],
    },
  ],
}
```

sharing steps with `$include`:

```jsonc
{
  "output": "include-demo.mp4",
  "steps": [
    { "$include": "./shared/setup.steps.jsonc" },
    { "type": "type", "text": "echo 'main demo starts here'" },
    { "type": "press", "key": "Enter" },
  ],
}
```

include files must be objects with a `steps` array:

```jsonc
{ "steps": [{ "type": "press", "key": "Enter" }] }
```

## step types

step objects live in `steps: []` and are a discriminated union on `step.type`.

| type         | key fields             | purpose                                             |
| ------------ | ---------------------- | --------------------------------------------------- |
| `launch`     | `command`              | start a terminal program (shell, tui app, etc.)     |
| `type`       | `text`, `speed?`       | type text character by character                    |
| `press`      | `key`                  | send a key press or combo (e.g. `Enter`, `Ctrl+C`)  |
| `wait`       | `pattern`, `timeout?`  | wait for text/regex to appear in terminal output    |
| `pause`      | `duration`             | pause for a fixed duration in milliseconds          |
| `scroll`     | `direction`, `amount?` | scroll the terminal view up/down                    |
| `click`      | `pattern`              | click on matching text in the terminal view         |
| `screenshot` | `output`               | write a png screenshot at this point                |
| `resize`     | `cols`, `rows`         | resize the terminal dimensions mid-run              |
| `set-env`    | `key`, `value`         | set an environment variable before subsequent steps |

## tips

- author loop: `tuireel validate` -> `tuireel preview` -> `tuireel record`
- start with explicit waits: prefer `wait` over long `pause` when you can key off terminal output
- use `--verbose` to see step-by-step progress; use `--debug` to see internal timing and ffmpeg commands
- for quick iteration, use `tuireel record --watch` so edits trigger a new recording
- use `tuireel composite` to tweak overlays (cursor/hud/sound) without re-running the terminal session

## troubleshooting

- "config not found": most commands default to `.tuireel.jsonc`. either run `tuireel init` or pass the config path explicitly: `tuireel record path/to/file.jsonc`
- waits timing out: confirm the terminal actually prints the text you are waiting for. add `--verbose`, and consider using a regex pattern for variable output
- ffmpeg download problems:
  - ensure `unzip` (macos) or `tar` (linux) is installed
  - retry on a clean network (first run downloads to `~/.tuireel/bin/ffmpeg`)
  - if downloads are blocked, install ffmpeg via `brew install ffmpeg` / `apt install ffmpeg` and ensure it is on `PATH`
- composite errors about missing raw/timeline artifacts: you must run `tuireel record` first. composite reads from `.tuireel/raw/` and `.tuireel/timelines/` in your current working directory

## reference files

- `skills/tuireel/steps-reference.md`
- `skills/tuireel/examples.md`
- `README.md`

## for repo contributors

if you are changing the cli or config format, keep docs + schema + runtime in sync:

- `packages/cli/src/commands/*.ts`
- `packages/core/src/config/schema.ts`
- `packages/core/src/executor/*`
