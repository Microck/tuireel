import { spawnSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { TimelineData } from "./timeline/types.js";

const SAMPLE_RATE = 44100;
const DEFAULT_TRACK_VOLUME = 0.3;
const DEFAULT_EFFECTS_VOLUME = 0.5;
const TRACK_FADE_DURATION_SEC = 2;

function resolveAssetsDirectory(): string {
  const moduleCandidates: string[] = [];

  try {
    moduleCandidates.push(
      resolve(dirname(fileURLToPath(import.meta.url)), "..", "assets", "sounds"),
    );
  } catch {}

  if (typeof __dirname === "string") {
    moduleCandidates.push(resolve(__dirname, "..", "assets", "sounds"));
  }

  const candidates = [
    ...moduleCandidates,
    resolve(process.cwd(), "assets", "sounds"),
    resolve(process.cwd(), "packages", "core", "assets", "sounds"),
    resolve(process.cwd(), "node_modules", "@tuireel", "core", "assets", "sounds"),
  ];

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

export interface SoundConfig {
  effects?: SfxConfig;
  track?: string;
  trackVolume?: number;
  effectsVolume?: number;
}

interface FullAudioArgs {
  inputArgs: string[];
  filterComplex: string;
  audioLabel: string;
}

function clampVolume(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, value ?? fallback));
}

function resolveDurationSec(durationSec: number): number {
  if (!Number.isFinite(durationSec)) {
    return 0;
  }

  return Math.max(0, durationSec);
}

function runFfmpeg(ffmpegPath: string, args: string[]): void {
  const result = spawnSync(ffmpegPath, args, {
    stdio: "pipe",
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.toString("utf8").slice(-2000) ?? "";
    throw new Error(
      `ffmpeg audio mixing exited with code ${result.status}. Try: check that audio files exist and are valid, or run with '--debug' for details.${stderr.length > 0 ? `\n${stderr}` : ""}`,
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

export function mixAudioTracks(leftLabel: string, rightLabel: string, outputLabel: string): string {
  return `[${leftLabel}][${rightLabel}]amix=inputs=2:normalize=0[${outputLabel}]`;
}

function buildTrackFilter(
  inputIndex: number,
  outputLabel: string,
  durationSec: number,
  trackVolume: number,
): string {
  const clampedDurationSec = resolveDurationSec(durationSec);
  const fadeStartSec = Math.max(0, clampedDurationSec - TRACK_FADE_DURATION_SEC);
  const fadeDurationSec = Math.min(TRACK_FADE_DURATION_SEC, clampedDurationSec);

  return [
    `[${inputIndex}:a]aresample=${SAMPLE_RATE}`,
    `atrim=0:${clampedDurationSec.toFixed(3)}`,
    `apad=pad_dur=${clampedDurationSec.toFixed(3)}`,
    `atrim=0:${clampedDurationSec.toFixed(3)}`,
    `volume=${trackVolume.toFixed(3)}`,
    `afade=t=out:st=${fadeStartSec.toFixed(3)}:d=${fadeDurationSec.toFixed(3)}[${outputLabel}]`,
  ].join(",");
}

export function buildFullAudioArgs(
  videoInput: string,
  events: SoundEvent[],
  durationSec: number,
  soundConfig?: SoundConfig,
): FullAudioArgs | null {
  const clampedDurationSec = resolveDurationSec(durationSec);
  const hasEffects = events.length > 0 && soundConfig?.effects !== undefined;
  const hasTrack = typeof soundConfig?.track === "string" && soundConfig.track.length > 0;

  if (!hasEffects && !hasTrack) {
    return null;
  }

  const effectsVolume = clampVolume(soundConfig?.effectsVolume, DEFAULT_EFFECTS_VOLUME);
  const trackVolume = clampVolume(soundConfig?.trackVolume, DEFAULT_TRACK_VOLUME);

  if (hasEffects && !hasTrack) {
    const effectsArgs = buildAudioMixArgs(
      videoInput,
      events,
      clampedDurationSec,
      soundConfig?.effects,
    );

    if (effectsVolume === 1) {
      return {
        inputArgs: effectsArgs.inputArgs,
        filterComplex: effectsArgs.filterComplex,
        audioLabel: "aout",
      };
    }

    return {
      inputArgs: effectsArgs.inputArgs,
      filterComplex: `${effectsArgs.filterComplex};[aout]volume=${effectsVolume.toFixed(3)}[aoutfull]`,
      audioLabel: "aoutfull",
    };
  }

  if (!hasEffects && hasTrack) {
    return {
      inputArgs: [
        "-i",
        videoInput,
        "-t",
        clampedDurationSec.toFixed(3),
        "-i",
        soundConfig?.track ?? "",
      ],
      filterComplex: buildTrackFilter(1, "aout", clampedDurationSec, trackVolume),
      audioLabel: "aout",
    };
  }

  const effectsArgs = buildAudioMixArgs(
    videoInput,
    events,
    clampedDurationSec,
    soundConfig?.effects,
  );
  const trackInputIndex = events.length + 2;
  const filterParts = [effectsArgs.filterComplex];
  const effectsLabel = effectsVolume === 1 ? "aout" : "effects";

  if (effectsVolume !== 1) {
    filterParts.push(`[aout]volume=${effectsVolume.toFixed(3)}[effects]`);
  }

  filterParts.push(buildTrackFilter(trackInputIndex, "track", clampedDurationSec, trackVolume));
  filterParts.push(mixAudioTracks(effectsLabel, "track", "aoutfull"));

  return {
    inputArgs: [
      ...effectsArgs.inputArgs,
      "-t",
      clampedDurationSec.toFixed(3),
      "-i",
      soundConfig?.track ?? "",
    ],
    filterComplex: filterParts.join(";"),
    audioLabel: "aoutfull",
  };
}

export function finalizeMp4WithSound(
  ffmpegPath: string,
  tempVideo: string,
  outputPath: string,
  events: SoundEvent[],
  durationSec: number,
  soundConfig?: SoundConfig,
): void {
  const fullAudioArgs = buildFullAudioArgs(tempVideo, events, durationSec, soundConfig);
  if (!fullAudioArgs) {
    moveOutput(tempVideo, outputPath);
    return;
  }

  runFfmpeg(ffmpegPath, [
    "-y",
    ...fullAudioArgs.inputArgs,
    "-filter_complex",
    fullAudioArgs.filterComplex,
    "-map",
    "0:v",
    "-map",
    `[${fullAudioArgs.audioLabel}]`,
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
  soundConfig?: SoundConfig,
): void {
  const fullAudioArgs = buildFullAudioArgs(tempVideo, events, durationSec, soundConfig);
  if (!fullAudioArgs) {
    moveOutput(tempVideo, outputPath);
    return;
  }

  runFfmpeg(ffmpegPath, [
    "-y",
    ...fullAudioArgs.inputArgs,
    "-filter_complex",
    fullAudioArgs.filterComplex,
    "-map",
    "0:v",
    "-map",
    `[${fullAudioArgs.audioLabel}]`,
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
