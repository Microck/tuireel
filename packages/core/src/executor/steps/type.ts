import { TuireelSession } from "../../session.js";
import { charDelay, sleep } from "../timing.js";

const DEFAULT_TYPE_SPEED_MS = 50;

export async function typeStep(
  session: TuireelSession,
  text: string,
  speed: number = DEFAULT_TYPE_SPEED_MS,
): Promise<void> {
  const baseSpeed = speed > 0 ? speed : DEFAULT_TYPE_SPEED_MS;

  for (const char of text) {
    session.writeRaw(char);
    await sleep(charDelay(baseSpeed));
  }

  await session.waitIdle();
}
