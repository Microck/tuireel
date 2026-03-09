import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { loadConfig } from "../src/config/loader.js";
import { inspectRecording } from "../src/diagnostics/inspect.js";
import { ensureFfmpeg } from "../src/ffmpeg/downloader.js";
import { record } from "../src/recorder.js";
import { InteractionTimeline } from "../src/timeline/interaction-timeline.js";

type RuntimeCaptureFixture = {
  outputVideoPath: string;
  rawVideoPath: string;
  report: Awaited<ReturnType<typeof inspectRecording>>;
  timeline: ReturnType<InteractionTimeline["toJSON"]>;
  workDirectory: string;
};

const fixtureDirectories: string[] = [];

async function createRuntimeCaptureFixture(
  name: string,
  steps: Array<Record<string, unknown>>,
): Promise<RuntimeCaptureFixture> {
  const workDirectory = await mkdtemp(join(tmpdir(), `tuireel-capture-fidelity-${name}-`));
  const configPath = join(workDirectory, `${name}.tuireel.jsonc`);
  const outputName = `${name}.mp4`;
  const previousCwd = process.cwd();
  const ffmpegPath = await ensureFfmpeg();

  fixtureDirectories.push(workDirectory);

  await writeFile(
    configPath,
    `${JSON.stringify(
      {
        output: outputName,
        format: "mp4",
        fps: 10,
        captureFps: 1,
        cols: 40,
        rows: 12,
        steps: [{ type: "launch", command: "sh" }, ...steps],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const [config] = await loadConfig(configPath);

  try {
    process.chdir(workDirectory);
    await record(config);
  } finally {
    process.chdir(previousCwd);
  }

  const outputVideoPath = join(workDirectory, outputName);
  const rawVideoPath = join(workDirectory, ".tuireel", "raw", outputName);
  const timelinePath = join(workDirectory, ".tuireel", "timelines", `${name}.timeline.json`);

  return {
    outputVideoPath,
    rawVideoPath,
    report: await inspectRecording({
      timelinePath,
      rawVideoPath,
      outputVideoPath,
      ffmpegPath,
    }),
    timeline: InteractionTimeline.fromFile(timelinePath).toJSON(),
    workDirectory,
  };
}

describe.sequential("capture fidelity runtime", () => {
  afterAll(async () => {
    await Promise.all(
      fixtureDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it("records multiple real terminal states for a short typed burst at 1fps capture", async () => {
    const fixture = await createRuntimeCaptureFixture("type-burst", [
      { type: "type", text: "abc" },
    ]);
    const keyEventCount = fixture.timeline.events.filter((event) => event.type === "key").length;

    expect(fixture.report.timingContract?.captureFps).toBe(1);
    expect(keyEventCount).toBe(3);
    expect(fixture.report.timeline.terminalFrameCount).toBeGreaterThanOrEqual(keyEventCount + 1);
    expect(fixture.report.rawVideo.streamFrameCount ?? 0).toBeGreaterThanOrEqual(keyEventCount + 1);
  }, 120_000);

  it("captures settled press and wait states even when sparse polling cannot save them", async () => {
    const baselineFixture = await createRuntimeCaptureFixture("press-wait-type-only", [
      { type: "type", text: "echo ok" },
    ]);
    const fixture = await createRuntimeCaptureFixture("press-wait", [
      { type: "type", text: "echo ok" },
      { type: "press", key: "enter" },
      { type: "wait", pattern: "ok", timeout: 2_000 },
    ]);
    const keyEventCount = fixture.timeline.events.filter((event) => event.type === "key").length;

    expect(fixture.report.timingContract?.captureFps).toBe(1);
    expect(keyEventCount).toBe(8);
    expect(fixture.report.timeline.terminalFrameCount).toBeGreaterThan(
      baselineFixture.report.timeline.terminalFrameCount,
    );
    expect(fixture.report.rawVideo.streamFrameCount ?? 0).toBeGreaterThan(
      baselineFixture.report.rawVideo.streamFrameCount ?? 0,
    );
  }, 120_000);

  it("captures a settled post-scroll terminal state through the real recorder path", async () => {
    const baselineFixture = await createRuntimeCaptureFixture("scroll-baseline", [
      { type: "type", text: "seq 1 40" },
      { type: "press", key: "enter" },
      { type: "wait", pattern: "40", timeout: 2_000 },
    ]);
    const fixture = await createRuntimeCaptureFixture("scroll", [
      { type: "type", text: "seq 1 40" },
      { type: "press", key: "enter" },
      { type: "wait", pattern: "40", timeout: 2_000 },
      { type: "scroll", direction: "up", amount: 10 },
    ]);
    const keyEventCount = fixture.timeline.events.filter((event) => event.type === "key").length;

    expect(fixture.report.timingContract?.captureFps).toBe(1);
    expect(keyEventCount).toBe(9);
    expect(fixture.report.timeline.terminalFrameCount).toBeGreaterThan(
      baselineFixture.report.timeline.terminalFrameCount,
    );
    expect(fixture.report.rawVideo.streamFrameCount ?? 0).toBeGreaterThan(
      baselineFixture.report.rawVideo.streamFrameCount ?? 0,
    );
  }, 120_000);
});
