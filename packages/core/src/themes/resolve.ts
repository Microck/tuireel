import { ZodError } from "zod";

import { builtInThemeNames, builtInThemes } from "./built-in.js";
import { themeSchema, type ThemeConfig } from "./schema.js";

function normalizeThemeName(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function resolveTheme(input: string | ThemeConfig): ThemeConfig {
  if (typeof input === "string") {
    const normalizedName = normalizeThemeName(input);
    const resolved = builtInThemes[normalizedName as keyof typeof builtInThemes];

    if (!resolved) {
      throw new Error(
        `Unknown theme \"${input}\". Available themes: ${builtInThemeNames.join(", ")}.`,
      );
    }

    return resolved;
  }

  try {
    return themeSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }

    throw new Error(`Invalid theme configuration: ${String(error)}`);
  }
}
