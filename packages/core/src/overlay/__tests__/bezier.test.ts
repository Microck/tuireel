import { describe, expect, it } from "vitest";

import { computeCursorPath, moveDuration } from "../bezier.js";

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function humanEase(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const mid = 0.4;

  if (clamped <= mid) {
    const s = clamped / mid;
    return 0.5 * s * s;
  }

  const s = (clamped - mid) / (1 - mid);
  return 0.5 + 0.5 * (1 - (1 - s) * (1 - s) * (1 - s));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function xJitterDelta(distance: number, steps: number, index: number, actualX: number): number {
  const rawT = index / steps;
  const baselineX = roundToTenth(distance * humanEase(rawT));
  return actualX - baselineX;
}

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

  it("produces visible mid-path jitter for long cursor travel", () => {
    const distance = 1200;
    let maxObservedMidJitter = 0;

    for (let run = 0; run < 24; run += 1) {
      const path = computeCursorPath(0, 0, distance, 0, 30);
      const steps = path.length - 1;
      const midStart = Math.max(1, Math.floor(steps * 0.35));
      const midEnd = Math.min(steps - 1, Math.ceil(steps * 0.65));

      for (let index = midStart; index <= midEnd; index += 1) {
        const delta = Math.abs(xJitterDelta(distance, steps, index, path[index]!.x));
        maxObservedMidJitter = Math.max(maxObservedMidJitter, delta);
      }
    }

    expect(maxObservedMidJitter).toBeGreaterThanOrEqual(1);
    expect(maxObservedMidJitter).toBeLessThanOrEqual(2.2);
  });

  it("keeps endpoint jitter lower than mid-path jitter", () => {
    const distance = 1200;
    const endpointMeans: number[] = [];
    const midpointMeans: number[] = [];

    for (let run = 0; run < 32; run += 1) {
      const path = computeCursorPath(0, 0, distance, 0, 30);
      const steps = path.length - 1;
      const edgeSpan = Math.max(1, Math.floor(steps * 0.15));
      const edgeValues: number[] = [];
      const midValues: number[] = [];

      for (let index = 1; index <= edgeSpan && index < steps; index += 1) {
        edgeValues.push(Math.abs(xJitterDelta(distance, steps, index, path[index]!.x)));
      }

      for (let index = Math.max(1, steps - edgeSpan); index < steps; index += 1) {
        edgeValues.push(Math.abs(xJitterDelta(distance, steps, index, path[index]!.x)));
      }

      const midStart = Math.max(1, Math.floor(steps * 0.4));
      const midEnd = Math.min(steps - 1, Math.ceil(steps * 0.6));

      for (let index = midStart; index <= midEnd; index += 1) {
        midValues.push(Math.abs(xJitterDelta(distance, steps, index, path[index]!.x)));
      }

      endpointMeans.push(average(edgeValues));
      midpointMeans.push(average(midValues));
    }

    const endpointMean = average(endpointMeans);
    const midpointMean = average(midpointMeans);

    expect(midpointMean).toBeGreaterThan(endpointMean * 2);
  });
});
