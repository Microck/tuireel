import { mkdir } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

import sharp from "sharp";

import type { TuireelConfig, TuireelStep } from "./config/schema.js";
import { compose } from "./compositor.js";
import { executeSteps } from "./executor/step-executor.js";
import { ensureFfmpeg } from "./ffmpeg/downloader.js";
import { createLogger, type Logger } from "./logger.js";
import { FrameCapturer } from "./capture/frame-capturer.js";
import { FfmpegEncoder } from "./encoding/encoder.js";
import { computeCursorPath } from "./overlay/bezier.js";
import { resolveTheme } from "./themes/resolve.js";
import { InteractionTimeline } from "./timeline/interaction-timeline.js";

const DEFAULT_FPS = 30;
const RECORDING_ROOT_DIR = ".tuireel";
const RAW_RECORDING_DIR = "raw";
const TIMELINE_RECORDING_DIR = "timelines";
const DEFAULT_FRAME_WIDTH = 1280;
const DEFAULT_FRAME_HEIGHT = 720;
const CURSOR_MARGIN = 24;

const CURSOR_ANCHORS = [
  { x: 0.18, y: 0.2 },
  { x: 0.5, y: 0.18 },
  { x: 0.82, y: 0.24 },
  { x: 0.22, y: 0.56 },
  { x: 0.5, y: 0.52 },
  { x: 0.8, y: 0.62 },
  { x: 0.5, y: 0.82 },
] as const;

type StepType = TuireelStep["type"];
const STEP_TYPE_CURSOR_OFFSET: Record<StepType, number> = {
  launch: 0,
  type: 1,
  press: 2,
  wait: 3,
  pause: 4,
  scroll: 5,
  click: 6,
  screenshot: 7,
  resize: 8,
  "set-env": 9,
};

type LaunchStep = Extract<TuireelStep, { type: "launch" }>;

function isLaunchStep(step: TuireelStep): step is LaunchStep {
  return step.type === "launch";
}

function getLaunchCommand(config: TuireelConfig): string {
  const launchStep = config.steps.find(isLaunchStep);
  if (!launchStep) {
    throw new Error("Config must include at least one 'launch' step. Try: add a step like { \"type\": \"launch\", \"command\": \"bash\" } to your config.");
  }

  return launchStep.command;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function recordingNameFromOutput(outputPath: string): string {
  const baseName = basename(outputPath, extname(outputPath));
  const normalized = baseName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "recording";
}

function resolveRecordingArtifacts(recordingName: string): {
  rawDirectory: string;
  timelineDirectory: string;
  rawVideoPath: string;
  timelinePath: string;
} {
  const root = resolve(process.cwd(), RECORDING_ROOT_DIR);
  const rawDirectory = join(root, RAW_RECORDING_DIR);
  const timelineDirectory = join(root, TIMELINE_RECORDING_DIR);

  return {
    rawDirectory,
    timelineDirectory,
    rawVideoPath: join(rawDirectory, `${recordingName}.mp4`),
    timelinePath: join(timelineDirectory, `${recordingName}.timeline.json`),
  };
}

function formatKeyLabel(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "";
  }

  if (trimmed.length === 1) {
    return trimmed.toUpperCase();
  }

  return `${trimmed[0]?.toUpperCase() ?? ""}${trimmed.slice(1)}`;
}

function hudLabelsForStep(step: TuireelStep): string[] {
  if (step.type === "type") {
    const compact = step.text.replace(/\s+/g, " ").trim();
    if (compact.length === 0) {
      return ["Space"];
    }

    if (compact.length <= 12) {
      return [compact];
    }

    return [`${compact.slice(0, 12)}...`];
  }

  if (step.type === "press") {
    return step.key
      .split("+")
      .map(formatKeyLabel)
      .filter((label) => label.length > 0)
      .slice(0, 4);
  }

  return [];
}

