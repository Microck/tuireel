import { spawnSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import type { TimelineData } from "./timeline/types.js";

const SAMPLE_RATE = 44100;

function resolveAssetsDirectory(): string {
  const candidates = [
    typeof __dirname === "string" ? resolve(__dirname, "..", "assets", "sounds") : null,
    resolve(process.cwd(), "assets", "sounds"),
    resolve(process.cwd(), "packages", "core", "assets", "sounds"),
    resolve(process.cwd(), "node_modules", "@tuireel", "core", "assets", "sounds"),
  ].filter((candidate): candidate is string => candidate !== null);

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? resolve(process.cwd(), "assets", "sounds");
}

const ASSETS_DIR = resolveAssetsDirectory();

type SoundType = "click" | "key";

type SoundEvent = {
  type: SoundType;
  timeMs: number;
};

export interface SfxConfig {
  click?: 1 | 2 | 3 | 4 | string;
  key?: 1 | 2 | 3 | 4 | string;
}

function runFfmpeg(ffmpegPath: string, args: string[]): void {
  const result = spawnSync(ffmpegPath, args, {
    stdio: "pipe",
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.toString("utf8").slice(-2000) ?? "";
    throw new Error(
      `ffmpeg exited with code ${result.status}${stderr.length > 0 ? `:\n${stderr}` : ""}`,
    );
  }
}

function clampTime(timeMs: number, durationMs: number): number {
  if (!Number.isFinite(timeMs)) {
    return 0;
  }

  if (timeMs < 0) {
    return 0;
  }

  return Math.min(timeMs, durationMs);
}

function moveOutput(tempPath: string, outputPath: string): void {
  if (tempPath === outputPath) {
    return;
  }

  rmSync(outputPath, { force: true });
  renameSync(tempPath, outputPath);
}

function isSoundType(value: unknown): value is SoundType {
  return value === "click" || value === "key";
}

export function resolveSfxPath(
  value: 1 | 2 | 3 | 4 | string | undefined,
  prefix: SoundType,
): string {
  if (value === undefined) {
    return resolve(ASSETS_DIR, `${prefix}-1.mp3`);
  }

  if (typeof value === "string") {
    return value;
  }

  return resolve(ASSETS_DIR, `${prefix}-${value}.mp3`);
}

export function ensureSoundAssets(sfx?: SfxConfig): {
  clickPath: string;
  keyPath: string;
} {
  return {
    clickPath: resolveSfxPath(sfx?.click, "click"),
    keyPath: resolveSfxPath(sfx?.key, "key"),
  };
}

export function extractSoundEvents(timeline: Pick<TimelineData, "events">): SoundEvent[] {
  return timeline.events
    .filter((event) => isSoundType(event.type))
    .map((event) => ({
      type: event.type,
      timeMs: event.timeMs,
    }));
}

export function buildAudioMixArgs(
  videoInput: string,
  events: SoundEvent[],
  durationSec: number,
  sfx?: SfxConfig,
): { inputArgs: string[]; filterComplex: string } {
  const { clickPath, keyPath } = ensureSoundAssets(sfx);
  const clampedDurationSec = Math.max(0, durationSec);
  const durationMs = Math.round(clampedDurationSec * 1000);
  const inputArgs = [
    "-i",
    videoInput,
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=${SAMPLE_RATE}:cl=mono`,
    "-t",
    clampedDurationSec.toFixed(3),
  ];
  const filterParts: string[] = [];

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event) {
      continue;
    }

    const soundFile = event.type === "click" ? clickPath : keyPath;
    const delayMs = clampTime(event.timeMs, durationMs);
    inputArgs.push("-i", soundFile);

    const baseVolume = event.type === "click" ? 0.25 : 0.15;
    const randomizedVolume = baseVolume + Math.random() * baseVolume * 0.6;
    const randomizedRate = SAMPLE_RATE * (0.93 + Math.random() * 0.14);

    filterParts.push(
      `[${index + 2}]asetrate=${Math.round(randomizedRate)},aresample=${SAMPLE_RATE},adelay=${delayMs}|${delayMs},volume=${randomizedVolume.toFixed(3)}[s${index}]`,
    );
  }

  const mixInputs = `[1]${events.map((_, index) => `[s${index}]`).join("")}`;
  filterParts.push(`${mixInputs}amix=inputs=${events.length + 1}:normalize=0[aout]`);

  return {
    inputArgs,
    filterComplex: filterParts.join(";"),
  };
}

export function finalizeMp4WithSound(
  ffmpegPath: string,
  tempVideo: string,
  outputPath: string,
  events: SoundEvent[],
  durationSec: number,
  sfx?: SfxConfig,
): void {
  if (events.length === 0 || !sfx) {
    moveOutput(tempVideo, outputPath);
    return;
  }

  const { inputArgs, filterComplex } = buildAudioMixArgs(tempVideo, events, durationSec, sfx);

  runFfmpeg(ffmpegPath, [
    "-y",
    ...inputArgs,
    "-filter_complex",
    filterComplex,
    "-map",
    "0:v",
    "-map",
    "[aout]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

export function finalizeWebmWithSound(
  ffmpegPath: string,
  tempVideo: string,
  outputPath: string,
  events: SoundEvent[],
  durationSec: number,
  sfx?: SfxConfig,
): void {
  if (events.length === 0 || !sfx) {
    moveOutput(tempVideo, outputPath);
    return;
  }

  const { inputArgs, filterComplex } = buildAudioMixArgs(tempVideo, events, durationSec, sfx);

  runFfmpeg(ffmpegPath, [
    "-y",
    ...inputArgs,
    "-filter_complex",
    filterComplex,
    "-map",
    "0:v",
    "-map",
    "[aout]",
    "-c:v",
    "copy",
    "-c:a",
    "libopus",
    "-b:a",
    "128k",
    "-shortest",
    outputPath,
  ]);
}
