import { Command } from "commander";
import { VERSION } from "@tuireel/core";

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

program.parse();
