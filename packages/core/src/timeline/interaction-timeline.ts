import { readFileSync, writeFileSync } from "node:fs";

import type {
  CursorPoint,
  CursorState,
  FrameData,
  HudState,
  InteractionTimelineOptions,
  SoundEvent,
  TimelineData,
  TimelineTheme,
  TimelineThemeOverrides,
} from "./types.js";
import type { TimingContract } from "./timing-contract.js";

const DEFAULT_FPS = 30;

const DEFAULT_CURSOR_STATE: CursorState = {
  x: 0,
  y: 0,
  visible: false,
};

const DEFAULT_THEME: TimelineTheme = {
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
};

function cloneCursor(cursor: CursorState): CursorState {
  return {
    x: cursor.x,
    y: cursor.y,
    visible: cursor.visible,
  };
}

function cloneHud(hud: HudState | null): HudState | null {
  if (!hud) {
    return null;
  }

  return {
    labels: [...hud.labels],
    opacity: hud.opacity,
  };
}

function cloneFrame(frame: FrameData): FrameData {
  return {
    frameIndex: frame.frameIndex,
    timeMs: frame.timeMs,
    cursor: cloneCursor(frame.cursor),
    hud: cloneHud(frame.hud),
  };
}

function cloneEvent(event: SoundEvent): SoundEvent {
  return {
    type: event.type,
    frameIndex: event.frameIndex,
    timeMs: event.timeMs,
  };
}

function cloneTheme(theme: TimelineTheme): TimelineTheme {
  return {
    cursor: {
      ...theme.cursor,
    },
    hud: {
      ...theme.hud,
    },
  };
}

function cloneTimingContract(
  timingContract: TimingContract | undefined,
): TimingContract | undefined {
  if (!timingContract) {
    return undefined;
  }

  return {
    ...timingContract,
  };
}

function mergeTheme(overrides?: TimelineThemeOverrides): TimelineTheme {
  return {
    cursor: {
      ...DEFAULT_THEME.cursor,
      ...overrides?.cursor,
    },
    hud: {
      ...DEFAULT_THEME.hud,
      ...overrides?.hud,
    },
  };
}

function hudStatesEqual(left: HudState | null, right: HudState | null): boolean {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  if (left.opacity !== right.opacity || left.labels.length !== right.labels.length) {
    return false;
  }

  return left.labels.every((label, index) => label === right.labels[index]);
}

