---
phase: quick-13
plan: 01
subsystem: demos
tags: [meta, video, demo, recursive]
dependency_graph:
  requires: []
  provides: [meta-demo-video]
  affects: [README]
tech_stack:
  added: []
  patterns: [meta-recursion, self-referential-demo]
key_files:
  created:
    - assets/demos/meta-demo.tuireel.jsonc
    - assets/demos/meta-demo.mp4
  modified:
    - README.md
decisions:
  - Removed wait steps from script to avoid recording hangs
  - Used demo preset for simpler, faster recording
  - Embedded video in README using HTML video tag for better control
metrics:
  duration_minutes: 16
  completed_date: 2026-03-06
---

# Quick Task 13: Meta Demo Video Summary

**One-liner:** Created recursive meta demo showing tuireel recording itself, embedded in README hero section

## Objective

Create a meta/recursive demo video for tuireel that shows the process of creating a tuireel demo video using OpenCode. The video demonstrates the self-referential loop: the viewer watches the creation of what they're watching.

## What Was Built

### 1. Meta Demo Script (assets/demos/meta-demo.tuireel.jsonc)

A tuireel script simulating an OpenCode session where a user asks to create a tuireel demo video. The script shows:

- OpenCode prompt appearing
- User typing: "create a tuireel demo video"
- Simulated thinking/processing phase
- Result message: "created: meta-demo.mp4"
- Meta message: "(you are watching what was just created)"

Key technical details:

- Uses demo preset for reliable recording
- 20 rows x 90 cols terminal size
- Pause-only timing (no wait steps to avoid hangs)
- Total duration: ~15 seconds

### 2. Rendered Video (assets/demos/meta-demo.mp4)

Successfully recorded MP4 video:

- Duration: 15.53 seconds
- Resolution: 756x420 at 30fps
- Size: 137KB
- Includes video (H.264) and audio (AAC)
- Demonstrates the recursive loop concept

### 3. README Integration

Added video embed in hero section:

- Positioned after documentation links, before quick start
- Uses HTML video tag with controls
- Includes caption: "watch tuireel create this demo (meta recursion)"
- Width: 600px for optimal viewing

## Tasks Completed

| Task | Description                        | Commit           | Status      |
| ---- | ---------------------------------- | ---------------- | ----------- |
| 1    | Create meta demo tuireel script    | ab1e895, ecfc660 | ✅ Complete |
| 2    | Record the meta demo video         | f8e1b61          | ✅ Complete |
| 3    | Link demo from README hero section | 1cf2b26          | ✅ Complete |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Recording hangs with wait steps**

- **Found during:** Task 2 (recording)
- **Issue:** Script with wait steps caused recording to timeout during compositing phase
- **Fix:** Removed all wait steps, using pause-only timing for reliable execution
- **Files modified:** assets/demos/meta-demo.tuireel.jsonc
- **Commit:** ecfc660

**2. [Rule 1 - Bug] Invalid config fields**

- **Found during:** Task 2 (recording attempt)
- **Issue:** Tried using boolean values for cursor/hud/sound fields (expected objects)
- **Fix:** Switched to using demo preset instead of manual field configuration
- **Files modified:** assets/demos/meta-demo.tuireel.jsonc
- **Commit:** ecfc660

## Verification

All success criteria met:

- ✅ Script validates without errors
- ✅ Video file exists and is playable (137KB, 15.5s, valid MP4)
- ✅ README links to the demo in hero section
- ✅ Demo captures the meta/recursive loop concept

## Self-Check

Verifying created files and commits:

```bash
# Check files exist
[ -f "assets/demos/meta-demo.tuireel.jsonc" ] && echo "✓ Script exists"
[ -f "assets/demos/meta-demo.mp4" ] && echo "✓ Video exists"
grep -q "meta-demo.mp4" README.md && echo "✓ README links to video"

# Check commits exist
git log --oneline --all | grep -q "ab1e895" && echo "✓ Commit ab1e895 exists"
git log --oneline --all | grep -q "ecfc660" && echo "✓ Commit ecfc660 exists"
git log --oneline --all | grep -q "f8e1b61" && echo "✓ Commit f8e1b61 exists"
git log --oneline --all | grep -q "1cf2b26" && echo "✓ Commit 1cf2b26 exists"
```

## Self-Check: PASSED

All files and commits verified successfully.
