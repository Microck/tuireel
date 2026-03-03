import type { TuireelStep } from "../../config/schema.js";
import type { TuireelSession } from "../../session.js";

type ScrollStep = Extract<TuireelStep, { type: "scroll" }>;

export async function scrollStep(session: TuireelSession, step: ScrollStep): Promise<void> {
  await session.scroll(step.direction, step.amount);
}
