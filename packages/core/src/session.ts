import {
  renderTerminalToImage,
  type RenderImageOptions,
} from "ghostty-opentui/image";
import { launchTerminal, type Key, type Session } from "tuistory";

import type { ThemeConfig } from "./themes/schema.js";

export interface SessionConfig {
  command: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string | undefined>;
  theme?: ThemeConfig;
}

type ScreenshotFormat = "jpeg" | "png" | "webp";

const SCREENSHOT_FONT_SIZE = 14;
const SCREENSHOT_LINE_HEIGHT = 1.5;
const SCREENSHOT_QUALITY = 90;
const OSC_TERMINATOR = "\u0007";

const ANSI_THEME_COLOR_INDEXES: Array<[keyof ThemeConfig["colors"], number]> = [
  ["black", 0],
  ["red", 1],
  ["green", 2],
  ["yellow", 3],
  ["blue", 4],
  ["magenta", 5],
  ["cyan", 6],
  ["white", 7],
  ["brightBlack", 8],
  ["brightRed", 9],
  ["brightGreen", 10],
  ["brightYellow", 11],
  ["brightBlue", 12],
  ["brightMagenta", 13],
  ["brightCyan", 14],
  ["brightWhite", 15],
];

function buildOscCommand(code: string, value: string): string {
  return `\u001b]${code};${value}${OSC_TERMINATOR}`;
}

function looksLikeFontPath(value: string): boolean {
  return /[\\/]/.test(value) || /\.(ttf|otf|woff|woff2)$/i.test(value);
}

function quoteForShell(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function buildThemeEscapeSequence(theme: ThemeConfig): string {
  const paletteCommands = ANSI_THEME_COLOR_INDEXES.map(([name, index]) =>
    buildOscCommand(`4;${index}`, theme.colors[name]),
  );

  const defaultCommands = [
    buildOscCommand("10", theme.foreground),
    buildOscCommand("11", theme.background),
  ];

  if (theme.cursor) {
    defaultCommands.push(buildOscCommand("12", theme.cursor));
  }

  return [...paletteCommands, ...defaultCommands].join("");
}

type ScreenshotRenderOptions = RenderImageOptions & { fontFamily?: string };

export function buildScreenshotRenderOptions(options: {
  format: ScreenshotFormat;
  rows: number;
  theme?: ThemeConfig;
}): ScreenshotRenderOptions {
  const fontSize = options.theme?.fontSize ?? SCREENSHOT_FONT_SIZE;

  const renderOptions: ScreenshotRenderOptions = {
    format: options.format,
    quality: SCREENSHOT_QUALITY,
    fontSize,
    lineHeight: SCREENSHOT_LINE_HEIGHT,
    height: Math.round(options.rows * fontSize * SCREENSHOT_LINE_HEIGHT),
  };

  if (!options.theme) {
    return renderOptions;
  }

  renderOptions.theme = {
    background: options.theme.background,
    text: options.theme.foreground,
  };

  if (options.theme.padding !== undefined) {
    renderOptions.paddingX = options.theme.padding;
    renderOptions.paddingY = options.theme.padding;
  }

  if (options.theme.fontFamily) {
    renderOptions.fontFamily = options.theme.fontFamily;

    if (looksLikeFontPath(options.theme.fontFamily)) {
      renderOptions.fontPath = options.theme.fontFamily;
    }
  }

  return renderOptions;
}

export class TuireelSession {
  private readonly session: Session;

  private readonly theme?: ThemeConfig;

  readonly env: Record<string, string | undefined>;

  constructor(session: Session, theme?: ThemeConfig, env: Record<string, string | undefined> = {}) {
    this.session = session;
    this.theme = theme;
    this.env = { ...env };
  }

  async screenshot(format: ScreenshotFormat = "jpeg"): Promise<Buffer> {
    const terminalData = this.session.getTerminalData();

    return renderTerminalToImage(
      terminalData,
      buildScreenshotRenderOptions({
        format,
        rows: terminalData.rows,
        theme: this.theme,
      }),
    );
  }

  async applyTheme(theme: ThemeConfig): Promise<void> {
    this.session.writeRaw(buildThemeEscapeSequence(theme));
    await this.waitIdle({ timeout: 250 });
  }

  waitIdle(options?: { timeout?: number }): Promise<void> {
    return this.session.waitIdle(options);
  }

  close(): void {
    this.session.close();
  }

  async type(text: string): Promise<void> {
    try {
      await this.session.type(text);
    } catch (error) {
      const preview = text.length > 50 ? `${text.slice(0, 50)}...` : text;
      throw new Error(
        `Failed to type text "${preview}": ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  writeRaw(text: string): void {
    this.session.writeRaw(text);
  }

  setEnv(key: string, value: string): void {
    this.env[key] = value;
    this.session.writeRaw(`export ${key}=${quoteForShell(value)}\r`);
  }

  async press(keys: Key | Key[]): Promise<void> {
    try {
      await this.session.press(keys);
    } catch (error) {
      const keyStr = Array.isArray(keys) ? keys.join("+") : String(keys);
      throw new Error(
        `Failed to press key "${keyStr}": ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  async waitForText(pattern: string | RegExp, options?: { timeout?: number }): Promise<string> {
    try {
      return await this.session.waitForText(pattern, options);
    } catch (error) {
      const patternStr = pattern instanceof RegExp ? pattern.toString() : `"${pattern}"`;
      const timeoutStr = options?.timeout ? ` (timeout: ${options.timeout}ms)` : "";
      throw new Error(
        `Failed waiting for text matching ${patternStr}${timeoutStr}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  async scroll(direction: "up" | "down", amount: number): Promise<void> {
    const scrollAmount = Math.max(1, Math.floor(amount));
    const mouseSession = this.session as unknown as {
      scrollUp(lines?: number): Promise<void>;
      scrollDown(lines?: number): Promise<void>;
    };

    if (direction === "up") {
      await mouseSession.scrollUp(scrollAmount);
      return;
    }

    await mouseSession.scrollDown(scrollAmount);
  }

  clickText(pattern: string): Promise<void> {
    const mouseSession = this.session as unknown as {
      click(pattern: string, options?: { first?: boolean }): Promise<void>;
    };

    return mouseSession.click(pattern, { first: true });
  }

  resize(options: { cols: number; rows: number }): void {
    this.session.resize(options);
  }
}

export async function createSession(config: SessionConfig): Promise<TuireelSession> {
  const session = await launchTerminal({
    command: config.command,
    cols: config.cols,
    rows: config.rows,
    env: config.env,
  });

  const tuireelSession = new TuireelSession(session, config.theme, config.env);

  if (config.theme) {
    await tuireelSession.applyTheme(config.theme);
  }

  return tuireelSession;
}
