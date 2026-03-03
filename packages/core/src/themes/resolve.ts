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
        `Unknown theme "${input}". Try: use one of the built-in themes: ${builtInThemeNames.join(", ")}, or provide a custom theme object.`,
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

    throw new Error(`Invalid theme configuration: ${String(error)}. Try: check that all required theme fields (foreground, background, colors) are valid hex color strings.`);
  }
}
