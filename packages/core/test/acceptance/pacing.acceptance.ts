import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TuireelConfig } from "../../src/config/schema.js";
import { loadConfig } from "../../src/config/loader.js";
import { inspectRecording, type InspectReport } from "../../src/diagnostics/inspect.js";
import { resolveBeatType } from "../../src/executor/pacing/beats.js";
import { ensureFfmpeg } from "../../src/ffmpeg/downloader.js";
import { record } from "../../src/recorder.js";
import { InteractionTimeline } from "../../src/timeline/interaction-timeline.js";

type AcceptanceFixture = {
  ffmpegPath: string;
  outputVideoPath: string;
  rawVideoPath: string;
  report: InspectReport;
  steps: TuireelConfig["steps"];
  timelinePath: string;
  workDirectory: string;
};

function getKeyframeGapsMs(timelinePath: string): number[] {
  const timeline = InteractionTimeline.fromFile(timelinePath).toJSON();
  const gaps: number[] = [];

  for (let index = 1; index < timeline.frames.length; index += 1) {
    const previous = timeline.frames[index - 1];
    const current = timeline.frames[index];

    if (!previous || !current) {
      continue;
    }

    gaps.push(current.timeMs - previous.timeMs);
  }

  return gaps;
}

function hasGapBetween(gaps: number[], minimumMs: number, maximumMs: number): boolean {
  return gaps.some((gap) => gap >= minimumMs && gap <= maximumMs);
}

async function createFixture(
  name: string,
  configSource: TuireelConfig,
): Promise<AcceptanceFixture> {
  const workDirectory = await mkdtemp(join(tmpdir(), `tuireel-acceptance-${name}-`));
  const configPath = join(workDirectory, `${name}.tuireel.jsonc`);
  const ffmpegPath = await ensureFfmpeg();
  const previousCwd = process.cwd();

  await writeFile(configPath, `${JSON.stringify(configSource, null, 2)}\n`, "utf8");

  const [config] = await loadConfig(configPath);

  try {
    process.chdir(workDirectory);
    await record(config);
  } finally {
    process.chdir(previousCwd);
  }

  const outputVideoPath = join(workDirectory, configSource.output);
  const rawVideoPath = join(workDirectory, ".tuireel", "raw", configSource.output);
  const timelinePath = join(workDirectory, ".tuireel", "timelines", `${name}.timeline.json`);
  const report = await inspectRecording({
    timelinePath,
    rawVideoPath,
    outputVideoPath,
    ffmpegPath,
    selected: {
      pacing: typeof configSource.pacing === "string" ? configSource.pacing : null,
      deliveryProfile: configSource.deliveryProfile ?? null,
    },
  });

  return {
    ffmpegPath,
    outputVideoPath,
    rawVideoPath,
    report,
    steps: configSource.steps,
    timelinePath,
    workDirectory,
  };
}

const namedPacingSteps: TuireelConfig["steps"] = [
  { type: "launch", command: "sh" },
  { type: "type", text: "printf '__PACE_READY__\\n'" },
  { type: "press", key: "Enter" },
  { type: "wait", pattern: "__PACE_READY__" },
  { type: "type", text: "echo paced acceptance" },
  { type: "press", key: "Enter" },
  { type: "type", text: "pwd" },
  { type: "press", key: "Enter" },
];

const inlinePacing = {
  baseSpeedMs: 72,
  firstCharExtra: 0.24,
  punctuationExtra: 0.2,
  whitespaceExtra: 0.3,
  pathSepExtra: 0.06,
  beats: {
    startup: 700,
    settle: 420,
    read: 320,
    idle: 180,
  },
} satisfies NonNullable<TuireelConfig["pacing"]>;

const inlinePacingSteps: TuireelConfig["steps"] = [
  { type: "launch", command: "sh" },
  { type: "type", text: "printf '__INLINE_READY__\\n'" },
  { type: "press", key: "Enter" },
  { type: "wait", pattern: "__INLINE_READY__" },
  { type: "pause", duration: 900 },
  { type: "type", text: "echo inline pacing artifact" },
  { type: "press", key: "Enter" },
];

const overrideBaselineSteps: TuireelConfig["steps"] = [
  { type: "launch", command: "sh" },
  { type: "type", text: "printf '__OVERRIDE_BASELINE__ abcdefghijklmnopqrstuvwx\\n'" },
  { type: "press", key: "Enter" },
  { type: "wait", pattern: "__OVERRIDE_BASELINE__" },
];

const overrideFastSteps: TuireelConfig["steps"] = [
  { type: "launch", command: "sh" },
  {
    type: "type",
    text: "printf '__OVERRIDE_FAST__ abcdefghijklmnopqrstuvwx\\n'",
    speed: 1,
  },
  { type: "press", key: "Enter" },
  { type: "wait", pattern: "__OVERRIDE_FAST__" },
];

const pauseAuthoritySteps: TuireelConfig["steps"] = [
  { type: "launch", command: "sh" },
  { type: "pause", duration: 900 },
  { type: "press", key: "Enter" },
];

