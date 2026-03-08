# Phase 29: Diagnostics and Acceptance Gates - Research

**Researched:** 2026-03-08
**Domain:** CLI diagnostics, acceptance fixtures, artifact inspection
**Confidence:** HIGH

## Summary

Phase 29 adds three diagnostics surfaces to Tuireel: acceptance fixtures that prove milestone promises on real demo artifacts (DIAG-04), a run-inspection command that shows pacing/fidelity stats for a single recording (DIAG-05), and opt-in raw-frame dumping for fidelity debugging (DIAG-06). All three build entirely on existing infrastructure: the `.tuireel/` artifact directory, saved `*.timeline.json` files, the compositor's frame-decode pipeline, `ffprobe` assertions already used in CI, and the established Commander.js CLI command pattern.

No new external dependencies are needed. The project already has `sharp` for image processing, `ffprobe` for video metadata extraction, `vitest` for tests, and `commander` for CLI surfaces. The work is 100% internal wiring: new CLI commands that read existing artifacts, new test fixtures that run real recordings, and a CI workflow step that gates the milestone.

**Primary recommendation:** Add two CLI commands (`tuireel inspect` and `tuireel dump-frames`), one acceptance test suite in `packages/core/test/acceptance/`, and a CI workflow step. Reuse `InteractionTimeline.fromFile()`, `decodeRawFrames()`, and the existing `ffprobe` validation pattern wholesale.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Acceptance checks must be fixture-backed and run on representative demo artifacts, not only synthetic unit coverage.
- Run inspection must be first-class (human-readable, structured enough for tooling later).
- Raw-frame dumping must be explicit opt-in debugging, not always-on.
- Diagnostics must provide artifact-level evidence and comparisons, not just logs or internal counters.

### Claude's Discretion

- Exact command names, report shape, and CI wiring.
- Exact balance between human-readable console output and machine-readable sidecar output.
- Exact artifact layout for dumped raw frames.

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                           | Research Support                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| DIAG-04 | Author can run acceptance fixtures that verify typing cadence, pause behavior, readability, and smooth output on representative demos | Acceptance test suite using vitest + real recordings + ffprobe assertions + timeline analysis. Existing CI smoke pattern is the template. |
| DIAG-05 | Author can inspect pacing stats for one run, including raw frame count, durations, and output metadata                                | New `tuireel inspect` CLI command reading `.tuireel/timelines/*.timeline.json` and running `ffprobe` on `.tuireel/raw/*.mp4`.             |
| DIAG-06 | Author can dump raw rendered frames for a recording when diagnosing fidelity issues                                                   | New `tuireel dump-frames` CLI command using existing `decodeRawFrames()` from compositor.ts, writing PNGs to a user-specified directory.  |

</phase_requirements>

## Standard Stack

### Core (all existing, no new deps)

| Library              | Version       | Purpose                                       | Why Standard                                       |
| -------------------- | ------------- | --------------------------------------------- | -------------------------------------------------- |
| vitest               | ^3.2.4        | Test runner for acceptance fixtures           | Already the project test framework                 |
| commander            | ^14.0.2       | CLI command registration                      | Already powers all CLI commands                    |
| sharp                | ^0.34.5       | Frame image processing, pixel comparison      | Already used in compositor                         |
| ffprobe (via ffmpeg) | system/cached | Video metadata extraction                     | Already used in CI smoke tests                     |
| InteractionTimeline  | internal      | Timeline data loading and analysis            | Already built, has `fromFile()` static             |
| Logger               | internal      | Console output at normal/verbose/debug levels | Already built with `stat()` and `timing()` methods |

### Supporting

| Library            | Version  | Purpose                  | When to Use                                |
| ------------------ | -------- | ------------------------ | ------------------------------------------ |
| node:fs/promises   | built-in | File I/O for artifacts   | Reading timeline JSON, writing frame dumps |
| node:child_process | built-in | Running ffprobe          | Extracting video metadata                  |
| node:path          | built-in | Artifact path resolution | Resolving `.tuireel/` directory structure  |

### Alternatives Considered

| Instead of                  | Could Use       | Tradeoff                                                                             |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| ffprobe JSON parsing        | mediainfo       | ffprobe already in the project's dependency surface; no reason to add another binary |
| Custom frame comparison     | pixelmatch npm  | sharp's raw buffer comparison is already proven in compositor; avoid new dep         |
| Separate diagnostics binary | CLI subcommands | Commander subcommands follow established pattern; no reason for a separate tool      |

**Installation:**

```bash
# No new packages needed - everything is already installed
pnpm install  # existing deps cover all needs
```

