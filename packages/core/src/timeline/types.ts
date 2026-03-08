import type { TimingContract } from "./timing-contract.js";

export interface CursorState {
  x: number;
  y: number;
  visible: boolean;
}

export interface HudState {
  labels: string[];
  opacity: number;
}

export interface FrameData {
  frameIndex: number;
  timeMs: number;
  cursor: CursorState;
  hud: HudState | null;
}

export interface SoundEvent {
  type: "click" | "key";
  frameIndex: number;
  timeMs: number;
}

export interface CursorTheme {
  color: string;
  size: number;
}

export interface HudTheme {
  background: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  borderRadius: number;
  position: "top" | "bottom";
}

export interface TimelineTheme {
  cursor: CursorTheme;
  hud: HudTheme;
}

export interface TimelineData {
  fps: number;
  width: number;
  height: number;
  frameCount: number;
  theme: TimelineTheme;
  frames: FrameData[];
  events: SoundEvent[];
  terminalFrames?: number[];
  timingContract?: TimingContract;
}

export interface CursorPoint {
  x: number;
  y: number;
  visible?: boolean;
}

export interface TimelineThemeOverrides {
  cursor?: Partial<CursorTheme>;
  hud?: Partial<HudTheme>;
}

export interface InteractionTimelineOptions {
  fps?: number;
  initialCursor?: CursorState;
  theme?: TimelineThemeOverrides;
}
