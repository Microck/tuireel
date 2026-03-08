import { describe, expect, it } from "vitest";

import { CADENCE_PROFILES } from "../src/executor/pacing/profiles.js";
import { charDelay } from "../src/executor/timing.js";

function legacyDelay(
  baseMs: number,
  context?: { text: string; char: string; index: number },
): number {
  if (!context) {
    return Math.max(1, baseMs);
  }

  const { text, char, index } = context;
  const safeBaseMs = Math.max(1, baseMs);
  const previousChar = index > 0 ? (text[index - 1] ?? "") : "";

  let hash = 2166136261;
  const seed = `${safeBaseMs}:${index}:${char}:${text.length}`;

  for (let seedIndex = 0; seedIndex < seed.length; seedIndex += 1) {
    hash ^= seed.charCodeAt(seedIndex);
    hash = Math.imul(hash, 16777619);
  }

  const jitter = (hash >>> 0) / 0xffffffff;
  let multiplier = 0.76 + jitter * 0.24;

  if (index === 0) {
    multiplier += 0.24;
  }

  if (char === "/") {
    multiplier += 0.08;
  }

  if (/\s/.test(char)) {
    multiplier += 0.28;
  }

  if (/[.,!?;:]/.test(char)) {
    multiplier += 0.22;
  }

  if (/[\/_.-]/.test(previousChar)) {
    multiplier += 0.06;
  }

  return Math.max(12, Math.round(safeBaseMs * multiplier));
}

describe("charDelay", () => {
  it("is deterministic for the same typing context", () => {
    const first = charDelay(135, {
      text: "/help",
      char: "h",
      index: 1,
    });

    const second = charDelay(135, {
      text: "/help",
      char: "h",
      index: 1,
    });

    expect(first).toBe(second);
  });

  it("adds a slower first keystroke than the following character", () => {
    const first = charDelay(135, {
      text: "/help",
      char: "/",
      index: 0,
    });
    const second = charDelay(135, {
      text: "/help",
      char: "h",
      index: 1,
    });

    expect(first).toBeGreaterThan(second);
  });

  it("keeps legacy delays when no profile is provided", () => {
    const context = {
      text: "npm run dev",
      char: " ",
      index: 3,
    };

    expect(charDelay(72, context)).toBe(legacyDelay(72, context));
  });

  it("uses profile extras instead of legacy hardcoded values", () => {
    const context = {
      text: "/help",
      char: "/",
      index: 0,
    };

    expect(charDelay(65, context, CADENCE_PROFILES.relaxed)).toBe(96);
  });

  it("makes brisk typing faster than relaxed for the same input", () => {
    const context = {
      text: "./demo",
      char: ".",
      index: 0,
    };

    const relaxed = charDelay(65, context, CADENCE_PROFILES.relaxed);
    const brisk = charDelay(38, context, CADENCE_PROFILES.brisk);

    expect(brisk).toBeLessThan(relaxed);
  });

  it("stays deterministic when a profile is provided", () => {
    const context = {
      text: "./demo",
      char: "/",
      index: 1,
    };

    const first = charDelay(90, context, CADENCE_PROFILES.deliberate);
    const second = charDelay(90, context, CADENCE_PROFILES.deliberate);

    expect(first).toBe(second);
  });
});
