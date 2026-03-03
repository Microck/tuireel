import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

const VALID_CUSTOM_THEME = {
  background: "#101010",
  foreground: "#f0f0f0",
  cursor: "#ffffff",
  colors: {
    black: "#111111",
    red: "#aa0000",
    green: "#00aa00",
    yellow: "#aaaa00",
    blue: "#0000aa",
    magenta: "#aa00aa",
    cyan: "#00aaaa",
    white: "#aaaaaa",
    brightBlack: "#555555",
    brightRed: "#ff5555",
    brightGreen: "#55ff55",
    brightYellow: "#ffff55",
    brightBlue: "#5555ff",
    brightMagenta: "#ff55ff",
    brightCyan: "#55ffff",
    brightWhite: "#ffffff",
  },
};

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

function waitPatternAlternativesFromStepsSchema(
  variants: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const waitVariant = variants.find((variant) => {
    const properties = variant.properties as Record<string, unknown> | undefined;
    const typeProperty = properties?.type as { const?: unknown } | undefined;
    return typeProperty?.const === "wait";
  });

  if (!waitVariant) {
    throw new Error("Expected wait step variant in generated schema");
  }

  const waitProperties = waitVariant.properties as Record<string, unknown>;
  const patternSchema = waitProperties.pattern as {
    anyOf?: Array<Record<string, unknown>>;
    oneOf?: Array<Record<string, unknown>>;
  };

  return patternSchema.anyOf ?? patternSchema.oneOf ?? [];
}

function schemaAlternatives(schema: Record<string, unknown>): Array<Record<string, unknown>> {
  const anyOf = schema.anyOf as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(anyOf)) {
    return anyOf;
  }

  const oneOf = schema.oneOf as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(oneOf)) {
    return oneOf;
  }

  return [];
}

function topLevelConfigVariants(schema: Record<string, unknown>): Array<Record<string, unknown>> {
  const variants = schemaAlternatives(schema);
  return variants.length > 0 ? variants : [schema];
}

function stepVariantsFromConfigVariant(
  configVariant: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const properties = configVariant.properties as Record<string, unknown> | undefined;
  const stepsSchema = properties?.steps as {
    items?: Record<string, unknown>;
  } | undefined;

  if (!stepsSchema?.items) {
    throw new Error("Expected steps schema on single-video config variant");
  }

  const variants = schemaAlternatives(stepsSchema.items);
  return variants.flatMap((variant) => {
    const nestedVariants = schemaAlternatives(variant);
    return nestedVariants.length > 0 ? nestedVariants : [variant];
  });
}

