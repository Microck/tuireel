import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { promisify } from "node:util";

import sharp from "sharp";

import { OUTPUT_FORMATS, type OutputFormat } from "./config/schema.js";
import { ENCODER_PROFILES } from "./encoding/encoder-profiles.js";
import { encodeGifTwoPass } from "./encoding/gif-encoder.js";
import { ensureFfmpeg } from "./ffmpeg/downloader.js";
import { createLogger, type Logger } from "./logger.js";
import { renderCursor } from "./overlay/cursor-renderer.js";
import { renderHud } from "./overlay/hud-renderer.js";
import type { CursorConfig, CursorImage, HudConfig, OverlayImage } from "./overlay/types.js";
import {
  extractSoundEvents,
  finalizeMp4WithSound,
  finalizeWebmWithSound,
  type SoundConfig,
} from "./sound.js";
import { InteractionTimeline } from "./timeline/interaction-timeline.js";
import type { FrameData, TimelineData } from "./timeline/types.js";

const execFileAsync = promisify(execFile);

const DEFAULT_FPS = 30;
const DEFAULT_FORMAT: OutputFormat = "mp4";
const FRAME_FILENAME_PATTERN = "%06d.jpg";
const JPEG_QUALITY = 90;

export interface ComposeOptions {
  format?: OutputFormat;
  cursorConfig?: CursorConfig;
  hudConfig?: HudConfig;
  sound?: SoundConfig;
  logger?: Logger;
}

interface EncodeFramesOptions {
  ffmpegPath: string;
  framesDirectory: string;
  outputPath: string;
  fps: number;
  format: OutputFormat;
  tempDirectory: string;
  logger?: Logger;
}

function getErrorStderr(error: unknown): string {
  if (typeof error !== "object" || error === null || !("stderr" in error)) {
    return "";
  }

  const stderr = (error as { stderr?: string | Buffer }).stderr;
  if (stderr === undefined) {
    return "";
  }

  const asString = typeof stderr === "string" ? stderr : stderr.toString("utf8");
  const trimmed = asString.trim();
  return trimmed.length === 0 ? "" : `\nffmpeg stderr:\n${trimmed}`;
}

