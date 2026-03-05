<p align="center">
  <img alt="Tuireel" src="assets/branding/logo.svg" width="200">
</p>

<p align="center">
  Produce polished terminal demo videos from declarative configs.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tuireel"><img src="https://img.shields.io/npm/v/tuireel" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@tuireel/core"><img src="https://img.shields.io/npm/v/@tuireel/core?label=%40tuireel%2Fcore" alt="@tuireel/core version"></a>
  <a href="https://github.com/Microck/tuireel/actions/workflows/ci.yml"><img src="https://github.com/Microck/tuireel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Microck/tuireel/actions/workflows/video-smoke.yml"><img src="https://github.com/Microck/tuireel/actions/workflows/video-smoke.yml/badge.svg" alt="Video Smoke Tests"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/tuireel" alt="license"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/node/v/tuireel" alt="node version"></a>
</p>

---

Tuireel executes scripted terminal interactions in a virtual PTY, captures frames, and renders polished videos (MP4, WebM, GIF) with optional cursor overlays, keystroke HUD, and sound effects. No manual recording or editing required.

Define steps in a JSONC config (typing, key presses, launches, waits, pauses) and Tuireel drives a headless terminal session, captures screenshots at configurable FPS, and encodes the result with ffmpeg.

[Documentation](https://tuireel.micr.dev) | [GitHub](https://github.com/Microck/tuireel)

## Quick Start

```bash
npm install -g tuireel   # or: npx tuireel / bunx tuireel
tuireel init              # scaffold a demo config
tuireel record            # record your first demo
```

The generated config is a JSONC file describing your demo steps:

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

## Usage

### Init

Scaffold a new demo config:

```bash
tuireel init
tuireel init -o my-demo.tuireel.jsonc
tuireel init --force       # overwrite existing config
```

This creates a `.tuireel.jsonc` with a `$schema` for IDE autocompletion.

### Record

Record a demo from config:

```bash
tuireel record
tuireel record my-demo.tuireel.jsonc
tuireel record --format webm
tuireel record --watch         # re-record on config change
tuireel record --verbose
tuireel record --debug
```

### Preview

Run a config in a visible terminal without recording:

```bash
tuireel preview
tuireel preview my-demo.tuireel.jsonc
tuireel preview --verbose
```

### Composite

Re-render overlays on an existing recording without re-recording:

```bash
tuireel composite
tuireel composite -c my-demo.tuireel.jsonc
tuireel composite --format gif
tuireel composite --cursor-size 4
tuireel composite --no-cursor --no-hud
```

### Validate

Check a config file for errors without running it:

```bash
tuireel validate
tuireel validate my-demo.tuireel.jsonc
```

### Help and Version

```bash
tuireel --help
tuireel --version
tuireel record --help
```

## Step Types

| Type         | Key Fields             | Description                                          |
| ------------ | ---------------------- | ---------------------------------------------------- |
| `launch`     | `command`              | Start a terminal program (e.g. `vim`, `htop`, `npm`) |
| `type`       | `text`, `speed?`       | Type text into the terminal character by character   |
| `press`      | `key`                  | Send a key press (Enter, Tab, Ctrl+C, Escape, etc.)  |
| `wait`       | `pattern`, `timeout?`  | Wait for text/regex to appear in terminal output     |
| `pause`      | `duration`             | Pause for a fixed duration in milliseconds           |
| `scroll`     | `direction`, `amount?` | Scroll the terminal view up or down                  |
| `click`      | `pattern`              | Click on matching text in the terminal               |
| `screenshot` | `output`               | Capture a PNG screenshot at this point               |
| `resize`     | `cols`, `rows`         | Resize the terminal dimensions mid-recording         |
| `set-env`    | `key`, `value`         | Set an environment variable before next command      |

All steps can be used with `$include` to share common setup sequences across configs.

## Config Options

### Top-level

| Field                | Default      | Description                                           |
| -------------------- | ------------ | ----------------------------------------------------- |
| `$schema`            | -            | JSON Schema URL for IDE autocompletion                |
| `preset`             | -            | Preset name (`polished`, `minimal`, `demo`, `silent`) |
| `output`             | `output.mp4` | Output file path                                      |
| `format`             | `mp4`        | Output format (`mp4`, `webm`, `gif`)                  |
| `theme`              | -            | Terminal color theme (name or inline object)          |
| `sound`              | -            | Sound effect configuration                            |
| `cursor`             | -            | Cursor overlay settings                               |
| `hud`                | -            | Keystroke HUD overlay settings                        |
| `fps`                | `30`         | Capture frame rate                                    |
| `cols`               | `80`         | Terminal width in columns                             |
| `rows`               | `24`         | Terminal height in rows                               |
| `defaultWaitTimeout` | -            | Default timeout for `wait` steps (ms)                 |
| `steps`              | required     | Array of step objects                                 |

### Multi-video config

For projects with multiple demos, use the multi-video format:

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

The `defaults` object is merged into each video definition. Per-video fields override defaults.

| Field           | Default   | Description                    |
| --------------- | --------- | ------------------------------ |
| `name`          | required  | Video identifier               |
| `output`        | required  | Output file path               |
| `steps`         | required  | Array of step objects          |
| `preset`        | inherited | Preset override for this video |
| `format`        | inherited | Output format override         |
| `theme`         | inherited | Theme override                 |
| `sound`         | inherited | Sound configuration override   |
| `cursor`        | inherited | Cursor overlay override        |
| `hud`           | inherited | Keystroke HUD override         |
| `fps`           | inherited | Frame rate override            |
| `cols` / `rows` | inherited | Terminal dimensions override   |

## Presets

Presets bundle presentation defaults (theme, sound, cursor, HUD) so you don't have to configure each one individually.

| Preset     | Theme       | Sound Effects | Cursor  | HUD     |
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

Preset values can be overridden by explicit fields in your config.

## Themes

Tuireel ships with 8 built-in terminal color themes:

- `dracula`
- `catppuccin`
- `one-dark`
- `monokai`
- `solarized-dark`
- `tokyo-night`
- `nord`
- `gruvbox-dark`

Use a theme by name or provide a custom theme object with `background`, `foreground`, `cursor`, and full 16-color ANSI palette:

By name:

```jsonc
{ "theme": "catppuccin" }
```

Or inline with full ANSI palette:

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

## Sound Effects

Tuireel includes built-in sound effects for key presses and clicks, with 4 variants each. Add a background music track with volume control.

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

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 10+ (`corepack enable`)
- [ffmpeg](https://ffmpeg.org/) on PATH

### Setup

```bash
git clone https://github.com/Microck/tuireel.git
cd tuireel
pnpm install
pnpm build
```

### Common Commands

| Command                              | Description                    |
| ------------------------------------ | ------------------------------ |
| `pnpm build`                         | Build all packages (via Turbo) |
| `pnpm dev`                           | Watch mode for all packages    |
| `pnpm test`                          | Run all tests (via Vitest)     |
| `pnpm lint`                          | Lint all packages              |
| `pnpm benchmark`                     | Run performance benchmarks     |
| `pnpm publish:smoke`                 | Run publish smoke tests        |
| `turbo build --filter=@tuireel/core` | Build only core                |
| `turbo build --filter=tuireel`       | Build only CLI                 |

### CI/CD

Three GitHub Actions workflows run on every push to `main` and on pull requests:

- **CI** - lint, build, type-check, and test
- **Video Smoke Tests** - records MP4, WebM, and GIF outputs and validates them with ffprobe
- **Release** - automated publishing via [Changesets](https://github.com/changesets/changesets) with npm OIDC trusted publishing and post-publish validation

## Packages

| Package                          | Description                                          |
| -------------------------------- | ---------------------------------------------------- |
| [`tuireel`](packages/cli)        | CLI interface for recording terminal demos           |
| [`@tuireel/core`](packages/core) | Recording engine, compositing pipeline, and overlays |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, code style, and PR process.

## License

[Apache 2.0](./LICENSE)
