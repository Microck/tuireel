import type { TuireelStep } from "../../config/schema.js";
import type { TuireelSession } from "../../session.js";

type SetEnvStep = Extract<TuireelStep, { type: "set-env" }>;

export function setEnvStep(session: TuireelSession, step: SetEnvStep): void {
  session.env[step.key] = step.value;
}
