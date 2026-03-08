import { execFile } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { compose } from "../compositor.js";
import { ensureFfmpeg } from "../ffmpeg/downloader.js";
import type { TimelineData } from "../timeline/types.js";

const execFileAsync = promisify(execFile);

function createTimelineData(): TimelineData {
  return {
    fps: 12,
    width: 320,
    height: 180,
    frameCount: 12,
    theme: {
      cursor: {
        color: "#ffffff",
        size: 18,
      },
      hud: {
        background: "#111827cc",
        color: "#f9fafb",
        fontSize: 16,
        fontFamily: "monospace",
        borderRadius: 8,
        position: "bottom",
      },
    },
    frames: [
      {
        frameIndex: 0,
        timeMs: 0,
        cursor: { x: 40, y: 36, visible: true },
        hud: null,
      },
      {
        frameIndex: 4,
        timeMs: 333.3,
        cursor: { x: 150, y: 80, visible: true },
        hud: { labels: ["Ctrl", "C"], opacity: 1 },
      },
      {
        frameIndex: 8,
        timeMs: 666.6,
        cursor: { x: 250, y: 140, visible: true },
        hud: null,
      },
    ],
    events: [],
  };
}

function createSavedArtifactTimeline(): TimelineData {
  return {
    ...createTimelineData(),
    fps: 10,
    frameCount: 10,
    frames: [
      {
        frameIndex: 0,
        timeMs: 0,
        cursor: { x: 40, y: 36, visible: true },
        hud: null,
      },
      {
        frameIndex: 4,
        timeMs: 400,
        cursor: { x: 150, y: 80, visible: true },
        hud: { labels: ["Ctrl", "C"], opacity: 1 },
      },
      {
        frameIndex: 8,
        timeMs: 800,
        cursor: { x: 250, y: 140, visible: true },
        hud: { labels: ["Shift", "Tab"], opacity: 0.8 },
      },
    ],
    terminalFrames: [0, 2, 4, 6, 8],
    timingContract: {
      version: 1,
      outputFps: 10,
      captureFps: 8,
      wallClockDurationMs: 1_000,
      rawFrameCount: 5,
      outputFrameCount: 10,
      terminalFrameCount: 5,
      deliveryProfile: "readable-1080p",
    },
  };
}

function stripHudFromTimeline(timeline: TimelineData): TimelineData {
  return {
    ...timeline,
    frames: timeline.frames.map((frame) => ({
      ...frame,
      hud: null,
    })),
  };
}

async function runFfmpeg(ffmpegPath: string, args: string[]): Promise<void> {
  await execFileAsync(ffmpegPath, args, {
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function createSavedArtifactRawVideo(ffmpegPath: string, rawPath: string): Promise<void> {
  await runFfmpeg(ffmpegPath, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=#111111:s=320x180:d=0.2[r0];color=c=#111111:s=320x180:d=0.2[r1];color=c=#1f2937:s=320x180:d=0.2[r2];color=c=#2563eb:s=320x180:d=0.2[r3];color=c=#16a34a:s=320x180:d=0.2[r4];[r0][r1][r2][r3][r4]concat=n=5:v=1:a=0",
    "-r",
    "10",
    rawPath,
  ]);
}

async function assertPlayable(ffmpegPath: string, filePath: string): Promise<void> {
  await runFfmpeg(ffmpegPath, ["-v", "error", "-i", filePath, "-f", "null", "-"]);
}

async function probeDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);

  return Number.parseFloat(stdout.trim());
}

async function probeDimensions(filePath: string): Promise<{ width: number; height: number }> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "csv=p=0:s=x",
    filePath,
  ]);

  const [widthText = "0", heightText = "0"] = stdout.trim().split("x");
  return {
    width: Number.parseInt(widthText, 10),
    height: Number.parseInt(heightText, 10),
  };
}

async function readPixel(
  filePath: string,
  x: number,
  y: number,
): Promise<[number, number, number]> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const offset = (y * info.width + x) * channels;

  return [data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0];
}

function expectRgbClose(
  actual: [number, number, number],
  expected: [number, number, number],
  tolerance = 8,
): void {
  expect(actual[0]).toBeGreaterThanOrEqual(expected[0] - tolerance);
  expect(actual[0]).toBeLessThanOrEqual(expected[0] + tolerance);
  expect(actual[1]).toBeGreaterThanOrEqual(expected[1] - tolerance);
  expect(actual[1]).toBeLessThanOrEqual(expected[1] + tolerance);
  expect(actual[2]).toBeGreaterThanOrEqual(expected[2] - tolerance);
  expect(actual[2]).toBeLessThanOrEqual(expected[2] + tolerance);
}

