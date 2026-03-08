import { describe, expect, it } from "vitest";

import { assessTimingCompatibility, type TimingContract } from "../src/timeline/timing-contract.js";
import type { TimelineData } from "../src/timeline/types.js";

function createTimelineData(overrides: Partial<TimelineData> = {}): TimelineData {
  return {
    fps: 30,
    width: 1280,
    height: 720,
    frameCount: 420,
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
    frames: [],
    events: [],
    terminalFrames: [0, 120, 240, 419],
    ...overrides,
  };
}

describe("timing contract compatibility", () => {
  it("treats packaging-only changes as compatible when timing fields match", () => {
    const timingContract: TimingContract = {
      version: 1,
      outputFps: 30,
      captureFps: 12,
      wallClockDurationMs: 14_000,
      rawFrameCount: 168,
      outputFrameCount: 420,
      terminalFrameCount: 4,
      deliveryProfile: "readable-1080p",
    };

    const timeline = createTimelineData({ timingContract });

    expect(
      assessTimingCompatibility(timeline, {
        fps: 30,
        captureFps: 12,
        deliveryProfile: "social-quick-share",
        format: "gif",
        sound: false,
        outputSize: {
          width: 1920,
          height: 1080,
          padding: 96,
        },
      }),
    ).toMatchObject({
      kind: "compatible",
      source: "timing-contract",
    });
  });

  it("flags output cadence changes as a timing mismatch", () => {
    const timeline = createTimelineData({
      timingContract: {
        version: 1,
        outputFps: 30,
        captureFps: 12,
        wallClockDurationMs: 14_000,
        rawFrameCount: 168,
        outputFrameCount: 420,
        terminalFrameCount: 4,
      },
    });

    expect(
      assessTimingCompatibility(timeline, {
        fps: 24,
        captureFps: 12,
      }),
    ).toMatchObject({
      kind: "timing-mismatch",
      mismatches: [
        {
          field: "outputFps",
          expected: 30,
          actual: 24,
        },
      ],
    });
  });

  it("returns an explicit legacy fallback when timingContract is missing", () => {
    const legacyTimeline = createTimelineData();

    expect(
      assessTimingCompatibility(legacyTimeline, {
        fps: 30,
        captureFps: 12,
      }),
    ).toMatchObject({
      kind: "legacy-fallback",
      fallback: "allow-packaging-only",
      outputFps: 30,
      reason: "missing-timing-contract",
    });
  });
});
