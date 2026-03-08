import { describe, expect, it } from "vitest";

import { executeSteps } from "../../src/executor/step-executor.js";
import type { Step } from "../../src/executor/step-executor.js";
import { resolveBeatType } from "../../src/executor/pacing/beats.js";
import type { CadenceProfile } from "../../src/executor/pacing/profiles.js";

function step<T extends Step["type"]>(type: T): Extract<Step, { type: T }> {
  switch (type) {
    case "launch":
      return { type, command: "pnpm dev" } as Extract<Step, { type: T }>;
    case "type":
      return { type, text: "hello" } as Extract<Step, { type: T }>;
    case "press":
      return { type, key: "Enter" } as Extract<Step, { type: T }>;
    case "wait":
      return { type, pattern: "ready" } as Extract<Step, { type: T }>;
    case "pause":
      return { type, duration: 250 } as Extract<Step, { type: T }>;
    case "scroll":
      return { type, direction: "down", amount: 1 } as Extract<Step, { type: T }>;
    case "click":
      return { type, pattern: "Submit" } as Extract<Step, { type: T }>;
    case "screenshot":
      return { type, output: "frame.png" } as Extract<Step, { type: T }>;
    case "resize":
      return { type, cols: 80, rows: 24 } as Extract<Step, { type: T }>;
    case "set-env":
      return { type, key: "TUIREEL_TEST", value: "1" } as Extract<Step, { type: T }>;
  }
}

class FakeSession {
  readonly pressed: unknown[] = [];
  idleCalls = 0;

  async press(key: unknown): Promise<void> {
    this.pressed.push(key);
  }

  async waitIdle(): Promise<void> {
    this.idleCalls += 1;
  }
}

const testProfile: CadenceProfile = {
  baseSpeedMs: 1,
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

async function elapsedMs(run: () => Promise<void>): Promise<number> {
  const startedAt = performance.now();
  await run();
  return performance.now() - startedAt;
}

describe("resolveBeatType", () => {
  it("returns null before the first step", () => {
    expect(resolveBeatType(undefined, step("launch"))).toBeNull();
  });

  it("returns startup when a launch step precedes a type step", () => {
    expect(resolveBeatType(step("launch"), step("type"))).toBe("startup");
  });

  it("returns settle when a wait step precedes a type step", () => {
    expect(resolveBeatType(step("wait"), step("type"))).toBe("settle");
  });

  it("returns read when typing follows a non-launch, non-wait step", () => {
    expect(resolveBeatType(step("press"), step("type"))).toBe("read");
  });

  it("returns idle for non-type steps after ordinary actions", () => {
    expect(resolveBeatType(step("press"), step("wait"))).toBe("idle");
  });

  it("returns null before authored pauses", () => {
    expect(resolveBeatType(step("type"), step("pause"))).toBeNull();
  });

  it("returns null after authored pauses", () => {
    expect(resolveBeatType(step("pause"), step("type"))).toBeNull();
  });

  it("keeps launch transitions on startup for non-pause steps", () => {
    expect(resolveBeatType(step("launch"), step("press"))).toBe("startup");
    expect(resolveBeatType(step("launch"), step("wait"))).toBe("startup");
  });
});

describe("executeSteps pacing beats", () => {
  it("injects the startup beat after launch when pacing is configured", async () => {
    const session = new FakeSession();

    const elapsed = await elapsedMs(async () => {
      await executeSteps(session as never, [step("launch"), step("press")], {
        pacing: testProfile,
      });
    });

    expect(elapsed).toBeGreaterThanOrEqual(testProfile.beats.startup - 5);
    expect(session.pressed).toEqual(["enter"]);
  });

  it("keeps legacy behavior when pacing is not configured", async () => {
    const session = new FakeSession();

    const elapsed = await elapsedMs(async () => {
      await executeSteps(session as never, [step("launch"), step("press")]);
    });

    expect(elapsed).toBeLessThan(testProfile.beats.startup - 5);
    expect(session.pressed).toEqual(["enter"]);
  });

  it("does not add beats next to authored pause steps", async () => {
    const session = new FakeSession();
    const authoredPause = { type: "pause", duration: 15 } as const;

    const elapsed = await elapsedMs(async () => {
      await executeSteps(session as never, [step("launch"), authoredPause, step("press")], {
        pacing: testProfile,
      });
    });

    expect(elapsed).toBeGreaterThanOrEqual(authoredPause.duration);
    expect(elapsed).toBeLessThan(testProfile.beats.startup + 10);
  });
});
