import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadConfig, record } from "../../core/src/index.js";

const execFileAsync = promisify(execFile);

type InspectFixture = {
  configPath: string;
  workDirectory: string;
};

async function createInspectFixture(name: string, pacingBlock: string): Promise<InspectFixture> {
  const workDirectory = await mkdtemp(join(tmpdir(), `tuireel-cli-inspect-${name}-`));
  const configPath = join(workDirectory, `${name}.tuireel.jsonc`);
  const outputName = `${name}.mp4`;
  const previousCwd = process.cwd();

  await writeFile(
    configPath,
    `{
  "output": "${outputName}",
  "format": "mp4",
  ${pacingBlock}
  "steps": [
    { "type": "launch", "command": "echo inspect" },
    { "type": "type", "text": "echo paced output" },
    { "type": "press", "key": "Enter" }
  ]
}
`,
    "utf8",
  );

  const [config] = await loadConfig(configPath);

  try {
    process.chdir(workDirectory);
    await record(config);
  } finally {
    process.chdir(previousCwd);
  }

  return {
    configPath,
    workDirectory,
  };
}

async function runInspectCommand(
  fixture: InspectFixture,
  args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const { createProgram } = await import("../src/index.js");
  const stdout: string[] = [];
  const stderr: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalCwd = process.cwd();

  console.log = (...values: unknown[]) => {
    stdout.push(values.map((value) => String(value)).join(" "));
  };
  console.error = (...values: unknown[]) => {
    stderr.push(values.map((value) => String(value)).join(" "));
  };

  try {
    process.chdir(fixture.workDirectory);
    process.exitCode = undefined;
    await createProgram().parseAsync(["node", "tuireel", "inspect", fixture.configPath, ...args]);
    return {
      exitCode: process.exitCode ?? 0,
      stdout: stdout.join("\n"),
      stderr: stderr.join("\n"),
    };
  } finally {
    process.chdir(originalCwd);
    process.exitCode = undefined;
    console.log = originalLog;
    console.error = originalError;
  }
}

describe.sequential("inspect command", () => {
  let namedFixture: InspectFixture;
  let inlineFixture: InspectFixture;

  beforeAll(async () => {
    await execFileAsync("pnpm", ["--filter", "@tuireel/core", "build"], {
      cwd: join(process.cwd()),
      maxBuffer: 10 * 1024 * 1024,
    });
    namedFixture = await createInspectFixture("inspect-named-cli", '"pacing": "relaxed",\n');
    inlineFixture = await createInspectFixture(
      "inspect-inline-cli",
      `"pacing": {
    "baseSpeedMs": 52,
    "firstCharExtra": 0.18,
    "punctuationExtra": 0.22,
    "whitespaceExtra": 0.3,
    "pathSepExtra": 0.04,
    "beats": {
      "startup": 620,
      "settle": 360,
      "read": 280,
      "idle": 150
    }
  },
`,
    );
  }, 120_000);

  afterAll(async () => {
    await Promise.all([
      namedFixture ? rm(namedFixture.workDirectory, { recursive: true, force: true }) : undefined,
      inlineFixture ? rm(inlineFixture.workDirectory, { recursive: true, force: true }) : undefined,
    ]);
  });

  it("prints saved pacing rows for named and inline artifacts", async () => {
    const named = await runInspectCommand(namedFixture, []);
    const inline = await runInspectCommand(inlineFixture, []);

    expect(named.exitCode).toBe(0);
    expect(named.stderr).toBe("");
    expect(named.stdout).toContain("Saved pacing source: named");
    expect(named.stdout).toContain("Saved pacing profile: relaxed");
    expect(named.stdout).toContain("Saved base speed: 65");
    expect(named.stdout).toContain("Saved startup beat: 800");
    expect(named.stdout).toContain("Saved idle beat: 250");

    expect(inline.exitCode).toBe(0);
    expect(inline.stderr).toBe("");
    expect(inline.stdout).toContain("Saved pacing source: inline");
    expect(inline.stdout).toContain("Saved pacing profile: n/a");
    expect(inline.stdout).toContain("Saved base speed: 52");
    expect(inline.stdout).toContain("Saved startup beat: 620");
    expect(inline.stdout).toContain("Saved idle beat: 150");
  }, 120_000);

  it("keeps --json aligned with the raw inspect report", async () => {
    const named = await runInspectCommand(namedFixture, ["--json"]);
    const inline = await runInspectCommand(inlineFixture, ["--json"]);

    expect(named.exitCode).toBe(0);
    expect(named.stderr).toBe("");
    expect(inline.exitCode).toBe(0);
    expect(inline.stderr).toBe("");

    const namedPayload = JSON.parse(named.stdout) as {
      timingContract: {
        pacing: {
          source: string;
          selectedName?: string;
          resolved: { baseSpeedMs: number };
        };
      } | null;
    };
    const inlinePayload = JSON.parse(inline.stdout) as {
      timingContract: {
        pacing: {
          source: string;
          selectedName?: string;
          resolved: { baseSpeedMs: number };
        };
      } | null;
    };

    expect(namedPayload.timingContract?.pacing.source).toBe("named");
    expect(namedPayload.timingContract?.pacing.selectedName).toBe("relaxed");
    expect(namedPayload.timingContract?.pacing.resolved.baseSpeedMs).toBe(65);

    expect(inlinePayload.timingContract?.pacing.source).toBe("inline");
    expect(inlinePayload.timingContract?.pacing.resolved.baseSpeedMs).toBe(52);
    expect(inlinePayload.timingContract?.pacing).not.toHaveProperty("selectedName");
  }, 120_000);
});
