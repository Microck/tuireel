/**
 * Publish smoke test for tuireel + @tuireel/core.
 *
 * Validates that packed tarballs:
 * 1. Contain no `workspace:` protocol references
 * 2. Install and execute correctly via npx
 * 3. Install and execute correctly via bun (when available)
 *
 * Run with: pnpm publish:smoke
 */

import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
let failures = 0;

const FFMPEG_BIN = join(homedir(), ".tuireel", "bin", "ffmpeg");
const SOUND_SMOKE_STEPS = [
  { type: "launch", command: "bash" },
  { type: "type", text: "echo sound" },
  { type: "press", key: "enter" },
  { type: "wait", pattern: "sound" },
  { type: "pause", duration: 0.2 },
] as const;
const SOUND_SMOKE_CASES = [
  {
    preset: "polished",
    configFile: "sound-smoke-polished.jsonc",
    outputFile: "sound-smoke-polished.mp4",
  },
  {
    preset: "demo",
    configFile: "sound-smoke-demo.jsonc",
    outputFile: "sound-smoke-demo.mp4",
  },
] as const;

function run(cmd: string, opts?: { cwd?: string }): string {
  return execSync(cmd, {
    cwd: opts?.cwd ?? ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function pass(label: string) {
  console.log(`  \u2713 ${label}`);
}

function fail(label: string, detail?: string) {
  console.error(`  \u2717 ${label}`);
  if (detail) console.error(`    ${detail}`);
  failures++;
}

function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 300);
}

type PackageJsonShape = {
  name?: unknown;
  version?: unknown;
  exports?: unknown;
};

class SmokeAbortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmokeAbortError";
  }
}

function failFast(label: string, detail: string): never {
  fail(label, detail);
  throw new SmokeAbortError(label);
}

function parsePackageJson(rawValue: string, source: string): PackageJsonShape {
  try {
    return JSON.parse(rawValue) as PackageJsonShape;
  } catch (error: unknown) {
    failFast(
      "publish smoke: failed to parse package.json",
      [`Source: ${source}`, `Error: ${errorMessage(error)}`].join("\n"),
    );
  }
}

function normalizeExports(exportsValue: unknown): Record<string, unknown> {
  if (typeof exportsValue === "string") {
    return { ".": exportsValue };
  }
  if (exportsValue && typeof exportsValue === "object" && !Array.isArray(exportsValue)) {
    return exportsValue as Record<string, unknown>;
  }
  return {};
}

function assertInstalledPackageMatchesTarball(options: {
  packageLabel: string;
  tarPath: string;
  installedPackageJsonPath: string;
}): void {
  const { packageLabel, tarPath, installedPackageJsonPath } = options;

  let tarballPackageJson: PackageJsonShape;
  let installedPackageJson: PackageJsonShape;

  try {
    const tarballPackageJsonRaw = run(`tar -xOzf "${tarPath}" package/package.json`);
    tarballPackageJson = parsePackageJson(
      tarballPackageJsonRaw,
      `${tarPath}::package/package.json`,
    );

    const installedPackageJsonRaw = readFileSync(installedPackageJsonPath, "utf8");
    installedPackageJson = parsePackageJson(installedPackageJsonRaw, installedPackageJsonPath);
  } catch (error: unknown) {
    if (error instanceof SmokeAbortError) {
      throw error;
    }

    failFast(
      `bun install: unable to verify ${packageLabel} tarball equivalence`,
      [
        "Bun may have resolved this package from the registry/cache instead of the packed tarball under test.",
        `Expected tarball: ${tarPath}`,
        `Installed package.json: ${installedPackageJsonPath}`,
        `Error: ${errorMessage(error)}`,
      ].join("\n"),
    );
  }

  const expectedName = String(tarballPackageJson.name ?? "");
  const expectedVersion = String(tarballPackageJson.version ?? "");
  const actualName = String(installedPackageJson.name ?? "");
  const actualVersion = String(installedPackageJson.version ?? "");

  const expectedExports = normalizeExports(tarballPackageJson.exports);
  const actualExports = normalizeExports(installedPackageJson.exports);

  const expectedExportKeys = Object.keys(expectedExports).sort();
  const actualExportKeys = Object.keys(actualExports).sort();
  const expectedExportKeysJoined = expectedExportKeys.join("\n");
  const actualExportKeysJoined = actualExportKeys.join("\n");

  const mismatches: string[] = [];

  if (expectedName !== actualName || expectedVersion !== actualVersion) {
    mismatches.push(
      `name/version mismatch: expected ${expectedName}@${expectedVersion}, actual ${actualName}@${actualVersion}`,
    );
  }

  if (expectedExportKeysJoined !== actualExportKeysJoined) {
    mismatches.push(
      [
        "exports key mismatch:",
        `expected keys:\n${expectedExportKeysJoined || "<none>"}`,
        `actual keys:\n${actualExportKeysJoined || "<none>"}`,
      ].join("\n"),
    );
  }

  for (const exportKey of expectedExportKeys) {
    const expectedValue = JSON.stringify(expectedExports[exportKey]);
    const actualValue = JSON.stringify(actualExports[exportKey]);
    if (expectedValue !== actualValue) {
      mismatches.push(
        [
          `exports value mismatch for \"${exportKey}\"`,
          `expected: ${expectedValue}`,
          `actual: ${actualValue}`,
        ].join("\n"),
      );
    }
  }

  if (mismatches.length > 0) {
    failFast(
      `bun install: ${packageLabel} package.json differs from packed tarball`,
      [
        "Bun may have resolved this package from the registry/cache instead of the packed tarball under test.",
        `Expected tarball: ${tarPath}`,
        `Installed package.json: ${installedPackageJsonPath}`,
        `Expected name/version: ${expectedName}@${expectedVersion}`,
        `Actual name/version: ${actualName}@${actualVersion}`,
        `Differences:\n- ${mismatches.join("\n- ")}`,
      ].join("\n"),
    );
  }

  pass(`bun install: ${packageLabel} matches packed tarball package.json`);
}

