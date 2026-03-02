import { TuireelSession } from "../../session.js";

export async function waitStep(
  session: TuireelSession,
  pattern: string | RegExp,
  timeout?: number,
): Promise<void> {
  await session.waitForText(pattern, timeout === undefined ? undefined : { timeout });
}