## Architecture Patterns

### Recommended Project Structure

```
packages/
  cli/src/commands/
    inspect.ts           # DIAG-05: tuireel inspect
    dump-frames.ts       # DIAG-06: tuireel dump-frames
  core/src/
    diagnostics/
      inspect.ts         # Core inspect logic (timeline + ffprobe analysis)
      frame-dumper.ts     # Core frame dump logic (reuses decodeRawFrames)
    index.ts             # Re-export diagnostics functions
  core/test/
    acceptance/
      pacing.acceptance.ts       # DIAG-04: cadence + pause assertions
      readability.acceptance.ts  # DIAG-04: 1080p readability assertions
      smooth-output.acceptance.ts # DIAG-04: frame continuity assertions
    fixtures/
      smoke.tuireel.jsonc        # existing, also used for acceptance
```

### Pattern 1: CLI Command Registration (established)

**What:** Each CLI command is a separate file that exports a `register*Command(program)` function, called from `index.ts`.
**When to use:** Every new user-facing command.
**Example:**

```typescript
// Source: packages/cli/src/commands/validate.ts (existing pattern)
export function registerInspectCommand(program: Command): void {
  program
    .command("inspect")
    .description("Show pacing stats and metadata for a recording")
    .argument("[configPath]", "Path to config file", DEFAULT_CONFIG_PATH)
    .option("--verbose", "Show detailed frame-level stats")
    .option("--json", "Output machine-readable JSON")
    .action(async (configPathArg: string, options: InspectOptions) => {
      // resolve artifacts -> load timeline -> run ffprobe -> format output
    });
}
```

### Pattern 2: Artifact Resolution (established)

**What:** Recording artifacts live in `.tuireel/raw/` and `.tuireel/timelines/`. The recording name is derived from the output filename.
**When to use:** Any command that reads saved recording data.
**Example:**

```typescript
// Source: packages/core/src/recorder.ts lines 84-100
function resolveRecordingArtifacts(recordingName: string): {
  rawDirectory: string;
  timelineDirectory: string;
  rawVideoPath: string;
  timelinePath: string;
} {
  const root = resolve(process.cwd(), ".tuireel");
  return {
    rawDirectory: join(root, "raw"),
    timelineDirectory: join(root, "timelines"),
    rawVideoPath: join(root, "raw", `${recordingName}.mp4`),
    timelinePath: join(root, "timelines", `${recordingName}.timeline.json`),
  };
}
```

### Pattern 3: ffprobe JSON Extraction (established in CI)

**What:** Run `ffprobe -v quiet -print_format json -show_format -show_streams` on a video file and parse the JSON output.
**When to use:** Extracting video metadata (duration, FPS, frame count, codec, dimensions).
**Example:**

```typescript
// Source: .github/workflows/video-smoke.yml (existing pattern, to be extracted into core)
async function probeVideo(ffmpegPath: string, videoPath: string): Promise<ProbeResult> {
  const ffprobePath = ffmpegPath.replace(/ffmpeg$/, "ffprobe");
  const { stdout } = await execFileAsync(ffprobePath, [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    videoPath,
  ]);
  return JSON.parse(stdout);
}
```

### Pattern 4: Timeline Data Analysis (new, extends existing)

**What:** Load a saved timeline JSON and compute pacing statistics from frame data.
**When to use:** DIAG-05 inspect command and DIAG-04 acceptance fixtures.
**Example:**

```typescript
// Uses existing InteractionTimeline.fromFile() + analysis
const timeline = InteractionTimeline.fromFile(timelinePath);
const data = timeline.toJSON();
const stats = {
  frameCount: data.frameCount,
  terminalFrameCount: data.terminalFrames?.length ?? 0,
  durationMs: (data.frameCount / data.fps) * 1000,
  fps: data.fps,
  dimensions: { width: data.width, height: data.height },
  keyframeCount: data.frames.length,
  eventCount: data.events.length,
};
```

### Pattern 5: Acceptance Fixtures (new, extends smoke pattern)

**What:** vitest tests that record a real demo from a fixture JSONC, then assert on the timeline and output video.
**When to use:** DIAG-04 milestone acceptance.
**Example:**

```typescript
// Extends packages/core/test/fixtures/smoke.tuireel.jsonc pattern
describe("acceptance: pacing", () => {
  it("typed characters produce deterministic cadence", async () => {
    // 1. Record from fixture
    // 2. Load timeline
    // 3. Assert: frame intervals follow expected cadence profile
    // 4. Assert: pause durations match config +-tolerance
  });
});
```

