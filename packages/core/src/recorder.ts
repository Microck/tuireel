import type { TuireelConfig, TuireelStep } from "./config/schema.js";
import { executeSteps } from "./executor/step-executor.js";
import { ensureFfmpeg } from "./ffmpeg/downloader.js";
import { FrameCapturer } from "./capture/frame-capturer.js";
import { FfmpegEncoder } from "./encoding/encoder.js";

const DEFAULT_FPS = 30;

type LaunchStep = Extract<TuireelStep, { type: "launch" }>;

function isLaunchStep(step: TuireelStep): step is LaunchStep {
  return step.type === "launch";
}

function getLaunchCommand(config: TuireelConfig): string {
  const launchStep = config.steps.find(isLaunchStep);
  if (!launchStep) {
    throw new Error("Config must include at least one launch step");
  }

  return launchStep.command;
}

export async function record(config: TuireelConfig): Promise<void> {
  const { createSession } = await import("./session.js");

  const ffmpegPath = await ensureFfmpeg();
  const fps = config.fps ?? DEFAULT_FPS;
  const launchCommand = getLaunchCommand(config);

  const session = await createSession({
    command: launchCommand,
    cols: config.cols,
    rows: config.rows,
  });

  const encoder = new FfmpegEncoder({
    ffmpegPath,
    fps,
    outputPath: config.output,
  });

  const capturer = new FrameCapturer({
    session,
    encoder,
    fps,
  });

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  let interruptedSignal: NodeJS.Signals | null = null;
  let resolveInterrupted: (() => void) | null = null;

  const interrupted = new Promise<void>((resolve) => {
    resolveInterrupted = resolve;
  });

  let cleanupStarted = false;

  const cleanup = async (): Promise<void> => {
    if (cleanupStarted) {
      return;
    }

    cleanupStarted = true;

    session.close();

    await encoder.abort().catch(() => {
      // Best-effort shutdown
    });
    await capturer.stop().catch(() => {
      // Best-effort shutdown
    });
  };

  const handleSignal = (signal: NodeJS.Signals): void => {
    if (interruptedSignal) {
      return;
    }

    interruptedSignal = signal;
    resolveInterrupted?.();
  };

  const runSteps = (async () => {
    capturer.start();
    await executeSteps(session, config.steps);
    await session.waitIdle();
  })();

  runSteps.catch(() => {
    // Prevent unhandled rejections if interrupted mid-step
  });

  for (const signal of signals) {
    process.once(signal, handleSignal);
  }

  try {
    const outcome = await Promise.race([
      runSteps.then(() => "steps" as const),
      interrupted.then(() => "signal" as const),
    ]);

    if (outcome === "signal") {
      throw new Error(`Recording interrupted by ${interruptedSignal ?? "signal"}`);
    }

    await capturer.stop();
    await encoder.finalize();
  } catch (error) {
    await cleanup();

    if (interruptedSignal) {
      throw new Error(`Recording interrupted by ${interruptedSignal}`);
    }

    throw error;
  } finally {
    for (const signal of signals) {
      process.off(signal, handleSignal);
    }

    if (!cleanupStarted) {
      session.close();
    }
  }
}
