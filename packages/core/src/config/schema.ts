import { z } from "zod";

import { DELIVERY_PROFILE_NAMES, type DeliveryProfileName } from "../delivery-profiles/built-in.js";
import { PRESET_NAMES } from "../presets/built-in.js";
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
const ENV_VAR_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const DELIVERY_PROFILE_NAME_SET = new Set<DeliveryProfileName>(DELIVERY_PROFILE_NAMES);
const soundEffectSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.string(),
]);

export const deliveryProfileSchema = z.string().superRefine((value, context) => {
  if (DELIVERY_PROFILE_NAME_SET.has(value as DeliveryProfileName)) {
    return;
  }

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: `Unknown delivery profile "${value}". Use one of: ${DELIVERY_PROFILE_NAMES.join(", ")}.`,
  });
});

const soundSchema = z
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
  .optional();

const cursorSchema = z
  .object({
    visible: z.boolean().optional(),
  })
  .optional();

const hudSchema = z
  .object({
    visible: z.boolean().optional(),
  })
  .optional();

const trimSchema = z
  .object({
    leadingStatic: z.boolean().optional(),
  })
  .optional();

const outputSizeSchema = z
  .object({
    width: z.number().int().positive().multipleOf(2),
    height: z.number().int().positive().multipleOf(2),
    padding: z.number().int().nonnegative().optional(),
  })
  .optional();

const baseConfigFields = {
  $schema: z.string().optional(),
  preset: z.enum(PRESET_NAMES).optional(),
  deliveryProfile: deliveryProfileSchema.optional(),
  format: z.enum(outputFormats).default("mp4"),
  output: z.string().default("output.mp4"),
  theme: z.union([z.string(), themeSchema]).optional(),
  sound: soundSchema,
  cursor: cursorSchema,
  hud: hudSchema,
  trim: trimSchema,
  outputSize: outputSizeSchema,
  defaultWaitTimeout: z.number().positive().optional(),
  fps: z.number().int().positive().default(30),
  captureFps: z.number().int().positive().optional(),
  cols: z.number().int().positive().default(80),
  rows: z.number().int().positive().default(24),
} satisfies Record<string, z.ZodTypeAny>;

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
  key: z.string().regex(ENV_VAR_KEY_PATTERN, {
    message:
      "set-env key must start with a letter or underscore and contain only letters, numbers, or underscores.",
  }),
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

export const includeStepSchema = z.object({
  $include: z.string().min(1),
});

export const stepWithIncludeSchema = z.union([stepSchema, includeStepSchema]);
export const stepArraySchema = z.array(stepWithIncludeSchema).min(1);

export const configSchema = z.object({
  ...baseConfigFields,
  steps: z.array(stepSchema).min(1),
});

export const singleVideoInputConfigSchema = z.object({
  ...baseConfigFields,
  steps: stepArraySchema,
});

const defaultsSchema = singleVideoInputConfigSchema.partial();

export const videoDefinitionSchema = z.object({
  name: z.string().min(1),
  output: z.string().min(1),
  steps: stepArraySchema,
  preset: z.enum(PRESET_NAMES).optional(),
  deliveryProfile: deliveryProfileSchema.optional(),
  format: z.enum(outputFormats).optional(),
  theme: z.union([z.string(), themeSchema]).optional(),
  sound: soundSchema,
  cursor: cursorSchema,
  hud: hudSchema,
  trim: trimSchema,
  outputSize: outputSizeSchema,
  defaultWaitTimeout: z.number().positive().optional(),
  fps: z.number().int().positive().optional(),
  captureFps: z.number().int().positive().optional(),
  cols: z.number().int().positive().optional(),
  rows: z.number().int().positive().optional(),
});

export const multiVideoConfigSchema = z.object({
  $schema: z.string().optional(),
  defaults: defaultsSchema.optional(),
  videos: z.array(videoDefinitionSchema).min(1),
});

export const configInputSchema = z.union([singleVideoInputConfigSchema, multiVideoConfigSchema]);

export type TuireelConfig = z.infer<typeof configSchema>;
export type TuireelStep = z.infer<typeof stepSchema>;
export type StepWithInclude = z.infer<typeof stepWithIncludeSchema>;
export type SingleVideoInputConfig = z.infer<typeof singleVideoInputConfigSchema>;
export type VideoDefinition = z.infer<typeof videoDefinitionSchema>;
export type MultiVideoConfig = z.infer<typeof multiVideoConfigSchema>;
export type TuireelInputConfig = z.infer<typeof configInputSchema>;
export type OutputFormat = (typeof outputFormats)[number];
export const STEP_TYPES = stepTypes;
export const OUTPUT_FORMATS = outputFormats;
