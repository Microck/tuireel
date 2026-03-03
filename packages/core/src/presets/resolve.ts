import { BUILT_IN_PRESETS, type PresetName } from "./built-in.js";

/**
 * Resolves a preset field in raw config by merging preset defaults
 * under user-specified values.
 *
 * Merge priority: User Config > Preset Defaults > Schema Defaults (Zod .default())
 *
 * Sound merge rule: If the user explicitly provides a `sound` field (even partial),
 * it REPLACES the preset's sound entirely. If the user doesn't set sound at all,
 * preset sound applies.
 */
export function resolvePreset(
  rawConfig: Record<string, unknown>,
): Record<string, unknown> {
  if (!("preset" in rawConfig) || rawConfig.preset === undefined) {
    return rawConfig;
  }

  const presetName = rawConfig.preset as string;

  if (!(presetName in BUILT_IN_PRESETS)) {
    throw new Error(
      `Unknown preset "${presetName}". Available presets: ${Object.keys(BUILT_IN_PRESETS).join(", ")}.`,
    );
  }

  const presetDefaults = BUILT_IN_PRESETS[presetName as PresetName];

  // Separate preset key and user overrides
  const { preset: _preset, ...userOverrides } = rawConfig;

  // Sound merge: user sound replaces preset sound entirely if present
  const hasSoundOverride = "sound" in userOverrides;

  const merged: Record<string, unknown> = {
    ...presetDefaults,
    ...userOverrides,
  };

  // If user didn't specify sound but preset has it, preset sound is already
  // applied by the spread above. If user specified sound, it already
  // overwrote preset sound. Nothing extra needed — the spread handles both.
  // But we need to ensure preset sound is removed if user explicitly set sound.
  if (hasSoundOverride) {
    merged.sound = userOverrides.sound;
  }

  return merged;
}
