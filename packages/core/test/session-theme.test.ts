import { ptyToJson } from "ghostty-opentui";
import { describe, expect, it } from "vitest";

import {
  buildScreenshotRenderOptions,
  buildThemeEscapeSequence,
} from "../src/session.js";
import { builtInThemes } from "../src/themes/built-in.js";

describe("session theme integration", () => {
  it("builds OSC palette commands that remap ANSI colors", () => {
    const theme = builtInThemes.catppuccin;
    const ansi = `${buildThemeEscapeSequence(theme)}\u001b[31mR\u001b[0m\u001b[44mB\u001b[0m`;
    const terminal = ptyToJson(ansi, { cols: 8, rows: 2 });
    const line = terminal.lines[0];

    const redSpan = line.spans.find((span) => span.text.includes("R"));
    const blueBackgroundSpan = line.spans.find((span) => span.text.includes("B"));

    expect(redSpan?.fg?.toLowerCase()).toBe(theme.colors.red.toLowerCase());
    expect(blueBackgroundSpan?.bg?.toLowerCase()).toBe(theme.colors.blue.toLowerCase());
  });

  it("maps theme padding and typography into screenshot render options", () => {
    const themedOptions = buildScreenshotRenderOptions({
      format: "png",
      rows: 24,
      theme: {
        ...builtInThemes.dracula,
        padding: 3,
        fontFamily: "./fonts/custom.ttf",
        fontSize: 18,
      },
    });

    expect(themedOptions.theme).toEqual({
      background: builtInThemes.dracula.background,
      text: builtInThemes.dracula.foreground,
    });
    expect(themedOptions.paddingX).toBe(3);
    expect(themedOptions.paddingY).toBe(3);
    expect(themedOptions.fontFamily).toBe("./fonts/custom.ttf");
    expect(themedOptions.fontPath).toBe("./fonts/custom.ttf");
    expect(themedOptions.fontSize).toBe(18);
    expect(themedOptions.height).toBe(Math.round(24 * 18 * 1.5));
  });

  it("uses renderer defaults when no theme override is set", () => {
    const renderOptions = buildScreenshotRenderOptions({
      format: "jpeg",
      rows: 10,
    });

    expect(renderOptions.theme).toBeUndefined();
    expect(renderOptions.paddingX).toBeUndefined();
    expect(renderOptions.fontSize).toBe(14);
    expect(renderOptions.height).toBe(Math.round(10 * 14 * 1.5));
  });
});
