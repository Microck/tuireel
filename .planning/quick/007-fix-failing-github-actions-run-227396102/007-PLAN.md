---
phase: quick-007-fix-failing-github-actions-run-227396102
plan: 007
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/core/src/sound.ts
autonomous: true
must_haves:
  truths:
    - "Root `pnpm lint` passes with zero errors (warnings may remain)"
    - "`packages/core/src/sound.ts` no longer contains an empty catch block that violates `no-empty`"
    - "Sound asset path resolution keeps current fallback order and behavior"
  artifacts:
    - path: "packages/core/src/sound.ts"
      provides: "Explicit non-empty handling around module-relative sound asset candidate resolution"
  key_links:
    - from: "packages/core/src/sound.ts"
      to: "resolveAssetsDirectory candidate list"
      via: "module candidate resolution remains guarded while preserving downstream fallbacks"
      pattern: "resolveAssetsDirectory"
---

<objective>
Fix the CI-blocking lint failure in run `22739610221` by removing the `no-empty` violation in `packages/core/src/sound.ts`.

Purpose: Restore a green CI lint gate with the smallest safe change.
Output: Updated `packages/core/src/sound.ts` and passing `pnpm lint`.
</objective>

<execution_context>
@/home/ubuntu/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/ubuntu/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@package.json
@packages/core/src/sound.ts
@packages/core/src/__tests__/sound.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove the empty catch in sound asset resolution without changing behavior</name>
  <files>packages/core/src/sound.ts</files>
  <action>
  Update `resolveAssetsDirectory()` so the `try/catch` around module-relative asset detection is no longer an empty block.

Requirements:

- Replace `catch {}` with explicit non-empty handling that keeps the same silent fallback behavior when module-relative resolution fails.
- Keep current candidate precedence unchanged:
  1. module-relative candidates
  2. `process.cwd()/assets/sounds`
  3. `process.cwd()/packages/core/assets/sounds`
  4. `process.cwd()/node_modules/@tuireel/core/assets/sounds`
- Keep the change surgical to this lint blocker only; do not modify unrelated warning-only files.
  </action>
  <verify>
  pnpm --filter @tuireel/core lint
  </verify>
  <done>
- `packages/core/src/sound.ts` has no `no-empty` violation.
- `@tuireel/core` lint exits successfully.
  </done>
  </task>

<task type="auto">
  <name>Task 2: Validate CI-equivalent lint gate from repo root</name>
  <files>packages/core/src/sound.ts</files>
  <action>
  Run full workspace lint exactly as CI does using `pnpm lint`.

- Confirm the previous blocker `packages/core/src/sound.ts:20:11  error  Empty block statement  no-empty` is gone.
- If any additional lint errors (not warnings) appear, fix only those required for `pnpm lint` to pass and keep scope minimal.
- Leave existing warnings untouched unless they become blockers.
  </action>
  <verify>
  pnpm lint
  </verify>
  <done>
- Root lint command exits with code 0.
- No lint errors remain in the workspace.
  </done>
  </task>

</tasks>

<verification>
- `pnpm lint` exits 0 from repo root.
- Lint output no longer reports `packages/core/src/sound.ts:20:11  error  Empty block statement  no-empty`.
</verification>

<success_criteria>

- CI lint gate is unblocked by removing the single known error in `packages/core/src/sound.ts`.
- The fix is limited to the blocker path and preserves existing sound asset fallback behavior.
  </success_criteria>

<output>
After completion, create `.planning/quick/007-fix-failing-github-actions-run-227396102/007-SUMMARY.md`.
</output>
