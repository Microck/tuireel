import type { CadenceProfile, CadenceProfileName } from "../executor/pacing/profiles.js";
import type { TimelineData } from "./types.js";

export type TimingContractPacing =
  | {
      source: "named";
      selectedName: CadenceProfileName;
      resolved: CadenceProfile;
    }
  | {
      source: "inline";
      resolved: CadenceProfile;
    };

export interface TimingContract {
  version: 1;
  outputFps: number;
  captureFps: number;
  wallClockDurationMs: number;
  rawFrameCount: number;
  outputFrameCount: number;
  terminalFrameCount: number;
  deliveryProfile?: string;
  pacing?: TimingContractPacing;
}

export interface BuildTimingContractInput {
  outputFps: number;
  captureFps: number;
  wallClockDurationMs: number;
  rawFrameCount: number;
  outputFrameCount: number;
  terminalFrameCount: number;
  deliveryProfile?: string;
  pacing?: TimingContractPacing;
}

export interface TimingCompatibilityCandidate {
  fps?: number;
  captureFps?: number;
  deliveryProfile?: string;
  [key: string]: unknown;
}

export interface TimingMismatch {
  field: "outputFps" | "captureFps";
  expected: number;
  actual: number;
}

export type TimingCompatibilityResult =
  | {
      kind: "compatible";
      source: "timing-contract";
    }
  | {
      kind: "timing-mismatch";
      mismatches: TimingMismatch[];
    }
  | {
      kind: "legacy-fallback";
      fallback: "allow-packaging-only";
      outputFps: number;
      reason: "missing-timing-contract";
      message: string;
    };

export function buildTimingContract(input: BuildTimingContractInput): TimingContract {
  return {
    version: 1,
    outputFps: input.outputFps,
    captureFps: input.captureFps,
    wallClockDurationMs: input.wallClockDurationMs,
    rawFrameCount: input.rawFrameCount,
    outputFrameCount: input.outputFrameCount,
    terminalFrameCount: input.terminalFrameCount,
    ...(input.deliveryProfile ? { deliveryProfile: input.deliveryProfile } : {}),
    ...(input.pacing ? { pacing: input.pacing } : {}),
  };
}

export function assessTimingCompatibility(
  timeline: Pick<TimelineData, "fps" | "timingContract">,
  requested: TimingCompatibilityCandidate,
): TimingCompatibilityResult {
  const savedContract = timeline.timingContract;
  if (!savedContract) {
    return {
      kind: "legacy-fallback",
      fallback: "allow-packaging-only",
      outputFps: timeline.fps,
      reason: "missing-timing-contract",
      message:
        "Saved timeline has no timingContract. Allow packaging-only recomposite changes, but require a fresh record for timing changes.",
    };
  }

  const mismatches: TimingMismatch[] = [];
  const requestedOutputFps = requested.fps ?? savedContract.outputFps;
  const requestedCaptureFps = requested.captureFps ?? savedContract.captureFps;

  if (requestedOutputFps !== savedContract.outputFps) {
    mismatches.push({
      field: "outputFps",
      expected: savedContract.outputFps,
      actual: requestedOutputFps,
    });
  }

  if (requestedCaptureFps !== savedContract.captureFps) {
    mismatches.push({
      field: "captureFps",
      expected: savedContract.captureFps,
      actual: requestedCaptureFps,
    });
  }

  if (mismatches.length > 0) {
    return {
      kind: "timing-mismatch",
      mismatches,
    };
  }

  return {
    kind: "compatible",
    source: "timing-contract",
  };
}
