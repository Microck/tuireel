import { extname } from "node:path";

import type { OutputFormat } from "../config/schema.js";

export function resolveOutputPath(outputPath: string, format: OutputFormat): string {
  const extension = extname(outputPath);

  if (extension.length === 0) {
    return `${outputPath}.${format}`;
  }

  return `${outputPath.slice(0, -extension.length)}.${format}`;
}
