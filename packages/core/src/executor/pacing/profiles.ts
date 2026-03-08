export interface CadenceProfile {
  baseSpeedMs: number;
  firstCharExtra: number;
  punctuationExtra: number;
  whitespaceExtra: number;
  pathSepExtra: number;
  beats: {
    startup: number;
    settle: number;
    read: number;
    idle: number;
  };
}

export const CADENCE_PROFILES = {
  relaxed: {
    baseSpeedMs: 65,
    firstCharExtra: 0.3,
    punctuationExtra: 0.25,
    whitespaceExtra: 0.32,
    pathSepExtra: 0.08,
    beats: {
      startup: 800,
      settle: 500,
      read: 400,
      idle: 250,
    },
  },
  brisk: {
    baseSpeedMs: 38,
    firstCharExtra: 0.2,
    punctuationExtra: 0.18,
    whitespaceExtra: 0.22,
    pathSepExtra: 0.05,
    beats: {
      startup: 400,
      settle: 250,
      read: 200,
      idle: 120,
    },
  },
  deliberate: {
    baseSpeedMs: 90,
    firstCharExtra: 0.4,
    punctuationExtra: 0.3,
    whitespaceExtra: 0.35,
    pathSepExtra: 0.1,
    beats: {
      startup: 1200,
      settle: 700,
      read: 600,
      idle: 350,
    },
  },
} as const satisfies Record<string, CadenceProfile>;

export const CADENCE_PROFILE_NAMES = [
  "relaxed",
  "brisk",
  "deliberate",
] as const satisfies readonly (keyof typeof CADENCE_PROFILES)[];

export type CadenceProfileName = (typeof CADENCE_PROFILE_NAMES)[number];

export function resolveProfile(
  input: CadenceProfileName | CadenceProfile | undefined,
): CadenceProfile | undefined {
  if (!input) {
    return undefined;
  }

  if (typeof input === "string") {
    return CADENCE_PROFILES[input];
  }

  return input;
}
