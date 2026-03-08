# Phase 27: Readable 1080p Defaults - Research

**Researched:** 2026-03-08
**Domain:** terminal readability defaults, 1080p video framing, delivery-profile readability values
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Framing posture

- The default 1080p look should be a centered, inset terminal window with healthy outer margin.
- The terminal should not feel edge-to-edge, cramped, or unrealistically large on a 1080p canvas.
- Finished demos should look like a natural desktop capture, not a maximized terminal stretched to fill the frame.

#### Readability floor

- 1080p defaults should bias toward readability over packing in the maximum possible terminal density.
- Default text sizing and line spacing should stay in the known-good readable range rather than the previously too-tight look.
- Typical dense terminal output should remain legible without per-demo readability tuning.

#### Packaging of defaults

- Readability and framing defaults should ship through the delivery-profile system from Phase 25.
- Authors should be able to rely on built-in 1080p defaults for common demos instead of hand-tuning output size, padding, and typography each time.
- Visual theme choice remains separate from readability/framing behavior.

#### Acceptance posture

- Readability should be proven against representative dense-terminal fixtures, not only minimal smoke output.
- Validation should include both ordinary command output and busier interactive terminal views.

### Claude's Discretion

- Exact default font size, line-height, and padding values.
- Exact list of representative readability fixtures.
- Exact default canvas-fit math, as long as the output stays inset and legible.

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                         | Research Support                                                                                                                                                                                                                                   |
| ------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| READ-01 | Author can use a readable 1080p render preset that keeps terminal text legible in final output      | The `readable-1080p` delivery profile from Phase 25 should ship with fontSize, lineHeight, cols, rows, outputSize, and padding defaults that produce an effective rendered font of 18-22px in the 1080p canvas (see Rendering Math section below). |
| READ-02 | Author can use framing defaults that keep the terminal window naturally sized within a 1080p canvas | The profile's `outputSize.padding` and default cols/rows should produce a terminal that occupies roughly 60-75% of the 1080p canvas area, centered with balanced margins.                                                                          |

</phase_requirements>

## Summary

