import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export interface FfmpegEncoderOptions {
  ffmpegPath: string;
  fps: number;
  outputPath: string;
  crf?: number | string;
}

function formatStderr(stderrChunks: string[]): string {
  const stderr = stderrChunks.join("").trim();
  if (stderr.length === 0) {
    return "";
  }

  return `\nffmpeg stderr:\n${stderr}`;
}

export class FfmpegEncoder {
  private readonly process: ChildProcessWithoutNullStreams;

  private readonly stderrChunks: string[] = [];

  private readonly exitPromise: Promise<number | null>;

  private drainPromise: Promise<void> | null = null;

  private drainResolve: (() => void) | null = null;

  private processError: Error | null = null;

  private finalized = false;

  constructor(options: FfmpegEncoderOptions) {
    const crf = options.crf ?? "23";

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
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "pad=ceil(iw/2)*2:ceil(ih/2)*2",
      "-movflags",
      "+faststart",
      "-r",
      String(options.fps),
      options.outputPath,
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
        `ffmpeg process error: ${this.processError.message}${formatStderr(this.stderrChunks)}`,
      );
    }

    if (!this.process.stdin.writable) {
      throw new Error(`ffmpeg stdin is not writable${formatStderr(this.stderrChunks)}`);
    }
  }

  async writeFrame(jpegBuffer: Buffer): Promise<void> {
    if (this.finalized) {
      throw new Error("Cannot write frame after finalize() has started");
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
        `ffmpeg process error: ${this.processError.message}${formatStderr(this.stderrChunks)}`,
      );
    }

    if (exitCode !== 0) {
      throw new Error(`ffmpeg exited with code ${exitCode}${formatStderr(this.stderrChunks)}`);
    }
  }

  async abort(signal: NodeJS.Signals = "SIGTERM"): Promise<void> {
    this.finalized = true;

    if (this.process.exitCode === null && !this.process.killed) {
      this.process.kill(signal);
    }

    await this.exitPromise;
  }
}
