import { execFile } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

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

async function runFfmpeg(ffmpegPath: string, args: string[]): Promise<void> {
  await execFileAsync(ffmpegPath, args, {
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function assertPlayable(ffmpegPath: string, filePath: string): Promise<void> {
  await runFfmpeg(ffmpegPath, ["-v", "error", "-i", filePath, "-f", "null", "-"]);
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
});
