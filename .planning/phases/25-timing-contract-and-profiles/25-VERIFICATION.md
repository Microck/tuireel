---
phase: 25-timing-contract-and-profiles
verified: 2026-03-08T20:36:27Z
status: passed
score: 4/4 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "Recomposition preserves saved timing intent with both command-path and core compose-path coverage"
  gaps_remaining: []
  regressions: []
---

# Phase 25: Timing Contract and Profiles Verification Report

**Phase Goal:** Authors can choose stable pacing and delivery semantics that survive recording and recompositing.
**Verified:** 2026-03-08T20:36:27Z
**Status:** passed
**Re-verification:** Yes - after gap closure

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                               | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Authors can set raw capture cadence separately from final output cadence without config ambiguity.  | ✓ VERIFIED | Quick regression check passed: `packages/core/src/config/schema.ts:84`, `packages/core/src/config/schema.ts:94`, `packages/core/src/config/schema.ts:212`, and `packages/core/src/config/schema.ts:221` still expose `deliveryProfile`, `fps`, and `captureFps`; `packages/core/src/config/loader.ts:158` still resolves delivery profiles before validation.                                                                                     |
| 2   | Authors can choose a named delivery target and get timing/readability defaults without hand-tuning. | ✓ VERIFIED | Quick regression check passed: built-in delivery targets still define cadence/readability defaults in `packages/core/src/delivery-profiles/built-in.ts:15`; starter config remains profile-first in `packages/cli/src/commands/init.ts:120` and `packages/cli/src/commands/init.ts:172`; docs still teach the contract in `README.md:57` and `docs/config-reference.mdx:24`.                                                                      |
| 3   | Saved recordings persist explicit timing intent for later recomposition.                            | ✓ VERIFIED | Quick regression check passed: the timing contract still exists in `packages/core/src/timeline/timing-contract.ts:3`; recorder persistence still writes it in `packages/core/src/recorder.ts:460`; serialized timelines still carry it in `packages/core/src/timeline/interaction-timeline.ts:311`.                                                                                                                                               |
| 4   | Recomposition preserves saved timing intent with both command-path and core compose-path coverage.  | ✓ VERIFIED | Gap closed: `packages/core/src/__tests__/compositor.test.ts:228` and `packages/core/src/__tests__/compositor.test.ts:262` now exercise saved-artifact packaging-only recomposition at `compose()`; `packages/core/test/timing-contract.test.ts:67`, `packages/core/test/timing-contract.test.ts:100`, and `packages/core/test/timing-contract.test.ts:130` now cover capture-fps drift, output-fps drift, and explicit legacy fallback semantics. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact                                          | Expected                                                              | Status     | Details                                                                                                                                                                                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core/src/delivery-profiles/built-in.ts` | Named delivery-profile defaults                                       | ✓ VERIFIED | Still defines profile timing/readability defaults in `packages/core/src/delivery-profiles/built-in.ts:15`.                                                                                                                                             |
| `packages/core/src/delivery-profiles/resolve.ts`  | Shared merge logic with explicit-config precedence                    | ✓ VERIFIED | Still merges profile defaults under explicit config in `packages/core/src/delivery-profiles/resolve.ts:25`.                                                                                                                                            |
| `packages/core/src/config/schema.ts`              | Public config contract for `deliveryProfile`, `fps`, and `captureFps` | ✓ VERIFIED | Still exposes the contract for single-video and multi-video config in `packages/core/src/config/schema.ts:81` and `packages/core/src/config/schema.ts:207`.                                                                                            |
| `packages/cli/src/commands/init.ts`               | Profile-first starter flow                                            | ✓ VERIFIED | Still scaffolds `deliveryProfile` first in `packages/cli/src/commands/init.ts:120` and prompts for it before preset at `packages/cli/src/commands/init.ts:172`.                                                                                        |
| `README.md`                                       | Top-level timing semantics                                            | ✓ VERIFIED | Still distinguishes final output cadence from raw capture cadence in `README.md:157` and `README.md:158`.                                                                                                                                              |
| `packages/core/src/timeline/timing-contract.ts`   | Versioned saved timing contract and compatibility helper              | ✓ VERIFIED | Still defines the contract and helper in `packages/core/src/timeline/timing-contract.ts:3` and `packages/core/src/timeline/timing-contract.ts:67`.                                                                                                     |
| `packages/core/src/recorder.ts`                   | Record-time timing persistence                                        | ✓ VERIFIED | Still persists timing metadata in `packages/core/src/recorder.ts:460`.                                                                                                                                                                                 |
| `packages/cli/src/commands/composite.ts`          | Recomposite timing gate                                               | ✓ VERIFIED | Still validates saved timing intent before compose in `packages/cli/src/commands/composite.ts:176`.                                                                                                                                                    |
| `packages/core/src/__tests__/compositor.test.ts`  | Core compose-path timing coverage                                     | ✓ VERIFIED | Now includes substantive saved-artifact recomposition cases in `packages/core/src/__tests__/compositor.test.ts:228` and `packages/core/src/__tests__/compositor.test.ts:262`.                                                                          |
| `packages/core/test/timing-contract.test.ts`      | Core timing mismatch and legacy fallback assertions                   | ✓ VERIFIED | Now asserts packaging-only compatibility, capture/output drift, and legacy fallback message in `packages/core/test/timing-contract.test.ts:34`, `packages/core/test/timing-contract.test.ts:67`, and `packages/core/test/timing-contract.test.ts:130`. |

### Key Link Verification

| From                                             | To                                                | Via                                                                                                                       | Status  | Details                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/config/loader.ts`             | `packages/core/src/delivery-profiles/resolve.ts`  | loader applies delivery-profile defaults before validation                                                                | ✓ WIRED | `packages/core/src/config/loader.ts:158` still calls `resolveDeliveryProfile(resolvePreset(rawConfig))`.                                                                                                                                                                                                                                      |
| `packages/core/src/config/schema.ts`             | `packages/core/src/delivery-profiles/built-in.ts` | schema validation source                                                                                                  | ✓ WIRED | `packages/core/src/config/schema.ts:30` still binds `deliveryProfile` validation to built-in names.                                                                                                                                                                                                                                           |
| `packages/cli/src/commands/init.ts`              | `packages/core` config contract                   | generated starter config uses public deliveryProfile contract                                                             | ✓ WIRED | `packages/cli/src/commands/init.ts:120` still writes `deliveryProfile`, aligned with the public schema surface.                                                                                                                                                                                                                               |
| `packages/core/src/recorder.ts`                  | `packages/core/src/timeline/types.ts`             | record writes `timingContract` into saved timeline JSON                                                                   | ✓ WIRED | `packages/core/src/recorder.ts:460` writes the contract and `packages/core/src/timeline/interaction-timeline.ts:321` serializes it.                                                                                                                                                                                                           |
| `packages/cli/src/commands/composite.ts`         | `packages/core/src/timeline/timing-contract.ts`   | composite validates resolved config against saved timing contract                                                         | ✓ WIRED | `packages/cli/src/commands/composite.ts:7` imports `assessTimingCompatibility` and uses it at `packages/cli/src/commands/composite.ts:176`.                                                                                                                                                                                                   |
| `packages/core/src/__tests__/compositor.test.ts` | `packages/core/src/compositor.ts`                 | compose() runs against a saved-artifact timeline fixture with `timingContract` metadata and packaging-only output changes | ✓ WIRED | The test fixture carries `timingContract` at `packages/core/src/__tests__/compositor.test.ts:86`, and the packaging-only recomposition cases call `compose()` at `packages/core/src/__tests__/compositor.test.ts:239` and `packages/core/src/__tests__/compositor.test.ts:272`.                                                               |
| `packages/core/test/timing-contract.test.ts`     | `packages/core/src/timeline/timing-contract.ts`   | assessTimingCompatibility() asserts mismatch and legacy fallback outcomes from saved timing metadata                      | ✓ WIRED | `packages/core/test/timing-contract.test.ts:3` imports the helper and uses it across compatibility, mismatch, and fallback cases at `packages/core/test/timing-contract.test.ts:49`, `packages/core/test/timing-contract.test.ts:82`, `packages/core/test/timing-contract.test.ts:114`, and `packages/core/test/timing-contract.test.ts:134`. |

