import { execSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const TOTAL_ATTEMPTS = 3;
const trioCommand = [
  "pnpm --filter @tuireel/core exec vitest run",
  "--maxWorkers=1",
  "--no-file-parallelism",
  "test/acceptance/pacing.acceptance.ts",
  "test/acceptance/readability.acceptance.ts",
  "test/acceptance/smooth-output.acceptance.ts",
].join(" ");

function run(command: string): void {
  execSync(command, {
    cwd: ROOT,
    stdio: "inherit",
  });
}

function formatDuration(startMs: number): string {
  return `${((Date.now() - startMs) / 1000).toFixed(1)}s`;
}

console.log(`Running DIAG-04 acceptance trio ${TOTAL_ATTEMPTS} consecutive times...`);

for (let attempt = 1; attempt <= 3; attempt += 1) {
  const startedAt = Date.now();

  console.log(`\n=== acceptance stability attempt ${attempt}/${TOTAL_ATTEMPTS} ===`);

  try {
    run(trioCommand);
    console.log(`Attempt ${attempt} passed in ${formatDuration(startedAt)}.`);
  } catch (error) {
    const duration = formatDuration(startedAt);
    const message = error instanceof Error ? error.message : String(error);

    console.error(
      `Attempt ${attempt}/${TOTAL_ATTEMPTS} failed after ${duration}. ` +
        `The repeated-run DIAG-04 gate stops on the first failing attempt. ` +
        `Re-run \`pnpm acceptance:stability\` locally to inspect the failing trio invocation.`,
    );
    console.error(`Underlying command: ${trioCommand}`);
    if (message.trim()) {
      console.error(message.trim());
    }
    process.exit(1);
  }
}

console.log("\nAcceptance stability gate passed all three consecutive attempts.");