describe("config parser", () => {
  it("parses a valid minimal config from disk", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tuireel-config-"));
    tempDirectories.push(directory);

    const filePath = join(directory, ".tuireel.jsonc");
    await writeFile(filePath, VALID_MINIMAL_CONFIG, "utf8");

    const configs = await loadConfig(filePath);
    const [config] = configs;

    expect(configs).toHaveLength(1);
    expect(config).toBeDefined();
    expect(config.steps).toHaveLength(1);
    expect(config.steps[0]).toMatchObject({
      type: "launch",
      command: "npm run dev",
    });
  });

  it("resolves $include directives relative to the including config file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tuireel-include-"));
    tempDirectories.push(directory);

    const snippetsDir = join(directory, "snippets");
    await mkdir(snippetsDir, { recursive: true });
    await writeFile(
      join(snippetsDir, "shared-steps.jsonc"),
      `{
        "steps": [
          { "type": "type", "text": "pnpm test" },
          { "type": "press", "key": "Enter" }
        ]
      }`,
      "utf8",
    );

    const configPath = join(directory, ".tuireel.jsonc");
    await writeFile(
      configPath,
      `{
        "steps": [
          { "type": "launch", "command": "pnpm dev" },
          { "$include": "./snippets/shared-steps.jsonc" },
          { "type": "wait", "pattern": "ready" }
        ]
      }`,
      "utf8",
    );

    const [config] = await loadConfig(configPath);

    expect(config).toBeDefined();
    expect(config.steps).toEqual([
      { type: "launch", command: "pnpm dev" },
      { type: "type", text: "pnpm test" },
      { type: "press", key: "Enter" },
      { type: "wait", pattern: "ready" },
    ]);
  });

  it("expands multi-video configs with defaults merged per video", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tuireel-multi-"));
    tempDirectories.push(directory);

    const configPath = join(directory, "multi.jsonc");
    await writeFile(
      configPath,
      `{
        "defaults": {
          "format": "webm",
          "fps": 60,
          "cols": 120,
          "rows": 30
        },
        "videos": [
          {
            "name": "intro",
            "output": "intro.webm",
            "steps": [
              { "type": "launch", "command": "echo intro" }
            ]
          },
          {
            "name": "demo",
            "output": "demo.webm",
            "format": "gif",
            "steps": [
              { "type": "launch", "command": "echo demo" }
            ]
          }
        ]
      }`,
      "utf8",
    );

    const configs = await loadConfig(configPath);

    expect(configs).toHaveLength(2);
    expect(configs[0]).toMatchObject({
      output: "intro.webm",
      format: "webm",
      fps: 60,
      cols: 120,
      rows: 30,
      steps: [{ type: "launch", command: "echo intro" }],
    });
    expect(configs[1]).toMatchObject({
      output: "demo.webm",
      format: "gif",
      fps: 60,
      cols: 120,
      rows: 30,
      steps: [{ type: "launch", command: "echo demo" }],
    });
  });

  it("reports circular includes with a clear validation error", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tuireel-cycle-"));
    tempDirectories.push(directory);

    await writeFile(
      join(directory, "a.jsonc"),
      `{
        "steps": [
          { "$include": "./b.jsonc" }
        ]
      }`,
      "utf8",
    );

    await writeFile(
      join(directory, "b.jsonc"),
      `{
        "steps": [
          { "$include": "./a.jsonc" }
        ]
      }`,
      "utf8",
    );

    const configPath = join(directory, ".tuireel.jsonc");
    await writeFile(
      configPath,
      `{
        "steps": [
          { "type": "launch", "command": "echo cycle" },
          { "$include": "./a.jsonc" }
        ]
      }`,
      "utf8",
    );

    await expect(loadConfig(configPath)).rejects.toThrow(/Circular include detected:/);
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

  it("accepts wait step with plain text pattern", () => {
    const config = validateConfig(`{
      "steps": [{ "type": "wait", "pattern": "Ready" }]
    }`);

    expect(config.steps[0]).toEqual({
      type: "wait",
      pattern: "Ready",
    });
  });

  it("accepts wait step with regex pattern and flags", () => {
    const config = validateConfig(`{
      "steps": [{ "type": "wait", "pattern": { "regex": "Ready|Done", "flags": "i" } }]
    }`);

    expect(config.steps[0]).toEqual({
      type: "wait",
      pattern: {
        regex: "Ready|Done",
        flags: "i",
      },
    });
  });

  it("rejects invalid wait regex payloads with pattern issues", () => {
    const malformedPatternError = captureValidationError(`{
      "steps": [{ "type": "wait", "pattern": { "regex": "(", "flags": "i" } }]
    }`);

    expect(
      malformedPatternError.issues.some((issue) => issue.path.includes("steps.0.pattern")),
    ).toBe(true);
    expect(malformedPatternError.message).toMatch(/invalid regular expression/i);

    const invalidFlagsError = captureValidationError(`{
      "steps": [{ "type": "wait", "pattern": { "regex": "Ready", "flags": "q" } }]
    }`);

    expect(invalidFlagsError.issues.some((issue) => issue.path.includes("steps.0.pattern"))).toBe(
      true,
    );
    expect(invalidFlagsError.message).toMatch(/invalid regular expression/i);
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

    expect(config.format).toBe("mp4");
    expect(config.output).toBe("output.mp4");
    expect(config.fps).toBe(30);
    expect(config.cols).toBe(80);
    expect(config.rows).toBe(24);
  });

  it("accepts explicit output format", () => {
    const config = validateConfig(`{
      "format": "webm",
      "output": "demo.webm",
      "steps": [{ "type": "launch", "command": "echo ok" }]
    }`);

    expect(config.format).toBe("webm");
    expect(config.output).toBe("demo.webm");
  });

  it("accepts built-in theme names in config", () => {
    const config = validateConfig(`{
      "theme": "dracula",
      "steps": [{ "type": "launch", "command": "echo themed" }]
    }`);

    expect(config.theme).toBe("dracula");
  });

  it("accepts custom theme objects in config", () => {
    const config = validateConfig(
      JSON.stringify({
        theme: {
          ...VALID_CUSTOM_THEME,
          padding: 4,
          fontFamily: "./fonts/jetbrains-mono.ttf",
          fontSize: 16,
        },
        steps: [{ type: "launch", command: "echo themed" }],
      }),
    );

    expect(config.theme).toEqual({
      ...VALID_CUSTOM_THEME,
      padding: 4,
      fontFamily: "./fonts/jetbrains-mono.ttf",
      fontSize: 16,
    });
  });

  it("rejects invalid custom theme colors", () => {
    const error = captureValidationError(
      JSON.stringify({
        theme: {
          ...VALID_CUSTOM_THEME,
          colors: {
            ...VALID_CUSTOM_THEME.colors,
            brightWhite: "white",
          },
        },
        steps: [{ type: "launch", command: "echo themed" }],
      }),
    );

    expect(error.issues.some((issue) => issue.path.includes("theme.colors.brightWhite"))).toBe(true);
    expect(error.message).toMatch(/#RRGGBB/i);
  });

  it("generates JSON Schema with config fields and step variants", () => {
    const jsonSchema = generateJsonSchema() as {
      $schema?: string;
      anyOf?: Array<Record<string, unknown>>;
      oneOf?: Array<Record<string, unknown>>;
    };

    expect(jsonSchema).toBeTypeOf("object");
    expect(jsonSchema.$schema).toContain("json-schema.org/draft");

    const configVariants = topLevelConfigVariants(jsonSchema as Record<string, unknown>);

    const singleVideoVariant = configVariants.find((variant) => {
      const properties = variant.properties as Record<string, unknown> | undefined;
      return properties?.steps !== undefined;
    });
    const multiVideoVariant = configVariants.find((variant) => {
      const properties = variant.properties as Record<string, unknown> | undefined;
      return properties?.videos !== undefined;
    });

    expect(singleVideoVariant).toBeDefined();
    expect(multiVideoVariant).toBeDefined();

    const singleProperties = (singleVideoVariant?.properties ?? {}) as Record<string, unknown>;
    expect(singleProperties).toEqual(
      expect.objectContaining({
        format: expect.any(Object),
        output: expect.any(Object),
        theme: expect.any(Object),
        fps: expect.any(Object),
        cols: expect.any(Object),
        rows: expect.any(Object),
        steps: expect.any(Object),
      }),
    );

    const multiProperties = (multiVideoVariant?.properties ?? {}) as Record<string, unknown>;
    expect(multiProperties).toEqual(
      expect.objectContaining({
        defaults: expect.any(Object),
        videos: expect.any(Object),
      }),
    );

    const variants = stepVariantsFromConfigVariant(singleVideoVariant as Record<string, unknown>);

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
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "scroll" }),
            direction: expect.any(Object),
            amount: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "direction"]),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "click" }),
            pattern: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "pattern"]),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "screenshot" }),
            output: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "output"]),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "resize" }),
            cols: expect.any(Object),
            rows: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "cols", "rows"]),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            type: expect.objectContaining({ const: "set-env" }),
            key: expect.any(Object),
            value: expect.any(Object),
          }),
          required: expect.arrayContaining(["type", "key", "value"]),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            $include: expect.any(Object),
          }),
          required: expect.arrayContaining(["$include"]),
        }),
      ]),
    );

    const waitPatternAlternatives = waitPatternAlternativesFromStepsSchema(variants);

    expect(waitPatternAlternatives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "string",
          minLength: 1,
        }),
        expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            regex: expect.objectContaining({
              type: "string",
              minLength: 1,
            }),
            flags: expect.objectContaining({
              type: "string",
            }),
          }),
          required: expect.arrayContaining(["regex"]),
        }),
      ]),
    );
  });
});