### Requirements Coverage

| Requirement | Source Plan               | Description                                                                                                     | Status      | Evidence                                                                                                                                                                                                                                                                                                       |
| ----------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CAP-01`    | `25-01`, `25-02`          | Author can configure raw capture cadence independently from final output FPS                                    | ✓ SATISFIED | The config contract still splits the fields in `packages/core/src/config/schema.ts:94` and `packages/core/src/config/schema.ts:95`, and author docs still describe the split in `README.md:157` and `README.md:158`.                                                                                           |
| `CAP-04`    | `25-03`, `25-04`, `25-05` | `record` and `composite` preserve enough timing metadata to regenerate smooth final motion from saved artifacts | ✓ SATISFIED | Saved timing metadata is still persisted in `packages/core/src/recorder.ts:460`, the CLI still enforces compatibility in `packages/cli/src/commands/composite.ts:176`, and core proof now exists in `packages/core/src/__tests__/compositor.test.ts:228` plus `packages/core/test/timing-contract.test.ts:67`. |
| `READ-03`   | `25-01`, `25-02`          | Author can choose named output presets for common delivery targets without losing readability guarantees        | ✓ SATISFIED | Named delivery/readability bundles still exist in `packages/core/src/delivery-profiles/built-in.ts:15`, and author-facing docs still teach profile-first usage in `docs/config-reference.mdx:24` and `docs/presets.mdx:28`.                                                                                    |

All requirement IDs declared in Phase 25 plan frontmatter are accounted for in `.planning/REQUIREMENTS.md:17`, `.planning/REQUIREMENTS.md:20`, `.planning/REQUIREMENTS.md:26`, and the traceability table at `.planning/REQUIREMENTS.md:61`. No orphaned Phase 25 requirements were found.

### Anti-Patterns Found

No blocker or warning-pattern matches were found in `packages/core/src/__tests__/compositor.test.ts` or `packages/core/test/timing-contract.test.ts` for TODO/FIXME placeholders, empty implementations, or console-log-only behavior.

### Human Verification Required

None. The remaining runtime checks were completed in this verification pass.

### Runtime Video Evidence (Completed)

1. Packaging-only recomposite pacing:
   - Recorded one saved artifact in `/tmp/tuireel-phase25-final-s6xD9C` with `deliveryProfile: "readable-1080p"`, `fps: 30`, and `captureFps: 12`.
   - Re-ran `node packages/cli/dist/index.js composite /tmp/tuireel-phase25-final-s6xD9C/packaging.tuireel.jsonc` with packaging-only changes: `format: "webm"`, `theme: "dracula"`, `cursor.visible: false`, `hud.visible: false`, and `outputSize: { width: 960, height: 540, padding: 48 }`.
   - Output changed as expected (`504x378` MP4 -> `960x540` WebM), while timing stayed aligned (`1.833333s` original vs `1.833s` recomposite, both `30` avg fps).
   - Visual spot-check of extracted mid-run frames confirmed the packaging changes: the original frame still shows a cursor dot, while the recomposited frame is 16:9 with no visible cursor or HUD.
2. Timing-change rejection UX:
   - Re-ran `composite` with changed `fps` and observed: `Saved recording timing does not match this composite request (saved output fps 30, requested output fps 24). Re-run \`tuireel record\` if you want different pacing.`
   - Re-ran `composite` with changed `captureFps` and observed: `Saved recording timing does not match this composite request (saved capture fps 12, requested capture fps 8). Re-run \`tuireel record\` if you want different pacing.`
   - Both timing-affecting requests failed before recomposition with clear rerun guidance.

### Gaps Summary

The prior automated gap is closed, and the remaining runtime checks now pass. Phase 25 has command-path, core compose-path, and runtime evidence for saved timing preservation: delivery profiles remain a real public contract, recordings persist an explicit `timingContract`, packaging-only recomposition changes visuals without changing pacing, and `composite` rejects timing drift with clear rerun guidance.

---

_Verified: 2026-03-08T20:36:27Z_
_Verifier: Claude (gsd-verifier)_
