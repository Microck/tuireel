import { access } from "node:fs/promises";

import type { TimingContractPacing } from "../timeline/timing-contract.js";
import { InteractionTimeline } from "../timeline/interaction-timeline.js";
import { probeVideo } from "./probe-video.js";

export interface InspectTimelineStats {
  frameCount: number;
  fps: number;
  width: number;
  height: number;
  keyframeCount: number;
  eventCount: number;
  terminalFrameCount: number;
  durationMs: number;
}

export interface InspectVideoStats {
  codec: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  streamFrameCount: number | null;
  formatName: string | null;
}

export interface InspectReport {
  selected: {
    pacing: string | null;
    deliveryProfile: string | null;
  };
  timingContract: {
    outputFps: number;
    captureFps: number;
    wallClockDurationMs: number;
    rawFrameCount: number;
    outputFrameCount: number;
    terminalFrameCount: number;
    deliveryProfile?: string;
    pacing?: TimingContractPacing;
  } | null;
  timeline: InspectTimelineStats;
  rawVideo: InspectVideoStats;
  outputVideo: InspectVideoStats | null;
}

export interface InspectRecordingOptions {
  timelinePath: string;
  rawVideoPath: string;
  outputVideoPath?: string;
  ffmpegPath: string;
  selected?: {
    pacing: string | null;
    deliveryProfile: string | null;
  };
}

async function assertFileExists(path: string, label: string): Promise<void> {
  try {
    await access(path);
  } catch (error) {
    throw new Error(
      `${label} not found: ${path}. Try: verify the artifact path or re-record the demo.`,
      {
        cause: error,
      },
    );
  }
}

function parseOptionalNumber(value: string | number | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInspectVideoStats(probe: Awaited<ReturnType<typeof probeVideo>>): InspectVideoStats {
  const videoStream = probe.streams.find((stream) => stream.codec_type === "video") ?? null;

  return {
    codec: videoStream?.codec_name ?? null,
    width: videoStream?.width ?? null,
    height: videoStream?.height ?? null,
    durationSeconds:
      parseOptionalNumber(videoStream?.duration) ?? parseOptionalNumber(probe.format.duration),
    streamFrameCount: parseOptionalNumber(videoStream?.nb_frames),
    formatName: probe.format.format_name ?? null,
  };
}

export async function inspectRecording(options: InspectRecordingOptions): Promise<InspectReport> {
  await assertFileExists(options.timelinePath, "Timeline file");
  await assertFileExists(options.rawVideoPath, "Raw video");
  if (options.outputVideoPath) {
    await assertFileExists(options.outputVideoPath, "Final output video");
  }

  const timeline = InteractionTimeline.fromFile(options.timelinePath).toJSON();
  const rawVideoProbe = await probeVideo(options.ffmpegPath, options.rawVideoPath);
  const outputVideoProbe = options.outputVideoPath
    ? await probeVideo(options.ffmpegPath, options.outputVideoPath)
    : null;

  return {
    selected: options.selected ?? {
      pacing: null,
      deliveryProfile: null,
    },
    timingContract: timeline.timingContract
      ? {
          outputFps: timeline.timingContract.outputFps,
          captureFps: timeline.timingContract.captureFps,
          wallClockDurationMs: timeline.timingContract.wallClockDurationMs,
          rawFrameCount: timeline.timingContract.rawFrameCount,
          outputFrameCount: timeline.timingContract.outputFrameCount,
          terminalFrameCount: timeline.timingContract.terminalFrameCount,
          ...(timeline.timingContract.deliveryProfile
            ? { deliveryProfile: timeline.timingContract.deliveryProfile }
            : {}),
          ...(timeline.timingContract.pacing ? { pacing: timeline.timingContract.pacing } : {}),
        }
      : null,
    timeline: {
      frameCount: timeline.frameCount,
      fps: timeline.fps,
      width: timeline.width,
      height: timeline.height,
      keyframeCount: timeline.frames.length,
      eventCount: timeline.events.length,
      terminalFrameCount: timeline.terminalFrames?.length ?? 0,
      durationMs: timeline.fps > 0 ? (timeline.frameCount / timeline.fps) * 1000 : 0,
    },
    rawVideo: toInspectVideoStats(rawVideoProbe),
    outputVideo: outputVideoProbe ? toInspectVideoStats(outputVideoProbe) : null,
  };
}
