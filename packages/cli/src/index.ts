import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Command } from "commander";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

import { registerCompositeCommand } from "./commands/composite.js";
import { registerInitCommand } from "./commands/init.js";
import { registerPreviewCommand } from "./commands/preview.js";
import { registerRecordCommand } from "./commands/record.js";
import { registerValidateCommand } from "./commands/validate.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("tuireel")
    .version(version)
    .description("Record polished demo videos from scripted TUI sessions")
    .addHelpText(
      "after",
      [
        "",
        "Getting started:",
        "  tuireel init",
        "  tuireel validate .tuireel.jsonc",
        "  tuireel record .tuireel.jsonc",
      ].join("\n"),
    );

  registerInitCommand(program);
  registerValidateCommand(program);
  registerPreviewCommand(program);
  registerRecordCommand(program);
  registerCompositeCommand(program);

  return program;
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = createProgram();
  await program.parseAsync(argv);
}

function isDirectExecution(): boolean {
  const entryPoint = process.argv[1];
  if (!entryPoint) {
    return false;
  }

  try {
    const resolvedEntryPoint = realpathSync(entryPoint);
    const resolvedModulePath = realpathSync(fileURLToPath(import.meta.url));
    return resolvedModulePath === resolvedEntryPoint;
  } catch {
    return import.meta.url === pathToFileURL(entryPoint).href;
  }
}

if (isDirectExecution()) {
  runCli().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
