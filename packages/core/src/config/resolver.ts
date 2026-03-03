import { readFile } from "node:fs/promises";
import { dirname, resolve as resolvePath } from "node:path";

import {
  parse as parseJsonc,
  printParseErrorCode,
  type ParseError,
} from "jsonc-parser";

interface IncludeDirective {
  $include: string;
}

type StepWithInclude<Step extends Record<string, unknown>> = Step | IncludeDirective;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIncludeDirective<Step extends Record<string, unknown>>(
  step: StepWithInclude<Step>,
): step is IncludeDirective {
  return (
    isRecord(step)
    && typeof step.$include === "string"
    && step.$include.trim().length > 0
  );
}

function parseIncludeFile(filePath: string, rawContent: string): Array<Record<string, unknown>> {
  const parseErrors: ParseError[] = [];
  const parsed = parseJsonc(rawContent, parseErrors, {
    allowTrailingComma: true,
  });

  if (parseErrors.length > 0) {
    const firstError = parseErrors[0];
    const parseMessage = firstError
      ? printParseErrorCode(firstError.error)
      : "Unknown parse error";
    throw new Error(`Failed to parse include file: ${filePath}: ${parseMessage}`);
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.steps)) {
    throw new Error(`Include file must define a steps array: ${filePath}`);
  }

  return parsed.steps.filter(isRecord);
}

function buildIncludeChain(seen: Set<string>, currentPath: string): string {
  return [...seen, currentPath].join(" -> ");
}

export async function resolveIncludes<Step extends Record<string, unknown>>(
  steps: ReadonlyArray<StepWithInclude<Step>>,
  baseDir: string,
  seen: Set<string> = new Set(),
  parentFile = "<config>",
): Promise<Step[]> {
  const resolvedSteps: Step[] = [];

  for (const step of steps) {
    if (!isIncludeDirective(step)) {
      resolvedSteps.push(step as Step);
      continue;
    }

    const includePath = resolvePath(baseDir, step.$include);

    if (seen.has(includePath)) {
      const chain = buildIncludeChain(seen, includePath);
      throw new Error(`Circular include detected: ${includePath} (chain: ${chain})`);
    }

    let includeRawContent: string;
    try {
      includeRawContent = await readFile(includePath, "utf8");
    } catch (error) {
      const maybeError = error as NodeJS.ErrnoException;
      if (maybeError.code === "ENOENT") {
        throw new Error(
          `Include file not found: ${includePath} (referenced from ${parentFile})`,
        );
      }

      throw error;
    }

    const parsedIncludeSteps = parseIncludeFile(includePath, includeRawContent) as Array<
      StepWithInclude<Step>
    >;

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
