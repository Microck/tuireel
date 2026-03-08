---
phase: 25
slug: timing-contract-and-profiles
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-08
---

# Phase 25 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                              |
| ---------------------- | ---------------------------------- |
| **Framework**          | `vitest` 3.2.4                     |
| **Config file**        | `packages/core/vitest.config.ts`   |
| **Quick run command**  | `pnpm --filter @tuireel/core test` |
| **Full suite command** | `pnpm test`                        |
| **Estimated runtime**  | ~60 seconds                        |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @tuireel/core test`
- **After every plan wave:** Run `pnpm --filter tuireel test && pnpm --filter @tuireel/core test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type             | Automated Command                                                | File Exists                                 | Status  |
| -------- | ---- | ---- | ----------- | --------------------- | ---------------------------------------------------------------- | ------------------------------------------- | ------- |
| 25-01-01 | 01   | 1    | CAP-01      | unit                  | `pnpm --filter @tuireel/core test`                               | `packages/core/test/config.test.ts` exists  | pending |
| 25-02-01 | 02   | 1-2  | READ-03     | unit + CLI/docs smoke | `pnpm --filter tuireel test`                                     | `packages/cli/test/commands.test.ts` exists | pending |
| 25-03-01 | 03   | 2    | CAP-04      | unit + integration    | `pnpm --filter @tuireel/core test && pnpm --filter tuireel test` | core and CLI suites exist                   | pending |

Status legend: pending / green / red / flaky

---

## Wave 0 Requirements

- [ ] `packages/core/test/delivery-profiles.test.ts` - resolver/default precedence coverage for `deliveryProfile`
- [ ] `packages/core/test/timing-contract.test.ts` - compatibility helper + legacy artifact fallback coverage
- [ ] Extend `packages/core/src/__tests__/compositor.test.ts` - incompatible recomposite failure and compatible packaging-only recomposite
- [ ] Extend `packages/cli/test/commands.test.ts` - `init` profile-first starter config and composite guidance coverage

---

## Manual-Only Verifications

All phase behaviors should have automated verification.

---

## Validation Sign-Off

- [x] All tasks have an automated verification target or explicit Wave 0 dependency
- [x] Sampling continuity avoids long stretches without automated checks
- [x] Wave 0 covers the missing phase-specific test scaffolds called out in research
- [x] No watch-mode flags
- [x] Feedback latency target is under 60s for quick loops
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