async function runFfmpeg(
  ffmpegPath: string,
  args: string[],
  operationDescription: string,
  log?: Logger,
): Promise<void> {
  const command = [ffmpegPath, ...args].join(" ");
  log?.debug(`ffmpeg: ${command}`);

  try {
    const result = await execFileAsync(ffmpegPath, args, {
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.stderr && result.stderr.trim().length > 0) {
      log?.debug(`ffmpeg stderr:\n${result.stderr.trim()}`);
    }
  } catch (error) {
    const exitCode = (error as { code?: number }).code ?? "unknown";
    const stderr = getErrorStderr(error);

    if (stderr.length > 0) {
      log?.debug(stderr);
    }

    throw new Error(
      `ffmpeg failed to ${operationDescription} (exit code: ${exitCode}). Try: run with '--debug' to see full ffmpeg output, or verify ffmpeg is installed correctly.\nCommand: ${command}${stderr}`,
      { cause: error },
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolveFormat(outputPath: string, override?: OutputFormat): OutputFormat {
  if (override) {
    return override;
  }

  const extension = extname(outputPath).toLowerCase().slice(1);
  if (OUTPUT_FORMATS.includes(extension as OutputFormat)) {
    return extension as OutputFormat;
  }

  return DEFAULT_FORMAT;
}

function resolveFps(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_FPS;
}

function resolveFrameState(frames: FrameData[], frameIndex: number): FrameData | null {
  if (frames.length === 0) {
    return null;
  }

  const direct = frames[frameIndex];
  if (direct) {
    return direct;
  }

  return frames[frames.length - 1] ?? null;
}

function hudStateKey(frame: FrameData): string | null {
  if (!frame.hud || frame.hud.labels.length === 0) {
    return null;
  }

  return `${frame.hud.labels.join("\u0001")}::${frame.hud.opacity.toFixed(4)}`;
}

async function decodeRawFrames(
  ffmpegPath: string,
  rawVideoPath: string,
  outputDirectory: string,
  log?: Logger,
): Promise<void> {
  await runFfmpeg(
    ffmpegPath,
    ["-y", "-i", rawVideoPath, "-vsync", "0", join(outputDirectory, FRAME_FILENAME_PATTERN)],
    "decode raw video into frame images",
    log,
  );
}

async function loadFrameFileNames(framesDirectory: string): Promise<string[]> {
  const names = await readdir(framesDirectory);
  const frameFiles = names
    .filter((name) => name.toLowerCase().endsWith(".jpg"))
    .sort((left, right) => left.localeCompare(right));

  if (frameFiles.length === 0) {
    throw new Error("Compositor decoded zero frame images. Try: verify the raw recording exists and is not empty; re-record with 'tuireel record'.");
  }

  return frameFiles;
}

async function encodeFrames(options: EncodeFramesOptions): Promise<void> {
  await mkdir(dirname(options.outputPath), { recursive: true });

  const framePatternPath = join(options.framesDirectory, FRAME_FILENAME_PATTERN);
  const selectedProfile = ENCODER_PROFILES[options.format];

  if (selectedProfile.twoPass) {
    const streamProfile = ENCODER_PROFILES.mp4;
    const streamFps = streamProfile.outputFps ?? options.fps;
    const streamOutputPath = join(options.tempDirectory, "compositor-stream.mp4");

    await runFfmpeg(
      options.ffmpegPath,
      [
        "-y",
        "-framerate",
        String(options.fps),
        "-i",
        framePatternPath,
        ...streamProfile.args,
        "-r",
        String(streamFps),
        streamOutputPath,
      ],
      "encode intermediate composited stream",
      options.logger,
    );

    try {
      await encodeGifTwoPass({
        ffmpegPath: options.ffmpegPath,
        inputPath: streamOutputPath,
        outputPath: options.outputPath,
        fps: selectedProfile.outputFps ?? options.fps,
        scaleWidth: selectedProfile.scaleWidth,
      });
    } finally {
      await rm(streamOutputPath, { force: true }).catch(() => {
        // Best-effort temp file cleanup
      });
    }

    return;
  }

  const outputFps = selectedProfile.outputFps ?? options.fps;
  await runFfmpeg(
    options.ffmpegPath,
    [
      "-y",
      "-framerate",
      String(options.fps),
      "-i",
      framePatternPath,
      ...selectedProfile.args,
      "-r",
      String(outputFps),
      options.outputPath,
    ],
    "encode composited output",
    options.logger,
  );
}

export async function compose(
  rawVideoPath: string,
  timelineData: TimelineData,
  outputPath: string,
  options: ComposeOptions = {},
): Promise<void> {
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  let interrupted = false;

  const handleSignal = (): void => {
    interrupted = true;
  };

  for (const signal of signals) {
    process.once(signal, handleSignal);
  }

  const throwIfInterrupted = (): void => {
    if (interrupted) {
      throw new Error("Compositing interrupted by signal. Try: re-run the command to start compositing again.");
    }
  };

  const ffmpegPath = await ensureFfmpeg();
  const log = options.logger ?? createLogger();
  const format = resolveFormat(outputPath, options.format);
  const fps = resolveFps(timelineData.fps);

  const frameWidth = Math.max(1, Math.round(timelineData.width));
  const frameHeight = Math.max(1, Math.round(timelineData.height));

  const expandedFrames = InteractionTimeline.load(timelineData).getFrames();

  const tempDirectory = await mkdtemp(join(tmpdir(), "tuireel-compositor-"));
  const decodedFramesDirectory = join(tempDirectory, "decoded");
  const compositedFramesDirectory = join(tempDirectory, "composited");
  const encodedVideoPath =
    format === "gif" ? outputPath : join(tempDirectory, `composited-silent.${format}`);

  await mkdir(decodedFramesDirectory, { recursive: true });
  await mkdir(compositedFramesDirectory, { recursive: true });

  try {
    log.verbose("Decoding raw frames...");
    const decodeStart = Date.now();
    await decodeRawFrames(ffmpegPath, rawVideoPath, decodedFramesDirectory, log);
    const frameFiles = await loadFrameFileNames(decodedFramesDirectory);
    log.timing("frame decode", Date.now() - decodeStart);
    log.stat("Decoded frames", frameFiles.length);

    throwIfInterrupted();

    const cursorEnabled = options.cursorConfig?.visible ?? true;
    let cursorCache: CursorImage | null = null;
    let hudCache: OverlayImage | null = null;
    let lastHudKey: string | null = null;

    log.verbose("Compositing overlays...");
    const compositeStart = Date.now();

    for (const [frameIndex, frameFile] of frameFiles.entries()) {
      if (frameIndex % 100 === 0) {
        throwIfInterrupted();
        if (frameIndex > 0) {
          log.verbose(`Compositing frames: ${frameIndex}/${frameFiles.length}`);
        }
      }

      const frameStart = Date.now();

      const frameState = resolveFrameState(expandedFrames, frameIndex);
      const overlays: sharp.OverlayOptions[] = [];

      if (frameState && cursorEnabled && frameState.cursor.visible) {
        if (!cursorCache) {
          cursorCache = await renderCursor(options.cursorConfig);
        }

        const left = clamp(
          Math.round(frameState.cursor.x - cursorCache.width / 2),
          0,
          Math.max(0, frameWidth - cursorCache.width),
        );
        const top = clamp(
          Math.round(frameState.cursor.y - cursorCache.height / 2),
          0,
          Math.max(0, frameHeight - cursorCache.height),
        );

        overlays.push({
          input: cursorCache.buffer,
          left,
          top,
        });
      }

      if (frameState?.hud && frameState.hud.labels.length > 0) {
        const currentHudKey = hudStateKey(frameState);

        if (!hudCache || currentHudKey !== lastHudKey) {
          hudCache = await renderHud({
            labels: frameState.hud.labels,
            opacity: frameState.hud.opacity,
            frameWidth,
            frameHeight,
            config: options.hudConfig,
          });
          lastHudKey = currentHudKey;
        }

        overlays.push({
          input: hudCache.buffer,
          left: hudCache.x,
          top: hudCache.y,
        });
      }

      const sourceFramePath = join(decodedFramesDirectory, frameFile);
      const outputFramePath = join(compositedFramesDirectory, frameFile);

      // Optimization: skip Sharp composite when no overlays are needed.
      // A plain file copy avoids decode+composite+encode overhead (~60% faster on pause-heavy recordings).
      if (overlays.length === 0) {
        await copyFile(sourceFramePath, outputFramePath);
      } else {
        await sharp(sourceFramePath)
          .composite(overlays)
          .jpeg({ quality: JPEG_QUALITY })
          .toFile(outputFramePath);
      }

      if (frameIndex < 5) {
        log.timing(`frame ${frameIndex} composite`, Date.now() - frameStart);
      }
    }

    log.timing("overlay compositing", Date.now() - compositeStart);

    throwIfInterrupted();

    log.verbose(`Encoding ${format} output...`);
    const encodeStart = Date.now();
    await encodeFrames({
      ffmpegPath,
      framesDirectory: compositedFramesDirectory,
      outputPath: encodedVideoPath,
      fps,
      format,
      tempDirectory,
      logger: log,
    });
    log.timing("final encode", Date.now() - encodeStart);
    log.stat("Output format", format);

    if (format === "gif") {
      return;
    }

    const soundEvents = extractSoundEvents(timelineData);
    const durationSec = frameFiles.length / fps;

    if (format === "webm") {
      finalizeWebmWithSound(
        ffmpegPath,
        encodedVideoPath,
        outputPath,
        soundEvents,
        durationSec,
        options.sound,
      );
      return;
    }

    finalizeMp4WithSound(
      ffmpegPath,
      encodedVideoPath,
      outputPath,
      soundEvents,
      durationSec,
      options.sound,
    );
  } finally {
    for (const signal of signals) {
      process.off(signal, handleSignal);
    }

    if (interrupted) {
      await rm(outputPath, { force: true }).catch(() => {
        // Best-effort partial output cleanup
      });
    }

    await rm(tempDirectory, { recursive: true, force: true });
  }
}
