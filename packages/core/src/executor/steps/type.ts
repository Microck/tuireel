import type { CadenceProfile } from "../pacing/profiles.js";

import { TuireelSession } from "../../session.js";
import { charDelay, sleep } from "../timing.js";

const DEFAULT_TYPE_SPEED_MS = 50;

export async function typeStep(
  session: TuireelSession,
  text: string,
  speed?: number,
  profile?: CadenceProfile,
  onCharacter?: (char: string, index: number) => void | Promise<void>,
): Promise<void> {
  const requestedSpeed = speed ?? profile?.baseSpeedMs ?? DEFAULT_TYPE_SPEED_MS;
  const baseSpeed = requestedSpeed > 0 ? requestedSpeed : DEFAULT_TYPE_SPEED_MS;

  let index = 0;
  for (const char of text) {
    session.writeRaw(char);
    await sleep(
      charDelay(
        baseSpeed,
        {
          text,
          char,
          index,
        },
        profile,
      ),
    );
    await onCharacter?.(char, index);
    index += 1;
  }

  await session.waitIdle();
}