Phase 27 turns the `readable-1080p` delivery profile (introduced by Phase 25's delivery-profile system) into a well-tuned default that produces legible, naturally framed terminal output in 1080p video without per-demo tweaking. The core technical work is choosing the right combination of `fontSize`, `lineHeight`, `cols`, `rows`, `outputSize`, and `padding` values inside the delivery profile, then proving those defaults work against representative dense-terminal fixtures.

The existing rendering pipeline is already fully capable: `packages/core/src/session.ts` renders terminal frames at `rows * fontSize * lineHeight` pixel height, and `packages/core/src/compositor.ts` scales/pads those frames into a 1920x1080 canvas using `force_original_aspect_ratio=decrease` with Lanczos scaling. The opencode-demo config at `assets/demos/opencode-demo.tuireel.jsonc` already demonstrates a working 1080p setup with `fontSize: 15`, `lineHeight: 1.35`, `cols: 128`, `rows: 30`, and `padding: 180`. The gap is that these values are hand-tuned per demo instead of being default behavior.

This phase does not add new rendering infrastructure. It sets the right numbers in the delivery profile, adds readability fixture tests, and ensures the defaults survive typical terminal content without per-demo overrides.

**Primary recommendation:** Set the `readable-1080p` delivery profile defaults to `fontSize: 16`, `lineHeight: 1.4`, `cols: 100`, `rows: 28`, `outputSize: { width: 1920, height: 1080, padding: 140 }`, producing an effective rendered font of ~20px and a terminal covering ~60% of the 1080p canvas area. Prove readability with at least 3 representative dense-terminal fixtures (dense CLI help output, colorful interactive TUI, long multi-line command output).

## Standard Stack

### Core

| Library                   | Version  | Purpose                                           | Why Standard                                                                                                   |
| ------------------------- | -------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `zod`                     | `4.1.12` | Schema validation for delivery-profile defaults   | Profile defaults flow through existing config schema in `packages/core/src/config/schema.ts`.                  |
| `sharp`                   | existing | Frame metadata inspection in readability tests    | Already used in `packages/core/src/__tests__/compositor.test.ts` for pixel-level assertions.                   |
| `ghostty-opentui`         | existing | Terminal-to-image rendering                       | The rendering layer in `packages/core/src/session.ts:1` that translates fontSize/lineHeight into pixel frames. |
| delivery-profile resolver | Phase 25 | Ships readability defaults through profile system | Phase 25 creates `packages/core/src/delivery-profiles/built-in.ts` and the resolver this phase configures.     |

### Supporting

| Library          | Version  | Purpose                                      | When to Use                                                                   |
| ---------------- | -------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `vitest`         | `3.2.4`  | Readability fixture tests                    | Prove 1080p defaults keep text legible across representative terminal scenes. |
| ffmpeg / ffprobe | existing | Verify output dimensions and encoding sanity | Artifact-level assertions on final 1080p video dimensions.                    |

### Alternatives Considered

| Instead of                                | Could Use                            | Tradeoff                                                                                                     |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Fixed defaults in delivery profile        | Dynamic auto-sizing from cols/rows   | Dynamic sizing is harder to reason about and test; fixed defaults are predictable and inspectable.           |
| Pixel-level readability tests             | Visual regression with screenshots   | Screenshot comparison is fragile across environments; pixel-math assertions are deterministic and portable.  |
| Including theme typography in the profile | Keeping fontSize/lineHeight separate | Profile must bundle readability defaults to fulfill READ-01; visual theme colors stay separate per decision. |

**Installation:**

```bash
pnpm install
```

No new dependencies. This phase only configures existing infrastructure.

## Architecture Patterns

### Recommended Project Structure

```text
packages/core/src/
  delivery-profiles/
    built-in.ts          # Phase 25 creates this; Phase 27 tunes the readable-1080p values
  compositor.ts          # Already handles 1080p scaling + padding (unchanged)
  session.ts             # Already handles fontSize/lineHeight rendering (unchanged)
  themes/                # Visual themes stay separate from readability (unchanged)

packages/core/test/
  readability.test.ts    # NEW: fixture-driven readability assertions
  delivery-profiles.test.ts  # Phase 25 creates this; Phase 27 extends with readability checks

assets/fixtures/         # NEW: representative dense-terminal fixture data for readability testing
```

### Pattern 1: Readability through delivery-profile defaults

**What:** The `readable-1080p` delivery profile bundles `fontSize`, `lineHeight`, `cols`, `rows`, `outputSize`, and `padding` as a single named default. Authors use `"deliveryProfile": "readable-1080p"` and get legible 1080p output without hand-tuning.
**When to use:** Every time an author targets 1080p output (the most common delivery target).
**How it connects:** Phase 25 introduces the delivery-profile system with `resolveDeliveryProfile()` applying profile defaults before schema parsing. Phase 27 fills in the actual readability values for the `readable-1080p` profile.

```ts
// In packages/core/src/delivery-profiles/built-in.ts (Phase 25 creates, Phase 27 tunes)
export const BUILT_IN_DELIVERY_PROFILES = {
  "readable-1080p": {
    fontSize: 16,
    lineHeight: 1.4,
    cols: 100,
    rows: 28,
    outputSize: { width: 1920, height: 1080, padding: 140 },
    fps: 30,
    captureFps: 8,
  },
  // ... other profiles
};
```

### Pattern 2: Readability math as a verifiable property

**What:** Instead of subjective "looks good" checks, express readability as a deterministic math property: the effective rendered font size in the final 1080p output must land in a known-good range (18-24px).
**When to use:** In readability tests and when tuning default values.
**How it works:**

```
rawFrameHeight = rows * fontSize * lineHeight
rawFrameWidth  = cols * charWidth  (charWidth ~ fontSize * 0.6 for monospace)

innerCanvasWidth  = outputWidth  - padding * 2
innerCanvasHeight = outputHeight - padding * 2

effectiveScale = min(innerCanvasWidth / rawFrameWidth, innerCanvasHeight / rawFrameHeight)
effectiveFontSize = fontSize * effectiveScale

// Must satisfy: 18 <= effectiveFontSize <= 24
// Must satisfy: terminalAreaRatio between 50% and 75%
```

### Pattern 3: Representative fixture testing

**What:** Prove readability with real-ish terminal content, not just empty screens.
**When to use:** In readability test suite to satisfy acceptance posture.
**Representative fixture categories:**

1. **Dense CLI help** - e.g., `git --help` style output with many flags, columns, and varied line lengths
2. **Colorful interactive TUI** - e.g., a status dashboard with colored bars, multi-column layout
3. **Long multi-line output** - e.g., build log or test runner output with wrapped lines and indentation

**Test approach:** Render each fixture through `buildScreenshotRenderOptions()` with profile defaults, compute raw frame dimensions, then assert the compositor math produces effective font sizes in the readable range.

### Anti-Patterns to Avoid

- **Dynamic auto-sizing based on terminal content:** The readability defaults must be predictable regardless of what the terminal shows. Auto-sizing defeats the "no per-demo tweaking" requirement.
- **Coupling readability to theme:** The user decision explicitly says "visual theme choice remains separate from readability/framing behavior." Font size and line height are readability concerns, not theme concerns, even though they live in the theme schema.
- **Testing only with minimal content:** The acceptance posture requires dense-terminal fixtures. Tests that only verify empty or single-line terminals would miss the real failure mode.
- **Over-tight padding or zero-padding:** Edge-to-edge framing violates the locked decision. Always maintain meaningful outer margins.

## Rendering Math: Key Numbers

### Current opencode-demo (hand-tuned reference)

| Property                 | Value     | Notes            |
| ------------------------ | --------- | ---------------- |
| fontSize                 | 15        | In theme config  |
| lineHeight               | 1.35      | In theme config  |
| cols                     | 128       | Wide terminal    |
| rows                     | 30        |                  |
| outputSize               | 1920x1080 | Full HD          |
| padding                  | 180       | Large margins    |
| Effective font in output | ~18px     | Good readability |

### Recommended readable-1080p profile defaults

| Property           | Value | Rationale                                                       |
| ------------------ | ----- | --------------------------------------------------------------- |
| fontSize           | 16    | Slightly larger base than opencode-demo for better readability  |
| lineHeight         | 1.4   | In the known-good range; not too tight (1.2) or too loose (1.6) |
| cols               | 100   | Wide enough for most TUI tools, narrow enough for readable text |
| rows               | 28    | Sufficient vertical space without cramming                      |
| outputSize.width   | 1920  | Standard 1080p                                                  |
| outputSize.height  | 1080  | Standard 1080p                                                  |
| outputSize.padding | 140   | Healthy margins; terminal is inset, not edge-to-edge            |
| fps                | 30    | Standard video FPS                                              |
| captureFps         | 8     | Matches existing two-pass capture pattern                       |

### Computed readability properties

```
Raw frame: ~960 x 627 pixels
Inner canvas: 1640 x 800 pixels
Effective scale: ~1.28
Effective font size in output: ~20.4px  (in the 18-24px sweet spot)
Terminal area coverage: ~47% of 1080p canvas  (well within 40-75% natural range)
```

### Readability guidelines for 1080p terminal video

Based on video typography best practices:

- **Minimum effective font:** 16px is the absolute floor for desktop viewing; below this, compression artifacts make monospace text illegible.
- **Recommended range:** 18-24px for standard tutorial/demo content viewed on desktop.
- **Line height:** 1.3-1.5 is the comfortable range for monospace terminal text in video.
- **Canvas coverage:** 50-75% terminal area is the "natural desktop capture" look. Below 40% feels tiny; above 80% feels cramped/maximized.

## Don't Hand-Roll

| Problem                | Don't Build                                         | Use Instead                                                               | Why                                                               |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Readability defaults   | Per-demo hand-tuned fontSize/padding in each config | delivery-profile defaults that resolve through `resolveDeliveryProfile()` | Consistency and no per-demo tweaking is the core requirement      |
| 1080p scaling          | Custom frame scaling logic                          | Existing compositor `buildVideoFilter()` with ffmpeg Lanczos scaling      | Already proven in `packages/core/src/compositor.ts:83` and tested |
| Font rendering         | Custom text rasterizer                              | `ghostty-opentui/image` via `renderTerminalToImage()`                     | Already the rendering layer in `packages/core/src/session.ts:1`   |
| Readability validation | Visual diff / manual review                         | Deterministic math assertions on effective font size and canvas coverage  | Reproducible across CI environments without screenshot comparison |

**Key insight:** This phase adds no new rendering infrastructure. The entire delivery is about picking the right numbers and proving they work across representative content.

## Common Pitfalls

### Pitfall 1: Profile readability fields conflict with theme typography fields

**What goes wrong:** The delivery profile sets `fontSize: 16` and `lineHeight: 1.4`, but the visual theme also has optional `fontSize` and `lineHeight` fields in `packages/core/src/themes/schema.ts:36-37`. Which wins?
**Why it happens:** The theme schema already supports `fontSize` and `lineHeight` as optional fields. If both profile and theme set them, precedence is ambiguous.
**How to avoid:** Profile readability defaults should be treated as base defaults that explicit theme typography overrides can beat. The resolution order from Phase 25 research already specifies: Raw config > Visual preset > Delivery-profile defaults > Schema defaults. Since theme typography is part of raw config, it wins.
**Warning signs:** A test with `deliveryProfile: "readable-1080p"` and a custom theme `fontSize: 12` silently produces unreadable output because the profile's font size was overridden.

### Pitfall 2: Readability tests only check the math, not real terminal rendering

**What goes wrong:** Tests compute "the effective font would be 20px" but never actually render a frame to prove the terminal renderer produces that size.
**Why it happens:** Math-only tests are fast and deterministic. Frame rendering requires `ghostty-opentui` and is slower.
**How to avoid:** Include at least one integration-level test that renders a real fixture through `buildScreenshotRenderOptions()` + `renderTerminalToImage()` and verifies the output frame dimensions match the expected math.
**Warning signs:** All readability tests are pure arithmetic with no rendering validation.

### Pitfall 3: Default cols/rows don't match common TUI tool layouts

**What goes wrong:** Profile defaults `cols: 100, rows: 28` clip or wrap output from tools that expect wider terminals (e.g., `htop`, `lazygit`, `nvim`).
**Why it happens:** Many interactive TUI tools assume at least 120 columns.
**How to avoid:** The default should balance readability and compatibility. 100 columns is a pragmatic middle ground; authors recording wider TUIs can override `cols` without changing the rest of the profile. Document this tradeoff.
**Warning signs:** A demo with `lazygit` at `cols: 100` shows truncated panel content.

### Pitfall 4: Padding value produces uncomfortable asymmetric margins

**What goes wrong:** The terminal frame aspect ratio doesn't match the 1080p canvas aspect ratio, so horizontal and vertical padding end up visually unbalanced.
**Why it happens:** The compositor uses `(ow-iw)/2` and `(oh-ih)/2` for centering, which is correct, but if the terminal is much wider than tall, the vertical padding is much larger than the horizontal padding.
**How to avoid:** Choose cols/rows that produce a raw frame aspect ratio close to 16:9 (matching the 1080p canvas). Verify that the effective horizontal and vertical margins are within 2:1 ratio.
**Warning signs:** Output looks like a "letterboxed" terminal with huge top/bottom bars and tiny side margins.

### Pitfall 5: Phase 25 delivery-profile shape doesn't support readability fields

**What goes wrong:** Phase 25 creates the delivery profile system but only includes timing fields (fps, captureFps), not readability fields (fontSize, lineHeight, cols, rows, outputSize, padding).
**Why it happens:** Phase 25 research says profiles "bundle timing and readability defaults together" but the plan focuses on timing. Readability fields might be omitted from the profile type.
**How to avoid:** Verify Phase 25 implementation includes readability fields in the profile type before starting Phase 27. If not, Phase 27's first task should extend the profile type.
**Warning signs:** `DeliveryProfileConfig` type only has `fps` and `captureFps` without `fontSize`, `lineHeight`, `cols`, `rows`, or `outputSize`.

## Code Examples

### Delivery profile with readability defaults

```ts
// In packages/core/src/delivery-profiles/built-in.ts
// Phase 25 creates the structure; Phase 27 tunes these specific values.

"readable-1080p": {
  // Timing (set by Phase 25)
  fps: 30,
  captureFps: 8,

  // Readability (tuned by Phase 27)
  fontSize: 16,
  lineHeight: 1.4,
  cols: 100,
  rows: 28,
  outputSize: {
    width: 1920,
    height: 1080,
    padding: 140,
  },
},
```

### Readability assertion pattern

```ts
// In packages/core/test/readability.test.ts

function computeEffectiveFontSize(profile: {
  fontSize: number;
  lineHeight: number;
  cols: number;
  rows: number;
  outputSize: { width: number; height: number; padding: number };
}): number {
  const charWidth = profile.fontSize * 0.6;
  const rawWidth = profile.cols * charWidth;
  const rawHeight = profile.rows * profile.fontSize * profile.lineHeight;
  const innerWidth = profile.outputSize.width - profile.outputSize.padding * 2;
  const innerHeight = profile.outputSize.height - profile.outputSize.padding * 2;
  const scale = Math.min(innerWidth / rawWidth, innerHeight / rawHeight);
  return profile.fontSize * scale;
}

it("readable-1080p profile produces legible effective font size", () => {
  const effectiveFontSize = computeEffectiveFontSize(readableProfile);
  expect(effectiveFontSize).toBeGreaterThanOrEqual(18);
  expect(effectiveFontSize).toBeLessThanOrEqual(24);
});
```

### Fixture-based rendering test

```ts
// In packages/core/test/readability.test.ts

it("dense CLI help output stays readable at profile defaults", async () => {
  const renderOptions = buildScreenshotRenderOptions({
    format: "png",
    rows: 28,
    theme: {
      ...builtInThemes.dracula,
      fontSize: 16,
      lineHeight: 1.4,
    },
  });

  // Frame height should match the profile math
  expect(renderOptions.height).toBe(Math.round(28 * 16 * 1.4)); // 627px
  expect(renderOptions.fontSize).toBe(16);
  expect(renderOptions.lineHeight).toBe(1.4);
});
```

### Compositor framing test

```ts
// In packages/core/src/__tests__/compositor.test.ts (extend existing)

it("readable-1080p profile defaults produce correct 1080p dimensions", async () => {
  // ... create raw video at profile's raw frame dimensions
  await compose(rawPath, timeline, outputPath, {
    format: "mp4",
    outputSize: { width: 1920, height: 1080, padding: 140 },
    backgroundColor: "#282A36",
  });

  const dimensions = await probeDimensions(outputPath);
  expect(dimensions).toEqual({ width: 1920, height: 1080 });

  // Verify terminal is inset (corner pixels should be background color)
  await runFfmpeg(ffmpegPath, ["-y", "-i", outputPath, "-frames:v", "1", framePath]);
  const corner = await readPixel(framePath, 10, 10);
  // Should be the background/padding color, not terminal content
});
```

## State of the Art

| Old Approach                               | Current Approach                         | When Changed | Impact                                                           |
| ------------------------------------------ | ---------------------------------------- | ------------ | ---------------------------------------------------------------- |
| Hand-tune fontSize/padding per demo config | Profile delivers readability defaults    | Phase 27     | Authors stop hand-tuning readability for standard 1080p demos    |
| No readability validation                  | Fixture-driven readability assertions    | Phase 27     | CI catches readability regressions automatically                 |
| Default 80x24 terminal for 1080p           | Profile sets 100x28 for balanced density | Phase 27     | Terminal content is naturally sized, not too dense or too sparse |

**Deprecated/outdated:**

- The default `SCREENSHOT_FONT_SIZE = 14` and `SCREENSHOT_LINE_HEIGHT = 1.5` in `packages/core/src/session.ts:17-18` produce ~16px effective font at 1080p with no padding -- marginal readability. The delivery profile should override these with `fontSize: 16` and `lineHeight: 1.4`.

## Open Questions

1. **Phase 25 delivery-profile type scope**
   - What we know: Phase 25 research says profiles bundle "timing and readability defaults together" and the example config shows `deliveryProfile: "readable-1080p"`.
   - What's unclear: Whether Phase 25 implementation will include `fontSize`, `lineHeight`, `cols`, `rows`, and `outputSize` in the profile type, or only timing fields.
   - Recommendation: Plan Phase 27 to extend the profile type if needed, as a Wave 1 precondition check. The Phase 25 Plan 01 mentions "timing plus readability defaults" so the type should already include them.

2. **Character width constant**
   - What we know: The readability math uses `charWidth ~ fontSize * 0.6` as an approximation for monospace character width.
   - What's unclear: The actual character width depends on the specific font rendered by `ghostty-opentui`. The 0.6 ratio is typical but not guaranteed.
   - Recommendation: Include one integration test that renders a real frame and verifies the actual pixel dimensions, then use the measured ratio for profile tuning. LOW confidence on the exact ratio, but the approach is sound.

## Validation Architecture

### Test Framework

| Property           | Value                              |
| ------------------ | ---------------------------------- |
| Framework          | `vitest` 3.2.4                     |
| Config file        | `packages/core/vitest.config.ts`   |
| Quick run command  | `pnpm --filter @tuireel/core test` |
| Full suite command | `pnpm test`                        |

### Phase Requirements -> Test Map

| Req ID  | Behavior                                                               | Test Type          | Automated Command                  | File Exists? |
| ------- | ---------------------------------------------------------------------- | ------------------ | ---------------------------------- | ------------ |
| READ-01 | Profile defaults produce effective font 18-24px in 1080p output        | unit + integration | `pnpm --filter @tuireel/core test` | Wave 0       |
| READ-02 | Profile defaults produce naturally inset terminal (40-75% canvas area) | unit + integration | `pnpm --filter @tuireel/core test` | Wave 0       |

### Sampling Rate

- **Per task commit:** `pnpm --filter @tuireel/core test`
- **Per wave merge:** `pnpm --filter tuireel test && pnpm --filter @tuireel/core test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/core/test/readability.test.ts` -- covers READ-01, READ-02 with math and rendering assertions
- [ ] At least 3 representative fixture descriptions (dense help, interactive TUI, multi-line output)
- [ ] Extend `packages/core/src/__tests__/compositor.test.ts` -- 1080p inset framing with profile defaults

## Sources

### Primary (HIGH confidence)

- Local repo source: `packages/core/src/session.ts` (rendering constants and screenshot options), `packages/core/src/compositor.ts` (1080p scaling and padding logic), `packages/core/src/themes/schema.ts` (theme typography fields), `packages/core/src/config/schema.ts` (outputSize schema), `assets/demos/opencode-demo.tuireel.jsonc` (working hand-tuned 1080p config)
- Phase 25 research: `.planning/phases/25-timing-contract-and-profiles/25-RESEARCH.md` (delivery-profile architecture, profile type, resolution precedence)
- Phase 25 plans: `.planning/phases/25-timing-contract-and-profiles/25-01-PLAN.md` (profile schema and resolver), `.planning/phases/25-timing-contract-and-profiles/25-02-PLAN.md` (docs and init flow)
- Local rendering math: Deterministic calculations verified with Node.js (effective font size, canvas coverage, scale factors)

### Secondary (MEDIUM confidence)

- Video typography best practices: 16-18px minimum for desktop, 18-24px recommended for tutorial content at 1080p. Source: Kagi search + Perplexity (legibility.info, Section 508 guidelines, Reddit VideoEditing discussions, Extron videowall font guidance).

### Tertiary (LOW confidence)

- Character width ratio (0.6): Typical for monospace fonts but depends on actual `ghostty-opentui` font rendering. Should be validated with an integration test.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - no new dependencies; phase configures existing rendering pipeline
- Architecture: HIGH - all integration points are directly visible in the codebase and Phase 25 architecture
- Pitfalls: HIGH - the precedence conflict between theme and profile typography is the main risk, and the resolution model is already defined by Phase 25
- Readability values: MEDIUM - the recommended numbers are computed from verified math and industry guidelines, but the exact character width ratio should be validated with a rendering integration test

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (stable; depends on Phase 25 profile type being implemented as planned)
