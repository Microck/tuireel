import type { OutputFormat } from "../config/schema.js";

export interface EncoderProfile {
  args: string[];
  outputFps?: number;
  twoPass?: boolean;
  scaleWidth?: number;
}

const COLOR_SPACE_ARGS = [
  "-colorspace",
  "bt709",
  "-color_primaries",
  "bt709",
  "-color_trc",
  "bt709",
] as const;

export const ENCODER_PROFILES: Record<OutputFormat, EncoderProfile> = {
  mp4: {
    args: [
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "pad=ceil(iw/2)*2:ceil(ih/2)*2",
      ...COLOR_SPACE_ARGS,
      "-movflags",
      "+faststart",
    ],
  },
  webm: {
    args: [
      "-c:v",
      "libvpx-vp9",
      "-crf",
      "30",
      "-b:v",
      "0",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "pad=ceil(iw/2)*2:ceil(ih/2)*2",
      ...COLOR_SPACE_ARGS,
    ],
  },
  gif: {
    args: [],
    outputFps: 15,
    twoPass: true,
  },
};
