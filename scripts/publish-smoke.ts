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
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
let failures = 0;

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
const cliTarPath = join(packsDir, cliTarball);
const coreTarPath = join(packsDir, coreTarball);

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
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  fail("npx tuireel --help failed", msg.slice(0, 300));
}

// --- bun smoke test (optional) ---

let hasBun = false;
try {
  execSync("which bun", { stdio: "pipe" });
  hasBun = true;
} catch {
  // bun not available
}

if (hasBun) {
  console.log("\n--- bun smoke test ---");
  const bunDir = mkdtempSync(join(tmpdir(), "tuireel-bun-"));

  try {
    run(`bun init -y`, { cwd: bunDir });
    run(`bun add "${coreTarPath}" "${cliTarPath}"`, { cwd: bunDir });

    run(`./node_modules/.bin/tuireel --help`, { cwd: bunDir });
    pass("bun: tuireel --help exited 0");

    run(`./node_modules/.bin/tuireel --version`, { cwd: bunDir });
    pass("bun: tuireel --version exited 0");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    fail("bun smoke test failed", msg.slice(0, 300));
  }
} else {
  console.log("\n--- bun not found, skipping bun smoke test ---");
}

// --- Cleanup ---

try {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(npxDir, { recursive: true, force: true });
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
