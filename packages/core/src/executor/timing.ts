import type { CadenceProfile } from "./pacing/profiles.js";

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededUnit(seed: string): number {
  return hashSeed(seed) / 0xffffffff;
}

export function charDelay(
  baseMs: number,
  context?: { text: string; char: string; index: number },
  profile?: CadenceProfile,
): number {
  const safeBaseMs = Math.max(1, baseMs);

  if (!context) {
    return safeBaseMs;
  }

  const { text, char, index } = context;
  const previousChar = index > 0 ? (text[index - 1] ?? "") : "";
  const jitter = seededUnit(`${safeBaseMs}:${index}:${char}:${text.length}`);

  let multiplier = 0.76 + jitter * 0.24;

  if (index === 0) {
    multiplier += profile?.firstCharExtra ?? 0.24;
  }

  if (char === "/") {
    multiplier += profile?.pathSepExtra ?? 0.08;
  }

  if (/\s/.test(char)) {
    multiplier += profile?.whitespaceExtra ?? 0.28;
  }

  if (/[.,!?;:]/.test(char)) {
    multiplier += profile?.punctuationExtra ?? 0.22;
  }

  if (/[\/_.-]/.test(previousChar)) {
    multiplier += profile?.pathSepExtra ?? 0.06;
  }

  return Math.max(12, Math.round(safeBaseMs * multiplier));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    timer.unref?.();
  });
}
