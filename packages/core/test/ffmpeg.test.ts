import { execFileSync } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  detectPlatform,
  ensureFfmpeg,
  getDownloadUrl,
  getFfmpegPath,
} from "../src/ffmpeg/downloader.js";

describe("ffmpeg downloader", () => {
  it("returns a cache path under ~/.tuireel/bin/ffmpeg", () => {
    const ffmpegPath = getFfmpegPath();

    expect(ffmpegPath).toMatch(/[\\/]\.tuireel[\\/]bin[\\/]ffmpeg$/);
  });

  it("detects a supported os and architecture", () => {
    const platform = detectPlatform();

    expect(["darwin", "linux"]).toContain(platform.os);
    expect(["arm64", "x64"]).toContain(platform.arch);
  });

  it("returns expected download URLs for supported targets", () => {
    expect(getDownloadUrl({ os: "darwin", arch: "arm64" })).toBe(
      "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip",
    );
    expect(getDownloadUrl({ os: "darwin", arch: "x64" })).toBe(
      "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip",
    );
    expect(getDownloadUrl({ os: "linux", arch: "x64" })).toBe(
      "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz",
    );
  });
});

describe.skipIf(Boolean(process.env.CI))("ffmpeg integration", () => {
  it("downloads ffmpeg when missing and reuses cached binary", async () => {
    const firstPath = await ensureFfmpeg();
    await access(firstPath, constants.X_OK);

    const versionOutput = execFileSync(firstPath, ["-version"], {
      encoding: "utf8",
    });

    expect(versionOutput).toMatch(/ffmpeg version/i);

    const secondPath = await ensureFfmpeg();
    expect(secondPath).toBe(firstPath);
  }, 120_000);
});
