import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { InteractionTimeline } from "../interaction-timeline.js";
import type { TimingContract } from "../timing-contract.js";
import type { TimelineData } from "../types.js";

describe("InteractionTimeline", () => {
  it("records frame count and frame states across ticks", () => {
    const timeline = new InteractionTimeline(1280, 720, { fps: 30 });

    timeline.tick();
    timeline.tick();
    timeline.tick();

    expect(timeline.getFrameCount()).toBe(3);
    expect(timeline.getFrames()).toHaveLength(3);
  });

  it("moves cursor through path points one point per tick", () => {
    const timeline = new InteractionTimeline(1280, 720, { fps: 30 });

    timeline.setCursorPath([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      { x: 50, y: 60 },
    ]);

    timeline.tick();
    timeline.tick();
    timeline.tick();

    expect(timeline.getFrames().map((frame) => ({ x: frame.cursor.x, y: frame.cursor.y }))).toEqual(
      [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 60 },
      ],
    );
  });

  it("round-trips serialized data via load", () => {
    const timeline = new InteractionTimeline(800, 600, { fps: 24 });

    timeline.setCursorPath([
      { x: 4, y: 5 },
      { x: 8, y: 10 },
    ]);
    timeline.tick();
    timeline.showHud(["Ctrl", "C"]);
    timeline.tick();
    timeline.addEvent("key");

    const serialized = timeline.toJSON();
    const loaded = InteractionTimeline.load(serialized);

    expect(loaded.toJSON()).toEqual(serialized);
  });

  it("saves to disk and reloads from file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tuireel-timeline-"));
    const filePath = join(directory, "timeline.json");

    try {
      const timeline = new InteractionTimeline(640, 360, { fps: 30 });
      const timingContract: TimingContract = {
        version: 1,
        outputFps: 30,
        captureFps: 12,
        wallClockDurationMs: 67,
        rawFrameCount: 2,
        outputFrameCount: 2,
        terminalFrameCount: 2,
        deliveryProfile: "readable-1080p",
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
      };

      timeline.showHud(["A"]);
      timeline.tick();
      timeline.markTerminalFrame();
      timeline.addEvent("click");
      timeline.setTimingContract(timingContract);
      timeline.save(filePath);

      const loaded = InteractionTimeline.fromFile(filePath);
      const fileData = JSON.parse(await readFile(filePath, "utf8")) as TimelineData;

      expect(loaded.toJSON()).toEqual(timeline.toJSON());
      expect(fileData).toEqual(timeline.toJSON());
      expect(fileData).toMatchObject({
        fps: 30,
        timingContract,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("shows and hides HUD state across frames", () => {
    const timeline = new InteractionTimeline(1280, 720, { fps: 30 });

    timeline.showHud(["Ctrl", "C"]);
    timeline.tick();
    timeline.hideHud();
    timeline.tick();

    const frames = timeline.getFrames();
    expect(frames[0]?.hud?.labels).toEqual(["Ctrl", "C"]);
    expect(frames[1]?.hud).toBeNull();
  });

  it("records sound events with frame-accurate timestamps", () => {
    const timeline = new InteractionTimeline(1280, 720, { fps: 20 });

    timeline.tick();
    timeline.tick();
    timeline.addEvent("key");

    const [event] = timeline.toJSON().events;

    expect(event?.type).toBe("key");
    expect(event?.frameIndex).toBe(2);
    expect(event?.timeMs).toBeCloseTo(100, 6);
  });

  it("stores only keyframes while expanding full frame sequence", () => {
    const timeline = new InteractionTimeline(1280, 720, { fps: 30 });

    timeline.tick();
    timeline.tick();
    timeline.tick();

    expect(timeline.getFrameCount()).toBe(3);
    expect(timeline.toJSON().frames).toHaveLength(1);
    expect(timeline.getFrames()).toHaveLength(3);
  });

  it("deep-clones nested pacing provenance when saving timing contracts", () => {
    const timeline = new InteractionTimeline(1280, 720, { fps: 30 });
    const timingContract: TimingContract = {
      version: 1,
      outputFps: 30,
      captureFps: 12,
      wallClockDurationMs: 3_000,
      rawFrameCount: 36,
      outputFrameCount: 90,
      terminalFrameCount: 5,
      pacing: {
        source: "inline",
        resolved: {
          baseSpeedMs: 52,
          firstCharExtra: 0.2,
          punctuationExtra: 0.18,
          whitespaceExtra: 0.22,
          pathSepExtra: 0.05,
          beats: {
            startup: 400,
            settle: 250,
            read: 200,
            idle: 120,
          },
        },
      },
    };

    timeline.setTimingContract(timingContract);
    timingContract.pacing.resolved.beats.startup = 999;

    expect(timeline.toJSON().timingContract?.pacing?.resolved.beats.startup).toBe(400);
  });
});
