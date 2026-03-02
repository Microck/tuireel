import { z } from "zod";

const stepTypes = ["launch", "type", "press", "wait", "pause"] as const;

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

const waitStepSchema = z.object({
  type: z.literal("wait"),
  pattern: z.string().min(1),
  timeout: z.number().nonnegative().optional(),
});

const pauseStepSchema = z.object({
  type: z.literal("pause"),
  duration: z.number().nonnegative(),
});

export const stepSchema = z.discriminatedUnion("type", [
  launchStepSchema,
  typeStepSchema,
  pressStepSchema,
  waitStepSchema,
  pauseStepSchema,
]);

export const configSchema = z.object({
  $schema: z.string().optional(),
  output: z.string().default("output.mp4"),
  fps: z.number().int().positive().default(30),
  cols: z.number().int().positive().default(80),
  rows: z.number().int().positive().default(24),
  steps: z.array(stepSchema).min(1),
});

export type TuireelConfig = z.infer<typeof configSchema>;
export type TuireelStep = z.infer<typeof stepSchema>;
export const STEP_TYPES = stepTypes;