### Anti-Patterns to Avoid

- **Don't log diagnostics to stdout during normal recording:** Inspection is a separate command. The `record` command should stay clean.
- **Don't make raw-frame dumps automatic:** They consume disk space fast. Always require explicit `tuireel dump-frames`.
- **Don't invent a new artifact directory:** Use `.tuireel/` consistently. Dumped frames go into a subdirectory like `.tuireel/frames/<recording>/`.
- **Don't parse ffprobe output with regex:** Always use `-print_format json` and parse JSON. The CI smoke tests already prove this pattern.

## Don't Hand-Roll

| Problem                       | Don't Build                     | Use Instead                                                              | Why                                                                |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Video metadata extraction     | Custom MP4/WebM parser          | `ffprobe -print_format json`                                             | Already proven in CI; handles all container formats and edge cases |
| Frame decoding from raw video | Custom video decoder            | `decodeRawFrames()` from compositor.ts                                   | Already handles ffmpeg invocation, frame naming, error handling    |
| Timeline loading              | Custom JSON parser for timeline | `InteractionTimeline.fromFile()`                                         | Already handles version migration, frame expansion, data cloning   |
| Artifact path resolution      | Hardcoded paths                 | `resolveRecordingArtifacts()` pattern from recorder.ts                   | Single source of truth for `.tuireel/` layout                      |
| CLI flag parsing              | Custom argv parsing             | Commander.js `.option()` / `.argument()`                                 | Already used by all 5 existing commands                            |
| Pixel-level frame comparison  | Manual buffer loops             | sharp `.resize().raw().toBuffer()` + existing `averagePixelDifference()` | compositor.ts already has this exact utility                       |

**Key insight:** This phase is almost entirely glue code. Every core capability (frame decode, timeline load, ffprobe, image comparison, CLI registration) already exists. The work is connecting them into user-facing surfaces.

## Common Pitfalls

### Pitfall 1: Acceptance tests that require recording are slow

**What goes wrong:** Each acceptance test records a real demo (PTY + ffmpeg), which takes 2-10 seconds.
**Why it happens:** Real recordings involve PTY startup, shell execution, frame capture, and encoding.
**How to avoid:** Keep acceptance fixture demos minimal (5-6 steps, small cols/rows like 40x12). Group related assertions in one test to amortize recording cost. Use `beforeAll` to record once, then assert many times.
**Warning signs:** Test suite taking >60 seconds; CI timeouts.

### Pitfall 2: ffprobe path resolution

**What goes wrong:** `ffprobe` is a sibling binary to `ffmpeg`, not always in the same location or PATH.
**Why it happens:** Tuireel auto-downloads ffmpeg to `~/.tuireel/ffmpeg/`. The `ensureFfmpeg()` function returns the ffmpeg path, but ffprobe might be adjacent.
**How to avoid:** Derive ffprobe path from the ffmpeg path returned by `ensureFfmpeg()`. On most systems, ffprobe lives next to ffmpeg (same directory). Test this in CI.
**Warning signs:** `ffprobe: command not found` errors.

### Pitfall 3: Frame count mismatch between timeline and decoded frames

**What goes wrong:** Timeline's `frameCount` may differ from the number of decoded PNG files because the timeline tracks output frames while the raw video has capture-cadence frames.
**Why it happens:** `captureFps` and `fps` can differ. The compositor maps between them using `terminalFrames`.
**How to avoid:** For inspect, report both: timeline frame count (output frames) and raw video frame count (captured frames). For dump-frames, dump the raw decoded frames (what ffmpeg extracted), not the timeline-expanded frames.
**Warning signs:** "Expected N frames but found M" type errors.

### Pitfall 4: Dumped frames consuming excessive disk space

**What goes wrong:** A 10-second recording at 30fps produces 300 PNG files. At 1280x720 each PNG is ~500KB-2MB. Total: 150MB-600MB.
**Why it happens:** PNGs are lossless and terminal screenshots have high entropy areas.
**How to avoid:** Dump-frames must be explicit opt-in (never automatic). Warn the user about estimated size before dumping. Consider adding a `--max-frames N` flag.
**Warning signs:** CI artifacts bloating; disk full during debugging.

### Pitfall 5: Acceptance tests breaking on timing variance

**What goes wrong:** Assertions on exact frame counts or exact durations fail intermittently because PTY timing is not perfectly deterministic.
**Why it happens:** Real terminal interaction has OS scheduling jitter, PTY buffer timing, and shell startup variance.
**How to avoid:** Assert on ranges and ratios, not exact values. For cadence: assert that typed characters produce >1 terminal frame per N characters. For pause: assert duration is within +-20% of configured value. For readability: assert dimensions, not pixel-perfect content.
**Warning signs:** Flaky CI; tests that pass locally but fail in CI.

