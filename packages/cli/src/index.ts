import { pathToFileURL } from "node:url";

import { Command } from "commander";
import { VERSION } from "@tuireel/core";

import { registerInitCommand } from "./commands/init.js";
import { registerRecordCommand } from "./commands/record.js";
import { registerStubCommands } from "./commands/stubs.js";
import { registerValidateCommand } from "./commands/validate.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("tuireel")
    .version(VERSION)
    .description("Record polished demo videos from scripted TUI sessions")
    .addHelpText(
      "after",
      [
        "",
        "Getting started:",
        "  tuireel init",
        "  tuireel validate .tuireel.jsonc",
        "  tuireel record .tuireel.jsonc"
      ].join("\n")
    );

  registerInitCommand(program);
  registerValidateCommand(program);
  registerRecordCommand(program);
  registerStubCommands(program);

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

  return import.meta.url === pathToFileURL(entryPoint).href;
}

if (isDirectExecution()) {
  runCli().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
