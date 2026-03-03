import { TuireelSession } from "../../session.js";

export async function waitStep(
  session: TuireelSession,
  pattern: string | RegExp,
  timeout?: number,
  defaultTimeout?: number,
): Promise<void> {
  const effectiveTimeout = timeout ?? defaultTimeout;
  await session.waitForText(pattern, effectiveTimeout === undefined ? undefined : { timeout: effectiveTimeout });
}
