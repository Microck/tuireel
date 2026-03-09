import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/loader.js";
import type { TuireelConfig } from "../../src/config/schema.js";
import { probeVideo, type ProbeResult } from "../../src/diagnostics/probe-video.js";
import { BUILT_IN_DELIVERY_PROFILES } from "../../src/delivery-profiles/built-in.js";
import { ensureFfmpeg } from "../../src/ffmpeg/downloader.js";
import { record } from "../../src/recorder.js";
import { InteractionTimeline } from "../../src/timeline/interaction-timeline.js";

const execFileAsync = promisify(execFile);
const CONTENT_DELTA_THRESHOLD = 24;
const MARGIN_TOLERANCE = 48;
const BALANCE_TOLERANCE = 24;

type ReadabilityProfile = {
  fps: number;
  fontSize: number;
  lineHeight: number;
  cols: number;
  rows: number;
  outputSize: { width: number; height: number; padding: number };
};

type FrameBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

type FrameMetrics = {
  effectiveFontSize: number;
  coverage: number;
  marginRatio: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
};

type FrameAnalysis = {
  framePath: string;
  background: [number, number, number];
  bounds: FrameBounds;
};

type ReadabilityFixture = {
  analysis: FrameAnalysis;
  configSource: ReadabilityConfigSource;
  outputPath: string;
  probe: ProbeResult;
  profile: ReadabilityProfile;
  resolvedConfig: Record<string, unknown>;
  timelinePath: string;
  workDirectory: string;
};

type ReadabilityConfigSource = Pick<
  TuireelConfig,
  "output" | "format" | "deliveryProfile" | "steps"
>;

