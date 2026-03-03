import type { CursorPoint } from "../timeline/types.js";

const DEFAULT_FPS = 30;
const MIN_STEPS = 6;
const SHORT_MOVE_THRESHOLD = 80;
const JITTER_THRESHOLD = 60;

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

function bezierControl(x0: number, y0: number, x1: number, y1: number, dist: number): CursorPoint {
  const midpointX = (x0 + x1) / 2;
  const midpointY = (y0 + y1) / 2;

  if (dist < SHORT_MOVE_THRESHOLD) {
    return { x: midpointX, y: midpointY };
  }

  const normalX = -(y1 - y0) / dist;
  const normalY = (x1 - x0) / dist;
  const amplitude = dist * (0.03 + Math.random() * 0.07);
  const sign = Math.random() < 0.5 ? -1 : 1;
  const offset = amplitude * sign;

  return {
    x: midpointX + normalX * offset,
    y: midpointY + normalY * offset,
  };
}

function evalBezier(t: number, p0: CursorPoint, p1: CursorPoint, p2: CursorPoint): CursorPoint {
  const m = 1 - t;
  return {
    x: m * m * p0.x + 2 * m * t * p1.x + t * t * p2.x,
    y: m * m * p0.y + 2 * m * t * p1.y + t * t * p2.y,
  };
}

function microJitter(t: number, dist: number): CursorPoint {
  const bell = Math.exp(-8 * (t - 0.5) * (t - 0.5));
  const magnitude = Math.min(0.4, dist * 0.0004) * bell;

  return {
    x: (Math.random() * 2 - 1) * magnitude,
    y: (Math.random() * 2 - 1) * magnitude,
  };
}

export function moveDuration(dist: number): number {
  const safeDist = Math.max(0, dist);
  return 180 + 16 * Math.sqrt(safeDist) + Math.random() * 30;
}

export function computeCursorPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  fps: number,
): CursorPoint[] {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);

  if (distance < 1) {
    return [{ x: toX, y: toY, visible: true }];
  }

  const safeFps = Number.isFinite(fps) && fps > 0 ? fps : DEFAULT_FPS;
  const frameMs = 1000 / safeFps;
  const duration = moveDuration(distance);
  const steps = Math.max(MIN_STEPS, Math.round(duration / frameMs));

  const p0: CursorPoint = { x: fromX, y: fromY };
  const p1 = bezierControl(fromX, fromY, toX, toY, distance);
  const p2: CursorPoint = { x: toX, y: toY };

  const points: CursorPoint[] = [{ x: fromX, y: fromY, visible: true }];

  for (let i = 1; i <= steps; i += 1) {
    const rawT = i / steps;
    const easedT = humanEase(rawT);
    const basePoint = evalBezier(easedT, p0, p1, p2);
    const jitter = distance > JITTER_THRESHOLD ? microJitter(rawT, distance) : { x: 0, y: 0 };

    points.push({
      x: roundToTenth(basePoint.x + jitter.x),
      y: roundToTenth(basePoint.y + jitter.y),
      visible: true,
    });
  }

  points[points.length - 1] = { x: toX, y: toY, visible: true };

  return points;
}
