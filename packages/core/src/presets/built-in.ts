import type { TuireelConfig } from "../config/schema.js";

export const PRESET_NAMES = ["polished", "minimal", "demo", "silent"] as const;

export type PresetName = (typeof PRESET_NAMES)[number];

/**
 * Presets define presentation defaults (theme, sound, cursor, hud) —
 * never output behavior (steps, output path, format).
 */
export type PresetConfig = Partial<
  Omit<TuireelConfig, "steps" | "output" | "$schema" | "format">
>;

export const BUILT_IN_PRESETS: Record<PresetName, PresetConfig> = {
  polished: {
    theme: "catppuccin",
    sound: { effects: { click: 1, key: 1 } },
    cursor: { visible: true },
    hud: { visible: true },
  },
  minimal: {
    theme: "tokyo-night",
    cursor: { visible: true },
    hud: { visible: false },
  },
  demo: {
    theme: "dracula",
    sound: { effects: { click: 1, key: 1 } },
    cursor: { visible: true },
    hud: { visible: true },
  },
  silent: {
    cursor: { visible: false },
    hud: { visible: false },
  },
};
