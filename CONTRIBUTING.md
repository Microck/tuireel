# Contributing to Tuireel

Thanks for your interest in contributing. This guide covers setup, development workflow, and how to submit changes.

## Getting Started

**Prerequisites:**

- Node.js 18+
- pnpm 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- ffmpeg installed and on PATH (used at runtime for video encoding)

**Setup:**

```bash
git clone https://github.com/Microck/tuireel.git
cd tuireel
pnpm install
pnpm build
```

If `pnpm build` completes without errors, you're good to go.

## Project Structure

This is a pnpm workspace monorepo managed by Turbo:

```
packages/
  core/     @tuireel/core — recording engine, compositing, pipeline
  cli/      tuireel       — CLI wrapper around core
```

`@tuireel/core` does the heavy lifting (terminal recording, frame capture, ffmpeg orchestration). The CLI package provides the `tuireel` command and delegates to core.

## Development

Common commands (all from repo root):

| Command | What it does |
|---------|-------------|
| `pnpm build` | Build all packages (via turbo) |
| `pnpm dev` | Watch mode for all packages (via turbo) |
| `pnpm test` | Run all tests (via vitest) |
| `turbo build --filter=@tuireel/core` | Build only core |
| `turbo build --filter=tuireel` | Build only CLI |

The build tool is **tsup** (per-package), orchestrated by **turbo** at the monorepo level. Tests use **vitest**.

## Making Changes

1. Fork the repo and create a branch from `main`
2. Keep PRs focused — one feature or fix per PR
3. Write tests for behavior changes
4. Run `pnpm build && pnpm test` before pushing

Branch naming: `feat/short-description`, `fix/short-description`, `docs/short-description`.

## Pull Request Process

1. Fill out the PR template: **What** changed, **Why**, and **How to test**
2. Make sure `pnpm build` and `pnpm test` pass
3. One approval is required before merge
4. Squash merge is the default

## Code Style

- TypeScript in strict mode
- ESM only (`"type": "module"` in all packages)
- Follow existing patterns — check neighboring files before inventing new conventions
- No default exports (use named exports)

## Reporting Issues

Open a GitHub issue with:

- What you expected
- What actually happened
- Steps to reproduce
- Node.js version, OS, ffmpeg version

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](./LICENSE).
