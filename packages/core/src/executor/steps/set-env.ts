import type { TuireelStep } from "../../config/schema.js";
import type { TuireelSession } from "../../session.js";

type SetEnvStep = Extract<TuireelStep, { type: "set-env" }>;

export async function setEnvStep(session: TuireelSession, step: SetEnvStep): Promise<void> {
  session.setEnv(step.key, step.value);
}
