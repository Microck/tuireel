import { loadConfig, record as runRecord } from "@tuireel/core";
import type { Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";

export function registerRecordCommand(program: Command): void {
  program
    .command("record")
    .description("Record a TUI session to video")
    .argument("[configPath]", "Path to config file", DEFAULT_CONFIG_PATH)
    .action(async (configPath: string) => {
      try {
        const config = await loadConfig(configPath);
        await runRecord(config);
        console.log(`Recording complete: ${config.output}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Recording failed: ${message}`);
        process.exitCode = 1;
      }
    });
}
