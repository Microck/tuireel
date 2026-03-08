import { readFile } from "node:fs/promises";

import { parse as parseJsonc, printParseErrorCode, type ParseError } from "jsonc-parser";
import { ZodError } from "zod";

import { resolveDeliveryProfile } from "../delivery-profiles/resolve.js";
import { resolvePreset } from "../presets/resolve.js";
import { resolveMultiConfig } from "./resolver.js";
import {
  STEP_TYPES,
  configSchema,
  multiVideoConfigSchema,
  singleVideoInputConfigSchema,
  type TuireelConfig,
  type TuireelInputConfig,
} from "./schema.js";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatIssuePath(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) {
    return "$";
  }

  return path.map((part) => (typeof part === "symbol" ? part.toString() : String(part))).join(".");
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

function prefixIssuePath(issue: ConfigIssue, prefix: string): ConfigIssue {
  if (prefix.length === 0) {
    return issue;
  }

  if (issue.path === "$") {
    return {
      ...issue,
      path: prefix,
    };
  }

  return {
    ...issue,
    path: `${prefix}.${issue.path}`,
  };
}

function mapInvalidStepTypeIssues(
  steps: unknown,
  pathPrefix: string,
  allowedStepTypes: Set<string>,
): ConfigIssue[] {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps.flatMap((step, index) => {
    if (!isRecord(step)) {
      return [];
    }

    if (typeof step.$include === "string") {
      return [];
    }

    const stepType = step.type;
    if (typeof stepType !== "string" || allowedStepTypes.has(stepType)) {
      return [];
    }

    return [
      {
        path: `${pathPrefix}${index}.type`,
        message: `Invalid step type "${stepType}". Expected one of: ${STEP_TYPES.join(", ")}.`,
      },
    ];
  });
}

function findInvalidStepTypeIssues(rawConfig: unknown): ConfigIssue[] {
  if (!isRecord(rawConfig)) {
    return [];
  }

  const allowedStepTypes = new Set(STEP_TYPES);

  if (Array.isArray(rawConfig.videos)) {
    return rawConfig.videos.flatMap((video, videoIndex) => {
      if (!isRecord(video)) {
        return [];
      }

      return mapInvalidStepTypeIssues(video.steps, `videos.${videoIndex}.steps.`, allowedStepTypes);
    });
  }

  return mapInvalidStepTypeIssues(rawConfig.steps, "steps.", allowedStepTypes);
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

function parseInputConfig(rawConfig: unknown): TuireelInputConfig {
  const schema =
    isRecord(rawConfig) && Object.hasOwn(rawConfig, "videos")
      ? multiVideoConfigSchema
      : singleVideoInputConfigSchema;

  const result = schema.safeParse(rawConfig);

  if (!result.success) {
    throw new ConfigValidationError(mapZodIssues(result.error));
  }

  return result.data;
}

function applyProfileResolution(rawConfig: Record<string, unknown>): Record<string, unknown> {
  return resolveDeliveryProfile(resolvePreset(rawConfig));
}

function stripSchemaField(config: TuireelConfig): TuireelConfig {
  const { $schema: _schema, ...rest } = config;
  return rest;
}

function parseSingleConfig(rawConfig: string): TuireelConfig {
  const parsedConfig = parseConfig(rawConfig);
  const profileResolved = applyProfileResolution(parsedConfig as Record<string, unknown>);

  const stepTypeIssues = findInvalidStepTypeIssues(profileResolved);
  if (stepTypeIssues.length > 0) {
    throw new ConfigValidationError(stepTypeIssues);
  }

  const result = configSchema.safeParse(profileResolved);
  if (!result.success) {
    throw new ConfigValidationError(mapZodIssues(result.error));
  }

  return stripSchemaField(result.data);
}

export function validateConfig(rawConfig: string): TuireelConfig {
  return parseSingleConfig(rawConfig);
}

function validateResolvedConfigs(
  resolvedConfigs: ReadonlyArray<Record<string, unknown>>,
  isMultiVideo: boolean,
): TuireelConfig[] {
  const issues: ConfigIssue[] = [];
  const validatedConfigs: TuireelConfig[] = [];

  for (const [index, config] of resolvedConfigs.entries()) {
    const profileResolved = applyProfileResolution(config);
    const result = configSchema.safeParse(profileResolved);
    if (!result.success) {
      const pathPrefix = isMultiVideo ? `videos.${index}` : "";
      issues.push(...mapZodIssues(result.error).map((issue) => prefixIssuePath(issue, pathPrefix)));
      continue;
    }

    validatedConfigs.push(stripSchemaField(result.data));
  }

  if (issues.length > 0) {
    throw new ConfigValidationError(issues);
  }

  return validatedConfigs;
}

async function loadConfigFromString(
  rawConfig: string,
  configPath: string,
): Promise<TuireelConfig[]> {
  const parsedConfig = parseConfig(rawConfig);
  const profileResolved = applyProfileResolution(parsedConfig as Record<string, unknown>);

  const stepTypeIssues = findInvalidStepTypeIssues(profileResolved);
  if (stepTypeIssues.length > 0) {
    throw new ConfigValidationError(stepTypeIssues);
  }

  const inputConfig = parseInputConfig(profileResolved);
  const isMultiVideo = "videos" in inputConfig;

  try {
    const resolvedConfigs = await resolveMultiConfig(inputConfig, configPath);
    return validateResolvedConfigs(resolvedConfigs, isMultiVideo);
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigValidationError([
      {
        path: "$",
        message,
      },
    ]);
  }
}

export async function loadConfig(configPath: string): Promise<TuireelConfig[]> {
  let rawConfig: string;
  try {
    rawConfig = await readFile(configPath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(
        `Config file not found: ${configPath}. Try: run 'tuireel init' to create one, or check the file path.`,
        { cause: error },
      );
    }
    throw new Error(
      `Failed to read config file: ${configPath}. Try: check file permissions and ensure the path is correct.`,
      { cause: error },
    );
  }
  return loadConfigFromString(rawConfig, configPath);
}

export async function loadSingleConfig(configPath: string): Promise<TuireelConfig> {
  const configs = await loadConfig(configPath);

  if (configs.length !== 1) {
    throw new Error(
      `Expected exactly one video config but found ${configs.length}. Try: use 'tuireel record' for multi-video configs, or split into separate config files.`,
    );
  }

  const [config] = configs;
  if (!config) {
    throw new Error(
      "No configuration resolved from input file. Try: check the config file is not empty and contains valid JSON.",
    );
  }

  return config;
}
