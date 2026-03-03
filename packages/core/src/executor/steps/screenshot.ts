import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type { TuireelStep } from "../../config/schema.js";
import type { TuireelSession } from "../../session.js";

type ScreenshotStep = Extract<TuireelStep, { type: "screenshot" }>;

export async function screenshotStep(
  session: TuireelSession,
  step: ScreenshotStep,
): Promise<void> {
  const outputPath = resolve(step.output);
  await mkdir(dirname(outputPath), { recursive: true });

  const screenshot = await session.screenshot("png");
  await writeFile(outputPath, screenshot);
}
