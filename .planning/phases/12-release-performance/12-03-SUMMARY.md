# Summary: 12-03 — Performance Benchmark + Compositing Optimization

**Status:** complete
**Duration:** 5 min

## What was done

1. **Created benchmark script** (`scripts/benchmark.ts`): Records a fixture with 15fps/60x18 terminal, then re-composes to isolate compositing time. Reports total frames, recording time, compositing time, per-frame time, and throughput. Added `tsx` dev dependency and `pnpm benchmark` script.

2. **Applied compositing optimization** (`packages/core/src/compositor.ts`): Skip Sharp decode+composite+encode pipeline for frames with no overlays (cursor hidden, no HUD). Uses a plain `copyFile` instead, avoiding all image processing overhead.

## Measured improvement

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Per-frame compositing | 33.7ms | 24.5ms | 27% faster |
| Throughput | 29.7 fps | 40.9 fps | 38% faster |

The optimization is most impactful on recordings with pauses (where cursor/HUD are not visible), which is the common case for demo videos.

## Artifacts

| File | Purpose |
|------|---------|
| `scripts/benchmark.ts` | Performance benchmark script |
| `packages/core/src/compositor.ts` | Added copyFile skip for empty overlays |
| `package.json` | Added benchmark script + tsx dependency |

## Verification

- `pnpm benchmark` runs and produces timing output
- All 91 tests pass after optimization
- Improvement > 5% threshold (measured 27% per-frame reduction)
- Optimization documented with inline comment
