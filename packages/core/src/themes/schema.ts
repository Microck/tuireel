import { z } from "zod";

const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

export const hexColorSchema = z
  .string()
  .regex(hexColorPattern, "Expected color in #RRGGBB format");

export const ansiColorsSchema = z
  .object({
    black: hexColorSchema,
    red: hexColorSchema,
    green: hexColorSchema,
    yellow: hexColorSchema,
    blue: hexColorSchema,
    magenta: hexColorSchema,
    cyan: hexColorSchema,
    white: hexColorSchema,
    brightBlack: hexColorSchema,
    brightRed: hexColorSchema,
    brightGreen: hexColorSchema,
    brightYellow: hexColorSchema,
    brightBlue: hexColorSchema,
    brightMagenta: hexColorSchema,
    brightCyan: hexColorSchema,
    brightWhite: hexColorSchema,
  })
  .strict();

export const themeSchema = z
  .object({
    background: hexColorSchema,
    foreground: hexColorSchema,
    cursor: hexColorSchema.optional(),
    colors: ansiColorsSchema,
    padding: z.number().nonnegative().optional(),
    fontFamily: z.string().min(1).optional(),
    fontSize: z.number().positive().optional(),
  })
  .strict();

export type ThemeConfig = z.infer<typeof themeSchema>;
export type ThemeColors = z.infer<typeof ansiColorsSchema>;
