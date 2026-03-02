import { readFile } from "node:fs/promises";

import { ConfigValidationError, loadConfig, type ConfigIssue } from "@tuireel/core";
import type { Command } from "commander";

const DEFAULT_CONFIG_PATH = ".tuireel.jsonc";
const COLOR_RESET = "\u001b[0m";
const COLOR_GREEN = "\u001b[32m";
const COLOR_RED = "\u001b[31m";

const PARSE_ERROR_PATTERN = /^JSONC parse error: (.+) at offset (\d+)$/;

interface ValidateCommandOutput {
  log: (message: string) => void;
  error: (message: string) => void;
}

const defaultOutput: ValidateCommandOutput = {
  log: (message) => {
    console.log(message);
  },
  error: (message) => {
    console.error(message);
  },
};

function formatSuccessLine(message: string): string {
  return `${COLOR_GREEN}✓${COLOR_RESET} ${message}`;
}

function formatErrorLine(message: string): string {
  return `${COLOR_RED}✗${COLOR_RESET} ${message}`;
}

function mapParseIssueToLineColumn(issue: ConfigIssue, rawConfig: string): ConfigIssue {
  const parseErrorMatch = issue.message.match(PARSE_ERROR_PATTERN);
  if (!parseErrorMatch) {
    return issue;
  }

  const [, parseMessage, offsetText] = parseErrorMatch;
  const { line, column } = getLineAndColumn(rawConfig, Number(offsetText));

  return {
    path: issue.path,
    message: `${parseMessage} at line ${line}, column ${column}`,
  };
}

function getLineAndColumn(source: string, offset: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const clampedOffset = Math.max(0, Math.min(offset, source.length));

  for (let index = 0; index < clampedOffset; index += 1) {
    if (source[index] === "\n") {
      line += 1;
      column = 1;
      continue;
    }

    column += 1;
  }

  return { line, column };
}

export function registerValidateCommand(
  program: Command,
  output: ValidateCommandOutput = defaultOutput,
): void {
  program
    .command("validate")
    .description("Validate a tuireel config file")
    .argument("[configPath]", "Path to config file", DEFAULT_CONFIG_PATH)
    .action(async (configPath: string) => {
      try {
        await loadConfig(configPath);
        output.log(formatSuccessLine(`Config is valid: ${configPath}`));
      } catch (error) {
        if (error instanceof ConfigValidationError) {
          let rawConfig = "";
          try {
            rawConfig = await readFile(configPath, "utf8");
          } catch {
            rawConfig = "";
          }

          const issues =
            rawConfig.length > 0
              ? error.issues.map((issue) => mapParseIssueToLineColumn(issue, rawConfig))
              : error.issues;

          for (const issue of issues) {
            output.error(formatErrorLine(`${issue.path}: ${issue.message}`));
          }
          process.exitCode = 1;
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        output.error(formatErrorLine(message));
        process.exitCode = 1;
      }
    });
}