function writeSoundSmokeConfigs(targetDir: string): void {
  for (const smokeCase of SOUND_SMOKE_CASES) {
    const configPath = join(targetDir, smokeCase.configFile);
    const config = {
      preset: smokeCase.preset,
      output: smokeCase.outputFile,
      steps: SOUND_SMOKE_STEPS,
    };
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  }
}

function runRecordAndAudioSmoke(
  targetDir: string,
  labelPrefix: string,
  recordCommand: (configFile: string) => string,
): void {
  try {
    writeSoundSmokeConfigs(targetDir);
    pass(`${labelPrefix}: wrote polished+demo sound smoke configs`);
  } catch (e: unknown) {
    fail(`${labelPrefix}: failed to write sound smoke configs`, errorMessage(e));
    return;
  }

  for (const smokeCase of SOUND_SMOKE_CASES) {
    try {
      run(recordCommand(smokeCase.configFile), { cwd: targetDir });
      pass(`${labelPrefix}: record ${smokeCase.preset} preset exited 0`);
    } catch (e: unknown) {
      fail(`${labelPrefix}: record ${smokeCase.preset} preset failed`, errorMessage(e));
      continue;
    }

    try {
      run(`"${FFMPEG_BIN}" -v error -i "${smokeCase.outputFile}" -map 0:a:0 -f null -`, {
        cwd: targetDir,
      });
      pass(`${labelPrefix}: ${smokeCase.outputFile} contains audio stream`);
    } catch (e: unknown) {
      fail(`${labelPrefix}: ${smokeCase.outputFile} missing audio stream`, errorMessage(e));
    }
  }
}

// --- Pack both packages ---

const packDir = mkdtempSync(join(tmpdir(), "tuireel-smoke-"));
const packsDir = join(packDir, "packs");
execSync(`mkdir -p "${packsDir}"`);

console.log("\n--- Packing tarballs ---");
run(`pnpm --filter tuireel pack --pack-destination "${packsDir}"`);
run(`pnpm --filter "@tuireel/core" pack --pack-destination "${packsDir}"`);

const tarballs = readdirSync(packsDir).filter((f) => f.endsWith(".tgz"));
console.log(`  Packed: ${tarballs.join(", ")}`);

const cliTarball = tarballs.find((f) => f.startsWith("tuireel-") && !f.startsWith("tuireel-core"));
const coreTarball = tarballs.find((f) => f.includes("core"));

if (!cliTarball) {
  fail("Could not find tuireel CLI tarball");
  process.exit(1);
}
if (!coreTarball) {
  fail("Could not find @tuireel/core tarball");
  process.exit(1);
}

const cliTarPath = join(packsDir, cliTarball);
const coreTarPath = join(packsDir, coreTarball);

// --- Check core tarball includes built-in SFX assets ---

console.log("\n--- Checking core tarball SFX assets ---");

try {
  const coreTarEntries = run(`tar -tf "${coreTarPath}"`);
  const requiredSfxEntries = [
    "package/assets/sounds/click-1.mp3",
    "package/assets/sounds/key-1.mp3",
  ];

  for (const requiredEntry of requiredSfxEntries) {
    if (coreTarEntries.includes(requiredEntry)) {
      pass(`core tarball includes ${requiredEntry}`);
    } else {
      fail(`core tarball missing ${requiredEntry}`);
    }
  }
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  fail("core tarball SFX asset check failed", msg.slice(0, 300));
}

