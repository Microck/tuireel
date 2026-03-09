import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TuireelConfig } from "../../src/config/schema.js";
import { loadConfig } from "../../src/config/loader.js";
import { ensureFfmpeg } from "../../src/ffmpeg/downloader.js";
import { inspectRecording } from "../../src/diagnostics/inspect.js";
import { probeVideo } from "../../src/diagnostics/probe-video.js";
import { record } from "../../src/recorder.js";

type RecordingFixture = {
  ffmpegPath: string;
  outputVideoPath: string;
  rawVideoPath: string;
  timelinePath: string;
  workDirectory: string;
};

type RawTimelineArtifact = {
  frameCount: number;
  fps: number;
  timingContract?: {
    pacing?: {
      source: "named" | "inline";
      selectedName?: string;
      resolved: {
        baseSpeedMs: number;
        firstCharExtra: number;
        punctuationExtra: number;
        whitespaceExtra: number;
        pathSepExtra: number;
        beats: {
          startup: number;
          settle: number;
          read: number;
          idle: number;
        };
      };
    };
  };
};

async function createRecordingFixture(
  name: string,
  overrides: Partial<TuireelConfig> = {},
): Promise<RecordingFixture> {
  const fixtureConfigPath = resolve("test/fixtures/smoke.tuireel.jsonc");
  const workDirectory = await mkdtemp(join(tmpdir(), `tuireel-${name}-`));
  const ffmpegPath = await ensureFfmpeg();
  const [config] = await loadConfig(fixtureConfigPath);
  const previousCwd = process.cwd();
  const outputName = `${name}.mp4`;

  try {
    process.chdir(workDirectory);
    await record({ ...config, ...overrides, output: outputName });
  } finally {
    process.chdir(previousCwd);
  }

  return {
    ffmpegPath,
    outputVideoPath: join(workDirectory, outputName),
    rawVideoPath: join(workDirectory, ".tuireel", "raw", outputName),
    timelinePath: join(workDirectory, ".tuireel", "timelines", `${name}.timeline.json`),
    workDirectory,
  };
}

