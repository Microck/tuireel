# Phase 26: Human Pacing Engine - Research

**Researched:** 2026-03-08
**Domain:** Deterministic human-feeling typing cadence and pause beats for terminal demos
**Confidence:** HIGH

## Summary

Phase 26 adds a pacing engine that makes recorded terminal demos feel human without requiring authors to hand-tune every step. The existing codebase already has the right primitives: `charDelay()` in `timing.ts` provides deterministic character-level variation, `typeStep()` types one character at a time through a session, and `pauseStep()` is a simple sleep wrapper. The gap is that there's no concept of named cadence profiles, no automatic beat insertion around interaction boundaries, and no per-step override mechanism in the schema.

The implementation is straightforward: define a `CadenceProfile` type with named presets (`relaxed`, `brisk`, `deliberate`), extend the config schema with a top-level `pacing` field and per-step override fields, then wire the profile's timing parameters through `charDelay()` and inject automatic beats in `executeSteps()`. Everything stays deterministic (no `Math.random()`) by continuing to use the existing seeded-hash approach.

**Primary recommendation:** Add a `pacing` config field pointing to a named profile, extend `charDelay()` to accept profile-driven parameters, inject automatic beats between steps in the executor, and add `speed`/`duration` override fields to `type` and `pause` step schemas.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Human pacing should be driven by deterministic named cadence profiles instead of per-script hand tuning.
- The pacing model should feel intentionally human without using random jitter as the default behavior.
- v1.2 should not add typo-and-correction theatrics; the focus is believable cadence, not storytelling flourishes.
- Tuireel should model startup, settle, read, and idle moments as first-class beats instead of relying on flat uniform pauses everywhere.
- Default pacing should add intentional beats around interaction boundaries so demos breathe naturally.
- These beats should stay consistent with the selected pacing profile rather than forcing authors to hand-author every pause.
- Authors can override timing locally on `type` and `pause` steps while the rest of the run keeps following the selected pacing model.
- Explicit per-step timing overrides should win over profile defaults.
- Overrides should stay scoped to the specific step instead of mutating later steps globally.
- An explicitly authored `pause` is intentional and should remain authoritative for that step.
- Automatic pacing behavior should mainly fill the natural gaps around actions instead of rewriting authored pause intent behind the author's back.

### Claude's Discretion

- Exact pacing profile names and the final beat-duration ranges.
- Exact character-level heuristics for punctuation, whitespace, and first-keystroke hesitation.
- Exact override field names, as long as they remain local and obvious.

### Deferred Ideas (OUT OF SCOPE)

- Typo-and-correction behavior - future phase (`PACE-04`).
- Higher-level narrative pacing helpers for long demos - future phase (`PACE-05`).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                | Research Support                                                                                                                                        |
| ------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PACE-01 | Author can apply a deterministic cadence profile so typed text follows human-feeling timing without per-script hand tuning | Named cadence profiles (`relaxed`, `brisk`, `deliberate`) with deterministic `charDelay()` parameters; top-level `pacing` config field                  |
| PACE-02 | Author can apply intentional pause behavior for startup, settle, read, and idle moments                                    | Automatic beat injection in `executeSteps()` at interaction boundaries; beat types map to profile duration ranges                                       |
| PACE-03 | Author can override timing behavior for specific `type` and `pause` steps without breaking the milestone pacing model      | Per-step `speed` field on `type` steps and `duration` on `pause` steps already exist; profile system skips auto-beats when explicit pauses are authored |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose                                                 | Why Standard                                                           |
| ------- | ------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| zod     | ^4.1.12 | Schema validation for cadence profile and pacing config | Already used throughout `config/schema.ts`; extending existing schemas |
| vitest  | ^3.2.4  | Unit testing for pacing logic                           | Already the project test runner                                        |

### Supporting

| Library    | Version | Purpose | When to Use                                                     |
| ---------- | ------- | ------- | --------------------------------------------------------------- |
| (none new) | -       | -       | All pacing logic is pure TypeScript; no new dependencies needed |

### Alternatives Considered

| Instead of              | Could Use                | Tradeoff                                                                                           |
| ----------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| Custom seeded hash      | Seedable PRNG lib        | Overkill; existing `hashSeed`/`seededUnit` already provides deterministic variation with zero deps |
| External easing library | Custom multiplier curves | Existing multiplier approach in `charDelay()` is simple and sufficient                             |

**Installation:**

```bash
# No new packages needed. All work extends existing code.
```

## Architecture Patterns

### Recommended Project Structure

