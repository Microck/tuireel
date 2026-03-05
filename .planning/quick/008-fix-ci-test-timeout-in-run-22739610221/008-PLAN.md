---
phase: quick-008-fix-ci-test-timeout-in-run-22739610221
plan: 008
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/core/src/__tests__/compositor.test.ts
autonomous: true
must_haves:
  truths:
    - "`pnpm --filter @tuireel/core test` passes without the compositor integration test timing out at 5000ms"
    - "The compositor integration test still exercises real ffmpeg download/extract + compose output validation"
    - "Root `pnpm test` passes after the timeout fix"
  artifacts:
    - path: "packages/core/src/__tests__/compositor.test.ts"
      provides: "A per-test timeout override scoped to the ffmpeg-backed compositor integration test"
  key_links:
    - from: "packages/core/src/__tests__/compositor.test.ts"
      to: "packages/core/src/ffmpeg/downloader.ts"
      via: "`ensureFfmpeg()` call is given enough timeout budget for first-run download/extract latency"
      pattern: "ensureFfmpeg\\(\\)"
---

<objective>
Unblock CI run `22739610221` by fixing the `pnpm test` timeout in `packages/core/src/__tests__/compositor.test.ts` with the smallest safe change.

Purpose: Keep the integration test meaningful while tolerating first-run ffmpeg download/extraction in CI.
Output: Targeted timeout override in the compositor integration test and passing package/root test commands.
</objective>

<execution_context>
@/home/ubuntu/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/ubuntu/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@packages/core/src/__tests__/compositor.test.ts
@packages/core/src/ffmpeg/downloader.ts
@packages/core/vitest.config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add a scoped timeout for the ffmpeg-backed compositor integration test</name>
  <files>packages/core/src/__tests__/compositor.test.ts</files>
  <action>
  Update only the failing test case `"creates a playable output from raw video and timeline data"` to use an explicit per-test timeout override large enough for CI first-run ffmpeg setup.

Requirements:

- Apply timeout at the test case level (for example, Vitest third argument or equivalent per-test option) so default timeouts remain unchanged for all other tests.
- Keep assertions, cleanup (`rm(tempDirectory, { recursive: true, force: true })`), and integration flow intact.
- Do not change `packages/core/vitest.config.ts` unless the scoped timeout mechanism is proven unsupported.
- Use a practical CI-safe timeout budget (for example 60_000-120_000ms) to cover download + extract variability.
  </action>
  <verify>
  pnpm --filter @tuireel/core test
  </verify>
  <done>
- The compositor integration test no longer fails at the 5000ms default timeout while waiting on `ensureFfmpeg()`.
- Timeout scope is limited to the single compositor integration test.
  </done>
  </task>

<task type="auto">
  <name>Task 2: Validate workspace-level test gate matches CI expectation</name>
  <files>packages/core/src/__tests__/compositor.test.ts</files>
  <action>
  Run root `pnpm test` after the targeted fix to confirm no regressions and that CI-equivalent test execution is green.

- If failures appear, only address issues directly caused by this timeout change.
- Keep the quick-task scope atomic: no unrelated refactors or broad timeout tuning.
  </action>
  <verify>
  pnpm test
  </verify>
  <done>
- Root test command exits with code 0.
- The known CI timeout blocker in `compositor.test.ts` is resolved without broad config changes.
  </done>
  </task>

</tasks>

<verification>
- `pnpm --filter @tuireel/core test` exits 0 and includes a passing compositor integration test.
- `pnpm test` exits 0 from repo root.
- `packages/core/vitest.config.ts` remains unchanged unless task execution proves scoped timeout support unavailable.
</verification>

<success_criteria>

- CI test timeout blocker from run `22739610221` is removed by a localized test-level timeout adjustment.
- No global timeout policy change is introduced unless technically required.
- The fix is self-contained to this quick task and validated by both package-level and root-level test commands.
  </success_criteria>

<output>
After completion, create `.planning/quick/008-fix-ci-test-timeout-in-run-22739610221/008-SUMMARY.md`.
</output>