describe("compose", () => {
  it("creates a playable output from raw video and timeline data", async () => {
    const ffmpegPath = await ensureFfmpeg();
    const tempDirectory = await mkdtemp(join(tmpdir(), "tuireel-compose-test-"));
    const rawPath = join(tempDirectory, "raw.mp4");
    const outputPath = join(tempDirectory, "composited.mp4");

    try {
      await runFfmpeg(ffmpegPath, [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=#1f2937:s=320x180:d=1",
        "-r",
        "12",
        rawPath,
      ]);

      await compose(rawPath, createTimelineData(), outputPath, {
        format: "mp4",
        cursorConfig: { size: 18 },
      });

      const outputStats = await stat(outputPath);
      expect(outputStats.size).toBeGreaterThan(0);

      await assertPlayable(ffmpegPath, outputPath);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }, 120_000);

  it("recomposes a saved timing artifact with packaging-only sizing and background changes", async () => {
    const ffmpegPath = await ensureFfmpeg();
    const tempDirectory = await mkdtemp(join(tmpdir(), "tuireel-compose-packaging-test-"));
    const rawPath = join(tempDirectory, "saved-artifact.mp4");
    const outputPath = join(tempDirectory, "recomposited.webm");
    const framePath = join(tempDirectory, "frame.png");
    const savedTimeline = createSavedArtifactTimeline();

    try {
      await createSavedArtifactRawVideo(ffmpegPath, rawPath);

      await compose(rawPath, savedTimeline, outputPath, {
        format: "webm",
        outputSize: { width: 1920, height: 1080, padding: 96 },
        backgroundColor: "#020617",
        cursorConfig: { visible: false },
      });

      await assertPlayable(ffmpegPath, outputPath);

      const dimensions = await probeDimensions(outputPath);
      expect(dimensions).toEqual({ width: 1920, height: 1080 });

      const rawDuration = await probeDuration(rawPath);
      const outputDuration = await probeDuration(outputPath);
      expect(Math.abs(outputDuration - rawDuration)).toBeLessThan(0.2);

      await runFfmpeg(ffmpegPath, ["-y", "-i", outputPath, "-frames:v", "1", framePath]);
      expectRgbClose(await readPixel(framePath, 12, 12), [2, 6, 23]);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }, 120_000);

  it("recomposes a saved timing artifact with trim and overlay visibility packaging changes", async () => {
    const ffmpegPath = await ensureFfmpeg();
    const tempDirectory = await mkdtemp(join(tmpdir(), "tuireel-compose-overlay-test-"));
    const rawPath = join(tempDirectory, "saved-artifact.mp4");
    const outputPath = join(tempDirectory, "trimmed.mp4");
    const savedTimeline = createSavedArtifactTimeline();

    try {
      await createSavedArtifactRawVideo(ffmpegPath, rawPath);

      await compose(rawPath, stripHudFromTimeline(savedTimeline), outputPath, {
        format: "mp4",
        trimLeadingStatic: true,
        cursorConfig: { visible: false },
      });

      await assertPlayable(ffmpegPath, outputPath);
      const outputDuration = await probeDuration(outputPath);
      expect(outputDuration).toBeGreaterThan(0);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }, 120_000);

  it("can trim a static lead before compositing", async () => {
    const ffmpegPath = await ensureFfmpeg();
    const tempDirectory = await mkdtemp(join(tmpdir(), "tuireel-compose-trim-test-"));
    const rawPath = join(tempDirectory, "raw.mp4");
    const outputPath = join(tempDirectory, "trimmed.mp4");

    const timeline: TimelineData = {
      ...createTimelineData(),
      fps: 10,
      frameCount: 3,
      frames: [
        {
          frameIndex: 0,
          timeMs: 0,
          cursor: { x: 40, y: 36, visible: true },
          hud: null,
        },
      ],
      terminalFrames: [0, 1, 2],
    };

    try {
      await runFfmpeg(ffmpegPath, [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=#111111:s=320x180:d=0.2[r0];color=c=#111111:s=320x180:d=0.2[r1];color=c=#55aa55:s=320x180:d=0.2[r2];[r0][r1][r2]concat=n=3:v=1:a=0",
        "-r",
        "10",
        rawPath,
      ]);

      await compose(rawPath, timeline, outputPath, {
        format: "mp4",
        trimLeadingStatic: true,
      });

      await assertPlayable(ffmpegPath, outputPath);

      const duration = await probeDuration(outputPath);
      expect(duration).toBeGreaterThan(0);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }, 120_000);

  it("can scale and pad output to an explicit canvas size", async () => {
    const ffmpegPath = await ensureFfmpeg();
    const tempDirectory = await mkdtemp(join(tmpdir(), "tuireel-compose-size-test-"));
    const rawPath = join(tempDirectory, "raw.mp4");
    const outputPath = join(tempDirectory, "sized.mp4");

    try {
      await runFfmpeg(ffmpegPath, [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=#1f2937:s=320x180:d=1",
        "-r",
        "12",
        rawPath,
      ]);

      await compose(rawPath, createTimelineData(), outputPath, {
        format: "mp4",
        outputSize: { width: 1920, height: 1080 },
        backgroundColor: "#1f2937",
      });

      await assertPlayable(ffmpegPath, outputPath);

      const dimensions = await probeDimensions(outputPath);
      expect(dimensions).toEqual({ width: 1920, height: 1080 });
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }, 120_000);

  it("can inset output inside a padded 1080p canvas", async () => {
    const ffmpegPath = await ensureFfmpeg();
    const tempDirectory = await mkdtemp(join(tmpdir(), "tuireel-compose-padding-test-"));
    const rawPath = join(tempDirectory, "raw.mp4");
    const outputPath = join(tempDirectory, "padded.mp4");
    const framePath = join(tempDirectory, "frame.png");

    try {
      await runFfmpeg(ffmpegPath, [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=#ff0000:s=320x180:d=1",
        "-r",
        "12",
        rawPath,
      ]);

      await compose(rawPath, createTimelineData(), outputPath, {
        format: "mp4",
        outputSize: { width: 1920, height: 1080, padding: 120 },
        backgroundColor: "#000000",
      });

      await assertPlayable(ffmpegPath, outputPath);
      await runFfmpeg(ffmpegPath, ["-y", "-i", outputPath, "-frames:v", "1", framePath]);

      expect(await readPixel(framePath, 10, 10)).toEqual([0, 0, 0]);
      expect(await readPixel(framePath, 960, 540)).not.toEqual([0, 0, 0]);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }, 120_000);
});
