export const VERSION = "0.0.1";

export * from "./config/index.js";
export * from "./ffmpeg/index.js";
export { compose } from "./compositor.js";
export { record } from "./recorder.js";
export {
  buildAudioMixArgs,
  ensureSoundAssets,
  extractSoundEvents,
  finalizeMp4WithSound,
  finalizeWebmWithSound,
  resolveSfxPath,
  type SfxConfig,
} from "./sound.js";
export { InteractionTimeline } from "./timeline/interaction-timeline.js";
export type {
  CursorState,
  FrameData,
  HudState,
  SoundEvent,
  TimelineData,
} from "./timeline/types.js";
