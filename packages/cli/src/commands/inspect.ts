import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";

import {
  ensureFfmpeg,
  inspectRecording,
  loadSingleConfig,
  type InspectReport,
} from "@tuireel/core";
import type { Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";
const RECORDING_ROOT_DIR = ".tuireel";
const RAW_RECORDING_DIR = "raw";
const TIMELINE_RECORDING_DIR = "timelines";
const COLOR_RESET = "\u001b[0m";
const COLOR_GREEN = "\u001b[32m";

interface InspectCommandOptions {
  json?: boolean;
  recording?: string;
  verbose?: boolean;
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

function resolveOutputArtifactPath(configPath: string, outputPath: string): string {
  return isAbsolute(outputPath) ? outputPath : resolve(dirname(configPath), outputPath);
}

function formatHeading(title: string): string {
  return `${COLOR_GREEN}✓${COLOR_RESET} ${title}`;
}

function formatValue(value: number | string | null): string {
  return value === null ? "n/a" : String(value);
}

function formatDurationMs(durationMs: number): string {
  return `${Math.round(durationMs)} ms (${(durationMs / 1000).toFixed(2)} s)`;
}

function printSection(title: string, rows: Array<[string, number | string | null]>): void {
  console.log(formatHeading(title));
  for (const [label, value] of rows) {
    console.log(`  ${label}: ${formatValue(value)}`);
  }
  console.log("");
}

function printVerboseSummary(report: InspectReport): void {
  const averageFrameDurationMs = report.timeline.fps > 0 ? 1000 / report.timeline.fps : null;
  const rawToTimelineDelta =
    report.rawVideo.streamFrameCount === null
      ? null
      : report.rawVideo.streamFrameCount - report.timeline.frameCount;

  printSection("Verbose", [
    [
      "Average timeline frame duration",
      averageFrameDurationMs === null ? null : `${averageFrameDurationMs.toFixed(2)} ms`,
    ],
    ["Raw - timeline frame delta", rawToTimelineDelta],
    [
      "Terminal frame density",
      report.timeline.frameCount > 0
        ? `${((report.timeline.terminalFrameCount / report.timeline.frameCount) * 100).toFixed(1)}%`
        : null,
    ],
  ]);
}

function timingContractRows(report: InspectReport): Array<[string, number | string | null]> {
  const savedPacing = report.timingContract?.pacing;

  return [
    ["Output FPS", report.timingContract?.outputFps ?? null],
    ["Capture FPS", report.timingContract?.captureFps ?? null],
    [
      "Wall clock duration",
      report.timingContract === null
        ? null
        : formatDurationMs(report.timingContract.wallClockDurationMs),
    ],
    ["Raw frame count", report.timingContract?.rawFrameCount ?? null],
    ["Output frame count", report.timingContract?.outputFrameCount ?? null],
    ["Terminal frame count", report.timingContract?.terminalFrameCount ?? null],
    ["Saved delivery profile", report.timingContract?.deliveryProfile ?? null],
    ["Saved pacing source", savedPacing?.source ?? null],
    ["Saved pacing profile", savedPacing?.source === "named" ? savedPacing.selectedName : null],
    ["Saved base speed", savedPacing?.resolved.baseSpeedMs ?? null],
    ["Saved startup beat", savedPacing?.resolved.beats.startup ?? null],
    ["Saved settle beat", savedPacing?.resolved.beats.settle ?? null],
    ["Saved read beat", savedPacing?.resolved.beats.read ?? null],
    ["Saved idle beat", savedPacing?.resolved.beats.idle ?? null],
  ];
}

export function registerInspectCommand(program: Command): void {
  program
    .command("inspect")
    .description("Inspect pacing stats and artifacts for a recording")
    .argument("[configPath]", "Path to config file", DEFAULT_CONFIG_PATH)
    .option("--json", "Output machine-readable JSON")
    .option("--recording <name>", "Inspect artifacts for a specific recording name")
    .option("--verbose", "Show additional pacing details")
    .action(async (configPathArg: string, options: InspectCommandOptions) => {
      const configPath = resolve(process.cwd(), configPathArg);

      try {
        const config = await loadSingleConfig(configPath);
        const recordingName = options.recording ?? recordingNameFromOutput(config.output);
        const artifacts = resolveRecordingArtifacts(recordingName);
        const outputVideoPath = resolveOutputArtifactPath(configPath, config.output);
        const ffmpegPath = await ensureFfmpeg();
        const report = await inspectRecording({
          timelinePath: artifacts.timelinePath,
          rawVideoPath: artifacts.rawVideoPath,
          outputVideoPath,
          ffmpegPath,
          selected: {
            pacing: typeof config.pacing === "string" ? config.pacing : null,
            deliveryProfile: config.deliveryProfile ?? null,
          },
        });

        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        printSection("Selected", [
          ["Pacing", report.selected.pacing],
          ["Delivery profile", report.selected.deliveryProfile],
        ]);

        printSection("Timing Contract", timingContractRows(report));

        printSection("Timeline", [
          ["Frame count", report.timeline.frameCount],
          ["FPS", report.timeline.fps],
          ["Dimensions", `${report.timeline.width}x${report.timeline.height}`],
          ["Duration", formatDurationMs(report.timeline.durationMs)],
          ["Keyframes", report.timeline.keyframeCount],
          ["Events", report.timeline.eventCount],
          ["Terminal frames", report.timeline.terminalFrameCount],
        ]);

        printSection("Raw Video", [
          ["Codec", report.rawVideo.codec],
          [
            "Dimensions",
            report.rawVideo.width === null || report.rawVideo.height === null
              ? null
              : `${report.rawVideo.width}x${report.rawVideo.height}`,
          ],
          [
            "Duration",
            report.rawVideo.durationSeconds === null
              ? null
              : `${report.rawVideo.durationSeconds.toFixed(2)} s`,
          ],
          ["Frame count", report.rawVideo.streamFrameCount],
          ["Format", report.rawVideo.formatName],
        ]);

        printSection("Final Output", [
          ["Codec", report.outputVideo?.codec ?? null],
          [
            "Dimensions",
            report.outputVideo?.width === null || report.outputVideo?.height === null
              ? null
              : `${report.outputVideo.width}x${report.outputVideo.height}`,
          ],
          [
            "Duration",
            report.outputVideo?.durationSeconds === null
              ? null
              : `${report.outputVideo.durationSeconds.toFixed(2)} s`,
          ],
          ["Frame count", report.outputVideo?.streamFrameCount ?? null],
          ["Format", report.outputVideo?.formatName ?? null],
        ]);

        printSection("Artifacts", [
          ["Timeline path", artifacts.timelinePath],
          ["Raw video path", artifacts.rawVideoPath],
          ["Final output path", outputVideoPath],
        ]);

        if (options.verbose) {
          printVerboseSummary(report);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Inspect failed: ${message}`);
        process.exitCode = 1;
      }
    });
}
