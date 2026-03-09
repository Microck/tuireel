import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/loader.js";
import { dumpFrames } from "../../src/diagnostics/frame-dumper.js";
import { inspectRecording } from "../../src/diagnostics/inspect.js";
import { probeVideo } from "../../src/diagnostics/probe-video.js";
import { ensureFfmpeg } from "../../src/ffmpeg/downloader.js";
import { record } from "../../src/recorder.js";
import { InteractionTimeline } from "../../src/timeline/interaction-timeline.js";

type SmoothFixture = {
  ffmpegPath: string;
  outputVideoPath: string;
  rawVideoPath: string;
  timelinePath: string;
  frameDumpRoot: string;
  outputFrameDumpDirectory: string;
  rawFrameDumpDirectory: string;
  workDirectory: string;
};

type ContinuityScore = {
  leftFrame: string;
  rightFrame: string;
  averageDelta: number;
  changedPixelRatio: number;
};

const CONTINUITY_MIN_CHANGED_PIXEL_RATIO = 0.0001;
const CONTINUITY_MAX_CHANGED_PIXEL_RATIO = 0.12;
const CONTINUITY_MAX_AVERAGE_DELTA = 0.08;
const MAX_CONTINUITY_FRAME_PAIRS = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function selectTransitionPairIndexes(
  frameCount: number,
  keyEventFrames: number[],
  terminalFrames: number[],
): number[] {
  if (frameCount < 2) {
    return [];
  }

  if (keyEventFrames.length === 0) {
    return Array.from(
      { length: Math.min(frameCount - 1, MAX_CONTINUITY_FRAME_PAIRS) },
      (_, index) => index,
    );
  }

  const defaultStart = Math.floor(frameCount * 0.25);
  const defaultEnd = Math.ceil(frameCount * 0.75);
  const keyedStart = keyEventFrames[0] != null ? Math.max(0, keyEventFrames[0] - 1) : null;
  const keyedEnd =
    keyEventFrames[keyEventFrames.length - 1] != null
      ? Math.min(frameCount - 1, keyEventFrames[keyEventFrames.length - 1] + 1)
      : null;
  const timelineStart = terminalFrames[Math.floor(terminalFrames.length * 0.2)] ?? defaultStart;
  const timelineEnd = terminalFrames[Math.ceil(terminalFrames.length * 0.8)] ?? defaultEnd;

  const startIndex = clamp(keyedStart ?? timelineStart, 0, Math.max(0, frameCount - 2));
  const endIndex = clamp(keyedEnd ?? timelineEnd, startIndex + 1, frameCount - 1);
  const windowFrameCount = endIndex - startIndex + 1;
  const boundedWindowLength = Math.min(windowFrameCount, MAX_CONTINUITY_FRAME_PAIRS + 1);
  const boundedStartIndex =
    startIndex + Math.max(0, Math.floor((windowFrameCount - boundedWindowLength) / 2));

  return Array.from({ length: boundedWindowLength - 1 }, (_, index) => boundedStartIndex + index);
}

async function scoreAdjacentFrames(leftPath: string, rightPath: string): Promise<ContinuityScore> {
  const [leftFrame, rightFrame] = await Promise.all([
    sharp(leftPath)
      .resize({
        width: 160,
        height: 90,
        fit: "inside",
        withoutEnlargement: true,
        kernel: "nearest",
      })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true }),
    sharp(rightPath)
      .resize({
        width: 160,
        height: 90,
        fit: "inside",
        withoutEnlargement: true,
        kernel: "nearest",
      })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true }),
  ]);

  expect(leftFrame.info.width).toBe(rightFrame.info.width);
  expect(leftFrame.info.height).toBe(rightFrame.info.height);

  let changedPixels = 0;
  let totalDelta = 0;

  for (let index = 0; index < leftFrame.data.length; index += 1) {
    const delta = Math.abs(leftFrame.data[index] - rightFrame.data[index]);
    totalDelta += delta;

    if (delta >= 1) {
      changedPixels += 1;
    }
  }

  return {
    leftFrame: leftPath,
    rightFrame: rightPath,
    averageDelta: totalDelta / leftFrame.data.length / 255,
    changedPixelRatio: changedPixels / leftFrame.data.length,
  };
}

