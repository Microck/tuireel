import type { TuireelStep } from "../config/schema.js";
import type { TuireelSession } from "../session.js";

import { launchStep } from "./steps/launch.js";
import { pauseStep } from "./steps/pause.js";
import { pressStep } from "./steps/press.js";
import { typeStep } from "./steps/type.js";
import { waitStep } from "./steps/wait.js";

export type Step = TuireelStep;
type WaitPattern = Extract<Step, { type: "wait" }>["pattern"];

export interface ExecuteStepsCallbacks {
  onStepStart?: (step: Step, index: number) => void | Promise<void>;
  onStepComplete?: (step: Step, index: number) => void | Promise<void>;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function assertNever(step: never): never {
  throw new Error(`Unsupported step type: ${JSON.stringify(step)}`);
}

function compileWaitPattern(pattern: WaitPattern): string | RegExp {
  if (typeof pattern === "string") {
    return pattern;
  }

  return new RegExp(pattern.regex, pattern.flags);
}

export async function executeSteps(
  session: TuireelSession,
  steps: Step[],
  callbacks: ExecuteStepsCallbacks = {},
): Promise<void> {
  for (const [index, step] of steps.entries()) {
    await callbacks.onStepStart?.(step, index);

    try {
      switch (step.type) {
        case "launch": {
          launchStep(step.command);
          break;
        }
        case "type": {
          await typeStep(session, step.text, step.speed);
          break;
        }
        case "press": {
          await pressStep(session, step.key);
          break;
        }
        case "wait": {
          await waitStep(session, compileWaitPattern(step.pattern), step.timeout);
          break;
        }
        case "pause": {
          await pauseStep(step.duration);
          break;
        }
        case "scroll": {
          break;
        }
        case "click": {
          break;
        }
        case "screenshot": {
          break;
        }
        case "resize": {
          break;
        }
        case "set-env": {
          break;
        }
        default: {
          assertNever(step);
        }
      }
    } catch (error) {
      throw new Error(`Step ${index + 1} (${step.type}) failed: ${errorMessage(error)}`, {
        cause: error,
      });
    }

    await session.waitIdle();
    await callbacks.onStepComplete?.(step, index);
  }
}
