import { mkdir, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { generateJsonSchema } from "@tuireel/core";
import type { Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";
const SCHEMA_DIRECTORY = ".tuireel";
const SCHEMA_FILENAME = "schema.json";

interface InitOptions {
  output: string;
  force?: boolean;
}

function resolveSchemaPath(): string {
  const schemaDirectoryPath = process.env.TUIREEL_HOME ?? resolve(homedir(), SCHEMA_DIRECTORY);
  return resolve(schemaDirectoryPath, SCHEMA_FILENAME);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : undefined;
    if (errorCode === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function createStarterConfig(schemaPath: string): string {
  const schemaUrl = pathToFileURL(schemaPath).href;

  return `// Tuireel recording configuration (JSONC supports comments).
// Edit steps below, then run: tuireel validate .tuireel.jsonc
{
  "$schema": "${schemaUrl}",
  "output": "demo.mp4",
  "fps": 30,
  "cols": 80,
  "rows": 24,
  "steps": [
    {
      "type": "launch",
      "command": "echo hello"
    },
    {
      "type": "pause",
      "duration": 1
    }
  ]
}
`;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create a starter .tuireel.jsonc config")
    .option("-o, --output <path>", "Output config file", DEFAULT_CONFIG_PATH)
    .option("-f, --force", "Overwrite an existing config file")
    .action(async (options: InitOptions) => {
      const outputPath = resolve(options.output);
      const outputExists = await exists(outputPath);

      if (outputExists && !options.force) {
        console.error(
          `Config already exists at ${outputPath}. Use --force to overwrite.`,
        );
        process.exitCode = 1;
        return;
      }

      if (outputExists) {
        console.warn(`Overwriting existing config at ${outputPath}.`);
      }

      const schemaPath = resolveSchemaPath();
      await mkdir(dirname(schemaPath), { recursive: true });

      const schema = generateJsonSchema();
      await writeFile(`${schemaPath}`, `${JSON.stringify(schema, null, 2)}\n`, "utf8");

      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, createStarterConfig(schemaPath), "utf8");

      console.log(`Created config: ${outputPath}`);
      console.log(`Schema generated: ${schemaPath}`);
      console.log("Next steps:");
      console.log(`  1. Edit ${outputPath}`);
      console.log(`  2. Run: tuireel validate ${outputPath}`);
      console.log(`  3. Run: tuireel record ${outputPath}`);
    });
}
