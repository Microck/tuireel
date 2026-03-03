import { z } from "zod";

import { configInputSchema } from "./schema.js";

export function generateJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(configInputSchema, {
    target: "draft-07",
    io: "input",
  }) as Record<string, unknown>;

  if (!schema.$schema) {
    schema.$schema = "http://json-schema.org/draft-07/schema#";
  }

  return schema;
}
