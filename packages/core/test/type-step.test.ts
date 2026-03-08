import { describe, expect, it } from "vitest";

import { charDelay } from "../src/executor/timing.js";
import { typeStep } from "../src/executor/steps/type.js";
import type { CadenceProfile } from "../src/executor/pacing/profiles.js";

class FakeSession {
  readonly writes: string[] = [];
  idleCalls = 0;

  writeRaw(text: string): void {
    this.writes.push(text);
  }

  async waitIdle(): Promise<void> {
    this.idleCalls += 1;
  }
}

const profile: CadenceProfile = {
  baseSpeedMs: 120,
  firstCharExtra: 0,
  punctuationExtra: 0,
  whitespaceExtra: 0,
  pathSepExtra: 0,
  beats: {
    startup: 40,
    settle: 20,
    read: 15,
    idle: 10,
  },
};

async function characterTimings(options?: {
  speed?: number;
  profile?: CadenceProfile;
}): Promise<number[]> {
  const session = new FakeSession();
  const startedAt = performance.now();
  const seen: number[] = [];

  await typeStep(session as never, "ab", options?.speed, options?.profile, async () => {
    seen.push(performance.now() - startedAt);
  });

  return seen;
}

describe("typeStep", () => {
  it("reports each typed character in order", async () => {
    const session = new FakeSession();
    const seen: string[] = [];

    await typeStep(session as never, "abc", 1, undefined, async (char, index) => {
      seen.push(`${index}:${char}`);
    });

    expect(session.writes).toEqual(["a", "b", "c"]);
    expect(seen).toEqual(["0:a", "1:b", "2:c"]);
    expect(session.idleCalls).toBe(1);
  });

  it("uses the profile base speed when no explicit speed override is provided", async () => {
    const timings = await characterTimings({ profile });
    const expectedFirst = charDelay(profile.baseSpeedMs, {
      text: "ab",
      char: "a",
      index: 0,
    });

    expect(timings[0]).toBeGreaterThanOrEqual(expectedFirst - 15);
  });

  it("lets the per-step speed override win over the profile base speed", async () => {
    const timings = await characterTimings({ speed: 1, profile });
    const expectedFirst = charDelay(1, {
      text: "ab",
      char: "a",
      index: 0,
    });

    expect(timings[0]).toBeGreaterThanOrEqual(expectedFirst - 5);
    expect(timings[0]).toBeLessThan(profile.baseSpeedMs - 20);
  });

  it("falls back to the legacy default speed when no profile or override is provided", async () => {
    const timings = await characterTimings();
    const expectedFirst = charDelay(50, {
      text: "ab",
      char: "a",
      index: 0,
    });

    expect(timings[0]).toBeGreaterThanOrEqual(expectedFirst - 15);
  });
});
