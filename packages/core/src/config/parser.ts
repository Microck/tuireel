import { readFile } from "node:fs/promises";

import {
  parse as parseJsonc,
  printParseErrorCode,
  type ParseError,
} from "jsonc-parser";
import { ZodError } from "zod";

import { STEP_TYPES, configSchema, type TuireelConfig } from "./schema.js";

export interface ConfigIssue {
  path: string;
  message: string;
}

export class ConfigValidationError extends Error {
  readonly issues: ConfigIssue[];

  constructor(issues: ConfigIssue[]) {
    const message = issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
    super(message);
    this.name = "ConfigValidationError";
    this.issues = issues;
  }
}

function formatIssuePath(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) {
    return "$";
  }

  return path
    .map((part) => (typeof part === "symbol" ? part.toString() : String(part)))
    .join(".");
}

function mapJsoncParseErrors(errors: ParseError[]): ConfigIssue[] {
  return errors.map((error) => ({
    path: "$",
    message: `JSONC parse error: ${printParseErrorCode(error.error)} at offset ${error.offset}`,
  }));
}

function mapZodIssues(error: ZodError): ConfigIssue[] {
  return error.issues.map((issue) => ({
    path: formatIssuePath(issue.path),
    message: issue.message,
  }));
}

function findInvalidStepTypeIssues(config: unknown): ConfigIssue[] {
  if (typeof config !== "object" || config === null) {
    return [];
  }

  const maybeSteps = (config as { steps?: unknown }).steps;
  if (!Array.isArray(maybeSteps)) {
    return [];
  }

  const allowedStepTypes = new Set(STEP_TYPES);

  return maybeSteps.flatMap((step, index) => {
    if (typeof step !== "object" || step === null) {
      return [];
    }

    const stepType = (step as { type?: unknown }).type;
    if (typeof stepType !== "string" || allowedStepTypes.has(stepType as never)) {
      return [];
    }

    return [
      {
        path: `steps.${index}.type`,
        message: `Invalid step type \"${stepType}\". Expected one of: ${STEP_TYPES.join(", ")}.`,
      },
    ];
  });
}

function parseConfig(rawConfig: string): unknown {
  const parseErrors: ParseError[] = [];
  const parsedConfig = parseJsonc(rawConfig, parseErrors, {
    allowTrailingComma: true,
  });

  if (parseErrors.length > 0) {
    throw new ConfigValidationError(mapJsoncParseErrors(parseErrors));
  }

  return parsedConfig;
}

function stripSchemaField(config: TuireelConfig): TuireelConfig {
  const { $schema: _schema, ...rest } = config;
  return rest;
}

export function validateConfig(rawConfig: string): TuireelConfig {
  const parsedConfig = parseConfig(rawConfig);

  const stepTypeIssues = findInvalidStepTypeIssues(parsedConfig);
  if (stepTypeIssues.length > 0) {
    throw new ConfigValidationError(stepTypeIssues);
  }

  const result = configSchema.safeParse(parsedConfig);
  if (!result.success) {
    throw new ConfigValidationError(mapZodIssues(result.error));
  }

  return stripSchemaField(result.data);
}

export async function loadConfig(configPath: string): Promise<TuireelConfig> {
  const rawConfig = await readFile(configPath, "utf8");
  return validateConfig(rawConfig);
}
