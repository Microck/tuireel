# Summary: 11-02 — Video Smoke Test CI

**Status:** complete
**Duration:** 3 min

## What was done

1. **Created smoke test fixture** (`packages/core/test/fixtures/smoke.tuireel.jsonc`): Minimal 40x12 terminal at 10fps with shell built-in commands only — CI-friendly, runs in ~1 second.

2. **Created video smoke test workflow** (`.github/workflows/video-smoke.yml`): Separate CI job that installs ffmpeg via `FedericoCarboni/setup-ffmpeg@v3`, builds the project, records MP4/WebM/GIF from the fixture, and validates each output with ffprobe assertions (codec, resolution, duration). Uploads artifacts on failure only.

## Artifacts

| File | Purpose |
|------|---------|
| `packages/core/test/fixtures/smoke.tuireel.jsonc` | Minimal fixture for smoke testing |
| `.github/workflows/video-smoke.yml` | Video smoke test CI workflow |

## Verification

- Fixture is valid JSONC with shell built-ins only
- Workflow YAML is valid with 3 record + 3 validate steps
- Conditional artifact upload on failure
- All 91 existing tests pass