function parseFrameRate(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const [numeratorText, denominatorText] = value.split("/");
  const numerator = Number(numeratorText);
  const denominator = Number(denominatorText);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

function getReadableProfile(): ReadabilityProfile {
  const profile = BUILT_IN_DELIVERY_PROFILES["readable-1080p"];

  expect(profile.fps).toBeTypeOf("number");
  expect(profile.fontSize).toBeTypeOf("number");
  expect(profile.lineHeight).toBeTypeOf("number");
  expect(profile.cols).toBeTypeOf("number");
  expect(profile.rows).toBeTypeOf("number");
  expect(profile.outputSize).toBeDefined();
  expect(profile.outputSize?.padding).toBeTypeOf("number");

  return profile as ReadabilityProfile;
}

function buildDenseFrameCommand(profile: ReadabilityProfile): string {
  return [
    "python3 -u -c",
    JSON.stringify(
      [
        "import sys,time",
        `row=chr(0x2588)*${profile.cols}`,
        `sys.stdout.write('\\n'.join([row for _ in range(${profile.rows})]))`,
        "sys.stdout.flush()",
        "time.sleep(0.6)",
      ].join(";"),
    ),
  ].join(" ");
}

function computeExpectedBounds(profile: ReadabilityProfile): FrameBounds {
  const charWidth = profile.fontSize * 0.6;
  const rawWidth = profile.cols * charWidth;
  const rawHeight = profile.rows * profile.fontSize * profile.lineHeight;
  const innerWidth = profile.outputSize.width - profile.outputSize.padding * 2;
  const innerHeight = profile.outputSize.height - profile.outputSize.padding * 2;
  const scale = Math.min(innerWidth / rawWidth, innerHeight / rawHeight);
  const width = rawWidth * scale;
  const height = rawHeight * scale;
  const left = (profile.outputSize.width - width) / 2;
  const top = (profile.outputSize.height - height) / 2;

  return {
    left,
    right: profile.outputSize.width - left,
    top,
    bottom: profile.outputSize.height - top,
    width,
    height,
  };
}

function computeFrameMetrics(profile: ReadabilityProfile, bounds: FrameBounds): FrameMetrics {
  const innerWidth = profile.outputSize.width - profile.outputSize.padding * 2;
  const innerHeight = profile.outputSize.height - profile.outputSize.padding * 2;
  const widthBasedFontSize = bounds.width / profile.cols / 0.6;
  const heightBasedFontSize = bounds.height / profile.rows / profile.lineHeight;
  const horizontalFill = bounds.width / innerWidth;
  const verticalFill = bounds.height / innerHeight;
  const largerFill = Math.max(horizontalFill, verticalFill);
  const smallerFill = Math.min(horizontalFill, verticalFill);

  return {
    effectiveFontSize: Math.min(widthBasedFontSize, heightBasedFontSize),
    coverage:
      (bounds.width * bounds.height) / (profile.outputSize.width * profile.outputSize.height),
    marginRatio: largerFill / smallerFill,
    leftMargin: bounds.left,
    rightMargin: profile.outputSize.width - bounds.right,
    topMargin: bounds.top,
    bottomMargin: profile.outputSize.height - bounds.bottom,
  };
}

async function runFfmpeg(ffmpegPath: string, args: string[]): Promise<void> {
  await execFileAsync(ffmpegPath, args, { maxBuffer: 10 * 1024 * 1024 });
}

function maxChannelDelta(
  actual: [number, number, number],
  background: [number, number, number],
): number {
  return Math.max(
    Math.abs(actual[0] - background[0]),
    Math.abs(actual[1] - background[1]),
    Math.abs(actual[2] - background[2]),
  );
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
  const offset = (y * info.width + x) * info.channels;

  return [data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0];
}

async function analyzeFrameContent(framePath: string): Promise<FrameAnalysis> {
  const { data, info } = await sharp(framePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const background: [number, number, number] = [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const pixel: [number, number, number] = [
        data[offset] ?? 0,
        data[offset + 1] ?? 0,
        data[offset + 2] ?? 0,
      ];

      if (maxChannelDelta(pixel, background) < CONTENT_DELTA_THRESHOLD) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0 || maxY < 0) {
    throw new Error(`No readable content bounds detected in ${framePath}`);
  }

  return {
    framePath,
    background,
    bounds: {
      left: minX,
      right: maxX + 1,
      top: minY,
      bottom: maxY + 1,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    },
  };
}

async function extractSettledFrame(
  ffmpegPath: string,
  outputPath: string,
  durationSeconds: number,
  workDirectory: string,
): Promise<string> {
  const sampleTimeSeconds = Math.max(0.2, durationSeconds * 0.75);
  const framePath = join(workDirectory, "readability-export-frame.png");

  await runFfmpeg(ffmpegPath, [
    "-y",
    "-ss",
    sampleTimeSeconds.toFixed(3),
    "-i",
    outputPath,
    "-frames:v",
    "1",
    framePath,
  ]);

  return framePath;
}

function buildEvidenceMessage(fixture: ReadabilityFixture, error: unknown): Error {
  const frameMetrics = computeFrameMetrics(fixture.profile, fixture.analysis.bounds);
  const message = [
    `Readable-1080p artifact assertion failed. Retained workdir: ${fixture.workDirectory}`,
    `Output artifact: ${fixture.outputPath}`,
    `Decoded frame: ${fixture.analysis.framePath}`,
    `Bounds: ${JSON.stringify(fixture.analysis.bounds)}`,
    `Metrics: ${JSON.stringify(frameMetrics)}`,
    `Timeline: ${fixture.timelinePath}`,
  ].join("\n");

  console.error(message);

  const wrappedError = new Error(message) as Error & { cause?: unknown };
  wrappedError.cause = error;
  return wrappedError;
}

async function createFixture(): Promise<ReadabilityFixture> {
  const profile = getReadableProfile();
  const workDirectory = await mkdtemp(join(tmpdir(), "tuireel-acceptance-readability-"));
  const configPath = join(workDirectory, "readability.tuireel.jsonc");
  const outputName = "readability-acceptance.mp4";
  const ffmpegPath = await ensureFfmpeg();
  const previousCwd = process.cwd();
  const configSource: ReadabilityConfigSource = {
    output: outputName,
    format: "mp4",
    deliveryProfile: "readable-1080p",
    steps: [
      {
        type: "launch",
        command: buildDenseFrameCommand(profile),
      },
      { type: "pause", duration: 800 },
    ],
  };

  await writeFile(configPath, `${JSON.stringify(configSource, null, 2)}\n`, "utf8");

  const [resolvedConfig] = await loadConfig(configPath);

  try {
    process.chdir(workDirectory);
    await record(resolvedConfig);
  } finally {
    process.chdir(previousCwd);
  }

  const outputPath = join(workDirectory, outputName);
  const probe = await probeVideo(ffmpegPath, outputPath);
  const durationSeconds = Number.parseFloat(probe.format.duration ?? "0");
  const framePath = await extractSettledFrame(
    ffmpegPath,
    outputPath,
    durationSeconds,
    workDirectory,
  );
  const analysis = await analyzeFrameContent(framePath);

  return {
    analysis,
    configSource,
    outputPath,
    probe,
    profile,
    resolvedConfig,
    timelinePath: join(
      workDirectory,
      ".tuireel",
      "timelines",
      "readability-acceptance.timeline.json",
    ),
    workDirectory,
  };
}

describe.sequential("acceptance: readability", () => {
  let fixture: ReadabilityFixture;
  let shouldRetainWorkDirectory = false;

  beforeAll(async () => {
    fixture = await createFixture();
  }, 60_000);

  afterAll(async () => {
    if (fixture && !shouldRetainWorkDirectory) {
      await rm(fixture.workDirectory, { recursive: true, force: true });
    }
  });

  it("records the real readable-1080p profile without readability overrides", () => {
    const videoStream = fixture.probe.streams.find((stream) => stream.codec_type === "video");
    const fps = parseFrameRate(videoStream?.r_frame_rate ?? videoStream?.avg_frame_rate);

    expect("fps" in fixture.configSource).toBe(false);
    expect("cols" in fixture.configSource).toBe(false);
    expect("rows" in fixture.configSource).toBe(false);
    expect(fixture.resolvedConfig.fps).toBe(fixture.profile.fps);
    expect(fixture.resolvedConfig.cols).toBe(fixture.profile.cols);
    expect(fixture.resolvedConfig.rows).toBe(fixture.profile.rows);
    expect(fixture.resolvedConfig.fontSize).toBe(fixture.profile.fontSize);
    expect(fixture.resolvedConfig.lineHeight).toBe(fixture.profile.lineHeight);
    expect(videoStream?.width).toBe(fixture.profile.outputSize.width);
    expect(videoStream?.height).toBe(fixture.profile.outputSize.height);
    expect(fps).toBeCloseTo(fixture.profile.fps, 2);
  }, 30_000);

  it("proves readable font scale on a decoded final-output frame", () => {
    try {
      const metrics = computeFrameMetrics(fixture.profile, fixture.analysis.bounds);

      expect(metrics.effectiveFontSize).toBeGreaterThanOrEqual(18);
      expect(metrics.effectiveFontSize).toBeLessThanOrEqual(24);
      expect(metrics.coverage).toBeGreaterThanOrEqual(0.4);
      expect(metrics.coverage).toBeLessThanOrEqual(0.75);
      expect(metrics.marginRatio).toBeLessThanOrEqual(2);
    } catch (error) {
      shouldRetainWorkDirectory = true;
      throw buildEvidenceMessage(fixture, error);
    }
  }, 30_000);

  it("proves centered inset framing and balanced margins on the exported artifact", async () => {
    try {
      const expectedBounds = computeExpectedBounds(fixture.profile);
      const bounds = fixture.analysis.bounds;
      const topLeftPixel = await readPixel(fixture.analysis.framePath, 10, 10);
      const contentCenterPixel = await readPixel(
        fixture.analysis.framePath,
        Math.floor((bounds.left + bounds.right) / 2),
        Math.floor((bounds.top + bounds.bottom) / 2),
      );

      expect(maxChannelDelta(topLeftPixel, fixture.analysis.background)).toBeLessThanOrEqual(6);
      expect(maxChannelDelta(contentCenterPixel, fixture.analysis.background)).toBeGreaterThan(
        CONTENT_DELTA_THRESHOLD,
      );
      expect(bounds.width).toBeGreaterThanOrEqual(expectedBounds.width - MARGIN_TOLERANCE);
      expect(bounds.width).toBeLessThanOrEqual(expectedBounds.width + MARGIN_TOLERANCE);
      expect(bounds.height).toBeGreaterThanOrEqual(expectedBounds.height - MARGIN_TOLERANCE);
      expect(bounds.height).toBeLessThanOrEqual(expectedBounds.height + MARGIN_TOLERANCE);
      expect(bounds.left).toBeGreaterThanOrEqual(expectedBounds.left - MARGIN_TOLERANCE);
      expect(bounds.left).toBeLessThanOrEqual(expectedBounds.left + MARGIN_TOLERANCE);
      expect(bounds.top).toBeGreaterThanOrEqual(expectedBounds.top - MARGIN_TOLERANCE);
      expect(bounds.top).toBeLessThanOrEqual(expectedBounds.top + MARGIN_TOLERANCE);
      expect(
        Math.abs(bounds.left - (fixture.profile.outputSize.width - bounds.right)),
      ).toBeLessThanOrEqual(BALANCE_TOLERANCE);
      expect(
        Math.abs(bounds.top - (fixture.profile.outputSize.height - bounds.bottom)),
      ).toBeLessThanOrEqual(BALANCE_TOLERANCE);

      const timeline = InteractionTimeline.fromFile(fixture.timelinePath).toJSON();
      expect(timeline.frameCount).toBeGreaterThan(0);
    } catch (error) {
      shouldRetainWorkDirectory = true;
      throw buildEvidenceMessage(fixture, error);
    }
  }, 30_000);
});
