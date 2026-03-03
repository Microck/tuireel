import { z } from "zod";

import { themeSchema } from "../themes/schema.js";

const stepTypes = [
  "launch",
  "type",
  "press",
  "wait",
  "pause",
  "scroll",
  "click",
  "screenshot",
  "resize",
  "set-env",
] as const;
const outputFormats = ["mp4", "webm", "gif"] as const;
const soundEffectSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.string(),
]);

const launchStepSchema = z.object({
  type: z.literal("launch"),
  command: z.string().min(1),
});

const typeStepSchema = z.object({
  type: z.literal("type"),
  text: z.string(),
  speed: z.number().positive().optional(),
});

const pressStepSchema = z.object({
  type: z.literal("press"),
  key: z.string().min(1),
});

const waitRegexPatternSchema = z
  .object({
    regex: z.string().min(1),
    flags: z.string().optional(),
  })
  .superRefine((value, context) => {
    try {
      new RegExp(value.regex, value.flags);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid regular expression: ${message}`,
      });
    }
  });

const waitStepSchema = z.object({
  type: z.literal("wait"),
  pattern: z.union([z.string().min(1), waitRegexPatternSchema]),
  timeout: z.number().nonnegative().optional(),
});

const pauseStepSchema = z.object({
  type: z.literal("pause"),
  duration: z.number().nonnegative(),
});

const scrollStepSchema = z.object({
  type: z.literal("scroll"),
  direction: z.enum(["up", "down"]),
  amount: z.number().int().positive().default(3),
});

const clickStepSchema = z.object({
  type: z.literal("click"),
  pattern: z.string().min(1),
});

const screenshotStepSchema = z.object({
  type: z.literal("screenshot"),
  output: z.string().min(1),
});

const resizeStepSchema = z.object({
  type: z.literal("resize"),
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
});

const setEnvStepSchema = z.object({
  type: z.literal("set-env"),
  key: z.string().min(1),
  value: z.string(),
});

export const stepSchema = z.discriminatedUnion("type", [
  launchStepSchema,
  typeStepSchema,
  pressStepSchema,
  waitStepSchema,
  pauseStepSchema,
  scrollStepSchema,
  clickStepSchema,
  screenshotStepSchema,
  resizeStepSchema,
  setEnvStepSchema,
]);

export const configSchema = z.object({
  $schema: z.string().optional(),
  format: z.enum(outputFormats).default("mp4"),
  output: z.string().default("output.mp4"),
  theme: z.union([z.string(), themeSchema]).optional(),
  sound: z
    .object({
      effects: z
        .object({
          click: soundEffectSchema.optional(),
          key: soundEffectSchema.optional(),
        })
        .optional(),
      track: z.string().optional(),
      trackVolume: z.number().min(0).max(1).default(0.3).optional(),
      effectsVolume: z.number().min(0).max(1).default(0.5).optional(),
    })
    .optional(),
  fps: z.number().int().positive().default(30),
  cols: z.number().int().positive().default(80),
  rows: z.number().int().positive().default(24),
  steps: z.array(stepSchema).min(1),
});

export type TuireelConfig = z.infer<typeof configSchema>;
export type TuireelStep = z.infer<typeof stepSchema>;
export type OutputFormat = (typeof outputFormats)[number];
export const STEP_TYPES = stepTypes;
export const OUTPUT_FORMATS = outputFormats;
