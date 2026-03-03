import { resolve } from "node:path";

import { loadSingleConfig, LogLevel, createLogger, preview as runPreview } from "@tuireel/core";
import type { Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";

interface PreviewOptions {
  verbose?: boolean;
  debug?: boolean;
}

export function registerPreviewCommand(program: Command): void {
  program
    .command("preview")
    .description("Run steps in a visible terminal without recording")
    .argument("[config]", "Path to config file", DEFAULT_CONFIG_PATH)
    .option("--verbose", "Show step-by-step progress and stats")
    .option("--debug", "Show internal timing details")
    .action(async (configPathArg: string, options: PreviewOptions) => {
      const configPath = resolve(process.cwd(), configPathArg);
      const logLevel = options.debug ? LogLevel.debug : options.verbose ? LogLevel.verbose : LogLevel.normal;
      const _logger = createLogger(logLevel);

      try {
        const config = await loadSingleConfig(configPath);
        await runPreview(config);
        console.log("Preview complete");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Preview failed: ${message}`);
        process.exitCode = 1;
      }
    });
}