async function createFixture(): Promise<SmoothFixture> {
  const workDirectory = await mkdtemp(join(tmpdir(), "tuireel-acceptance-smooth-"));
  const frameDumpRoot = await mkdtemp(join(tmpdir(), "tuireel-acceptance-smooth-frames-"));
  const configPath = join(workDirectory, "smooth-output.tuireel.jsonc");
  const outputFrameDumpDirectory = join(frameDumpRoot, "output-frames");
  const rawFrameDumpDirectory = join(frameDumpRoot, "raw-frames");
  const outputName = "smooth-output-acceptance.mp4";
  const ffmpegPath = await ensureFfmpeg();
  const previousCwd = process.cwd();
  const configSource = {
    output: outputName,
    format: "mp4",
    fps: 10,
    cols: 40,
    rows: 12,
    steps: [
      {
        type: "launch",
        command:
          "python3 -u -c \"import sys,time; sys.stdout.write('> '); sys.stdout.flush(); text='echo hello world\\n'; [(sys.stdout.write(ch), sys.stdout.flush(), time.sleep(0.12)) for ch in text]; time.sleep(0.5)\"",
      },
      { type: "pause", duration: 3000 },
    ],
  };

  await writeFile(configPath, `${JSON.stringify(configSource, null, 2)}\n`, "utf8");

  const [config] = await loadConfig(configPath);

  try {
    process.chdir(workDirectory);
    await record(config);
  } finally {
    process.chdir(previousCwd);
  }

  return {
    ffmpegPath,
    outputVideoPath: join(workDirectory, outputName),
    rawVideoPath: join(workDirectory, ".tuireel", "raw", outputName),
    timelinePath: join(
      workDirectory,
      ".tuireel",
      "timelines",
      "smooth-output-acceptance.timeline.json",
    ),
    frameDumpRoot,
    outputFrameDumpDirectory,
    rawFrameDumpDirectory,
    workDirectory,
  };
}