function resolveCursorTarget(
  step: TuireelStep,
  index: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const cursorOffset = STEP_TYPE_CURSOR_OFFSET[step.type] ?? 0;
  const anchorIndex = (index + cursorOffset) % CURSOR_ANCHORS.length;
  const anchor = CURSOR_ANCHORS[anchorIndex] ?? CURSOR_ANCHORS[0];

  const marginX = Math.min(CURSOR_MARGIN, Math.floor(width / 2));
  const marginY = Math.min(CURSOR_MARGIN, Math.floor(height / 2));

  const x = clamp(
    Math.round(width * anchor.x),
    marginX,
    Math.max(marginX, width - marginX),
  );
  const y = clamp(
    Math.round(height * anchor.y),
    marginY,
    Math.max(marginY, height - marginY),
  );

  return { x, y };
}

async function resolveFrameDimensions(
  initialFrame: Buffer,
  fallbackCols: number,
  fallbackRows: number,
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(initialFrame).metadata();

  const fallbackWidth = Math.max(DEFAULT_FRAME_WIDTH, Math.round(fallbackCols * 10));
  const fallbackHeight = Math.max(DEFAULT_FRAME_HEIGHT, Math.round(fallbackRows * 21));

  return {
    width: metadata.width ?? fallbackWidth,
    height: metadata.height ?? fallbackHeight,
  };
}

export interface RecordOptions {
  logger?: Logger;
}

