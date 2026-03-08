import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { Command } from "commander";
import { afterEach, describe, expect, it } from "vitest";

import { ensureFfmpeg, type TimelineData } from "../../core/src/index.js";
import { validateConfig } from "../../core/src/config/parser.js";
import { registerCompositeCommand } from "../src/commands/composite.js";
import { registerInitCommand } from "../src/commands/init.js";
import { registerValidateCommand } from "../src/commands/validate.js";
import { createProgram } from "../src/index.js";

const tempDirectories: string[] = [];
const execFileAsync = promisify(execFile);

afterEach(async () => {
  process.exitCode = undefined;
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function makeTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "tuireel-cli-"));
  tempDirectories.push(directory);
  return directory;
}

async function runProgram(program: Command, args: string[]): Promise<number> {
  process.exitCode = undefined;
  await program.parseAsync(["node", "tuireel", ...args]);
  const exitCode = process.exitCode ?? 0;
  process.exitCode = undefined;
  return exitCode;
}

async function withNonInteractiveStdin<T>(run: () => Promise<T>): Promise<T> {
  const originalIsTTY = process.stdin.isTTY;
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value: false,
  });

  try {
    return await run();
  } finally {
    Object.defineProperty(process.stdin, "isTTY", {
      configurable: true,
      value: originalIsTTY,
    });
  }
}

async function runFfmpeg(ffmpegPath: string, args: string[]): Promise<void> {
  await execFileAsync(ffmpegPath, args, {
    maxBuffer: 10 * 1024 * 1024,
  });
}

function createTimingContractTimelineData(overrides: Partial<TimelineData> = {}): TimelineData {
  return {
    fps: 30,
    width: 320,
    height: 180,
    frameCount: 30,
    theme: {
      cursor: {
        color: "#ffffff",
        size: 18,
      },
      hud: {
        background: "#111827cc",
        color: "#f9fafb",
        fontSize: 16,
        fontFamily: "monospace",
        borderRadius: 8,
        position: "bottom",
      },
    },
    frames: [
      {
        frameIndex: 0,
        timeMs: 0,
        cursor: { x: 40, y: 36, visible: true },
        hud: null,
      },
    ],
    events: [],
    terminalFrames: [0],
    timingContract: {
      version: 1,
      outputFps: 30,
      captureFps: 12,
      wallClockDurationMs: 1_000,
      rawFrameCount: 12,
      outputFrameCount: 30,
      terminalFrameCount: 1,
      deliveryProfile: "readable-1080p",
    },
    ...overrides,
  };
}

async function createCompositeFixture(options: {
  configText: string;
  timelineData?: TimelineData;
}): Promise<{
  directory: string;
  configPath: string;
  outputPath: string;
}> {
  const directory = await makeTempDirectory();
  const ffmpegPath = await ensureFfmpeg();
  const configPath = join(directory, "demo.tuireel.jsonc");
  const outputPath = join(directory, "demo.mp4");
  const recordingsDirectory = join(directory, ".tuireel");
  const rawDirectory = join(recordingsDirectory, "raw");
  const timelineDirectory = join(recordingsDirectory, "timelines");
  const rawPath = join(rawDirectory, "demo.mp4");
  const timelinePath = join(timelineDirectory, "demo.timeline.json");

  await writeFile(configPath, options.configText, "utf8");
  await writeFile(join(directory, ".tuireel.jsonc"), options.configText, "utf8");
  await mkdir(rawDirectory, { recursive: true });
  await mkdir(timelineDirectory, { recursive: true });

  await runFfmpeg(ffmpegPath, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=#1f2937:s=320x180:d=1",
    "-r",
    "12",
    rawPath,
  ]);

  await writeFile(
    timelinePath,
    `${JSON.stringify(options.timelineData ?? createTimingContractTimelineData(), null, 2)}\n`,
    "utf8",
  );

  return { directory, configPath, outputPath };
}

async function captureConsole(run: () => Promise<number>): Promise<{
  exitCode: number;
  stdout: string[];
  stderr: string[];
}> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...values: unknown[]) => {
    stdout.push(values.map((value) => String(value)).join(" "));
  };
  console.error = (...values: unknown[]) => {
    stderr.push(values.map((value) => String(value)).join(" "));
  };

  try {
    const exitCode = await run();
    return { exitCode, stdout, stderr };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
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
    throw new Error("Expected wait step variant in persisted schema");
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
  const stepsSchema = properties?.steps as
    | {
        items?: Record<string, unknown>;
      }
    | undefined;

  if (!stepsSchema?.items) {
    throw new Error("Expected steps schema in single-video config variant");
  }

  const variants = schemaAlternatives(stepsSchema.items);
  return variants.flatMap((variant) => {
    const nestedVariants = schemaAlternatives(variant);
    return nestedVariants.length > 0 ? nestedVariants : [variant];
  });
}

