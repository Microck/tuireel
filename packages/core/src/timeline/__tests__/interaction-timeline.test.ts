import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { InteractionTimeline } from "../interaction-timeline.js";
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

    expect(
      timeline.getFrames().map((frame) => ({ x: frame.cursor.x, y: frame.cursor.y })),
    ).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      { x: 50, y: 60 },
    ]);
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

      timeline.showHud(["A"]);
      timeline.tick();
      timeline.addEvent("click");
      timeline.save(filePath);

      const loaded = InteractionTimeline.fromFile(filePath);
      const fileData = JSON.parse(await readFile(filePath, "utf8")) as TimelineData;

      expect(loaded.toJSON()).toEqual(timeline.toJSON());
      expect(fileData).toEqual(timeline.toJSON());
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
});
