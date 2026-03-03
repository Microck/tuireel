import { readFile } from "node:fs/promises";
import { dirname, resolve as resolvePath } from "node:path";

import {
  parse as parseJsonc,
  printParseErrorCode,
  type ParseError,
} from "jsonc-parser";

import type {
  MultiVideoConfig,
  StepWithInclude,
  TuireelInputConfig,
  TuireelStep,
  VideoDefinition,
} from "./schema.js";

interface IncludeDirective {
  $include: string;
}

type ResolvedConfigInput = Omit<VideoDefinition, "name"> & {
  $schema?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIncludeDirective(
  step: StepWithInclude,
): step is IncludeDirective {
  if (!isRecord(step) || !Object.hasOwn(step, "$include")) {
    return false;
  }

  const includePath = (step as Record<string, unknown>)["$include"];
  return typeof includePath === "string" && includePath.trim().length > 0;
}

function isMultiVideoConfig(rawConfig: TuireelInputConfig): rawConfig is MultiVideoConfig {
  return "videos" in rawConfig;
}

function parseIncludeFile(filePath: string, rawContent: string): StepWithInclude[] {
  const parseErrors: ParseError[] = [];
  const parsed = parseJsonc(rawContent, parseErrors, {
    allowTrailingComma: true,
  });

  if (parseErrors.length > 0) {
    const firstError = parseErrors[0];
    const parseMessage = firstError
      ? printParseErrorCode(firstError.error)
      : "Unknown parse error";
    throw new Error(`Failed to parse include file ${filePath}: ${parseMessage}. Try: validate JSON syntax in the include file.`);
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.steps)) {
    throw new Error(`Include file must define a "steps" array: ${filePath}. Try: ensure the file has the format { "steps": [...] }.`);
  }

  if (!parsed.steps.every(isRecord)) {
    throw new Error(`Include file "steps" must be an array of objects: ${filePath}. Try: check that each step is a JSON object with a "type" field.`);
  }

  return parsed.steps as StepWithInclude[];
}

function buildIncludeChain(seen: Set<string>, currentPath: string): string {
  return [...seen, currentPath].join(" -> ");
}

export async function resolveIncludes(
  steps: ReadonlyArray<StepWithInclude>,
  baseDir: string,
  seen: Set<string> = new Set(),
  parentFile = "<config>",
): Promise<TuireelStep[]> {
  const resolvedSteps: TuireelStep[] = [];

  for (const step of steps) {
    if (!isIncludeDirective(step)) {
      resolvedSteps.push(step);
      continue;
    }

    const includePath = resolvePath(baseDir, step.$include);

    if (seen.has(includePath)) {
      const chain = buildIncludeChain(seen, includePath);
      throw new Error(`Circular include detected: ${includePath} (chain: ${chain}). Try: remove the circular $include reference.`);
    }

    let includeRawContent: string;
    try {
      includeRawContent = await readFile(includePath, "utf8");
    } catch (error) {
      const maybeError = error as NodeJS.ErrnoException;
      if (maybeError.code === "ENOENT") {
        throw new Error(
          `Include file not found: ${includePath} (referenced from ${parentFile}). Try: check the $include path is correct and relative to the config file.`,
        );
      }

      throw error;
    }

    const parsedIncludeSteps = parseIncludeFile(includePath, includeRawContent);

    const nextSeen = new Set(seen);
    nextSeen.add(includePath);

    const nestedSteps = await resolveIncludes(
      parsedIncludeSteps,
      dirname(includePath),
      nextSeen,
      includePath,
    );

    resolvedSteps.push(...nestedSteps);
  }

  return resolvedSteps;
}

function mergeVideoWithDefaults(
  video: VideoDefinition,
  defaults: Partial<ResolvedConfigInput>,
  schemaRef: string | undefined,
): ResolvedConfigInput {
  const { name: _name, ...videoOverrides } = video;

  return {
    ...defaults,
    ...videoOverrides,
    $schema: defaults.$schema ?? schemaRef,
    steps: video.steps,
  };
}

export async function resolveMultiConfig(
  rawConfig: TuireelInputConfig,
  configPath: string,
): Promise<ResolvedConfigInput[]> {
  const configDir = dirname(configPath);
  const includeSeed = new Set<string>([configPath]);

  if (!isMultiVideoConfig(rawConfig)) {
    const steps = await resolveIncludes(rawConfig.steps, configDir, includeSeed, configPath);
    return [{ ...rawConfig, steps }];
  }

  const defaults = rawConfig.defaults ?? {};
  const configs: ResolvedConfigInput[] = [];

  for (const video of rawConfig.videos) {
    const merged = mergeVideoWithDefaults(video, defaults, rawConfig.$schema);
    const steps = await resolveIncludes(merged.steps, configDir, includeSeed, configPath);
    configs.push({
      ...merged,
      steps,
    });
  }

  return configs;
}
