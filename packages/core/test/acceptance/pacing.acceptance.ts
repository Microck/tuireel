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

describe.sequential("acceptance: pacing", () => {
  let namedFixture: AcceptanceFixture;

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
  }, 240_000);

  afterAll(async () => {
    if (namedFixture) {
      await rm(namedFixture.workDirectory, { recursive: true, force: true });
    }
  });

  it("persists named pacing provenance in the recorded artifact", () => {
    expect(namedFixture.report.selected.pacing).toBe("relaxed");
    expect(namedFixture.report.timingContract?.pacing).toEqual({
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
    const gaps = getKeyframeGapsMs(namedFixture.timelinePath);
    const automaticBeats = namedFixture.steps
      .map((step, index, steps) => resolveBeatType(steps[index - 1], step))
      .filter((beat): beat is NonNullable<typeof beat> => beat !== null);
    const nonStartupBeatLikeGaps = gaps.filter((gap) => gap >= 150 && gap <= 450);

    expect(namedFixture.report.timeline.terminalFrameCount).toBeGreaterThan(10);
    expect(automaticBeats).toEqual(expect.arrayContaining(["startup", "settle", "read", "idle"]));
    expect(hasGapBetween(gaps, 500, 700)).toBe(true);
    expect(nonStartupBeatLikeGaps.length).toBeGreaterThanOrEqual(3);
    expect(hasGapBetween(gaps, 180, 240)).toBe(true);
  }, 30_000);
});