// --- Check for workspace: references ---

console.log("\n--- Checking for workspace: references ---");

for (const tarball of [cliTarball, coreTarball]) {
  const tarPath = join(packsDir, tarball);
  const pkgJson = run(`tar -xOzf "${tarPath}" package/package.json`);

  if (pkgJson.includes("workspace:")) {
    fail(`${tarball} contains workspace: reference`, pkgJson.slice(0, 500));
  } else {
    pass(`${tarball} has no workspace: references`);
  }
}

// --- npx smoke test ---

console.log("\n--- npx smoke test ---");

const npxDir = mkdtempSync(join(tmpdir(), "tuireel-npx-"));

try {
  // Install core dep first, then CLI tarball
  run(`npm init -y`, { cwd: npxDir });
  run(`npm install "${coreTarPath}" "${cliTarPath}"`, { cwd: npxDir });
  const helpOut = run(`npx tuireel --help`, { cwd: npxDir });
  if (helpOut.length > 0) {
    pass("npx tuireel --help exited 0");
  } else {
    fail("npx tuireel --help produced no output");
  }

  runRecordAndAudioSmoke(
    npxDir,
    "npx",
    (configFile) => `npx tuireel record ./${configFile} --format mp4`,
  );
} catch (e: unknown) {
  fail("npx tuireel --help failed", errorMessage(e));
}

// --- bun smoke test (optional) ---

let hasBun = false;
try {
  execSync("which bun", { stdio: "pipe" });
  hasBun = true;
} catch {
  // bun not available
}

let bunDir: string | undefined;

if (hasBun) {
  console.log("\n--- bun smoke test ---");
  bunDir = mkdtempSync(join(tmpdir(), "tuireel-bun-"));

  try {
    const bunPackageJson = {
      private: true,
      type: "module",
      dependencies: {
        tuireel: cliTarPath,
        "@tuireel/core": coreTarPath,
      },
      overrides: {
        "@tuireel/core": coreTarPath,
      },
    };
    writeFileSync(join(bunDir, "package.json"), `${JSON.stringify(bunPackageJson, null, 2)}\n`);

    run(`bun install`, { cwd: bunDir });

    assertInstalledPackageMatchesTarball({
      packageLabel: "@tuireel/core",
      tarPath: coreTarPath,
      installedPackageJsonPath: join(bunDir, "node_modules", "@tuireel", "core", "package.json"),
    });

    assertInstalledPackageMatchesTarball({
      packageLabel: "tuireel",
      tarPath: cliTarPath,
      installedPackageJsonPath: join(bunDir, "node_modules", "tuireel", "package.json"),
    });

    const nestedCoreDir = join(
      bunDir,
      "node_modules",
      "tuireel",
      "node_modules",
      "@tuireel",
      "core",
    );

    if (existsSync(nestedCoreDir)) {
      failFast(
        "bun install: detected nested tuireel/node_modules/@tuireel/core",
        [
          "Bun may have resolved @tuireel/core from the registry/cache instead of the packed tarball under test.",
          `Expected core tarball: ${coreTarPath}`,
          `Unexpected nested path: ${nestedCoreDir}`,
        ].join("\n"),
      );
    }

    pass("bun install: no nested tuireel/node_modules/@tuireel/core");

    run(
      `bun --cwd "${bunDir}" x --no-install tuireel --help || bun x --no-install tuireel --help`,
      { cwd: bunDir },
    );
    pass("bun runtime: tuireel --help exited 0");

    run(
      `bun --cwd "${bunDir}" x --no-install tuireel --version || bun x --no-install tuireel --version`,
      { cwd: bunDir },
    );
    pass("bun runtime: tuireel --version exited 0");

    runRecordAndAudioSmoke(
      bunDir,
      "bun runtime",
      (configFile) =>
        `bun --cwd "${bunDir}" x --no-install tuireel record ./${configFile} --format mp4 || bun x --no-install tuireel record ./${configFile} --format mp4`,
    );
  } catch (e: unknown) {
    if (!(e instanceof SmokeAbortError)) {
      fail("bun smoke test failed", errorMessage(e));
    }
  }
} else {
  console.log("\n--- bun not found, skipping bun smoke test ---");
  pass("bunx record smoke skipped (bun not available)");
}

// --- Cleanup ---

try {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(npxDir, { recursive: true, force: true });
  if (bunDir) {
    rmSync(bunDir, { recursive: true, force: true });
  }
} catch {
  // best-effort cleanup
}

// --- Result ---

console.log("");
if (failures > 0) {
  console.error(`FAILED: ${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("ALL CHECKS PASSED");
}