describe.sequential("acceptance: smooth-output", () => {
  let fixture: SmoothFixture;
  let shouldRetainFrameDump = false;

  beforeAll(async () => {
    fixture = await createFixture();
  }, 30_000);

  afterAll(async () => {
    if (fixture) {
      await rm(fixture.workDirectory, { recursive: true, force: true });

      if (!shouldRetainFrameDump) {
        await rm(fixture.frameDumpRoot, { recursive: true, force: true });
      }
    }
  });

  it("recording captures multiple terminal states", async () => {
    const report = await inspectRecording({
      timelinePath: fixture.timelinePath,
      rawVideoPath: fixture.rawVideoPath,
      outputVideoPath: fixture.outputVideoPath,
      ffmpegPath: fixture.ffmpegPath,
    });

    expect(report.timeline.terminalFrameCount).toBeGreaterThan(1);
    expect(report.timeline.keyframeCount).toBeGreaterThan(2);
  }, 30_000);

  it("output frame count matches expected range", () => {
    const timeline = InteractionTimeline.fromFile(fixture.timelinePath).toJSON();

    expect(timeline.frameCount).toBeGreaterThanOrEqual(30);
    expect(timeline.frameCount).toBeLessThanOrEqual(80);
  }, 30_000);

  it("raw video has expected frame count", async () => {
    const probe = await probeVideo(fixture.ffmpegPath, fixture.rawVideoPath);
    const videoStream = probe.streams.find((stream) => stream.codec_type === "video");
    const frameCount = Number(videoStream?.nb_frames ?? 0);

    expect(frameCount).toBeGreaterThan(0);
    expect(frameCount).toBeLessThanOrEqual(60);
  }, 30_000);

  it("inspect reports final output metadata for the composed artifact", async () => {
    const report = await inspectRecording({
      timelinePath: fixture.timelinePath,
      rawVideoPath: fixture.rawVideoPath,
      outputVideoPath: fixture.outputVideoPath,
      ffmpegPath: fixture.ffmpegPath,
    });

    expect(report.outputVideo).not.toBeNull();
    expect(report.outputVideo?.width).toBeGreaterThan(0);
    expect(report.outputVideo?.height).toBeGreaterThan(0);
    expect(report.outputVideo?.streamFrameCount).toBeGreaterThan(0);
    expect(report.outputVideo?.durationSeconds).toBeGreaterThan(0);
  }, 30_000);

  it("final output stays visually continuous through the typed transition", async () => {
    const report = await inspectRecording({
      timelinePath: fixture.timelinePath,
      rawVideoPath: fixture.rawVideoPath,
      outputVideoPath: fixture.outputVideoPath,
      ffmpegPath: fixture.ffmpegPath,
    });
    const timeline = InteractionTimeline.fromFile(fixture.timelinePath).toJSON();

    const [outputResult, rawResult] = await Promise.all([
      dumpFrames({
        rawVideoPath: fixture.outputVideoPath,
        outputDirectory: fixture.outputFrameDumpDirectory,
        ffmpegPath: fixture.ffmpegPath,
      }),
      dumpFrames({
        rawVideoPath: fixture.rawVideoPath,
        outputDirectory: fixture.rawFrameDumpDirectory,
        ffmpegPath: fixture.ffmpegPath,
      }),
    ]);

    const outputFrameFiles = (await readdir(fixture.outputFrameDumpDirectory))
      .filter((name) => name.endsWith(".png"))
      .sort((left, right) => left.localeCompare(right));
    const rawFrameFiles = (await readdir(fixture.rawFrameDumpDirectory))
      .filter((name) => name.endsWith(".png"))
      .sort((left, right) => left.localeCompare(right));
    const keyEventFrames = timeline.events
      .filter((event) => event.type === "key")
      .map((event) => event.frameIndex);
    const pairIndexes = selectTransitionPairIndexes(
      outputFrameFiles.length,
      keyEventFrames,
      timeline.terminalFrames ?? [],
    );

    try {
      expect(report.timeline.terminalFrameCount).toBeGreaterThan(1);
      expect(report.rawVideo.streamFrameCount).toBeGreaterThan(0);
      expect(report.outputVideo?.streamFrameCount).toBeGreaterThan(0);
      expect(outputResult.frameCount).toBeGreaterThan(0);
      expect(rawResult.frameCount).toBeGreaterThan(0);
      expect(outputFrameFiles.length).toBeGreaterThan(3);
      expect(rawFrameFiles.length).toBeGreaterThan(3);
      expect(outputFrameFiles.length).toBe(outputResult.frameCount);
      expect(rawFrameFiles.length).toBe(rawResult.frameCount);
      expect(outputFrameFiles.every((name) => name.endsWith(".png"))).toBe(true);
      expect(rawFrameFiles.every((name) => name.endsWith(".png"))).toBe(true);
      expect(pairIndexes.length).toBeGreaterThan(0);

      const metadata = await sharp(
        join(fixture.outputFrameDumpDirectory, outputFrameFiles[0] ?? ""),
      ).metadata();

      expect(metadata.format).toBe("png");
      expect(metadata.width ?? 0).toBeGreaterThan(0);
      expect(metadata.height ?? 0).toBeGreaterThan(0);

      const continuityScores = await Promise.all(
        pairIndexes.map((pairIndex) =>
          scoreAdjacentFrames(
            join(fixture.outputFrameDumpDirectory, outputFrameFiles[pairIndex] ?? ""),
            join(fixture.outputFrameDumpDirectory, outputFrameFiles[pairIndex + 1] ?? ""),
          ),
        ),
      );
      const changedPixelRatios = continuityScores.map((score) => score.changedPixelRatio);
      const averageDeltas = continuityScores.map((score) => score.averageDelta);
      const maxChangedPixelRatio = Math.max(...changedPixelRatios);
      const maxAverageDelta = Math.max(...averageDeltas);

      expect(
        continuityScores.some(
          (score) => score.changedPixelRatio >= CONTINUITY_MIN_CHANGED_PIXEL_RATIO,
        ),
      ).toBe(true);
      expect(maxChangedPixelRatio).toBeLessThanOrEqual(CONTINUITY_MAX_CHANGED_PIXEL_RATIO);
      expect(maxAverageDelta).toBeLessThanOrEqual(CONTINUITY_MAX_AVERAGE_DELTA);
    } catch (error) {
      shouldRetainFrameDump = true;

      const evidenceMessage = [
        "Smooth-output final-output continuity gate failed.",
        `Retained output frame dump: ${fixture.outputFrameDumpDirectory}`,
        `Retained raw frame dump: ${fixture.rawFrameDumpDirectory}`,
        `Output artifact: ${fixture.outputVideoPath}`,
        `Raw artifact: ${fixture.rawVideoPath}`,
        `Inspect output video frames: ${report.outputVideo?.streamFrameCount ?? "unknown"}`,
        `Inspect report terminal frames: ${report.timeline.terminalFrameCount}`,
        `Inspect report frame count: ${report.timeline.frameCount}`,
        `Key event frames: ${keyEventFrames.join(", ") || "none"}`,
      ].join("\n");

      console.error(evidenceMessage);

      const wrappedError = new Error(evidenceMessage) as Error & { cause?: unknown };
      wrappedError.cause = error;
      throw wrappedError;
    }
  }, 30_000);
});
