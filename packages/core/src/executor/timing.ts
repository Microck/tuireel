export function charDelay(baseMs: number): number {
  return baseMs * (0.5 + Math.random());
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    timer.unref?.();
  });
}
