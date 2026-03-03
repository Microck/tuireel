import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { OutputFormat } from "../config/schema.js";
import { ENCODER_PROFILES } from "./encoder-profiles.js";
import { encodeGifTwoPass } from "./gif-encoder.js";

export interface FfmpegEncoderOptions {
  ffmpegPath: string;
  fps: number;
  outputPath: string;
  format: OutputFormat;
  crf?: number | string;
}

function applyCrfOverride(args: readonly string[], crf?: number | string): string[] {
  if (crf === undefined) {
    return [...args];
  }

  const crfIndex = args.indexOf("-crf");
  if (crfIndex === -1 || crfIndex + 1 >= args.length) {
    return [...args];
  }

  const updatedArgs = [...args];
  updatedArgs[crfIndex + 1] = String(crf);
  return updatedArgs;
}

function createTemporaryOutputPath(extension: string): string {
  return join(tmpdir(), `tuireel-${randomUUID()}.${extension}`);
}

function formatStderr(stderrChunks: string[]): string {
  const stderr = stderrChunks.join("").trim();
  if (stderr.length === 0) {
    return "";
  }

  return `\nffmpeg stderr:\n${stderr}`;
}

export class FfmpegEncoder {
  private readonly ffmpegPath: string;

  private readonly finalOutputPath: string;

  private readonly intermediateOutputPath: string | null;

  private readonly gifFinalizeOptions: { fps: number; scaleWidth?: number } | null;

  private readonly process: ChildProcessWithoutNullStreams;

  private readonly stderrChunks: string[] = [];

  private readonly exitPromise: Promise<number | null>;

  private drainPromise: Promise<void> | null = null;

  private drainResolve: (() => void) | null = null;

  private processError: Error | null = null;

  private finalized = false;

  constructor(options: FfmpegEncoderOptions) {
    this.ffmpegPath = options.ffmpegPath;
    this.finalOutputPath = options.outputPath;

    const selectedProfile = ENCODER_PROFILES[options.format];
    const streamProfile = selectedProfile.twoPass ? ENCODER_PROFILES.mp4 : selectedProfile;

    this.intermediateOutputPath = selectedProfile.twoPass
      ? createTemporaryOutputPath("mp4")
      : null;
    this.gifFinalizeOptions =
      options.format === "gif" && selectedProfile.twoPass
        ? {
            fps: selectedProfile.outputFps ?? options.fps,
            scaleWidth: selectedProfile.scaleWidth,
          }
        : null;

    const streamOutputPath = this.intermediateOutputPath ?? this.finalOutputPath;

    const outputFps = streamProfile.outputFps ?? options.fps;
    const profileArgs = applyCrfOverride(streamProfile.args, options.crf);

    const args = [
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(options.fps),
      "-c:v",
      "mjpeg",
      "-i",
      "pipe:0",
      ...profileArgs,
      "-r",
      String(outputFps),
      streamOutputPath,
    ];

    this.process = spawn(options.ffmpegPath, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.process.stderr.setEncoding("utf8");
    this.process.stderr.on("data", (chunk: string) => {
      this.stderrChunks.push(chunk);
    });

    this.process.on("error", (error) => {
      this.processError = error;
      this.resolveDrain();
    });

    this.exitPromise = new Promise((resolve) => {
      this.process.on("close", (code) => {
        this.resolveDrain();
        resolve(code);
      });
    });
  }

  private async cleanupIntermediateOutput(): Promise<void> {
    if (!this.intermediateOutputPath) {
      return;
    }

    await rm(this.intermediateOutputPath, { force: true }).catch(() => {
      // Best-effort cleanup
    });
  }

  private async runTwoPassFinalize(): Promise<void> {
    if (!this.gifFinalizeOptions || !this.intermediateOutputPath) {
      return;
    }

    await encodeGifTwoPass({
      ffmpegPath: this.ffmpegPath,
      inputPath: this.intermediateOutputPath,
      outputPath: this.finalOutputPath,
      fps: this.gifFinalizeOptions.fps,
      scaleWidth: this.gifFinalizeOptions.scaleWidth,
    });
  }

  private resolveDrain(): void {
    const resolve = this.drainResolve;
    if (resolve) {
      this.drainResolve = null;
      this.drainPromise = null;
      resolve();
    }
  }

  private assertWritable(): void {
    if (this.processError) {
      throw new Error(
        `ffmpeg encoder process error: ${this.processError.message}. Try: run with '--debug' for full ffmpeg output.${formatStderr(this.stderrChunks)}`,
      );
    }

    if (!this.process.stdin.writable) {
      throw new Error(`ffmpeg encoder stdin is not writable. Try: check available disk space and memory.${formatStderr(this.stderrChunks)}`);
    }
  }

  async writeFrame(jpegBuffer: Buffer): Promise<void> {
    if (this.finalized) {
      throw new Error("Cannot write frame after encoder has been finalized. Try: this is an internal error — please report it at https://github.com/tuireel/tuireel/issues.");
    }

    this.assertWritable();

    const canContinue = this.process.stdin.write(jpegBuffer);
    if (!canContinue) {
      if (!this.drainPromise) {
        this.drainPromise = new Promise<void>((resolve) => {
          this.drainResolve = resolve;
        });
      }

      await this.drainPromise;
      this.assertWritable();
    }
  }

  async finalize(): Promise<void> {
    if (this.finalized) {
      return;
    }

    this.finalized = true;
    this.process.stdin.end();

    const exitCode = await this.exitPromise;

    if (this.processError) {
      throw new Error(
        `ffmpeg encoding failed: ${this.processError.message}. Try: run with '--debug' for full ffmpeg output.${formatStderr(this.stderrChunks)}`,
      );
    }

    if (exitCode !== 0) {
      throw new Error(`ffmpeg encoding exited with code ${exitCode}. Try: check available disk space or run with '--debug' for details.${formatStderr(this.stderrChunks)}`);
    }

    try {
      await this.runTwoPassFinalize();
    } finally {
      await this.cleanupIntermediateOutput();
    }
  }

  terminate(signal: NodeJS.Signals = "SIGTERM"): void {
    this.finalized = true;

    if (this.process.exitCode === null && !this.process.killed) {
      this.process.kill(signal);
    }

    this.resolveDrain();
  }

  async abort(signal: NodeJS.Signals = "SIGTERM"): Promise<void> {
    this.terminate(signal);

    await this.exitPromise;
    await this.cleanupIntermediateOutput();
  }
}
