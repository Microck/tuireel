import { Command } from "commander";
import { VERSION } from "@tuireel/core";

import { registerInitCommand } from "./commands/init.js";
import { registerStubCommands } from "./commands/stubs.js";
import { registerValidateCommand } from "./commands/validate.js";

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
registerStubCommands(program);

program.parse();