## Code Examples

Verified patterns from existing codebase:

### Loading Timeline from Saved Artifact

```typescript
// Source: packages/core/src/timeline/interaction-timeline.ts lines 330-333
static fromFile(path: string): InteractionTimeline {
  const raw = readFileSync(path, "utf8");
  return InteractionTimeline.load(JSON.parse(raw) as TimelineData);
}
```

### Existing Logger stat/timing Methods (for inspect output)

```typescript
// Source: packages/core/src/logger.ts lines 53-63
timing(label: string, ms: number): void {
  if (this.level >= LogLevel.debug) {
    process.stderr.write(`${label}: ${Math.round(ms)}ms\n`);
  }
}

stat(label: string, value: string | number): void {
  if (this.level >= LogLevel.verbose) {
    process.stderr.write(`${label}: ${value}\n`);
  }
}
```

### Existing Frame Decode (for dump-frames)

```typescript
// Source: packages/core/src/compositor.ts lines 235-247
async function decodeRawFrames(
  ffmpegPath: string,
  rawVideoPath: string,
  outputDirectory: string,
  log?: Logger,
): Promise<void> {
  await runFfmpeg(
    ffmpegPath,
    ["-y", "-i", rawVideoPath, "-vsync", "0", join(outputDirectory, "%06d.png")],
    "decode raw video into frame images",
    log,
  );
}
```

### Existing CLI Command Pattern

```typescript
// Source: packages/cli/src/commands/validate.ts pattern
export function registerValidateCommand(
  program: Command,
  output: ValidateCommandOutput = defaultOutput,
): void {
  program
    .command("validate")
    .description("Validate a tuireel config file")
    .argument("[configPath]", "Path to config file", DEFAULT_CONFIG_PATH)
    .action(async (configPath: string) => {
      try {
        await loadConfig(configPath);
        output.log(formatSuccessLine(`Config is valid: ${configPath}`));
      } catch (error) {
        // error handling with process.exitCode = 1
      }
    });
}
```

### Existing FakeSession/FakeEncoder Pattern (for unit tests)

```typescript
// Source: packages/core/test/frame-capturer.test.ts lines 7-37
class FakeSession {
  private readonly results: Array<Buffer | Error>;
  async screenshot(): Promise<Buffer> {
    const next = this.results.shift() ?? Buffer.from("frame");
    if (next instanceof Error) throw next;
    return next;
  }
}

class FakeEncoder {
  readonly frames: Buffer[] = [];
  async writeFrame(frame: Buffer): Promise<void> {
    this.frames.push(frame);
  }
}
```

## State of the Art

| Old Approach                    | Current Approach                          | When Changed | Impact                                                                      |
| ------------------------------- | ----------------------------------------- | ------------ | --------------------------------------------------------------------------- |
| CI-only ffprobe checks in shell | Moving to reusable `probeVideo()` in core | Phase 29     | Inspect command and acceptance tests can share the same probe logic         |
| No run inspection               | `tuireel inspect` command                 | Phase 29     | Authors stop reading timeline JSON by hand                                  |
| No frame dump capability        | `tuireel dump-frames`                     | Phase 29     | Fidelity debugging becomes explicit and structured                          |
| Smoke test only (CI)            | Acceptance fixtures (vitest)              | Phase 29     | Milestone promises are enforced by test assertions, not just "video exists" |

**Deprecated/outdated:**

- The inline `node -e` ffprobe validation in `video-smoke.yml` should be consolidated into a shared probe utility. Keep CI calling the utility rather than duplicating parsing logic.

## Open Questions

1. **Should `tuireel inspect` read from config or accept artifact paths directly?**
   - What we know: The `composite` command resolves artifacts from config's output name. The `inspect` command could do the same.
   - What's unclear: Whether authors want to inspect without having a config file present (e.g., inspecting a recording on a different machine).
   - Recommendation: Accept config path as primary (consistent with other commands), but also accept `--recording <name>` flag for direct artifact access.

2. **Should acceptance fixtures record fresh demos or use pre-recorded golden artifacts?**
   - What we know: Recording is deterministic enough for assertions on ranges. Pre-recorded artifacts avoid PTY dependency in CI but drift from code changes.
   - What's unclear: Whether golden-artifact acceptance is maintainable long-term.
   - Recommendation: Record fresh in the test. Phases 25-28 are designed to make recording deterministic enough. Use tolerant assertions (ranges, not exact values).

