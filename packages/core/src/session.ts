import { renderTerminalToImage } from "ghostty-opentui/image";
import { launchTerminal, type Key, type Session } from "tuistory";

export interface SessionConfig {
  command: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string | undefined>;
}

type ScreenshotFormat = "jpeg" | "png" | "webp";

const SCREENSHOT_FONT_SIZE = 14;
const SCREENSHOT_LINE_HEIGHT = 1.5;

export class TuireelSession {
  private readonly session: Session;

  constructor(session: Session) {
    this.session = session;
  }

  async screenshot(format: ScreenshotFormat = "jpeg"): Promise<Buffer> {
    const terminalData = this.session.getTerminalData();
    const viewportHeight = Math.round(
      terminalData.rows * SCREENSHOT_FONT_SIZE * SCREENSHOT_LINE_HEIGHT,
    );

    return renderTerminalToImage(terminalData, {
      format,
      quality: 90,
      fontSize: SCREENSHOT_FONT_SIZE,
      lineHeight: SCREENSHOT_LINE_HEIGHT,
      height: viewportHeight,
    });
  }

  waitIdle(options?: { timeout?: number }): Promise<void> {
    return this.session.waitIdle(options);
  }

  close(): void {
    this.session.close();
  }

  type(text: string): Promise<void> {
    return this.session.type(text);
  }

  writeRaw(text: string): void {
    this.session.writeRaw(text);
  }

  press(keys: Key | Key[]): Promise<void> {
    return this.session.press(keys);
  }

  waitForText(pattern: string | RegExp, options?: { timeout?: number }): Promise<string> {
    return this.session.waitForText(pattern, options);
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

  return new TuireelSession(session);
}
