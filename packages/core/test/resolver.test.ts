import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveIncludes } from "../src/config/resolver.js";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

async function makeTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "tuireel-resolver-"));
  tempDirectories.push(directory);
  return directory;
}

describe("resolveIncludes", () => {
  it("resolves nested include files and flattens steps", async () => {
    const directory = await makeTempDirectory();
    const sharedDirectory = join(directory, "shared");
    const nestedDirectory = join(directory, "nested");

    await mkdir(sharedDirectory, { recursive: true });
    await mkdir(nestedDirectory, { recursive: true });

    await writeFile(
      join(sharedDirectory, "sequence.jsonc"),
      `{
        "steps": [
          { "type": "type", "text": "whoami" },
          { "$include": "../nested/final.jsonc" }
        ]
      }`,
      "utf8",
    );

    await writeFile(
      join(nestedDirectory, "final.jsonc"),
      `{
        "steps": [
          { "type": "wait", "pattern": "ready" }
        ]
      }`,
      "utf8",
    );

    const resolved = await resolveIncludes(
      [
        { type: "launch", command: "npm run dev" },
        { $include: "./shared/sequence.jsonc" },
        { type: "press", key: "Enter" },
      ],
      directory,
    );

    expect(resolved).toEqual([
      { type: "launch", command: "npm run dev" },
      { type: "type", text: "whoami" },
      { type: "wait", pattern: "ready" },
      { type: "press", key: "Enter" },
    ]);
  });

  it("throws clear error when include file is missing", async () => {
    const directory = await makeTempDirectory();

    await expect(
      resolveIncludes([{ $include: "./missing.jsonc" }], directory),
    ).rejects.toThrow(/Include file not found:/);
  });

  it("throws clear error when include file contains invalid JSONC", async () => {
    const directory = await makeTempDirectory();
    const invalidPath = join(directory, "invalid.jsonc");

    await writeFile(
      invalidPath,
      `{
        "steps": [
          { "type": "type", "text": "hello" }
      }`,
      "utf8",
    );

    await expect(resolveIncludes([{ $include: "./invalid.jsonc" }], directory)).rejects.toThrow(
      /Failed to parse include file:/,
    );
  });

  it("detects circular include chains", async () => {
    const directory = await makeTempDirectory();

    await writeFile(
      join(directory, "a.jsonc"),
      `{
        "steps": [
          { "$include": "./b.jsonc" }
        ]
      }`,
      "utf8",
    );

    await writeFile(
      join(directory, "b.jsonc"),
      `{
        "steps": [
          { "$include": "./a.jsonc" }
        ]
      }`,
      "utf8",
    );

    await expect(resolveIncludes([{ $include: "./a.jsonc" }], directory)).rejects.toThrow(
      /Circular include detected:/,
    );
  });
});
