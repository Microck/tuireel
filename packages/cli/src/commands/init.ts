import { mkdir, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

import { DELIVERY_PROFILE_NAMES, generateJsonSchema, PRESET_NAMES } from "@tuireel/core";
import type { Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";
const SCHEMA_DIRECTORY = ".tuireel";
const SCHEMA_FILENAME = "schema.json";
const DEFAULT_DELIVERY_PROFILE = "readable-1080p";

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

const PRESET_DESCRIPTIONS: Record<string, string> = {
  polished: "catppuccin + sound + cursor + HUD",
  minimal: "tokyo-night + cursor only",
  demo: "dracula + sound + cursor + HUD",
  silent: "no overlays, no sound",
};

const DELIVERY_PROFILE_DESCRIPTIONS: Record<string, string> = {
  "readable-1080p": "30fps output + 12fps capture + roomy 1080p framing",
  "social-quick-share": "30fps output + lighter capture for quick share clips",
  "high-motion-demo": "60fps output + 24fps capture for dense terminal motion",
};

async function promptDeliveryProfile(): Promise<string> {
  if (!process.stdin.isTTY) {
    return DEFAULT_DELIVERY_PROFILE;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("\nChoose a delivery profile:");
  for (const [index, name] of DELIVERY_PROFILE_NAMES.entries()) {
    const desc = DELIVERY_PROFILE_DESCRIPTIONS[name] ?? "";
    console.log(`  ${index + 1}. ${name}  - ${desc}`);
  }

  return new Promise<string>((resolve) => {
    rl.question(`\nEnter number or press Enter for ${DEFAULT_DELIVERY_PROFILE}: `, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (trimmed === "") {
        resolve(DEFAULT_DELIVERY_PROFILE);
        return;
      }

      const index = parseInt(trimmed, 10) - 1;
      if (index >= 0 && index < DELIVERY_PROFILE_NAMES.length) {
        resolve(DELIVERY_PROFILE_NAMES[index]);
        return;
      }

      resolve(DEFAULT_DELIVERY_PROFILE);
    });
  });
}

async function promptPreset(): Promise<string | undefined> {
  if (!process.stdin.isTTY) {
    return undefined;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("\nChoose a preset (optional):");
  for (const [index, name] of PRESET_NAMES.entries()) {
    const desc = PRESET_DESCRIPTIONS[name] ?? "";
    console.log(`  ${index + 1}. ${name}  - ${desc}`);
  }
  console.log(`  ${PRESET_NAMES.length + 1}. none  - start from scratch`);

  return new Promise<string | undefined>((resolve) => {
    rl.question("\nEnter number or press Enter to skip: ", (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (trimmed === "" || trimmed === String(PRESET_NAMES.length + 1)) {
        resolve(undefined);
        return;
      }
      const index = parseInt(trimmed, 10) - 1;
      if (index >= 0 && index < PRESET_NAMES.length) {
        resolve(PRESET_NAMES[index]);
        return;
      }
      resolve(undefined);
    });
  });
}

function createStarterConfig(schemaPath: string, deliveryProfile: string, preset?: string): string {
  const schemaUrl = pathToFileURL(schemaPath).href;
  const presetLine = preset ? `\n  "preset": "${preset}",` : "";

  return `// Tuireel recording configuration (JSONC supports comments).
// Edit steps below, then run: tuireel validate .tuireel.jsonc
{
  "$schema": "${schemaUrl}",
  "deliveryProfile": "${deliveryProfile}",${presetLine}
  "output": "demo.mp4",
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
        console.error(`Config already exists at ${outputPath}. Use --force to overwrite.`);
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

      const deliveryProfileChoice = await promptDeliveryProfile();
      const presetChoice = await promptPreset();

      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(
        outputPath,
        createStarterConfig(schemaPath, deliveryProfileChoice, presetChoice),
        "utf8",
      );

      console.log(`Created config: ${outputPath}`);
      console.log(`Using delivery profile: ${deliveryProfileChoice}`);
      if (presetChoice) {
        console.log(`Using preset: ${presetChoice}`);
      }
      console.log(`Schema generated: ${schemaPath}`);
      console.log("Next steps:");
      console.log(`  1. Edit ${outputPath}`);
      console.log(`  2. Run: tuireel validate ${outputPath}`);
      console.log(`  3. Run: tuireel record ${outputPath}`);
    });
}