describe.sequential("inspectRecording", () => {
  let fixture: RecordingFixture;
  let namedPacingFixture: RecordingFixture;
  let inlinePacingFixture: RecordingFixture;

  beforeAll(async () => {
    fixture = await createRecordingFixture("inspect-smoke-output");
    namedPacingFixture = await createRecordingFixture("inspect-named-pacing", {
      pacing: "relaxed",
    });
    inlinePacingFixture = await createRecordingFixture("inspect-inline-pacing", {
      pacing: {
        baseSpeedMs: 52,
        firstCharExtra: 0.18,
        punctuationExtra: 0.22,
        whitespaceExtra: 0.3,
        pathSepExtra: 0.04,
        beats: {
          startup: 620,
          settle: 360,
          read: 280,
          idle: 150,
        },
      },
    });
  }, 120_000);

  afterAll(async () => {
    if (fixture) {
      await rm(fixture.workDirectory, { recursive: true, force: true });
    }
    if (namedPacingFixture) {
      await rm(namedPacingFixture.workDirectory, { recursive: true, force: true });
    }
    if (inlinePacingFixture) {
      await rm(inlinePacingFixture.workDirectory, { recursive: true, force: true });
    }
  });

  it("returns selected metadata, timing facts, and raw/final video stats for a real recording", async () => {
    const report = await inspectRecording({
      timelinePath: fixture.timelinePath,
      rawVideoPath: fixture.rawVideoPath,
      outputVideoPath: fixture.outputVideoPath,
      ffmpegPath: fixture.ffmpegPath,
      selected: {
        pacing: null,
        deliveryProfile: null,
      },
    });

    expect(report.selected).toEqual({
      pacing: null,
      deliveryProfile: null,
    });

    expect(report.timingContract).toEqual(
      expect.objectContaining({
        outputFps: 10,
        captureFps: 10,
        rawFrameCount: expect.any(Number),
        outputFrameCount: expect.any(Number),
        terminalFrameCount: expect.any(Number),
        wallClockDurationMs: expect.any(Number),
      }),
    );

    expect(report.timeline.frameCount).toBeGreaterThan(0);
    expect(report.timeline.fps).toBe(10);
    expect(report.timeline.width).toBeGreaterThan(0);
    expect(report.timeline.height).toBeGreaterThan(0);
    expect(report.timeline.keyframeCount).toBeGreaterThan(0);
    expect(report.timeline.eventCount).toBeGreaterThanOrEqual(1);
    expect(report.timeline.terminalFrameCount).toBeGreaterThan(0);
    expect(report.timeline.durationMs).toBeGreaterThan(500);

    expect(report.rawVideo.codec).toBeTypeOf("string");
    expect(report.rawVideo.width).toBeGreaterThan(0);
    expect(report.rawVideo.height).toBeGreaterThan(0);
    expect(report.rawVideo.durationSeconds).toBeGreaterThan(0);
    expect(report.rawVideo.streamFrameCount).toBeGreaterThan(0);
    expect(report.rawVideo.formatName).toContain("mp4");

    expect(report.outputVideo).not.toBeNull();
    expect(report.outputVideo?.codec).toBeTypeOf("string");
    expect(report.outputVideo?.width).toBeGreaterThan(0);
    expect(report.outputVideo?.height).toBeGreaterThan(0);
    expect(report.outputVideo?.durationSeconds).toBeGreaterThan(0);
    expect(report.outputVideo?.streamFrameCount).toBeGreaterThan(0);
    expect(report.outputVideo?.formatName).toContain("mp4");
  }, 120_000);

  it("exposes the raw ffprobe metadata through probeVideo", async () => {
    const probe = await probeVideo(fixture.ffmpegPath, fixture.rawVideoPath);
    const videoStream = probe.streams.find((stream) => stream.codec_type === "video");

    expect(videoStream?.codec_name).toBeTypeOf("string");
    expect(Number(videoStream?.nb_frames ?? 0)).toBeGreaterThan(0);
    expect(probe.format.filename).toBe(fixture.rawVideoPath);
  }, 120_000);

  it("throws a descriptive error when the timeline file is missing", async () => {
    await expect(
      inspectRecording({
        timelinePath: join(fixture.workDirectory, "missing.timeline.json"),
        rawVideoPath: fixture.rawVideoPath,
        ffmpegPath: fixture.ffmpegPath,
      }),
    ).rejects.toThrow(/Timeline file not found/);
  });

  it("throws a descriptive error when the raw video is missing", async () => {
    await expect(
      inspectRecording({
        timelinePath: fixture.timelinePath,
        rawVideoPath: join(fixture.workDirectory, "missing.mp4"),
        ffmpegPath: fixture.ffmpegPath,
      }),
    ).rejects.toThrow(/Raw video not found/);
  });

  it("throws a descriptive error when the final output video is missing", async () => {
    await expect(
      inspectRecording({
        timelinePath: fixture.timelinePath,
        rawVideoPath: fixture.rawVideoPath,
        outputVideoPath: join(fixture.workDirectory, "missing-output.mp4"),
        ffmpegPath: fixture.ffmpegPath,
      }),
    ).rejects.toThrow(/Final output video not found/);
  });

  it("writes a valid timeline artifact during fixture recording", async () => {
    const rawTimeline = JSON.parse(
      await readFile(fixture.timelinePath, "utf8"),
    ) as RawTimelineArtifact;

    expect(rawTimeline.frameCount).toBeGreaterThan(0);
    expect(rawTimeline.fps).toBe(10);
    expect(rawTimeline.timingContract?.pacing).toBeUndefined();
  });

  it("persists named pacing provenance in the saved timeline artifact", async () => {
    const rawTimeline = JSON.parse(
      await readFile(namedPacingFixture.timelinePath, "utf8"),
    ) as RawTimelineArtifact;

    expect(rawTimeline.timingContract?.pacing).toEqual({
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
  });

  it("persists inline pacing provenance in the saved timeline artifact", async () => {
    const rawTimeline = JSON.parse(
      await readFile(inlinePacingFixture.timelinePath, "utf8"),
    ) as RawTimelineArtifact;

    expect(rawTimeline.timingContract?.pacing).toEqual({
      source: "inline",
      resolved: {
        baseSpeedMs: 52,
        firstCharExtra: 0.18,
        punctuationExtra: 0.22,
        whitespaceExtra: 0.3,
        pathSepExtra: 0.04,
        beats: {
          startup: 620,
          settle: 360,
          read: 280,
          idle: 150,
        },
      },
    });
  });
});