function frameStateChanged(previous: FrameData, next: FrameData): boolean {
  if (
    previous.cursor.x !== next.cursor.x ||
    previous.cursor.y !== next.cursor.y ||
    previous.cursor.visible !== next.cursor.visible
  ) {
    return true;
  }

  return !hudStatesEqual(previous.hud, next.hud);
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function inferredFrameCount(frames: FrameData[]): number {
  if (frames.length === 0) {
    return 0;
  }

  const lastFrame = frames.reduce((max, frame) =>
    frame.frameIndex > max.frameIndex ? frame : max,
  );
  return lastFrame.frameIndex + 1;
}

export class InteractionTimeline {
  private cursorPath: CursorPoint[] | null = null;
  private pathIndex = 0;
  private currentCursor: CursorState;
  private currentHud: HudState | null = null;
  private frames: FrameData[] = [];
  private events: SoundEvent[] = [];
  private terminalFrames: number[] = [];
  private timingContract: TimingContract | undefined;
  private frameCount = 0;

  private readonly width: number;
  private readonly height: number;
  private readonly fps: number;
  private readonly theme: TimelineTheme;

  constructor(width: number, height: number, options: InteractionTimelineOptions = {}) {
    this.width = width;
    this.height = height;
    this.fps = options.fps ?? DEFAULT_FPS;
    this.theme = mergeTheme(options.theme);
    this.currentCursor = cloneCursor(options.initialCursor ?? DEFAULT_CURSOR_STATE);
  }

  setCursorPath(points: CursorPoint[]): void {
    this.cursorPath = points.map((point) => ({
      x: point.x,
      y: point.y,
      visible: point.visible,
    }));
    this.pathIndex = 0;
  }

  showHud(labels: string[]): void {
    this.currentHud = {
      labels: [...labels],
      opacity: 1,
    };
  }

  hideHud(): void {
    this.currentHud = null;
  }

  addEvent(type: "click" | "key"): void {
    this.events.push({
      type,
      frameIndex: this.frameCount,
      timeMs: this.timeAtFrame(this.frameCount),
    });
  }

  tick(): void {
    this.advanceToFrameCount(this.frameCount + 1);
  }

  advanceToTimeMs(elapsedMs: number): void {
    const frameDurationMs = 1000 / this.fps;
    const targetFrameCount = Math.max(1, Math.floor(elapsedMs / frameDurationMs) + 1);
    this.advanceToFrameCount(targetFrameCount);
  }

  markTerminalFrame(): void {
    const frameIndex = Math.max(0, this.frameCount - 1);
    const previous = this.terminalFrames[this.terminalFrames.length - 1];
    if (previous === frameIndex) {
      return;
    }
    this.terminalFrames.push(frameIndex);
  }

  getTerminalFrames(): number[] {
    return [...this.terminalFrames];
  }

  setTimingContract(timingContract: TimingContract): void {
    this.timingContract = cloneTimingContract(timingContract);
  }

  private advanceToFrameCount(targetFrameCount: number): void {
    while (this.frameCount < targetFrameCount) {
      this.tickOnce();
    }
  }

  private tickOnce(): void {
    if (this.cursorPath && this.pathIndex < this.cursorPath.length) {
      const point = this.cursorPath[this.pathIndex];
      this.pathIndex += 1;

      if (point) {
        this.currentCursor = {
          x: point.x,
          y: point.y,
          visible: point.visible ?? true,
        };
      }

      if (this.pathIndex >= this.cursorPath.length) {
        this.cursorPath = null;
      }
    }

    this.captureFrame();
    this.frameCount += 1;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  getFrames(): FrameData[] {
    if (this.frameCount === 0) {
      return [];
    }

    if (this.frames.length === 0) {
      const fallbackCursor = cloneCursor(this.currentCursor);
      const fallbackHud = cloneHud(this.currentHud);
      return Array.from({ length: this.frameCount }, (_, index) => ({
        frameIndex: index,
        timeMs: this.timeAtFrame(index),
        cursor: cloneCursor(fallbackCursor),
        hud: cloneHud(fallbackHud),
      }));
    }

    const expandedFrames: FrameData[] = [];
    const keyframes = this.frames;
    const firstKeyframe = keyframes[0];
    if (!firstKeyframe) {
      return [];
    }

    let currentKeyframe = firstKeyframe;
    let nextKeyframeIndex = 1;
    let nextKeyframe = keyframes[nextKeyframeIndex] ?? null;

    for (let frameIndex = 0; frameIndex < this.frameCount; frameIndex += 1) {
      while (nextKeyframe && nextKeyframe.frameIndex <= frameIndex) {
        currentKeyframe = nextKeyframe;
        nextKeyframeIndex += 1;
        nextKeyframe = keyframes[nextKeyframeIndex] ?? null;
      }

      const cursor = this.interpolateCursor(currentKeyframe, nextKeyframe, frameIndex);
      expandedFrames.push({
        frameIndex,
        timeMs: this.timeAtFrame(frameIndex),
        cursor,
        hud: cloneHud(currentKeyframe.hud),
      });
    }

    return expandedFrames;
  }

  toJSON(): TimelineData {
    return {
      fps: this.fps,
      width: this.width,
      height: this.height,
      frameCount: this.frameCount,
      theme: cloneTheme(this.theme),
      frames: this.frames.map(cloneFrame),
      events: this.events.map(cloneEvent),
      terminalFrames: [...this.terminalFrames],
      timingContract: cloneTimingContract(this.timingContract),
    };
  }

  save(path: string): void {
    writeFileSync(path, JSON.stringify(this.toJSON(), null, 2), "utf8");
  }

  static load(json: TimelineData): InteractionTimeline {
    const timeline = new InteractionTimeline(json.width, json.height, {
      fps: json.fps,
      theme: json.theme,
    });

    timeline.frames = json.frames.map(cloneFrame);
    timeline.events = json.events.map(cloneEvent);
    timeline.terminalFrames = [...(json.terminalFrames ?? [])];
    timeline.timingContract = cloneTimingContract(json.timingContract);
    timeline.frameCount = json.frameCount ?? inferredFrameCount(json.frames);

    const latestFrame = timeline.getFrames()[timeline.frameCount - 1];
    if (latestFrame) {
      timeline.currentCursor = cloneCursor(latestFrame.cursor);
      timeline.currentHud = cloneHud(latestFrame.hud);
    }

    return timeline;
  }

  static fromFile(path: string): InteractionTimeline {
    const raw = readFileSync(path, "utf8");
    return InteractionTimeline.load(JSON.parse(raw) as TimelineData);
  }

  private captureFrame(): void {
    const snapshot: FrameData = {
      frameIndex: this.frameCount,
      timeMs: this.timeAtFrame(this.frameCount),
      cursor: cloneCursor(this.currentCursor),
      hud: cloneHud(this.currentHud),
    };

    const previousFrame = this.frames[this.frames.length - 1];
    if (!previousFrame || frameStateChanged(previousFrame, snapshot)) {
      this.frames.push(snapshot);
    }
  }

  private interpolateCursor(
    currentKeyframe: FrameData,
    nextKeyframe: FrameData | null,
    frameIndex: number,
  ): CursorState {
    if (!nextKeyframe || nextKeyframe.frameIndex <= currentKeyframe.frameIndex) {
      return cloneCursor(currentKeyframe.cursor);
    }

    if (frameIndex <= currentKeyframe.frameIndex) {
      return cloneCursor(currentKeyframe.cursor);
    }

    if (frameIndex >= nextKeyframe.frameIndex) {
      return cloneCursor(nextKeyframe.cursor);
    }

    const distance = nextKeyframe.frameIndex - currentKeyframe.frameIndex;
    const progress = (frameIndex - currentKeyframe.frameIndex) / distance;

    return {
      x: lerp(currentKeyframe.cursor.x, nextKeyframe.cursor.x, progress),
      y: lerp(currentKeyframe.cursor.y, nextKeyframe.cursor.y, progress),
      visible: currentKeyframe.cursor.visible,
    };
  }

  private timeAtFrame(frameIndex: number): number {
    return (frameIndex / this.fps) * 1000;
  }
}
