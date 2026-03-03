import { describe, expect, it } from "vitest";

import { computeCursorPath, moveDuration } from "../bezier.js";

describe("bezier cursor path", () => {
  it("starts at source and ends exactly at destination", () => {
    const path = computeCursorPath(12, 34, 96, 68, 30);

    expect(path[0]).toEqual({ x: 12, y: 34, visible: true });
    expect(path[path.length - 1]).toEqual({ x: 96, y: 68, visible: true });
  });

  it("produces at least six movement steps", () => {
    const path = computeCursorPath(0, 0, 20, 15, 30);

    expect(path.length - 1).toBeGreaterThanOrEqual(6);
  });

  it("uses more steps for longer cursor moves", () => {
    const shortPath = computeCursorPath(0, 0, 40, 0, 30);
    const longPath = computeCursorPath(0, 0, 400, 0, 30);

    expect(longPath.length).toBeGreaterThan(shortPath.length);
  });

  it("follows the expected human-ease inflection near 40 percent", () => {
    const path = computeCursorPath(0, 0, 60, 0, 31.35);
    const inflectionPoint = path[4];

    expect(path[0]).toEqual({ x: 0, y: 0, visible: true });
    expect(path[path.length - 1]).toEqual({ x: 60, y: 0, visible: true });
    expect(inflectionPoint?.x).toBeCloseTo(30, 1);
    expect(inflectionPoint?.y).toBeCloseTo(0, 1);
  });

  it("scales movement duration with distance", () => {
    const shortDuration = moveDuration(4);
    const mediumDuration = moveDuration(100);
    const longDuration = moveDuration(900);

    expect(mediumDuration).toBeGreaterThan(shortDuration);
    expect(longDuration).toBeGreaterThan(mediumDuration);
  });
});
