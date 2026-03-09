# Project Retrospective

_A living document updated after each milestone. Lessons feed forward into future planning._

## Milestone: v1.2 - Human Demo Feel

**Shipped:** 2026-03-09
**Phases:** 11 | **Plans:** 24 | **Sessions:** not tracked in docs

### What Was Built

- Timing contracts and delivery profiles that separate raw capture cadence from final output cadence.
- Deterministic pacing, readability defaults, and denser real-state capture so demos feel more human without fake interpolation.
- Diagnostics, exported-artifact acceptance proofs, and repeated-run stability automation for the shipped milestone surface.

### What Worked

- Feature phases stayed focused, then gap-closure phases tightened proof without reopening the whole milestone.
- Artifact-backed acceptance caught real pacing, readability, and continuity issues better than structural proxies.
- Persisting milestone truth in saved artifacts (`timingContract`, pacing provenance) reduced ambiguity during later verification.

### What Was Inefficient

- Milestone completion tooling wrote incorrect shipped-scope stats and duplicate milestone entries, so archive docs still needed manual correction.
- Nyquist validation coverage lagged behind implementation, which turned end-of-milestone cleanup into separate backlog work.
- Scope drift across `ROADMAP.md`, `PROJECT.md`, and `MILESTONES.md` made the archive pass slower than it should have been.

### Patterns Established

- Keep delivery intent explicit: `deliveryProfile` for author-facing defaults, `timingContract` for persisted artifact truth.
- Prove milestone claims on exported artifacts, not only internal structures or one-off verification notes.
- When audit follow-up is non-blocking tech debt, carry it forward explicitly instead of quietly expanding shipped scope.

### Key Lessons

1. Acceptance proof should follow the user-visible artifact boundary from the start; retrofitting that later is expensive.
2. Milestone archive tooling needs post-run verification because generated counts and scope can drift from the actual shipped definition.
3. Small, explicit gap-closure phases are cheaper than reopening broad feature phases once the product behavior is already right.

### Cost Observations

- Model mix: not tracked locally in repo docs.
- Sessions: not tracked locally in repo docs.
- Notable: the highest cost came from proof and archive normalization, not from the core feature implementations.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change                                                                               |
| --------- | -------- | ------ | ---------------------------------------------------------------------------------------- |
| v1.0      | n/a      | 6      | Built the end-to-end recorder/compositor baseline quickly.                               |
| v1.1      | n/a      | 13     | Added stronger docs, CI, release, and gap-closure discipline.                            |
| v1.15     | n/a      | 5      | Tightened brand and docs hosting with a smaller milestone footprint.                     |
| v1.2      | n/a      | 11     | Shifted from feature delivery to artifact-backed proof and automated acceptance closure. |

### Cumulative Quality

| Milestone | Tests                                                                                          | Coverage | Zero-Dep Additions |
| --------- | ---------------------------------------------------------------------------------------------- | -------- | ------------------ |
| v1.0      | Core pipeline coverage established                                                             | n/a      | 0                  |
| v1.1      | CI, smoke, and publish/install checks expanded                                                 | n/a      | 0                  |
| v1.15     | Docs/brand validation tightened                                                                | n/a      | 0                  |
| v1.2      | Acceptance surface expanded across pacing, readability, continuity, and repeated-run stability | n/a      | 0                  |

### Top Lessons (Verified Across Milestones)

1. Small, focused phases keep momentum high, but shipped behavior still needs artifact-level proof before archive.
2. Planning docs are only trustworthy if archive and state files are normalized immediately after milestone completion.