export async function record(config: TuireelConfig, options: RecordOptions = {}): Promise<void> {
  const { createSession } = await import("./session.js");
  const log = options.logger ?? createLogger();

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  let interruptedSignal: NodeJS.Signals | null = null;
  let resolveInterrupted: (() => void) | null = null;

  const interrupted = new Promise<void>((resolve) => {
    resolveInterrupted = resolve;
  });

  let session: Awaited<ReturnType<typeof createSession>> | null = null;
  let encoder: FfmpegEncoder | null = null;
  let capturer: FrameCapturer | null = null;

  let cleanupStarted = false;

  const cleanup = async (): Promise<void> => {
    if (cleanupStarted) {
      return;
    }

    cleanupStarted = true;

    session?.close();

    await encoder?.abort().catch(() => {
      // Best-effort shutdown
    });
    await capturer?.stop().catch(() => {
      // Best-effort shutdown
    });
  };

  const throwIfInterrupted = (): void => {
    if (interruptedSignal) {
      throw new Error(`Recording interrupted by ${interruptedSignal}. Try: re-run the command to start recording again.`);
    }
  };

  const handleSignal = (signal: NodeJS.Signals): void => {
    if (interruptedSignal) {
      return;
    }

    interruptedSignal = signal;
    session?.close();
    encoder?.terminate("SIGKILL");
    resolveInterrupted?.();
  };

  for (const signal of signals) {
    process.once(signal, handleSignal);
  }

  try {
    const ffmpegStart = Date.now();
    const ffmpegPath = await ensureFfmpeg();
    log.timing("ffmpeg resolve", Date.now() - ffmpegStart);
    throwIfInterrupted();

    const fps = config.fps ?? DEFAULT_FPS;
    const launchCommand = getLaunchCommand(config);
    const resolvedTheme = config.theme ? resolveTheme(config.theme) : undefined;

    const recordingName = recordingNameFromOutput(config.output);
    const artifacts = resolveRecordingArtifacts(recordingName);

    await mkdir(artifacts.rawDirectory, { recursive: true });
    await mkdir(artifacts.timelineDirectory, { recursive: true });

    log.setTotalSteps(config.steps.length);
    log.verbose(`Recording "${recordingName}" at ${fps}fps`);

    const sessionStart = Date.now();
    session = await createSession({
      command: launchCommand,
      cols: config.cols,
      rows: config.rows,
      theme: resolvedTheme,
    });
    log.timing("session create", Date.now() - sessionStart);
    throwIfInterrupted();

    const firstFrame = await session.screenshot();
    const frameDimensions = await resolveFrameDimensions(firstFrame, config.cols, config.rows);

    const timeline = new InteractionTimeline(frameDimensions.width, frameDimensions.height, {
      fps,
      initialCursor: {
        x: Math.round(frameDimensions.width / 2),
        y: Math.round(frameDimensions.height / 2),
        visible: true,
      },
    });

    let currentCursor = {
      x: Math.round(frameDimensions.width / 2),
      y: Math.round(frameDimensions.height / 2),
    };

    encoder = new FfmpegEncoder({
      ffmpegPath,
      fps,
      format: "mp4",
      outputPath: artifacts.rawVideoPath,
    });
    log.debug(`ffmpeg encoder: ${ffmpegPath} -> ${artifacts.rawVideoPath}`);
    throwIfInterrupted();

    let frameCount = 0;

    capturer = new FrameCapturer({
      session,
      encoder,
      fps,
      onFrame: () => {
        frameCount++;
        timeline.tick();
      },
    });

    const stepTimings: number[] = [];

    const runSteps = (async () => {
      capturer.start();
      await executeSteps(session, config.steps, {
        defaultWaitTimeout: config.defaultWaitTimeout,
        onStepStart: (step, index) => {
          stepTimings[index] = Date.now();
          log.step(step.type, step.type === "launch" ? `"${launchCommand}"` : undefined);

          if (step.type !== "launch") {
            const target = resolveCursorTarget(step, index, frameDimensions.width, frameDimensions.height);
            timeline.setCursorPath(
              computeCursorPath(currentCursor.x, currentCursor.y, target.x, target.y, fps),
            );
            currentCursor = target;
          }

          const hudVisible = config.hud?.visible ?? true;
          const labels = hudLabelsForStep(step);
          if (labels.length > 0) {
            if (hudVisible) {
              timeline.showHud(labels);
            }
            timeline.addEvent("key");
          } else if (hudVisible) {
            timeline.hideHud();
          }
        },
        onStepComplete: (step, index) => {
          const startTime = stepTimings[index];
          if (startTime !== undefined) {
            log.timing(`step ${index + 1}`, Date.now() - startTime);
          }

          if (step.type === "type" || step.type === "press") {
            timeline.hideHud();
          }
        },
      });
      await session.waitIdle();
    })();

    runSteps.catch(() => {
      // Prevent unhandled rejections if interrupted mid-step
    });

    const outcome = await Promise.race([
      runSteps.then(() => "steps" as const),
      interrupted.then(() => "signal" as const),
    ]);

    if (outcome === "signal") {
      throwIfInterrupted();
      throw new Error("Recording interrupted by signal. Try: re-run the command to start recording again.");
    }

    await capturer.stop();
    log.stat("Captured frames", frameCount);

    log.verbose("Encoding raw video...");
    const encodeStart = Date.now();
    await encoder.finalize();
    log.timing("raw encode", Date.now() - encodeStart);

    timeline.save(artifacts.timelinePath);

    log.verbose(`Compositing to ${config.output}...`);
    const composeStart = Date.now();
    await compose(artifacts.rawVideoPath, timeline.toJSON(), config.output, {
      format: config.format,
      sound: config.sound,
      cursorConfig: config.cursor ? { visible: config.cursor.visible ?? true } : undefined,
      logger: options.logger,
    });
    log.timing("compositing", Date.now() - composeStart);
    log.verbose(`Recording complete: ${config.output}`);
  } catch (error) {
    await cleanup();

    if (interruptedSignal) {
      throw new Error(`Recording interrupted by ${interruptedSignal}. Try: re-run the command to start recording again.`);
    }

    throw error;
  } finally {
    for (const signal of signals) {
      process.off(signal, handleSignal);
    }

    if (!cleanupStarted) {
      session?.close();
    }
  }
}
