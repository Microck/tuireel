import { sleep } from "../timing.js";

export async function pauseStep(durationMs: number): Promise<void> {
  await sleep(durationMs);
}
