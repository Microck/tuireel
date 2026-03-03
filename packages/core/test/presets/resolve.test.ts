import { describe, expect, it } from "vitest";

import { BUILT_IN_PRESETS, PRESET_NAMES } from "../../src/presets/built-in.js";
import { resolvePreset } from "../../src/presets/resolve.js";

describe("preset definitions", () => {
  it("exports exactly 4 preset names", () => {
    expect(PRESET_NAMES).toEqual(["polished", "minimal", "demo", "silent"]);
  });

  it("has a preset definition for every name", () => {
    for (const name of PRESET_NAMES) {
      expect(BUILT_IN_PRESETS).toHaveProperty(name);
    }
  });

  it("polished preset has catppuccin theme, sound, cursor visible, hud visible", () => {
    const polished = BUILT_IN_PRESETS["polished"];
    expect(polished).toEqual({
      theme: "catppuccin",
      sound: { effects: { click: 1, key: 1 } },
      cursor: { visible: true },
      hud: { visible: true },
    });
  });

  it("minimal preset has tokyo-night theme, cursor visible, hud hidden, no sound", () => {
    const minimal = BUILT_IN_PRESETS["minimal"];
    expect(minimal).toEqual({
      theme: "tokyo-night",
      cursor: { visible: true },
      hud: { visible: false },
    });
  });

  it("demo preset has dracula theme, sound, cursor visible, hud visible", () => {
    const demo = BUILT_IN_PRESETS["demo"];
    expect(demo).toEqual({
      theme: "dracula",
      sound: { effects: { click: 1, key: 1 } },
      cursor: { visible: true },
      hud: { visible: true },
    });
  });

  it("silent preset has no theme, no sound, cursor hidden, hud hidden", () => {
    const silent = BUILT_IN_PRESETS["silent"];
    expect(silent).toEqual({
      cursor: { visible: false },
      hud: { visible: false },
    });
  });
});

describe("resolvePreset", () => {
  it("returns config unchanged when no preset field is present", () => {
    const config = { steps: [{ type: "launch", command: "bash" }] };
    expect(resolvePreset(config)).toEqual(config);
  });

  it("applies polished preset defaults", () => {
    const result = resolvePreset({
      preset: "polished",
      steps: [{ type: "launch", command: "bash" }],
    });

    expect(result).toEqual({
      theme: "catppuccin",
      sound: { effects: { click: 1, key: 1 } },
      cursor: { visible: true },
      hud: { visible: true },
      steps: [{ type: "launch", command: "bash" }],
    });
  });

  it("user theme overrides preset theme", () => {
    const result = resolvePreset({
      preset: "polished",
      theme: "tokyo-night",
      steps: [{ type: "launch", command: "bash" }],
    });

    expect(result.theme).toBe("tokyo-night");
  });

  it("user sound replaces preset sound entirely", () => {
    const result = resolvePreset({
      preset: "polished",
      sound: { effects: { key: 2 } },
      steps: [{ type: "launch", command: "bash" }],
    });

    // User provided sound, so it replaces preset sound entirely
    expect(result.sound).toEqual({ effects: { key: 2 } });
  });

  it("preset sound applies when user does not set sound", () => {
    const result = resolvePreset({
      preset: "polished",
      steps: [{ type: "launch", command: "bash" }],
    });

    expect(result.sound).toEqual({ effects: { click: 1, key: 1 } });
  });

  it("applies silent preset defaults", () => {
    const result = resolvePreset({
      preset: "silent",
      steps: [{ type: "launch", command: "bash" }],
    });

    expect(result).toEqual({
      cursor: { visible: false },
      hud: { visible: false },
      steps: [{ type: "launch", command: "bash" }],
    });
  });

  it("applies minimal preset defaults", () => {
    const result = resolvePreset({
      preset: "minimal",
      steps: [{ type: "launch", command: "bash" }],
    });

    expect(result).toEqual({
      theme: "tokyo-night",
      cursor: { visible: true },
      hud: { visible: false },
      steps: [{ type: "launch", command: "bash" }],
    });
  });

  it("strips the preset key from output", () => {
    const result = resolvePreset({
      preset: "polished",
      steps: [{ type: "launch", command: "bash" }],
    });

    expect(result).not.toHaveProperty("preset");
  });

  it("throws on unknown preset name", () => {
    expect(() =>
      resolvePreset({
        preset: "nonexistent",
        steps: [{ type: "launch", command: "bash" }],
      }),
    ).toThrow(/unknown preset/i);
  });

  it("preserves user config fields not in preset", () => {
    const result = resolvePreset({
      preset: "polished",
      fps: 60,
      cols: 120,
      steps: [{ type: "launch", command: "bash" }],
    });

    expect(result.fps).toBe(60);
    expect(result.cols).toBe(120);
    expect(result.theme).toBe("catppuccin");
  });

  it("user cursor overrides preset cursor", () => {
    const result = resolvePreset({
      preset: "polished",
      cursor: { visible: false },
      steps: [{ type: "launch", command: "bash" }],
    });

    expect(result.cursor).toEqual({ visible: false });
  });

  it("user hud overrides preset hud", () => {
    const result = resolvePreset({
      preset: "silent",
      hud: { visible: true },
      steps: [{ type: "launch", command: "bash" }],
    });

    expect(result.hud).toEqual({ visible: true });
  });
});
