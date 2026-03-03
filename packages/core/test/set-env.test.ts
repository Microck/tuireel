import { describe, expect, it } from "vitest";

import { ConfigValidationError, validateConfig } from "../src/config/parser.js";
import { executeSteps } from "../src/executor/step-executor.js";
import { createSession } from "../src/session.js";

function getValidationError(config: string): ConfigValidationError {
  try {
    validateConfig(config);
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigValidationError);
    return error as ConfigValidationError;
  }

  throw new Error("Expected config validation to fail");
}

describe("set-env step", () => {
  it("applies runtime env updates that subsequent commands can read", async () => {
    const key = "TUIREEL_RUNTIME_SET_ENV";
    const value = "value with spaces and 'quotes'";
    const marker = "__TUIREEL_SET_ENV_RESULT__";
    const printCommand = `printf '${marker}:%s\\n' "$${key}"`;

    const session = await createSession({
      command: "sh",
      cols: 80,
      rows: 24,
      env: {},
    });

    try {
      await executeSteps(session, [
        { type: "set-env", key, value },
        { type: "type", text: printCommand, speed: 1 },
        { type: "press", key: "Enter" },
        {
          type: "wait",
          pattern: `${marker}:${value}`,
          timeout: 5_000,
        },
      ]);

      expect(session.env[key]).toBe(value);
    } finally {
      session.close();
    }
  });

  it("rejects invalid set-env keys during config validation", () => {
    const error = getValidationError(`{
      "steps": [
        { "type": "set-env", "key": "9INVALID-KEY", "value": "hello" }
      ]
    }`);

    expect(error.issues.some((issue) => issue.path === "steps.0.key")).toBe(true);
    expect(error.message).toMatch(/set-env key must start with a letter or underscore/i);
  });
});
