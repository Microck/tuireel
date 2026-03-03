import { describe, expect, it } from "vitest";

import { builtInThemes } from "../src/themes/built-in.js";
import { resolveTheme } from "../src/themes/resolve.js";
import type { ThemeConfig } from "../src/themes/schema.js";

describe("theme resolver", () => {
  it("resolves built-in theme names", () => {
    expect(resolveTheme("catppuccin")).toEqual(builtInThemes.catppuccin);
    expect(resolveTheme("Tokyo Night")).toEqual(builtInThemes["tokyo-night"]);
  });

  it("throws a clear error for unknown theme names", () => {
    expect(() => resolveTheme("missing-theme")).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unknown theme "missing-theme". Try: use one of the built-in themes: catppuccin, dracula, gruvbox-dark, monokai, nord, one-dark, solarized-dark, tokyo-night, or provide a custom theme object.]`,
    );
  });

  it("accepts and validates custom themes", () => {
    const customTheme: ThemeConfig = {
      background: "#101010",
      foreground: "#f0f0f0",
      cursor: "#ffffff",
      colors: {
        black: "#111111",
        red: "#aa0000",
        green: "#00aa00",
        yellow: "#aaaa00",
        blue: "#0000aa",
        magenta: "#aa00aa",
        cyan: "#00aaaa",
        white: "#aaaaaa",
        brightBlack: "#555555",
        brightRed: "#ff5555",
        brightGreen: "#55ff55",
        brightYellow: "#ffff55",
        brightBlue: "#5555ff",
        brightMagenta: "#ff55ff",
        brightCyan: "#55ffff",
        brightWhite: "#ffffff",
      },
      padding: 4,
      fontFamily: "JetBrainsMono.ttf",
      fontSize: 16,
    };

    expect(resolveTheme(customTheme)).toEqual(customTheme);
  });

  it("rejects custom themes with invalid color values", () => {
    expect(() =>
      resolveTheme({
        background: "#101010",
        foreground: "#f0f0f0",
        colors: {
          black: "#111111",
          red: "#aa0000",
          green: "#00aa00",
          yellow: "#aaaa00",
          blue: "#0000aa",
          magenta: "#aa00aa",
          cyan: "#00aaaa",
          white: "#aaaaaa",
          brightBlack: "#555555",
          brightRed: "#ff5555",
          brightGreen: "#55ff55",
          brightYellow: "#ffff55",
          brightBlue: "#5555ff",
          brightMagenta: "#ff55ff",
          brightCyan: "#55ffff",
          brightWhite: "white",
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [ZodError: [
        {
          "origin": "string",
          "code": "invalid_format",
          "format": "regex",
          "pattern": "/^#[0-9a-fA-F]{6}$/",
          "path": [
            "colors",
            "brightWhite"
          ],
          "message": "Expected color in #RRGGBB format"
        }
      ]]
    `);
  });
});