```
packages/core/src/
  executor/
    timing.ts             # Extend charDelay() with profile params
    pacing/
      profiles.ts         # CadenceProfile type + built-in profiles
      beats.ts            # Beat injection logic (startup/settle/read/idle)
      index.ts            # Public API barrel
    steps/
      type.ts             # Wire profile base speed
      pause.ts            # Respect authored vs auto-generated
    step-executor.ts      # Inject beats between steps
  config/
    schema.ts             # Add pacing field + step override fields
packages/core/test/
  timing.test.ts          # Extend with profile-aware charDelay tests
  pacing/
    profiles.test.ts      # Profile selection and parameter tests
    beats.test.ts         # Beat injection determinism tests
```

### Pattern 1: Cadence Profile as a Data Object

**What:** A `CadenceProfile` is a plain object with named timing parameters. Each profile defines base speed, character-class multipliers, and beat durations.
**When to use:** Always. Every pacing decision reads from the active profile.
**Example:**

```typescript
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
    beats: { startup: 800, settle: 500, read: 400, idle: 250 },
  },
  brisk: {
    baseSpeedMs: 38,
    firstCharExtra: 0.2,
    punctuationExtra: 0.18,
    whitespaceExtra: 0.22,
    pathSepExtra: 0.05,
    beats: { startup: 400, settle: 250, read: 200, idle: 120 },
  },
  deliberate: {
    baseSpeedMs: 90,
    firstCharExtra: 0.4,
    punctuationExtra: 0.3,
    whitespaceExtra: 0.35,
    pathSepExtra: 0.1,
    beats: { startup: 1200, settle: 700, read: 600, idle: 350 },
  },
} as const satisfies Record<string, CadenceProfile>;
```

### Pattern 2: Beat Injection in the Step Executor

**What:** The step executor inserts automatic pauses (beats) at interaction boundaries. Beat type is inferred from the step transition (e.g., `launch` -> anything = `startup`, anything -> `type` = `read`).
**When to use:** When `pacing` is set in config. When no pacing profile is set, behavior is unchanged (backward compatible).
**Key rule:** Beats are NOT inserted before or after an explicitly authored `pause` step. Authored pauses are authoritative.
**Example:**

```typescript
function resolveBeatType(prevStep: Step | undefined, currentStep: Step): BeatType | null {
  if (currentStep.type === "pause") return null; // authored pause is authoritative
  if (prevStep?.type === "pause") return null; // don't double-pause after authored pause
  if (!prevStep || prevStep.type === "launch") return "startup";
  if (prevStep.type === "wait") return "settle";
  if (currentStep.type === "type") return "read";
  return "idle";
}
```

### Pattern 3: Per-Step Override via Existing Schema Fields

**What:** `type` steps already have an optional `speed` field. When set, it overrides the profile's `baseSpeedMs`. `pause` steps already have a `duration` field which is always authoritative. No new override fields needed for v1.2.
**When to use:** Author wants one step to be faster/slower without changing the whole profile.
**Key insight:** The `speed` field on `typeStepSchema` already exists (`z.number().positive().optional()`). The planner should wire this so that when `speed` is provided it replaces `profile.baseSpeedMs` for that step only.

### Anti-Patterns to Avoid

- **Mutating global state from per-step overrides:** An override on step 5 must not affect step 6. Overrides are scoped to the step, never stored as mutable state.
- **Random jitter as default:** Never use `Math.random()`. All variation must come from the existing seeded hash (`seededUnit()`).
- **Rewriting authored pauses:** If the author wrote `{ "type": "pause", "duration": 1000 }`, the engine must not add beats around it or change its duration.
- **Adding beats inside type steps:** Beats go between steps, not inside character sequences. Character-level pacing is handled by `charDelay()` multipliers.

## Don't Hand-Roll

| Problem                         | Don't Build        | Use Instead                                  | Why                                                                         |
| ------------------------------- | ------------------ | -------------------------------------------- | --------------------------------------------------------------------------- |
| Deterministic pseudo-randomness | Custom PRNG        | Existing `seededUnit()` in `timing.ts`       | Already proven, tested, and zero-dep                                        |
| Schema validation               | Manual type guards | Zod schemas (extend existing `configSchema`) | Zod already validates all config; stay consistent                           |
| Config merging with presets     | Custom deep-merge  | Existing `resolvePreset()` pattern           | Preset merge is already solved; pacing follows the same merge-under pattern |

**Key insight:** The existing codebase already has the right abstractions. The pacing engine is mostly about wiring new data (profile parameters) through existing control flow (executor loop, charDelay, sleep).

## Common Pitfalls

### Pitfall 1: Breaking Backward Compatibility