3. **Should inspect output be pure console or also write a sidecar JSON?**
   - What we know: CONTEXT.md says "human-readable first, structured enough for tooling later."
   - What's unclear: Whether a `--json` flag is needed now or can wait.
   - Recommendation: Default to human-readable console output. Add `--json` flag that outputs the same data as JSON to stdout. This satisfies both needs with minimal code.

## Validation Architecture

### Test Framework

| Property           | Value                              |
| ------------------ | ---------------------------------- |
| Framework          | vitest ^3.2.4                      |
| Config file        | `packages/core/vitest.config.ts`   |
| Quick run command  | `pnpm --filter @tuireel/core test` |
| Full suite command | `pnpm test`                        |

### Phase Requirements -> Test Map

| Req ID  | Behavior                                   | Test Type   | Automated Command                                                                       | File Exists? |
| ------- | ------------------------------------------ | ----------- | --------------------------------------------------------------------------------------- | ------------ |
| DIAG-04 | Acceptance fixtures verify cadence         | integration | `pnpm --filter @tuireel/core vitest run test/acceptance/pacing.acceptance.ts -x`        | Wave 0       |
| DIAG-04 | Acceptance fixtures verify readability     | integration | `pnpm --filter @tuireel/core vitest run test/acceptance/readability.acceptance.ts -x`   | Wave 0       |
| DIAG-04 | Acceptance fixtures verify smooth output   | integration | `pnpm --filter @tuireel/core vitest run test/acceptance/smooth-output.acceptance.ts -x` | Wave 0       |
| DIAG-05 | Inspect command shows pacing stats         | unit        | `pnpm --filter @tuireel/core vitest run test/diagnostics/inspect.test.ts -x`            | Wave 0       |
| DIAG-05 | Inspect command reads timeline and ffprobe | integration | CI video-smoke with inspect step                                                        | Wave 0       |
| DIAG-06 | Dump-frames writes PNGs to output dir      | unit        | `pnpm --filter @tuireel/core vitest run test/diagnostics/frame-dumper.test.ts -x`       | Wave 0       |

### Sampling Rate

- **Per task commit:** `pnpm --filter @tuireel/core test`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/core/test/acceptance/pacing.acceptance.ts` -- covers DIAG-04 cadence
- [ ] `packages/core/test/acceptance/readability.acceptance.ts` -- covers DIAG-04 readability
- [ ] `packages/core/test/acceptance/smooth-output.acceptance.ts` -- covers DIAG-04 smooth output
- [ ] `packages/core/test/diagnostics/inspect.test.ts` -- covers DIAG-05
- [ ] `packages/core/test/diagnostics/frame-dumper.test.ts` -- covers DIAG-06
- [ ] `packages/core/src/diagnostics/inspect.ts` -- core inspect logic
- [ ] `packages/core/src/diagnostics/frame-dumper.ts` -- core frame dump logic
- [ ] `packages/cli/src/commands/inspect.ts` -- CLI command
- [ ] `packages/cli/src/commands/dump-frames.ts` -- CLI command

## Sources

### Primary (HIGH confidence)

- packages/core/src/compositor.ts - frame decode pipeline, `decodeRawFrames()`, `loadFrameFileNames()`, `averagePixelDifference()`
- packages/core/src/recorder.ts - artifact path resolution, `.tuireel/` directory structure, recording flow
- packages/core/src/timeline/interaction-timeline.ts - `fromFile()`, `toJSON()`, `TimelineData` structure
- packages/core/src/timeline/types.ts - `TimelineData`, `FrameData`, `SoundEvent` interfaces
- packages/core/src/logger.ts - `LogLevel`, `stat()`, `timing()` methods
- packages/cli/src/commands/\*.ts - all CLI command registration patterns
- .github/workflows/video-smoke.yml - ffprobe JSON extraction and assertion pattern
- packages/core/vitest.config.ts - test configuration
- packages/core/test/\*.test.ts - existing test patterns (FakeSession, FakeEncoder)

### Secondary (MEDIUM confidence)

- packages/core/src/executor/timing.ts - charDelay deterministic cadence (used by acceptance assertions)
- packages/core/src/capture/frame-capturer.ts - `captureNow()`, `shouldCaptureTypedCharacter()` logic

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - all deps already in the project, no new packages
- Architecture: HIGH - all patterns directly observed in existing codebase
- Pitfalls: HIGH - derived from actual code behavior and CI workflow analysis

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable internal-only phase, no external dependency volatility)
