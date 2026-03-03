import type { TuireelStep } from "../../config/schema.js";
import type { TuireelSession } from "../../session.js";

type ClickStep = Extract<TuireelStep, { type: "click" }>;

export async function clickStep(session: TuireelSession, step: ClickStep): Promise<void> {
  await session.clickText(step.pattern);
}
