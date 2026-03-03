import { dirname, isAbsolute, resolve } from "node:path";

import {
  OUTPUT_FORMATS,
  loadConfig,
  record as runRecord,
  watchAndRecord,
  type OutputFormat,
  type TuireelConfig,
} from "@tuireel/core";
import { InvalidArgumentError, type Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";

interface RecordOptions {
  format?: OutputFormat;
  watch?: boolean;
}

type ResolvedSoundConfig = TuireelConfig["sound"];

function parseOutputFormat(value: string): OutputFormat {
  if (OUTPUT_FORMATS.includes(value as OutputFormat)) {
    return value as OutputFormat;
  }

  throw new InvalidArgumentError(`Invalid format \"${value}\". Expected one of: ${OUTPUT_FORMATS.join(", ")}.`);
}

function resolveSoundConfig(
  sound: ResolvedSoundConfig,
  resolvedConfigPath: string,
): ResolvedSoundConfig {
  if (!sound || !sound.track || sound.track.trim().length === 0) {
    return sound;
  }

  return {
    ...sound,
    track: isAbsolute(sound.track)
      ? sound.track
      : resolve(dirname(resolvedConfigPath), sound.track),
  } satisfies NonNullable<ResolvedSoundConfig>;
}

export function registerRecordCommand(program: Command): void {
  program
    .command("record")
    .description("Record a TUI session to video")
    .argument("[configPath]", "Path to config file", DEFAULT_CONFIG_PATH)
    .option("--format <format>", "Output format (mp4, webm, gif)", parseOutputFormat)
    .option("-w, --watch", "Watch config and re-record on changes")
    .action(async (configPathArg: string, options: RecordOptions) => {
      const configPath = resolve(process.cwd(), configPathArg);

      try {
        if (options.watch) {
          console.log(`Watching ${configPath} for changes...`);
          await watchAndRecord(configPath, {
            format: options.format,
          });
          return;
        }

        const configs = await loadConfig(configPath);

        for (const [index, config] of configs.entries()) {
          const resolvedConfig = {
            ...config,
            format: options.format ?? config.format,
            sound: resolveSoundConfig(config.sound, configPath),
          } satisfies TuireelConfig;

          if (configs.length > 1) {
            console.log(`[${index + 1}/${configs.length}] Recording: ${resolvedConfig.output}`);
          }

          await runRecord(resolvedConfig);
          console.log(`Recording complete: ${resolvedConfig.output}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Recording failed: ${message}`);
        process.exitCode = 1;
      }
    });
}
