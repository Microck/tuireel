import { zodToJsonSchema } from "zod-to-json-schema";

import { configSchema } from "./schema.js";

export function generateJsonSchema(): Record<string, unknown> {
  const schema = zodToJsonSchema(configSchema as never, {
    name: "TuireelConfig",
    target: "jsonSchema7",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  if (!schema.$schema) {
    schema.$schema = "http://json-schema.org/draft-07/schema#";
  }

  return schema;
}
