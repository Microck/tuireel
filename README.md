<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/branding/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/branding/logo-light.svg">
    <img alt="Tuireel" src="assets/branding/logo-light.svg" width="360">
  </picture>
</p>

<p align="center">
  <img src="assets/branding/banner.png" alt="Tuireel — Scripted TUI demo recorder" width="640">
</p>

<p align="center">
  Scripted TUI demo recorder — produce polished terminal demo videos from declarative configs.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tuireel"><img src="https://img.shields.io/npm/v/tuireel" alt="npm version"></a>
  <a href="https://github.com/Microck/tuireel/actions/workflows/ci.yml"><img src="https://github.com/Microck/tuireel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/tuireel" alt="license"></a>
</p>

---

## Install

```bash
npm install -g tuireel
```

Or run without installing:

```bash
npx tuireel
# or
bunx tuireel
```

## Quick Start

Scaffold a config and record your first demo:

```bash
tuireel init
tuireel record
```

The generated config is a JSONC file describing your demo steps:

```jsonc
{
  "output": "demo.mp4",
  "steps": [
    { "type": "type", "value": "echo 'Hello, world!'" },
    { "type": "enter" },
    { "type": "pause", "duration": 1000 }
  ]
}
```

## Features

- **Declarative JSONC config** with JSON Schema support for editor autocompletion
- **Multiple output formats** — MP4, WebM, and GIF
- **Cursor overlay, keystroke HUD, and sound effects** for polished demos
- **Terminal themes** — built-in collection plus custom theme support
- **Watch mode** for iterative development with instant re-recording
- **Multi-video configs** with shared step includes for consistency

## Documentation

Full documentation is available at [tuireel.dev](https://tuireel.dev).

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting a pull request.

## License

[Apache 2.0](./LICENSE) — see the LICENSE file for details.
