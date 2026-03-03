import type { TuireelStep } from "../../config/schema.js";
import type { TuireelSession } from "../../session.js";

type ResizeStep = Extract<TuireelStep, { type: "resize" }>;

export async function resizeStep(session: TuireelSession, step: ResizeStep): Promise<void> {
  session.resize({ cols: step.cols, rows: step.rows });
}
