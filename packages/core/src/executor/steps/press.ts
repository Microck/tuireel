import type { Key } from "tuistory";

import { TuireelSession } from "../../session.js";

function parseKeyInput(key: string): Key | Key[] {
  const keys = key
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);

  if (keys.length === 0) {
    throw new Error("Press step key cannot be empty.");
  }

  if (keys.length === 1) {
    return keys[0] as Key;
  }

  return keys as Key[];
}

export async function pressStep(session: TuireelSession, key: string): Promise<void> {
  const parsedKey = parseKeyInput(key);
  await session.press(parsedKey);
}