**What goes wrong:** Adding pacing changes the default timing of existing scripts that don't opt in.
**Why it happens:** If the pacing profile applies by default, old scripts suddenly behave differently.
**How to avoid:** When no `pacing` field is set, behavior must be identical to the current code. The `charDelay()` signature should accept optional profile params and fall back to current hardcoded multipliers when none are provided.
**Warning signs:** Existing timing tests fail after changes.

### Pitfall 2: Beat Injection Creates Double Pauses

**What goes wrong:** An authored `pause` step gets an automatic beat inserted before/after it, creating unnaturally long gaps.
**Why it happens:** Beat injection doesn't check whether adjacent steps are authored pauses.
**How to avoid:** `resolveBeatType()` must return `null` when current or previous step is an authored `pause`.
**Warning signs:** Test fixture with authored pauses shows longer total duration than expected.

### Pitfall 3: charDelay Multiplier Stacking

**What goes wrong:** Multiple character-class multipliers stack additively, making some characters absurdly slow (e.g., a space after punctuation).
**Why it happens:** The current code adds multipliers (`+= 0.28`, `+= 0.22`) which can compound.
**How to avoid:** The existing code already handles this acceptably (multipliers are moderate). When switching to profile-driven values, keep the same additive approach but test edge cases with profile `deliberate` to ensure no character takes > 3x base speed.
**Warning signs:** Individual character delays exceed 300ms with `deliberate` profile.

### Pitfall 4: Schema Extension Breaks JSON Schema Generation

**What goes wrong:** Adding `pacing` to the config schema without updating `generate-schema.ts` means the published JSON Schema doesn't validate the new field.
**Why it happens:** The project generates a JSON Schema file from Zod schemas; new fields must be included.
**How to avoid:** After extending `configSchema`, verify that `generate-schema.ts` still works and the output includes the new field.
**Warning signs:** `tuireel validate` doesn't catch invalid `pacing` values.

## Code Examples

Verified patterns from the existing codebase:

### Extending charDelay with Profile Parameters

```typescript
// packages/core/src/executor/timing.ts
// Current signature:
export function charDelay(
  baseMs: number,
  context?: { text: string; char: string; index: number },
): number;

// Extended signature (backward compatible):
export function charDelay(
  baseMs: number,
  context?: { text: string; char: string; index: number },
  profile?: CadenceProfile,
): number {
  const safeBaseMs = Math.max(1, baseMs);
  if (!context) return safeBaseMs;

  const { text, char, index } = context;
  const previousChar = index > 0 ? (text[index - 1] ?? "") : "";
  const jitter = seededUnit(`${safeBaseMs}:${index}:${char}:${text.length}`);

  // Use profile multipliers when available, else fall back to hardcoded values
  const p = profile;
  let multiplier = 0.76 + jitter * 0.24;

  if (index === 0) multiplier += p?.firstCharExtra ?? 0.24;
  if (char === "/") multiplier += p?.pathSepExtra ?? 0.08;
  if (/\s/.test(char)) multiplier += p?.whitespaceExtra ?? 0.28;
  if (/[.,!?;:]/.test(char)) multiplier += p?.punctuationExtra ?? 0.22;
  if (/[\/_.-]/.test(previousChar)) multiplier += p?.pathSepExtra ?? 0.06;

  return Math.max(12, Math.round(safeBaseMs * multiplier));
}
```

### Schema Extension for Pacing

```typescript
// packages/core/src/config/schema.ts
const pacingSchema = z
  .union([
    z.enum(CADENCE_PROFILE_NAMES), // "relaxed" | "brisk" | "deliberate"
    z.object({
      // Custom inline profile
      baseSpeedMs: z.number().positive(),
      // ... full CadenceProfile fields
    }),
  ])
  .optional();

// Add to baseConfigFields:
const baseConfigFields = {
  // ... existing fields ...
  pacing: pacingSchema,
};
```

### Wiring Profile into Type Step

```typescript
// packages/core/src/executor/steps/type.ts
export async function typeStep(
  session: TuireelSession,
  text: string,
  speed: number | undefined,
  profile: CadenceProfile | undefined,
  onCharacter?: (char: string, index: number) => void | Promise<void>,
): Promise<void> {
  // Per-step speed override wins, then profile base, then hardcoded default
  const baseSpeed = speed ?? profile?.baseSpeedMs ?? DEFAULT_TYPE_SPEED_MS;
  // ... rest unchanged, pass profile to charDelay
}
```

## State of the Art

