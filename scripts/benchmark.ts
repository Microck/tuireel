/**
 * Performance benchmark for Tuireel compositing pipeline.
 *
 * Measures recording time, compositing time, and per-frame throughput.
 * Run with: pnpm benchmark
 */

import { readFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { compose, record, createLogger, LogLevel } from "@tuireel/core";
import type { TuireelConfig, TimelineData } from "@tuireel/core";

const FIXTURE: TuireelConfig = {
  output: "benchmark-output.mp4",
  format: "mp4",
  fps: 15,
  cols: 60,
  rows: 18,
  steps: [
    { type: "launch", command: "bash" },
    { type: "pause", duration: 200 },
    { type: "type", text: "echo 'frame 1'" },
    { type: "press", key: "Enter" },
    { type: "pause", duration: 200 },
    { type: "type", text: "echo 'frame 2'" },
    { type: "press", key: "Enter" },
    { type: "pause", duration: 200 },
    { type: "type", text: "echo 'frame 3'" },
    { type: "press", key: "Enter" },
    { type: "pause", duration: 200 },
    { type: "type", text: "echo 'frame 4'" },
    { type: "press", key: "Enter" },
    { type: "pause", duration: 200 },
    { type: "type", text: "echo 'frame 5'" },
    { type: "press", key: "Enter" },
    { type: "pause", duration: 300 },
  ],
};

const RECORDING_NAME = "benchmark-output";
const RAW_VIDEO = resolve(
  ".tuireel/raw",
  `${RECORDING_NAME}.mp4`,
);
const TIMELINE = resolve(
  ".tuireel/timelines",
  `${RECORDING_NAME}.timeline.json`,
);
const OUTPUT = "benchmark-output.mp4";
const RECOMPOSE_OUTPUT = "benchmark-recompose.mp4";

function cleanup() {
  for (const file of [OUTPUT, RECOMPOSE_OUTPUT]) {
    if (existsSync(file)) rmSync(file, { force: true });
  }
}

async function main() {
  const log = createLogger(LogLevel.silent);

  console.log("Tuireel Benchmark");
  console.log("=".repeat(50));
  console.log();

  // Phase 1: Full record (recording + compositing)
  console.log("Phase 1: Full record...");
  cleanup();
  const recordStart = performance.now();
  await record(FIXTURE, { logger: log });
  const recordMs = performance.now() - recordStart;

  // Read timeline to get frame count
  const timelineData: TimelineData = JSON.parse(
    readFileSync(TIMELINE, "utf8"),
  );
  const frameCount = timelineData.frames.length;

  console.log(`  Recording + compositing: ${recordMs.toFixed(0)}ms`);
  console.log(`  Frames: ${frameCount}`);
  console.log();

  // Phase 2: Re-compose only (to isolate compositing time)
  console.log("Phase 2: Re-compose only...");
  const composeStart = performance.now();
  await compose(RAW_VIDEO, timelineData, RECOMPOSE_OUTPUT, {
    format: "mp4",
    logger: log,
  });
  const composeMs = performance.now() - composeStart;

  const perFrameMs = frameCount > 0 ? composeMs / frameCount : 0;
  const throughput = frameCount > 0 ? (frameCount / composeMs) * 1000 : 0;

  // Report
  console.log();
  console.log("Benchmark Results:");
  console.log("-".repeat(50));
  console.log(`  Total frames:       ${frameCount}`);
  console.log(`  Recording (full):   ${recordMs.toFixed(0)}ms`);
  console.log(`  Compositing:        ${composeMs.toFixed(0)}ms (${perFrameMs.toFixed(1)}ms/frame)`);
  console.log(`  Throughput:         ${throughput.toFixed(1)} frames/sec (compositing)`);
  console.log("-".repeat(50));

  cleanup();
}

main().catch((error) => {
  console.error("Benchmark failed:", error);
  cleanup();
  process.exit(1);
});
