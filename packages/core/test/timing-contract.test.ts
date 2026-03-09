import { describe, expect, it } from "vitest";

import {
  assessTimingCompatibility,
  buildTimingContract,
  type TimingContract,
} from "../src/timeline/timing-contract.js";
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
  it("builds named pacing provenance with selected name and resolved cadence values", () => {
    const timingContract = buildTimingContract({
      outputFps: 30,
      captureFps: 12,
      wallClockDurationMs: 14_000,
      rawFrameCount: 168,
      outputFrameCount: 420,
      terminalFrameCount: 4,
      pacing: {
        source: "named",
        selectedName: "relaxed",
        resolved: {
          baseSpeedMs: 65,
          firstCharExtra: 0.3,
          punctuationExtra: 0.25,
          whitespaceExtra: 0.32,
          pathSepExtra: 0.08,
          beats: {
            startup: 800,
            settle: 500,
            read: 400,
            idle: 250,
          },
        },
      },
    });

    expect(timingContract.pacing).toEqual({
      source: "named",
      selectedName: "relaxed",
      resolved: {
        baseSpeedMs: 65,
        firstCharExtra: 0.3,
        punctuationExtra: 0.25,
        whitespaceExtra: 0.32,
        pathSepExtra: 0.08,
        beats: {
          startup: 800,
          settle: 500,
          read: 400,
          idle: 250,
        },
      },
    });
  });

  it("builds inline pacing provenance without inventing a selected profile name", () => {
    const timingContract = buildTimingContract({
      outputFps: 24,
      captureFps: 24,
      wallClockDurationMs: 9_000,
      rawFrameCount: 216,
      outputFrameCount: 216,
      terminalFrameCount: 12,
      pacing: {
        source: "inline",
        resolved: {
          baseSpeedMs: 52,
          firstCharExtra: 0.18,
          punctuationExtra: 0.22,
          whitespaceExtra: 0.3,
          pathSepExtra: 0.04,
          beats: {
            startup: 620,
            settle: 360,
            read: 280,
            idle: 150,
          },
        },
      },
    });

    expect(timingContract.pacing).toEqual({
      source: "inline",
      resolved: {
        baseSpeedMs: 52,
        firstCharExtra: 0.18,
        punctuationExtra: 0.22,
        whitespaceExtra: 0.3,
        pathSepExtra: 0.04,
        beats: {
          startup: 620,
          settle: 360,
          read: 280,
          idle: 150,
        },
      },
    });
    expect(timingContract.pacing).not.toHaveProperty("selectedName");
  });

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
        pacing: {
          source: "inline",
          resolved: {
            baseSpeedMs: 48,
            firstCharExtra: 0.2,
            punctuationExtra: 0.2,
            whitespaceExtra: 0.2,
            pathSepExtra: 0.1,
            beats: {
              startup: 500,
              settle: 300,
              read: 200,
              idle: 100,
            },
          },
        },
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

  it("flags capture cadence changes as a timing mismatch", () => {
    const timeline = createTimelineData({
      timingContract: {
        version: 1,
        outputFps: 30,
        captureFps: 12,
        wallClockDurationMs: 14_000,
        rawFrameCount: 168,
        outputFrameCount: 420,
        terminalFrameCount: 4,
        deliveryProfile: "readable-1080p",
      },
    });

    expect(
      assessTimingCompatibility(timeline, {
        fps: 30,
        captureFps: 8,
        deliveryProfile: "social-quick-share",
        format: "webm",
      }),
    ).toMatchObject({
      kind: "timing-mismatch",
      mismatches: [
        {
          field: "captureFps",
          expected: 12,
          actual: 8,
        },
      ],
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
        format: "gif",
        deliveryProfile: "readable-1080p",
        outputSize: {
          width: 1920,
          height: 1080,
          padding: 96,
        },
      }),
    ).toEqual({
      kind: "legacy-fallback",
      fallback: "allow-packaging-only",
      outputFps: 30,
      reason: "missing-timing-contract",
      message:
        "Saved timeline has no timingContract. Allow packaging-only recomposite changes, but require a fresh record for timing changes.",
    });
  });
});
