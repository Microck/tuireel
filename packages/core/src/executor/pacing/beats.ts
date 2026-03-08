import type { Step } from "../step-executor.js";

export type BeatType = "startup" | "settle" | "read" | "idle";

export function resolveBeatType(prevStep: Step | undefined, currentStep: Step): BeatType | null {
  if (currentStep.type === "pause") {
    return null;
  }

  if (!prevStep || prevStep.type === "pause") {
    return null;
  }

  if (prevStep.type === "launch") {
    return "startup";
  }

  if (prevStep.type === "wait") {
    return "settle";
  }

  if (currentStep.type === "type") {
    return "read";
  }

  return "idle";
}