describe("cli commands", () => {
  it("init writes .tuireel.jsonc with $schema and valid config", async () => {
    const directory = await makeTempDirectory();
    const configPath = join(directory, ".tuireel.jsonc");

    const previousTuireelHome = process.env.TUIREEL_HOME;
    process.env.TUIREEL_HOME = join(directory, ".tuireel-home");

    try {
      const program = new Command();
      registerInitCommand(program);

      const exitCode = await withNonInteractiveStdin(() =>
        runProgram(program, ["init", "--output", configPath]),
      );

      expect(exitCode).toBe(0);

      const rawConfig = await readFile(configPath, "utf8");
      expect(rawConfig).toContain("$schema");
      expect(rawConfig).toContain('"deliveryProfile": "readable-1080p"');
      expect(rawConfig).not.toContain('"preset"');

      const parsedConfig = validateConfig(rawConfig);
      expect(parsedConfig.deliveryProfile).toBe("readable-1080p");
      expect(parsedConfig.steps).toHaveLength(2);
      expect(parsedConfig.steps[0]).toMatchObject({
        type: "launch",
        command: "echo hello",
      });

      const schemaPath = join(process.env.TUIREEL_HOME, "schema.json");
      const rawSchema = await readFile(schemaPath, "utf8");
      const parsedSchema = JSON.parse(rawSchema) as {
        anyOf?: Array<Record<string, unknown>>;
        oneOf?: Array<Record<string, unknown>>;
      };

      const configVariants = topLevelConfigVariants(parsedSchema as Record<string, unknown>);
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
          deliveryProfile: expect.any(Object),
          format: expect.any(Object),
          output: expect.any(Object),
          fps: expect.any(Object),
          captureFps: expect.any(Object),
          cols: expect.any(Object),
          rows: expect.any(Object),
          steps: expect.any(Object),
        }),
      );
      expect((multiVideoVariant?.properties ?? {}) as Record<string, unknown>).toEqual(
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
          }),
          expect.objectContaining({
            properties: expect.objectContaining({
              type: expect.objectContaining({ const: "type" }),
              text: expect.any(Object),
            }),
          }),
          expect.objectContaining({
            properties: expect.objectContaining({
              type: expect.objectContaining({ const: "press" }),
              key: expect.any(Object),
            }),
          }),
          expect.objectContaining({
            properties: expect.objectContaining({
              type: expect.objectContaining({ const: "wait" }),
              pattern: expect.any(Object),
            }),
          }),
          expect.objectContaining({
            properties: expect.objectContaining({
              type: expect.objectContaining({ const: "pause" }),
              duration: expect.any(Object),
            }),
          }),
          expect.objectContaining({
            properties: expect.objectContaining({
              $include: expect.any(Object),
            }),
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
    } finally {
      if (previousTuireelHome === undefined) {
        delete process.env.TUIREEL_HOME;
      } else {
        process.env.TUIREEL_HOME = previousTuireelHome;
      }
    }
  });

  it("validate exits with code 0 for init-generated config", async () => {
    const directory = await makeTempDirectory();
    const configPath = join(directory, ".tuireel.jsonc");

    const previousTuireelHome = process.env.TUIREEL_HOME;
    process.env.TUIREEL_HOME = join(directory, ".tuireel-home");

    try {
      const initProgram = new Command();
      registerInitCommand(initProgram);
      const initExitCode = await withNonInteractiveStdin(() =>
        runProgram(initProgram, ["init", "--output", configPath]),
      );
      expect(initExitCode).toBe(0);

      const validateProgram = new Command();
      registerValidateCommand(validateProgram);

      const validateExitCode = await runProgram(validateProgram, ["validate", configPath]);

      expect(validateExitCode).toBe(0);
    } finally {
      if (previousTuireelHome === undefined) {
        delete process.env.TUIREEL_HOME;
      } else {
        process.env.TUIREEL_HOME = previousTuireelHome;
      }
    }
  });

  it("validate exits 1 for invalid config and mentions steps", async () => {
    const directory = await makeTempDirectory();
    const configPath = join(directory, "invalid.jsonc");
    await writeFile(configPath, '{"output":"demo.mp4"}\n', "utf8");

    const errors: string[] = [];
    const validateProgram = new Command();
    registerValidateCommand(validateProgram, {
      log: () => {
        // no-op
      },
      error: (message) => {
        errors.push(message);
      },
    });

    const exitCode = await runProgram(validateProgram, ["validate", configPath]);

    expect(exitCode).toBe(1);
    expect(errors.join("\n")).toMatch(/steps/i);
  });

  it("validate exits 1 for malformed JSONC and shows line and column", async () => {
    const directory = await makeTempDirectory();
    const configPath = join(directory, "malformed.jsonc");
    await writeFile(
      configPath,
      '{ "steps": [ { "type": "launch" "command": "echo hi" } ] }\n',
      "utf8",
    );

    const errors: string[] = [];
    const validateProgram = new Command();
    registerValidateCommand(validateProgram, {
      log: () => {
        // no-op
      },
      error: (message) => {
        errors.push(message);
      },
    });

    const exitCode = await runProgram(validateProgram, ["validate", configPath]);

    expect(exitCode).toBe(1);
    expect(errors.join("\n")).toMatch(/line \d+, column \d+/i);
  });

  it("--help output lists all configured commands", () => {
    const helpOutput = createProgram().helpInformation();

    expect(helpOutput).toContain("init");
    expect(helpOutput).toContain("validate");
    expect(helpOutput).toContain("record");
    expect(helpOutput).toContain("preview");
    expect(helpOutput).toContain("composite");
  });

  it("composite allows packaging-only recomposition from saved timing artifacts", async () => {
    const config = `{
  "output": "demo.mp4",
  "deliveryProfile": "readable-1080p",
  "format": "gif",
  "captureFps": 12,
  "theme": "dracula",
  "trim": { "leadingStatic": true },
  "outputSize": { "width": 640, "height": 360, "padding": 24 },
  "steps": [{ "type": "launch", "command": "echo hello" }]
}\n`;
    const fixture = await createCompositeFixture({ configText: config });
    const program = new Command();
    registerCompositeCommand(program);

    const originalCwd = process.cwd();
    process.chdir(fixture.directory);

    try {
      const result = await captureConsole(() =>
        runProgram(program, ["composite", fixture.configPath]),
      );

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toEqual([]);
      expect(await stat(join(fixture.directory, "demo.gif"))).toMatchObject({
        size: expect.any(Number),
      });
      expect(result.stdout.join("\n")).toContain("Composite complete:");
    } finally {
      process.chdir(originalCwd);
    }
  }, 120_000);

  it("composite rejects timing-affecting changes with rerun guidance", async () => {
    const config = `{
  "output": "demo.mp4",
  "deliveryProfile": "readable-1080p",
  "fps": 24,
  "captureFps": 12,
  "steps": [{ "type": "launch", "command": "echo hello" }]
}\n`;
    const fixture = await createCompositeFixture({ configText: config });
    const program = new Command();
    registerCompositeCommand(program);

    const originalCwd = process.cwd();
    process.chdir(fixture.directory);

    try {
      const result = await captureConsole(() =>
        runProgram(program, ["composite", fixture.configPath]),
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr.join("\n")).toContain("Re-run `tuireel record`");
      expect(result.stderr.join("\n")).toContain("output fps 30");
      expect(result.stderr.join("\n")).toContain("requested output fps 24");
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("composite treats legacy timelines conservatively", async () => {
    const baseConfig = `{
  "output": "demo.mp4",
  "trim": { "leadingStatic": true },
  "steps": [{ "type": "launch", "command": "echo hello" }]
}\n`;
    const legacyTimeline = createTimingContractTimelineData();
    delete legacyTimeline.timingContract;

    const fixture = await createCompositeFixture({
      configText: baseConfig,
      timelineData: legacyTimeline,
    });
    const program = new Command();
    registerCompositeCommand(program);
    const originalCwd = process.cwd();
    process.chdir(fixture.directory);

    try {
      const packagingOnly = await captureConsole(() =>
        runProgram(program, ["composite", fixture.configPath]),
      );
      expect(packagingOnly.exitCode).toBe(0);
      expect(await stat(fixture.outputPath)).toMatchObject({ size: expect.any(Number) });

      const timingConfigPath = join(fixture.directory, "timing-change.tuireel.jsonc");
      await writeFile(
        timingConfigPath,
        `{
  "output": "demo.mp4",
  "deliveryProfile": "readable-1080p",
  "fps": 24,
  "captureFps": 12,
  "steps": [{ "type": "launch", "command": "echo hello" }]
}\n`,
        "utf8",
      );

      const timingChange = await captureConsole(() =>
        runProgram(program, ["composite", timingConfigPath]),
      );
      expect(timingChange.exitCode).toBe(1);
      expect(timingChange.stderr.join("\n")).toContain("legacy timing metadata");
      expect(timingChange.stderr.join("\n")).toContain("Re-run `tuireel record`");
    } finally {
      process.chdir(originalCwd);
    }
  }, 120_000);
});