describe.sequential("acceptance: pacing", () => {
  let namedFixture: AcceptanceFixture | undefined;
  let inlineFixture: AcceptanceFixture | undefined;
  let overrideBaselineFixture: AcceptanceFixture | undefined;
  let overrideFastFixture: AcceptanceFixture | undefined;
  let pauseBaselineFixture: AcceptanceFixture | undefined;
  let pausePacedFixture: AcceptanceFixture | undefined;

  beforeAll(async () => {
    namedFixture = await createFixture("pacing-named-acceptance", {
      output: "pacing-named-acceptance.mp4",
      format: "mp4",
      fps: 10,
      cols: 40,
      rows: 12,
      pacing: "relaxed",
      steps: namedPacingSteps,
    });

    inlineFixture = await createFixture("pacing-inline-acceptance", {
      output: "pacing-inline-acceptance.mp4",
      format: "mp4",
      fps: 10,
      cols: 40,
      rows: 12,
      pacing: inlinePacing,
      steps: inlinePacingSteps,
    });

    overrideBaselineFixture = await createFixture("pacing-override-baseline", {
      output: "pacing-override-baseline.mp4",
      format: "mp4",
      fps: 10,
      cols: 40,
      rows: 12,
      pacing: inlinePacing,
      steps: overrideBaselineSteps,
    });

    overrideFastFixture = await createFixture("pacing-override-fast", {
      output: "pacing-override-fast.mp4",
      format: "mp4",
      fps: 10,
      cols: 40,
      rows: 12,
      pacing: inlinePacing,
      steps: overrideFastSteps,
    });

    pauseBaselineFixture = await createFixture("pacing-pause-baseline", {
      output: "pacing-pause-baseline.mp4",
      format: "mp4",
      fps: 10,
      cols: 40,
      rows: 12,
      steps: pauseAuthoritySteps,
    });

    pausePacedFixture = await createFixture("pacing-pause-paced", {
      output: "pacing-pause-paced.mp4",
      format: "mp4",
      fps: 10,
      cols: 40,
      rows: 12,
      pacing: inlinePacing,
      steps: pauseAuthoritySteps,
    });
  }, 240_000);

  afterAll(async () => {
    if (namedFixture) {
      await rm(namedFixture.workDirectory, { recursive: true, force: true });
    }
    if (inlineFixture) {
      await rm(inlineFixture.workDirectory, { recursive: true, force: true });
    }
    if (overrideBaselineFixture) {
      await rm(overrideBaselineFixture.workDirectory, { recursive: true, force: true });
    }
    if (overrideFastFixture) {
      await rm(overrideFastFixture.workDirectory, { recursive: true, force: true });
    }
    if (pauseBaselineFixture) {
      await rm(pauseBaselineFixture.workDirectory, { recursive: true, force: true });
    }
    if (pausePacedFixture) {
      await rm(pausePacedFixture.workDirectory, { recursive: true, force: true });
    }
  });

  it("persists named pacing provenance in the recorded artifact", () => {
    expect(namedFixture?.report.selected.pacing).toBe("relaxed");
    expect(namedFixture?.report.timingContract?.pacing).toEqual({
      source: "named",
      selectedName: "relaxed",
      resolved: {
        baseSpeedMs: 65,
        firstCharExtra: 0.3,
        punctuationExtra: 0.25,
        whitespaceExtra: 0.32,
        pathSepExtra: 0.08,
        beats: {
          startup: 800,
          settle: 500,
          read: 400,
          idle: 250,
        },
      },
    });
  }, 30_000);

  it("captures startup, settle, read, and idle beats in one paced flow", () => {
    const gaps = getKeyframeGapsMs(namedFixture!.timelinePath);
    const automaticBeats = namedFixture!.steps
      .map((step, index, steps) => resolveBeatType(steps[index - 1], step))
      .filter((beat): beat is NonNullable<typeof beat> => beat !== null);
    const commandScaleBeatGaps = gaps.filter((gap) => gap >= 1_500 && gap <= 3_200);

    expect(namedFixture?.report.timeline.terminalFrameCount).toBeGreaterThan(10);
    expect(automaticBeats).toEqual(expect.arrayContaining(["startup", "settle", "read", "idle"]));
    expect(commandScaleBeatGaps.length).toBeGreaterThanOrEqual(3);
    expect(hasGapBetween(gaps, 180, 240)).toBe(true);
  }, 30_000);

  it("persists inline pacing provenance through record and inspect", () => {
    expect(inlineFixture?.report.selected.pacing).toBeNull();
    expect(inlineFixture?.report.timingContract?.pacing).toEqual({
      source: "inline",
      resolved: inlinePacing,
    });
  }, 30_000);

  it("lets per-step type speed overrides beat paced inline cadence", () => {
    expect(overrideBaselineFixture?.report.timeline.durationMs).toBeGreaterThan(
      (overrideFastFixture?.report.timeline.durationMs ?? Number.POSITIVE_INFINITY) + 800,
    );
  }, 30_000);

  it("keeps authored pause duration authoritative inside a paced recording", () => {
    const gaps = getKeyframeGapsMs(pausePacedFixture!.timelinePath);

    expect(hasGapBetween(gaps, 800, 1_100)).toBe(true);
    expect(pausePacedFixture?.report.timeline.durationMs).toBeLessThan(
      (pauseBaselineFixture?.report.timeline.durationMs ?? Number.NEGATIVE_INFINITY) + 250,
    );
  }, 30_000);
});
