import { describe, expect, it } from "vitest";

import {
  CADENCE_PROFILES,
  CADENCE_PROFILE_NAMES,
  resolveProfile,
  type CadenceProfile,
} from "../../src/executor/pacing/profiles.js";

describe("cadence profiles", () => {
  it("resolves the relaxed profile by name", () => {
    expect(resolveProfile("relaxed")).toMatchObject({
      baseSpeedMs: 65,
      beats: {
        startup: 800,
        settle: 500,
        read: 400,
        idle: 250,
      },
    });
  });

  it("resolves the brisk profile by name", () => {
    expect(resolveProfile("brisk")).toMatchObject({
      baseSpeedMs: 38,
      beats: {
        startup: 400,
        settle: 250,
        read: 200,
        idle: 120,
      },
    });
  });

  it("resolves the deliberate profile by name", () => {
    expect(resolveProfile("deliberate")).toMatchObject({
      baseSpeedMs: 90,
      beats: {
        startup: 1200,
        settle: 700,
        read: 600,
        idle: 350,
      },
    });
  });

  it("returns undefined when no profile is configured", () => {
    expect(resolveProfile(undefined)).toBeUndefined();
  });

  it("returns inline profiles as-is", () => {
    const inlineProfile: CadenceProfile = {
      baseSpeedMs: 52,
      firstCharExtra: 0.18,
      punctuationExtra: 0.21,
      whitespaceExtra: 0.25,
      pathSepExtra: 0.07,
      beats: {
        startup: 500,
        settle: 320,
        read: 240,
        idle: 160,
      },
    };

    expect(resolveProfile(inlineProfile)).toBe(inlineProfile);
  });

  it("ships only positive built-in timing values", () => {
    for (const profile of Object.values(CADENCE_PROFILES)) {
      expect(profile.baseSpeedMs).toBeGreaterThan(0);
      expect(profile.beats.startup).toBeGreaterThan(0);
      expect(profile.beats.settle).toBeGreaterThan(0);
      expect(profile.beats.read).toBeGreaterThan(0);
      expect(profile.beats.idle).toBeGreaterThan(0);
    }
  });

  it("exports the built-in profile names in order", () => {
    expect(CADENCE_PROFILE_NAMES).toEqual(["relaxed", "brisk", "deliberate"]);
  });
});
