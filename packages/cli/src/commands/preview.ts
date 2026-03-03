import { resolve } from "node:path";

import { loadConfig, preview as runPreview } from "@tuireel/core";
import type { Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";

export function registerPreviewCommand(program: Command): void {
  program
    .command("preview")
    .description("Run steps in a visible terminal without recording")
    .argument("[config]", "Path to config file", DEFAULT_CONFIG_PATH)
    .action(async (configPathArg: string) => {
      const configPath = resolve(process.cwd(), configPathArg);

      try {
        const config = await loadConfig(configPath);
        await runPreview(config);
        console.log("Preview complete");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Preview failed: ${message}`);
        process.exitCode = 1;
      }
    });
}
