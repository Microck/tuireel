import type { TuireelSession } from "../session.js";
import type { FfmpegEncoder } from "../encoding/encoder.js";

export interface FrameCapturerOptions {
  session: TuireelSession;
  encoder: FfmpegEncoder;
  fps: number;
  onFrame?: (frameCount: number) => void;
}

export class FrameCapturer {
  private readonly session: TuireelSession;

  private readonly encoder: FfmpegEncoder;

  private readonly onFrame?: (frameCount: number) => void;

  private readonly intervalMs: number;

  private timer: NodeJS.Timeout | null = null;

  private activeTick: Promise<void> | null = null;

  private running = false;

  private skipNextTick = false;

  private captureError: Error | null = null;

  private frameCount = 0;

  constructor(options: FrameCapturerOptions) {
    if (!Number.isFinite(options.fps) || options.fps <= 0) {
      throw new Error(`Invalid fps value: ${options.fps}. Try: use a positive number like 20 or 30.`);
    }

    this.session = options.session;
    this.encoder = options.encoder;
    this.onFrame = options.onFrame;
    this.intervalMs = 1000 / options.fps;
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.captureError = null;

    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);

    this.tick();
  }

  private tick(): void {
    if (!this.running || this.activeTick) {
      return;
    }

    if (this.skipNextTick) {
      this.skipNextTick = false;
      return;
    }

    const startedAt = Date.now();

    this.activeTick = (async () => {
      try {
        const frame = await this.session.screenshot();
        await this.encoder.writeFrame(frame);

        this.frameCount += 1;
        this.onFrame?.(this.frameCount);
      } catch (error) {
        this.captureError =
          error instanceof Error ? error : new Error(`Frame capture failed: ${String(error)}`);
        this.running = false;

        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      } finally {
        const elapsed = Date.now() - startedAt;
        if (elapsed > this.intervalMs) {
          this.skipNextTick = true;
        }

        this.activeTick = null;
      }
    })();
  }

  async stop(): Promise<void> {
    this.running = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.activeTick) {
      await this.activeTick;
    }

    if (this.captureError) {
      throw this.captureError;
    }
  }

  getFrameCount(): number {
    return this.frameCount;
  }
}
