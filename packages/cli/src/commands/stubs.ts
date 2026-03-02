import type { Command } from "commander";

const STUB_COMMANDS = [
  { name: "record", phase: 2, description: "Record a TUI session to video" },
  {
    name: "preview",
    phase: 6,
    description: "Run steps in a visible terminal without recording",
  },
  {
    name: "composite",
    phase: 4,
    description: "Composite overlays onto an existing recording",
  },
] as const;

export function registerStubCommands(program: Command): void {
  for (const command of STUB_COMMANDS) {
    program
      .command(command.name)
      .description(command.description)
      .action(() => {
        console.log(`Not yet implemented. Coming in Phase ${command.phase}.`);
      });
  }
}
