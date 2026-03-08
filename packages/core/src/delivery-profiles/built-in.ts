import type { TuireelConfig } from "../config/schema.js";

export const DELIVERY_PROFILE_NAMES = [
  "readable-1080p",
  "social-quick-share",
  "high-motion-demo",
] as const;

export type DeliveryProfileName = (typeof DELIVERY_PROFILE_NAMES)[number];

export type DeliveryProfileConfig = Partial<
  Pick<TuireelConfig, "fps" | "captureFps" | "outputSize" | "cols" | "rows">
>;

export const BUILT_IN_DELIVERY_PROFILES: Record<DeliveryProfileName, DeliveryProfileConfig> = {
  "readable-1080p": {
    fps: 30,
    captureFps: 12,
    cols: 100,
    rows: 30,
    outputSize: {
      width: 1920,
      height: 1080,
      padding: 96,
    },
  },
  "social-quick-share": {
    fps: 30,
    captureFps: 10,
    cols: 90,
    rows: 28,
    outputSize: {
      width: 1600,
      height: 900,
      padding: 72,
    },
  },
  "high-motion-demo": {
    fps: 60,
    captureFps: 24,
    cols: 100,
    rows: 30,
    outputSize: {
      width: 1920,
      height: 1080,
      padding: 80,
    },
  },
};
