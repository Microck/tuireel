export const VERSION = "0.0.1";

export * from "./config/index.js";
export * from "./ffmpeg/index.js";
export { compose } from "./compositor.js";
export { preview } from "./preview.js";
export { record } from "./recorder.js";
export {
  buildAudioMixArgs,
  buildFullAudioArgs,
  ensureSoundAssets,
  extractSoundEvents,
  finalizeMp4WithSound,
  finalizeWebmWithSound,
  mixAudioTracks,
  resolveSfxPath,
  type SoundConfig,
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
