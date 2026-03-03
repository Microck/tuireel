import { readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";

import {
  OUTPUT_FORMATS,
  compose,
  loadConfig,
  type OutputFormat,
  type SoundConfig,
  type TimelineData,
} from "@tuireel/core";
import { InvalidArgumentError, type Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";
const RECORDING_ROOT_DIR = ".tuireel";
const RAW_RECORDING_DIR = "raw";
const TIMELINE_RECORDING_DIR = "timelines";

interface CompositeOptions {
  config?: string;
  format?: OutputFormat;
  cursorSize?: number;
  cursor: boolean;
  hud: boolean;
}

function parseOutputFormat(value: string): OutputFormat {
  if (OUTPUT_FORMATS.includes(value as OutputFormat)) {
    return value as OutputFormat;
  }

  throw new InvalidArgumentError(`Invalid format \"${value}\". Expected one of: ${OUTPUT_FORMATS.join(", ")}.`);
}

function parseCursorSize(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new InvalidArgumentError(`Invalid cursor size \"${value}\". Expected a positive number.`);
  }

  return Math.round(parsed);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    const maybeError = error as NodeJS.ErrnoException;
    if (maybeError.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function recordingNameFromOutput(outputPath: string): string {
  const baseName = basename(outputPath, extname(outputPath));
  const normalized = baseName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "recording";
}

function resolveRecordingArtifacts(recordingName: string): {
  rawVideoPath: string;
  timelinePath: string;
} {
  const recordingRoot = resolve(process.cwd(), RECORDING_ROOT_DIR);

  return {
    rawVideoPath: join(recordingRoot, RAW_RECORDING_DIR, `${recordingName}.mp4`),
    timelinePath: join(recordingRoot, TIMELINE_RECORDING_DIR, `${recordingName}.timeline.json`),
  };
}

function resolveOutputPath(configOutputPath: string, format: OutputFormat): string {
  const extension = extname(configOutputPath);

  if (extension.length === 0) {
    return `${configOutputPath}.${format}`;
  }

  return `${configOutputPath.slice(0, -extension.length)}.${format}`;
}

function stripHudFromTimeline(timelineData: TimelineData): TimelineData {
  return {
    ...timelineData,
    frames: timelineData.frames.map((frame) => ({
      ...frame,
      hud: null,
    })),
  };
}

function resolveSoundConfig(
  sound: SoundConfig | undefined,
  resolvedConfigPath: string,
): SoundConfig | undefined {
  if (!sound || !sound.track || sound.track.trim().length === 0) {
    return sound;
  }

  return {
    ...sound,
    track: isAbsolute(sound.track)
      ? sound.track
      : resolve(dirname(resolvedConfigPath), sound.track),
  };
}

export function registerCompositeCommand(program: Command): void {
  program
    .command("composite")
    .description("Composite overlays onto an existing recording")
    .argument("[configPath]", "Path to config file", DEFAULT_CONFIG_PATH)
    .option("-c, --config <path>", "Path to config file (overrides positional argument)")
    .option("--format <format>", "Output format (mp4, webm, gif)", parseOutputFormat)
    .option("--cursor-size <n>", "Cursor size in pixels", parseCursorSize)
    .option("--no-cursor", "Disable cursor overlay")
    .option("--no-hud", "Disable keystroke HUD overlay")
    .action(async (configPathArg: string, options: CompositeOptions) => {
      const configPath = resolve(process.cwd(), options.config ?? configPathArg);

      try {
        const config = await loadConfig(configPath);
        const resolvedSound = resolveSoundConfig(config.sound, configPath);
        const recordingName = recordingNameFromOutput(config.output);
        const artifacts = resolveRecordingArtifacts(recordingName);

        if (!(await fileExists(artifacts.rawVideoPath))) {
          throw new Error(`Raw video not found: ${artifacts.rawVideoPath}. Run \`tuireel record\` first.`);
        }

        if (!(await fileExists(artifacts.timelinePath))) {
          throw new Error(`Timeline not found: ${artifacts.timelinePath}. Run \`tuireel record\` first.`);
        }

        const timelineData = JSON.parse(await readFile(artifacts.timelinePath, "utf8")) as TimelineData;
        const selectedFormat = options.format ?? config.format;
        const outputPath = resolveOutputPath(config.output, selectedFormat);

        console.log(`Compositing from ${artifacts.rawVideoPath}`);

        await compose(
          artifacts.rawVideoPath,
          options.hud ? timelineData : stripHudFromTimeline(timelineData),
          outputPath,
          {
            format: selectedFormat,
            cursorConfig: {
              size: options.cursorSize,
              visible: options.cursor,
            },
            sound: resolvedSound,
          },
        );

        console.log(`Composite complete: ${outputPath}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Composite failed: ${message}`);
        process.exitCode = 1;
      }
    });
}
