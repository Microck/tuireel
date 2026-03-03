import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GIF_FPS_MIN = 10;
const GIF_FPS_MAX = 15;
const DEFAULT_GIF_FPS = 15;

export interface GifEncoderOptions {
  ffmpegPath: string;
  inputPath: string;
  outputPath: string;
  fps: number;
  scaleWidth?: number;
}

function buildScaleSegment(scaleWidth?: number): string {
  if (scaleWidth === undefined || !Number.isFinite(scaleWidth)) {
    return "";
  }

  const width = Math.max(2, Math.round(scaleWidth));
  return `,scale=${width}:-1:flags=lanczos`;
}

function resolveGifFps(fps: number): string {
  const desiredFps = Number.isFinite(fps)
    ? Math.min(GIF_FPS_MAX, Math.max(GIF_FPS_MIN, fps))
    : DEFAULT_GIF_FPS;

  const centisecondsPerFrame = Math.ceil(100 / desiredFps);
  return `100/${centisecondsPerFrame}`;
}

function formatStderr(stderrChunks: string[]): string {
  const stderr = stderrChunks.join("").trim();
  if (stderr.length === 0) {
    return "";
  }

  return `\nffmpeg stderr:\n${stderr}`;
}

async function runFfmpeg(ffmpegPath: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stderrChunks: string[] = [];

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderrChunks.push(chunk);
    });

    child.on("error", (error) => {
      reject(new Error(`ffmpeg process error: ${error.message}${formatStderr(stderrChunks)}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}${formatStderr(stderrChunks)}`));
        return;
      }

      resolve();
    });
  });
}

export async function encodeGifTwoPass(options: GifEncoderOptions): Promise<void> {
  const gifFps = resolveGifFps(options.fps);
  const scaleSegment = buildScaleSegment(options.scaleWidth);
  const palettePath = join(tmpdir(), `tuireel-palette-${randomUUID()}.png`);

  const palettegenFilter = `fps=${gifFps}${scaleSegment},palettegen=stats_mode=diff`;
  const paletteuseFilter = `fps=${gifFps}${scaleSegment}[x];[x][1:v]paletteuse=dither=bayer`;

  try {
    await runFfmpeg(options.ffmpegPath, [
      "-y",
      "-i",
      options.inputPath,
      "-vf",
      palettegenFilter,
      palettePath,
    ]);

    await runFfmpeg(options.ffmpegPath, [
      "-y",
      "-i",
      options.inputPath,
      "-i",
      palettePath,
      "-lavfi",
      paletteuseFilter,
      "-loop",
      "0",
      options.outputPath,
    ]);
  } finally {
    await rm(palettePath, { force: true }).catch(() => {
      // Best-effort temp file cleanup
    });
  }
}
