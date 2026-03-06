<p align="center">
  <img alt="Tuireel" src="assets/branding/logo.svg" width="200">
</p>

<p align="center">
  produce polished terminal demo videos from declarative configs.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tuireel"><img src="https://img.shields.io/npm/v/tuireel" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@tuireel/core"><img src="https://img.shields.io/npm/v/@tuireel/core?label=%40tuireel%2Fcore" alt="@tuireel/core version"></a>
  <a href="https://github.com/Microck/tuireel/actions/workflows/ci.yml"><img src="https://github.com/Microck/tuireel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Microck/tuireel/actions/workflows/video-smoke.yml"><img src="https://github.com/Microck/tuireel/actions/workflows/video-smoke.yml/badge.svg" alt="Video Smoke Tests"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/tuireel" alt="license"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/node/v/tuireel" alt="node version"></a>
</p>

<!-- assets/branding/banner.png -->

---

tuireel executes scripted terminal interactions in a virtual pty, captures frames, and renders polished videos (mp4, webm, gif) with optional cursor overlays, keystroke hud, and sound effects. no manual recording or editing required.

define steps in a jsonc config (typing, key presses, launches, waits, pauses) and tuireel drives a headless terminal session, captures screenshots at configurable fps, and encodes the result with ffmpeg.

[documentation](https://tuireel.micr.dev) | [github](https://github.com/Microck/tuireel)

## quick start

```bash
npm install -g tuireel   # or: npx tuireel / bunx tuireel
tuireel init              # scaffold a demo config
tuireel record            # record your first demo
```

the generated config is a jsonc file describing your demo steps:

```jsonc
{
  "preset": "polished",
  "output": "demo.mp4",
  "steps": [
    { "type": "type", "text": "echo 'Hello, world!'" },
    { "type": "press", "key": "Enter" },
    { "type": "pause", "duration": 1000 },
  ],
}
```

## usage

### init

scaffold a new demo config:

```bash
tuireel init
tuireel init -o my-demo.tuireel.jsonc
tuireel init --force       # overwrite existing config
```

this creates a `.tuireel.jsonc` with a `$schema` for ide autocompletion.

### record

record a demo from config:

```bash
tuireel record
tuireel record my-demo.tuireel.jsonc
tuireel record --format webm
tuireel record --watch         # re-record on config change
tuireel record --verbose
tuireel record --debug
```

### preview

run a config in a visible terminal without recording:

```bash
tuireel preview
tuireel preview my-demo.tuireel.jsonc
tuireel preview --verbose
```

### composite

re-render overlays on an existing recording without re-recording:

```bash
tuireel composite
tuireel composite -c my-demo.tuireel.jsonc
tuireel composite --format gif
tuireel composite --cursor-size 4
tuireel composite --no-cursor --no-hud
```

### validate

check a config file for errors without running it:

```bash
tuireel validate
tuireel validate my-demo.tuireel.jsonc
```

### help and version

```bash
tuireel --help
tuireel --version
tuireel record --help
```

## step types

| type         | key fields             | description                                          |
| ------------ | ---------------------- | ---------------------------------------------------- |
| `launch`     | `command`              | start a terminal program (e.g. `vim`, `htop`, `npm`) |
| `type`       | `text`, `speed?`       | type text into the terminal character by character   |
| `press`      | `key`                  | send a key press (enter, tab, ctrl+c, escape, etc.)  |
| `wait`       | `pattern`, `timeout?`  | wait for text/regex to appear in terminal output     |
| `pause`      | `duration`             | pause for a fixed duration in milliseconds           |
| `scroll`     | `direction`, `amount?` | scroll the terminal view up or down                  |
| `click`      | `pattern`              | click on matching text in the terminal               |
| `screenshot` | `output`               | capture a png screenshot at this point               |
| `resize`     | `cols`, `rows`         | resize the terminal dimensions mid-recording         |
| `set-env`    | `key`, `value`         | set an environment variable before next command      |

all steps can be used with `$include` to share common setup sequences across configs.

## config options

### top-level

| field                | default      | description                                           |
| -------------------- | ------------ | ----------------------------------------------------- |
| `$schema`            | -            | json schema url for ide autocompletion                |
| `preset`             | -            | preset name (`polished`, `minimal`, `demo`, `silent`) |
| `output`             | `output.mp4` | output file path                                      |
| `format`             | `mp4`        | output format (`mp4`, `webm`, `gif`)                  |
| `theme`              | -            | terminal color theme (name or inline object)          |
| `sound`              | -            | sound effect configuration                            |
| `cursor`             | -            | cursor overlay settings                               |
| `hud`                | -            | keystroke hud overlay settings                        |
| `fps`                | `30`         | capture frame rate                                    |
| `cols`               | `80`         | terminal width in columns                             |
| `rows`               | `24`         | terminal height in rows                               |
| `defaultWaitTimeout` | -            | default timeout for `wait` steps (ms)                 |
| `steps`              | required     | array of step objects                                 |

### multi-video config

for projects with multiple demos, use the multi-video format:

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
    {
      "name": "usage",
      "output": "videos/usage.mp4",
      "steps": [
        { "type": "type", "text": "tuireel record" },
        { "type": "press", "key": "Enter" },
      ],
    },
  ],
}
```

the `defaults` object is merged into each video definition. per-video fields override defaults.

| field           | default   | description                    |
| --------------- | --------- | ------------------------------ |
| `name`          | required  | video identifier               |
| `output`        | required  | output file path               |
| `steps`         | required  | array of step objects          |
| `preset`        | inherited | preset override for this video |
| `format`        | inherited | output format override         |
| `theme`         | inherited | theme override                 |
| `sound`         | inherited | sound configuration override   |
| `cursor`        | inherited | cursor overlay override        |
| `hud`           | inherited | keystroke hud override         |
| `fps`           | inherited | frame rate override            |
| `cols` / `rows` | inherited | terminal dimensions override   |

## presets

presets bundle presentation defaults (theme, sound, cursor, hud) so you don't have to configure each one individually.

| preset     | theme       | sound effects | cursor  | hud     |
| ---------- | ----------- | ------------- | ------- | ------- |
| `polished` | Catppuccin  | Click + Key   | Visible | Visible |
| `demo`     | Dracula     | Click + Key   | Visible | Visible |
| `minimal`  | Tokyo Night | None          | Visible | Hidden  |
| `silent`   | Default     | None          | Hidden  | Hidden  |

```jsonc
{
  "preset": "polished",
  "output": "demo.mp4",
  "steps": [...]
}
```

preset values can be overridden by explicit fields in your config.

## themes

tuireel ships with 8 built-in terminal color themes:

- `dracula`
- `catppuccin`
- `one-dark`
- `monokai`
- `solarized-dark`
- `tokyo-night`
- `nord`
- `gruvbox-dark`

use a theme by name or provide a custom theme object with `background`, `foreground`, `cursor`, and full 16-color ansi palette:

by name:

```jsonc
{ "theme": "catppuccin" }
```

or inline with full ansi palette:

```jsonc
{
  "theme": {
    "background": "#1E1E2E",
    "foreground": "#CDD6F4",
    "cursor": "#F5E0DC",
    "colors": {
      "black": "#45475A",
      "red": "#F38BA8",
      "green": "#A6E3A1",
      // ... full 16-color palette
    },
  },
}
```

## sound effects

tuireel includes built-in sound effects for key presses and clicks, with 4 variants each. add a background music track with volume control.

```jsonc
{
  "sound": {
    "effects": {
      "click": 1, // built-in variant 1-4, or path to custom .wav/.mp3
      "key": 2,
    },
    "track": "path/to/background-music.mp3",
    "trackVolume": 0.3,
    "effectsVolume": 0.5,
  },
}
```

## development

### prerequisites

- [node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 10+ (`corepack enable`)
- [ffmpeg](https://ffmpeg.org/) on path

### setup

```bash
git clone https://github.com/Microck/tuireel.git
cd tuireel
pnpm install
pnpm build
```

### common commands

| command                              | description                    |
| ------------------------------------ | ------------------------------ |
| `pnpm build`                         | build all packages (via turbo) |
| `pnpm dev`                           | watch mode for all packages    |
| `pnpm test`                          | run all tests (via vitest)     |
| `pnpm lint`                          | lint all packages              |
| `pnpm benchmark`                     | run performance benchmarks     |
| `pnpm publish:smoke`                 | run publish smoke tests        |
| `turbo build --filter=@tuireel/core` | build only core                |
| `turbo build --filter=tuireel`       | build only cli                 |

### ci/cd

three github actions workflows run on every push to `main` and on pull requests:

- **CI** - lint, build, type-check, and test
- **Video Smoke Tests** - records mp4, webm, and gif outputs and validates them with ffprobe
- **Release** - automated publishing via [changesets](https://github.com/changesets/changesets) with npm oidc trusted publishing and post-publish validation

## packages

| package                          | description                                          |
| -------------------------------- | ---------------------------------------------------- |
| [`tuireel`](packages/cli)        | cli interface for recording terminal demos           |
| [`@tuireel/core`](packages/core) | recording engine, compositing pipeline, and overlays |

## contributing

see [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, code style, and pr process.

## license

[Apache 2.0](./LICENSE)
