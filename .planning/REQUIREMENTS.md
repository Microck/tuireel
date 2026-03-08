# Requirements: Tuireel

**Milestone:** v1.2 Human Demo Feel
**Defined:** 2026-03-08
**Core Value:** TUI tool authors can produce polished demo videos from a declarative script, without manual screen recording, editing, or post-production.

## v1.2 Requirements

### Human Timing

- [x] **PACE-01**: Author can apply a deterministic cadence profile so typed text follows human-feeling timing without per-script hand tuning
- [ ] **PACE-02**: Author can apply intentional pause behavior for startup, settle, read, and idle moments
- [ ] **PACE-03**: Author can override timing behavior for specific `type` and `pause` steps without breaking the milestone pacing model

### Capture and Motion

- [x] **CAP-01**: Author can configure raw capture cadence independently from final output FPS
- [ ] **CAP-02**: Recorded demos capture extra real terminal states during typing and other visible transitions so short interactions do not collapse into one visual jump
- [ ] **CAP-03**: Final output plays back at smooth target FPS without changing authored wall-clock timing
- [x] **CAP-04**: `record` and `composite` preserve enough timing metadata to regenerate smooth final motion from saved artifacts

### Readability

- [ ] **READ-01**: Author can use a readable 1080p render preset that keeps terminal text legible in final output
- [ ] **READ-02**: Author can use framing defaults that keep the terminal window naturally sized within a 1080p canvas
- [x] **READ-03**: Author can choose named output presets for common delivery targets without losing readability guarantees

### Diagnostics

- [ ] **DIAG-04**: Author can run acceptance fixtures that verify typing cadence, pause behavior, readability, and smooth output on representative demos
- [ ] **DIAG-05**: Author can inspect pacing stats for one run, including raw frame count, durations, and output metadata
- [ ] **DIAG-06**: Author can dump raw rendered frames for a recording when diagnosing fidelity issues

## v2 Requirements

### Human Polish

- **PACE-04**: Author can enable typo-and-correction behavior as an explicit storytelling effect
- **PACE-05**: Author can use higher-level narrative pacing helpers for long-form demos

### Motion Experiments

- **CAP-05**: Author can opt into advanced terminal-safe smoothing experiments beyond repeated real frame states

## Out of Scope

| Feature                                                | Reason                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| Browser automation or browser capture                  | Tuireel remains a PTY-native terminal recorder, not a WebReel clone |
| Random timing jitter as the default humanization model | The milestone should stay deterministic and testable                |
| Optical-flow or glyph interpolation                    | Fake smoothness would hide sparse raw capture instead of fixing it  |
| Built-in video editor or cinematic effects             | Not core to human-feeling terminal demos                            |

## Traceability

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| PACE-01     | Phase 26 | Complete |
| PACE-02     | Phase 26 | Pending |
| PACE-03     | Phase 26 | Pending |
| CAP-01      | Phase 25 | Complete |
| CAP-02      | Phase 28 | Pending |
| CAP-03      | Phase 28 | Pending |
| CAP-04      | Phase 25 | Complete |
| READ-01     | Phase 27 | Pending |
| READ-02     | Phase 27 | Pending |
| READ-03     | Phase 25 | Complete |
| DIAG-04     | Phase 29 | Pending |
| DIAG-05     | Phase 29 | Pending |
| DIAG-06     | Phase 29 | Pending |

**Coverage:**

- v1.2 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---

_Requirements defined: 2026-03-08_
_Last updated: 2026-03-08 after v1.2 roadmap creation_
