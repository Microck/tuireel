import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Command } from "commander";
import { afterEach, describe, expect, it } from "vitest";

import { validateConfig } from "../../core/src/config/parser.js";
import { registerInitCommand } from "../src/commands/init.js";
import {
  registerValidateCommand,
} from "../src/commands/validate.js";
import { createProgram } from "../src/index.js";

const tempDirectories: string[] = [];

afterEach(async () => {
  process.exitCode = undefined;
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
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

describe("cli commands", () => {
  it("init writes .tuireel.jsonc with $schema and valid config", async () => {
    const directory = await makeTempDirectory();
    const configPath = join(directory, ".tuireel.jsonc");

    const previousTuireelHome = process.env.TUIREEL_HOME;
    process.env.TUIREEL_HOME = join(directory, ".tuireel-home");

    try {
      const program = new Command();
      registerInitCommand(program);

      const exitCode = await runProgram(program, ["init", "--output", configPath]);

      expect(exitCode).toBe(0);

      const rawConfig = await readFile(configPath, "utf8");
      expect(rawConfig).toContain("$schema");

      const parsedConfig = validateConfig(rawConfig);
      expect(parsedConfig.steps).toHaveLength(2);
      expect(parsedConfig.steps[0]).toMatchObject({
        type: "launch",
        command: "echo hello",
      });

      const schemaPath = join(process.env.TUIREEL_HOME, "schema.json");
      const rawSchema = await readFile(schemaPath, "utf8");
      const parsedSchema = JSON.parse(rawSchema) as {
        type?: string;
        properties?: Record<string, unknown>;
        required?: unknown;
      };

      expect(parsedSchema.type).toBe("object");
      expect(parsedSchema.properties).toEqual(
        expect.objectContaining({
          output: expect.any(Object),
          fps: expect.any(Object),
          cols: expect.any(Object),
          rows: expect.any(Object),
          steps: expect.any(Object),
        }),
      );
      expect(Array.isArray(parsedSchema.required)).toBe(true);
      expect(parsedSchema.required).toContain("steps");

      const stepsSchema = (parsedSchema.properties as Record<string, unknown>).steps as {
        items?: {
          oneOf?: Array<Record<string, unknown>>;
        };
      };
      const variants = stepsSchema.items?.oneOf ?? [];

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
      const initExitCode = await runProgram(initProgram, [
        "init",
        "--output",
        configPath,
      ]);
      expect(initExitCode).toBe(0);

      const validateProgram = new Command();
      registerValidateCommand(validateProgram);

      const validateExitCode = await runProgram(validateProgram, [
        "validate",
        configPath,
      ]);

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
    await writeFile(configPath, '{ "steps": [ { "type": "launch" "command": "echo hi" } ] }\n', "utf8");

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
});
