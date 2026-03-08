import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ConfigValidationError, loadConfig } from "../src/config/parser.js";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function writeConfigFile(contents: string, fileName = ".tuireel.jsonc"): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "tuireel-delivery-profile-"));
  tempDirectories.push(directory);

  const filePath = join(directory, fileName);
  await writeFile(filePath, contents, "utf8");

  return filePath;
}

describe("delivery profiles", () => {
  it("stacks deliveryProfile timing defaults under a visual preset", async () => {
    const configPath = await writeConfigFile(`{
      "preset": "minimal",
      "deliveryProfile": "readable-1080p",
      "steps": [{ "type": "launch", "command": "echo ready" }]
    }`);

    const [config] = await loadConfig(configPath);

    expect(config).toMatchObject({
      theme: "tokyo-night",
      cursor: { visible: true },
      hud: { visible: false },
      fps: 30,
      captureFps: 12,
      outputSize: {
        width: 1920,
        height: 1080,
        padding: 96,
      },
    });
  });

  it("lets explicit timing and readability fields override deliveryProfile defaults", async () => {
    const configPath = await writeConfigFile(`{
      "deliveryProfile": "social-quick-share",
      "fps": 48,
      "captureFps": 9,
      "outputSize": {
        "width": 1600,
        "height": 900,
        "padding": 40
      },
      "steps": [{ "type": "launch", "command": "echo custom" }]
    }`);

    const [config] = await loadConfig(configPath);

    expect(config).toMatchObject({
      fps: 48,
      captureFps: 9,
      outputSize: {
        width: 1600,
        height: 900,
        padding: 40,
      },
    });
  });

  it("applies deliveryProfile defaults through multi-video defaults while keeping per-video overrides authoritative", async () => {
    const configPath = await writeConfigFile(`{
      "defaults": {
        "preset": "polished",
        "deliveryProfile": "readable-1080p"
      },
      "videos": [
        {
          "name": "default-timing",
          "output": "default.mp4",
          "steps": [{ "type": "launch", "command": "echo default" }]
        },
        {
          "name": "override-timing",
          "output": "override.mp4",
          "fps": 24,
          "captureFps": 6,
          "steps": [{ "type": "launch", "command": "echo override" }]
        }
      ]
    }`);

    const configs = await loadConfig(configPath);

    expect(configs[0]).toMatchObject({
      theme: "catppuccin",
      fps: 30,
      captureFps: 12,
      outputSize: {
        width: 1920,
        height: 1080,
        padding: 96,
      },
    });
    expect(configs[1]).toMatchObject({
      theme: "catppuccin",
      fps: 24,
      captureFps: 6,
      outputSize: {
        width: 1920,
        height: 1080,
        padding: 96,
      },
    });
  });

  it("rejects unknown deliveryProfile names with actionable guidance", async () => {
    const configPath = await writeConfigFile(`{
      "deliveryProfile": "unknown-profile",
      "steps": [{ "type": "launch", "command": "echo nope" }]
    }`);

    await expect(loadConfig(configPath)).rejects.toThrow(
      /Unknown delivery profile "unknown-profile"/i,
    );
    await expect(loadConfig(configPath)).rejects.toThrow(/readable-1080p/i);
  });

  it("rejects invalid deliveryProfile shapes with validation guidance", async () => {
    const configPath = await writeConfigFile(`{
      "deliveryProfile": {
        "name": "readable-1080p"
      },
      "steps": [{ "type": "launch", "command": "echo nope" }]
    }`);

    await expect(loadConfig(configPath)).rejects.toBeInstanceOf(ConfigValidationError);
    await expect(loadConfig(configPath)).rejects.toThrow(/deliveryProfile/i);
  });
});
