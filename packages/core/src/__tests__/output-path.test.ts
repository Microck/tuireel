import { describe, expect, it } from "vitest";

import { resolveOutputPath } from "../utils/output-path.js";

describe("resolveOutputPath", () => {
  it("normalizes output paths to match the selected format", () => {
    const cases: Array<[string, "mp4" | "webm" | "gif", string]> = [
      ["smoke-output.mp4", "webm", "smoke-output.webm"],
      ["smoke-output", "gif", "smoke-output.gif"],
      ["dir/name.webm", "mp4", "dir/name.mp4"],
      ["name.tar.gz", "webm", "name.tar.webm"],
      ["smoke-output.webm", "webm", "smoke-output.webm"],
    ];

    for (const [input, format, expected] of cases) {
      expect(resolveOutputPath(input, format)).toBe(expected);
    }
  });
});
