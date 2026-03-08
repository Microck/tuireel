import type { TuireelStep } from "../config/schema.js";
import type { TuireelSession } from "../session.js";

import {
  resolveBeatType,
  resolveProfile,
  type CadenceProfile,
  type CadenceProfileName,
} from "./pacing/index.js";
import { launchStep } from "./steps/launch.js";
import { pauseStep } from "./steps/pause.js";
import { pressStep } from "./steps/press.js";
import { clickStep } from "./steps/click.js";
import { resizeStep } from "./steps/resize.js";
import { screenshotStep } from "./steps/screenshot.js";
import { scrollStep } from "./steps/scroll.js";
import { setEnvStep } from "./steps/set-env.js";
import { typeStep } from "./steps/type.js";
import { waitStep } from "./steps/wait.js";
import { sleep } from "./timing.js";

export type Step = TuireelStep;
type WaitPattern = Extract<Step, { type: "wait" }>["pattern"];

export interface ExecuteStepsOptions {
  onStepStart?: (step: Step, index: number) => void | Promise<void>;
  onStepComplete?: (step: Step, index: number) => void | Promise<void>;
  onTypeCharacter?: (payload: {
    char: string;
    charIndex: number;
    step: Extract<Step, { type: "type" }>;
    stepIndex: number;
  }) => void | Promise<void>;
  defaultWaitTimeout?: number;
  pacing?: CadenceProfileName | CadenceProfile;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function assertNever(step: never): never {
  throw new Error(
    `Unsupported step type: ${JSON.stringify(step)}. Try: check available step types in the docs or run 'tuireel validate'.`,
  );
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
  options: ExecuteStepsOptions = {},
): Promise<void> {
  const profile = resolveProfile(options.pacing);

  for (const [index, step] of steps.entries()) {
    await options.onStepStart?.(step, index);

    if (profile) {
      const beatType = resolveBeatType(steps[index - 1], step);
      if (beatType) {
        await sleep(profile.beats[beatType]);
      }
    }

    try {
      switch (step.type) {
        case "launch": {
          launchStep(step.command);
          break;
        }
        case "type": {
          await typeStep(session, step.text, step.speed, profile, (char, charIndex) =>
            options.onTypeCharacter?.({
              char,
              charIndex,
              step,
              stepIndex: index,
            }),
          );
          break;
        }
        case "press": {
          await pressStep(session, step.key);
          break;
        }
        case "wait": {
          await waitStep(
            session,
            compileWaitPattern(step.pattern),
            step.timeout,
            options.defaultWaitTimeout,
          );
          break;
        }
        case "pause": {
          await pauseStep(step.duration);
          break;
        }
        case "scroll": {
          await scrollStep(session, step);
          break;
        }
        case "click": {
          await clickStep(session, step);
          break;
        }
        case "screenshot": {
          await screenshotStep(session, step);
          break;
        }
        case "resize": {
          await resizeStep(session, step);
          break;
        }
        case "set-env": {
          await setEnvStep(session, step);
          break;
        }
        default: {
          assertNever(step);
        }
      }
    } catch (error) {
      throw new Error(
        `Step ${index + 1} (${step.type}) failed: ${errorMessage(error)}. Try: check the step configuration and ensure the terminal is in the expected state.`,
        {
          cause: error,
        },
      );
    }

    if (step.type !== "screenshot") {
      await session.waitIdle();
    }
    await options.onStepComplete?.(step, index);
  }
}