| Old Approach                           | Current Approach                        | When Changed        | Impact                                            |
| -------------------------------------- | --------------------------------------- | ------------------- | ------------------------------------------------- |
| Hardcoded multipliers in `charDelay()` | Profile-driven multipliers              | This phase          | Character timing becomes configurable per-profile |
| No automatic pauses between steps      | Beat injection at boundaries            | This phase          | Demos breathe without manual pause authoring      |
| Global `speed` on type steps only      | Per-step override with profile fallback | This phase (wiring) | Authors can fine-tune individual steps            |

**Deprecated/outdated:**

- Nothing deprecated. The existing hardcoded multipliers become the default fallback when no profile is selected.

## Open Questions

1. **Should presets (`polished`, `demo`, etc.) include a default pacing profile?**
   - What we know: Presets currently define theme, sound, cursor, and HUD. They don't include timing.
   - What's unclear: Whether `polished` should imply `relaxed` pacing, `demo` should imply `brisk`, etc.
   - Recommendation: Keep presets and pacing independent for v1.2. If coupling is desired, it's a one-line change in `built-in.ts` later. Keeps the initial implementation simpler and avoids surprising existing preset users.

2. **Should custom inline profiles be supported in v1.2, or just named profiles?**
   - What we know: The schema could accept either a string name or an inline object.
   - What's unclear: Whether anyone needs custom profiles before v2.
   - Recommendation: Support both in the schema (it's trivial with Zod union), but only ship 3 named profiles. Custom inline profiles get validation for free.

## Validation Architecture

### Test Framework

| Property           | Value                              |
| ------------------ | ---------------------------------- |
| Framework          | vitest 3.2.4                       |
| Config file        | `packages/core/vitest.config.ts`   |
| Quick run command  | `pnpm test --filter @tuireel/core` |
| Full suite command | `pnpm test`                        |

### Phase Requirements to Test Map

| Req ID  | Behavior                                                            | Test Type | Automated Command                                                        | File Exists?    |
| ------- | ------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------ | --------------- |
| PACE-01 | Named profile drives charDelay multipliers and base speed           | unit      | `pnpm --filter @tuireel/core vitest run test/pacing/profiles.test.ts -x` | Wave 0          |
| PACE-01 | Profile selection via config schema validation                      | unit      | `pnpm --filter @tuireel/core vitest run test/config.test.ts -x`          | Extend existing |
| PACE-02 | Beat injection at interaction boundaries (startup/settle/read/idle) | unit      | `pnpm --filter @tuireel/core vitest run test/pacing/beats.test.ts -x`    | Wave 0          |
| PACE-02 | No beat inserted adjacent to authored pause steps                   | unit      | `pnpm --filter @tuireel/core vitest run test/pacing/beats.test.ts -x`    | Wave 0          |
| PACE-03 | Per-step speed override wins over profile baseSpeedMs               | unit      | `pnpm --filter @tuireel/core vitest run test/type-step.test.ts -x`       | Extend existing |
| PACE-03 | Authored pause duration is never modified by pacing                 | unit      | `pnpm --filter @tuireel/core vitest run test/pacing/beats.test.ts -x`    | Wave 0          |
| ALL     | charDelay determinism preserved with profile params                 | unit      | `pnpm --filter @tuireel/core vitest run test/timing.test.ts -x`          | Extend existing |
| ALL     | Backward compat: no pacing field = identical behavior               | unit      | `pnpm --filter @tuireel/core vitest run test/timing.test.ts -x`          | Extend existing |

### Sampling Rate

- **Per task commit:** `pnpm --filter @tuireel/core vitest run -x`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/core/test/pacing/profiles.test.ts` - covers PACE-01 (profile resolution, charDelay with profile)
- [ ] `packages/core/test/pacing/beats.test.ts` - covers PACE-02, PACE-03 (beat injection logic, authored pause respect)

## Sources

### Primary (HIGH confidence)

- Codebase inspection: `packages/core/src/executor/timing.ts` - existing `charDelay()` and `seededUnit()` implementation
- Codebase inspection: `packages/core/src/executor/step-executor.ts` - existing step loop and hook system
- Codebase inspection: `packages/core/src/config/schema.ts` - existing Zod schemas including `typeStepSchema.speed` field
- Codebase inspection: `packages/core/src/executor/steps/pause.ts` - existing simple pause implementation
- Codebase inspection: `packages/core/test/timing.test.ts` - existing determinism tests

### Secondary (MEDIUM confidence)

- None needed. This phase is entirely internal to the codebase with no external library integration.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - No new dependencies; extending existing patterns
- Architecture: HIGH - All integration points verified by reading actual source code
- Pitfalls: HIGH - Identified from real code structure and existing test patterns

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable; no external dependencies to drift)
