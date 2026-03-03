import { dirname, isAbsolute, resolve } from "node:path";

import { OUTPUT_FORMATS, loadConfig, record as runRecord, type OutputFormat } from "@tuireel/core";
import { InvalidArgumentError, type Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";

interface RecordOptions {
  format?: OutputFormat;
}

type SoundConfig = NonNullable<Awaited<ReturnType<typeof loadConfig>>["sound"]>;

function parseOutputFormat(value: string): OutputFormat {
  if (OUTPUT_FORMATS.includes(value as OutputFormat)) {
    return value as OutputFormat;
  }

  throw new InvalidArgumentError(`Invalid format \"${value}\". Expected one of: ${OUTPUT_FORMATS.join(", ")}.`);
}

function resolveSoundConfig(
  sound: Awaited<ReturnType<typeof loadConfig>>["sound"],
  resolvedConfigPath: string,
): Awaited<ReturnType<typeof loadConfig>>["sound"] {
  if (!sound || !sound.track || sound.track.trim().length === 0) {
    return sound;
  }

  return {
    ...sound,
    track: isAbsolute(sound.track)
      ? sound.track
      : resolve(dirname(resolvedConfigPath), sound.track),
  } satisfies SoundConfig;
}

export function registerRecordCommand(program: Command): void {
  program
    .command("record")
    .description("Record a TUI session to video")
    .argument("[configPath]", "Path to config file", DEFAULT_CONFIG_PATH)
    .option("--format <format>", "Output format (mp4, webm, gif)", parseOutputFormat)
    .action(async (configPathArg: string, options: RecordOptions) => {
      const configPath = resolve(process.cwd(), configPathArg);

      try {
        const config = await loadConfig(configPath);
        const resolvedConfig = {
          ...config,
          format: options.format ?? config.format,
          sound: resolveSoundConfig(config.sound, configPath),
        };

        await runRecord(resolvedConfig);
        console.log(`Recording complete: ${resolvedConfig.output}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Recording failed: ${message}`);
        process.exitCode = 1;
      }
    });
}
