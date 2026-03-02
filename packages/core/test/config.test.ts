import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  ConfigValidationError,
  loadConfig,
  validateConfig,
} from "../src/config/parser.js";
import { generateJsonSchema } from "../src/config/generate-schema.js";

const VALID_MINIMAL_CONFIG = `{
  "steps": [{ "type": "launch", "command": "npm run dev" }]
}`;

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

function captureValidationError(input: string): ConfigValidationError {
  try {
    validateConfig(input);
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigValidationError);
    return error as ConfigValidationError;
  }

  throw new Error("Expected validateConfig to throw ConfigValidationError");
}

describe("config parser", () => {
  it("parses a valid minimal config from disk", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tuireel-config-"));
    tempDirectories.push(directory);

    const filePath = join(directory, ".tuireel.jsonc");
    await writeFile(filePath, VALID_MINIMAL_CONFIG, "utf8");

    const config = await loadConfig(filePath);

    expect(config.steps).toHaveLength(1);
    expect(config.steps[0]).toMatchObject({
      type: "launch",
      command: "npm run dev",
    });
  });

  it("parses config containing JSONC comments", () => {
    const config = validateConfig(`{
      // comment before steps
      "steps": [
        {
          "type": "launch",
          "command": "pnpm dev"
        }
      ]
    }`);

    expect(config.steps[0]).toMatchObject({ type: "launch", command: "pnpm dev" });
  });

  it("accepts $schema but strips it from validated output", () => {
    const config = validateConfig(`{
      "$schema": "https://example.com/tuireel.schema.json",
      "steps": [{ "type": "launch", "command": "echo hello" }]
    }`);

    expect(config).not.toHaveProperty("$schema");
  });

  it("reports missing required steps with actionable message", () => {
    const error = captureValidationError(`{
      "output": "demo.mp4"
    }`);

    expect(error.message).toMatch(/steps/i);
    expect(error.issues.some((issue) => issue.path.includes("steps"))).toBe(true);
  });

  it("reports invalid step type and lists valid options", () => {
    const error = captureValidationError(`{
      "steps": [{ "type": "invalid-step", "command": "echo nope" }]
    }`);

    expect(error.message).toMatch(/launch/i);
    expect(error.message).toMatch(/press/i);
    expect(error.message).toMatch(/wait/i);
    expect(error.message).toMatch(/pause/i);
  });

  it("applies config defaults for output, fps, cols, and rows", () => {
    const config = validateConfig(VALID_MINIMAL_CONFIG);

    expect(config.output).toBe("output.mp4");
    expect(config.fps).toBe(30);
    expect(config.cols).toBe(80);
    expect(config.rows).toBe(24);
  });

  it("generates JSON Schema with config fields and step variants", () => {
    const jsonSchema = generateJsonSchema() as {
      $schema?: string;
      type?: string;
      properties?: Record<string, unknown>;
      required?: unknown;
    };

    expect(jsonSchema).toBeTypeOf("object");
    expect(jsonSchema.$schema).toContain("json-schema.org/draft");
    expect(jsonSchema.type).toBe("object");
    expect(jsonSchema.properties).toEqual(
      expect.objectContaining({
        output: expect.any(Object),
        fps: expect.any(Object),
        cols: expect.any(Object),
        rows: expect.any(Object),
        steps: expect.any(Object),
      }),
    );

    expect(Array.isArray(jsonSchema.required)).toBe(true);
    expect(jsonSchema.required).toContain("steps");

    const properties = jsonSchema.properties as Record<string, unknown>;
    const stepsSchema = properties.steps as {
      items?: {
        oneOf?: Array<Record<string, unknown>>;
      };
    };

    expect(stepsSchema.items).toBeDefined();
    expect(Array.isArray(stepsSchema.items?.oneOf)).toBe(true);

    const variants = stepsSchema.items?.oneOf ?? [];

    expect(variants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "launch" }),
            command: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "command"]),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "type" }),
            text: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "text"]),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "press" }),
            key: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "key"]),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "wait" }),
            pattern: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "pattern"]),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "pause" }),
            duration: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "duration"]),
        }),
      ]),
    );
  });
});
