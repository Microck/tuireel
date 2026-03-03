import { launchTerminal } from "tuistory";

import type { TuireelConfig, TuireelStep } from "./config/schema.js";
import { executeSteps } from "./executor/step-executor.js";
import { createSession, TuireelSession } from "./session.js";
import { resolveTheme } from "./themes/resolve.js";

const SUMMARY_TEXT_LIMIT = 30;

type LaunchStep = Extract<TuireelStep, { type: "launch" }>;

function assertNever(step: never): never {
  throw new Error(`Unsupported step type: ${JSON.stringify(step)}`);
}

function isLaunchStep(step: TuireelStep): step is LaunchStep {
  return step.type === "launch";
}

function getLaunchCommand(config: TuireelConfig): string {
  const launchStep = config.steps.find(isLaunchStep);
  if (!launchStep) {
    throw new Error("Config must include at least one launch step");
  }

  return launchStep.command;
}

function summarizeText(input: string): string {
  const compact = input.replace(/\s+/g, " ").trim();
  if (compact.length <= SUMMARY_TEXT_LIMIT) {
    return compact;
  }

  return `${compact.slice(0, SUMMARY_TEXT_LIMIT)}...`;
}

function summarizeWaitPattern(step: Extract<TuireelStep, { type: "wait" }>): string {
  if (typeof step.pattern === "string") {
    return `"${summarizeText(step.pattern)}"`;
  }

  const flags = step.pattern.flags ?? "";
  return `/${summarizeText(step.pattern.regex)}/${flags}`;
}

function summarizeStep(step: TuireelStep): string {
  switch (step.type) {
    case "launch":
      return `command "${summarizeText(step.command)}"`;
    case "type":
      return `text "${summarizeText(step.text)}"`;
    case "press":
      return `key ${step.key}`;
    case "wait":
      return step.timeout === undefined
        ? `pattern ${summarizeWaitPattern(step)}`
        : `pattern ${summarizeWaitPattern(step)} (${step.timeout}ms timeout)`;
    case "pause":
      return `${step.duration}ms`;
    case "scroll":
      return `${step.direction} ${step.amount}`;
    case "click":
      return `pattern "${summarizeText(step.pattern)}"`;
    case "screenshot":
      return `output "${summarizeText(step.output)}"`;
    case "resize":
      return `${step.cols}x${step.rows}`;
    case "set-env":
      return `${step.key}=<set>`;
    default:
      return assertNever(step);
  }
}

function isVisibleOptionUnsupported(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("visible") &&
    (message.includes("unknown") || message.includes("unsupported") || message.includes("invalid"))
  );
}

async function createPreviewSession(config: {
  command: string;
  cols: number;
  rows: number;
  env: Record<string, string | undefined>;
  theme?: Awaited<ReturnType<typeof resolveTheme>>;
}): Promise<TuireelSession> {
  type LaunchTerminalOptions = Parameters<typeof launchTerminal>[0] & { visible?: boolean };

  const launchOptions: LaunchTerminalOptions = {
    command: config.command,
    cols: config.cols,
    rows: config.rows,
    env: config.env,
    visible: true,
  };

  try {
    const session = await launchTerminal(launchOptions);
    const previewSession = new TuireelSession(session, config.theme, config.env);

    if (config.theme) {
      await previewSession.applyTheme(config.theme);
    }

    return previewSession;
  } catch (error) {
    if (!isVisibleOptionUnsupported(error)) {
      throw error;
    }

    return createSession({
      command: config.command,
      cols: config.cols,
      rows: config.rows,
      env: config.env,
      theme: config.theme,
    });
  }
}

export async function preview(config: TuireelConfig): Promise<void> {
  const launchCommand = getLaunchCommand(config);
  const resolvedTheme = config.theme ? resolveTheme(config.theme) : undefined;

  let session: TuireelSession | null = null;

  try {
    session = await createPreviewSession({
      command: launchCommand,
      cols: config.cols,
      rows: config.rows,
      env: {},
      theme: resolvedTheme,
    });

    await executeSteps(session, config.steps, {
      defaultWaitTimeout: config.defaultWaitTimeout,
      onStepStart: (step) => {
        console.log(`▶ ${step.type}: ${summarizeStep(step)}`);
      },
    });

    await session.waitIdle();
  } finally {
    session?.close();
  }
}
