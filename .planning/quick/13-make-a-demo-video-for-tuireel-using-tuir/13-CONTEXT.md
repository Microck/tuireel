# Quick Task 13: make a demo video for tuireel, using tuireel itself - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Create a meta/recursive demo video for tuireel that shows OpenCode being used to create a tuireel demo video using the tuireel skill. The demo should capture the conceptual loop: the result being shown is the process of creating itself.

</domain>

<decisions>
## Implementation Decisions

### Demo Narrative & Content

- **Approach:** Meta/recursive loop (conceptual)
- Focus on the self-referential aspect rather than comprehensive feature coverage
- Keep it conceptual and shorter rather than tutorial-style

### Recording Approach

- **Method:** Synthetic script simulation
- Use a tuireel script to simulate the interaction (polished, repeatable, easier to edit)
- Not a real screen recording

### Loop Visualization

- **Flow:** opencode → prompt → enter → show the thinking → wait for the result → get result
- The key insight: "the point is that the 'result' is what's being shown to them"
- Show the full interaction sequence including the thinking/waiting phase
- The demo video itself IS the result being demonstrated

### Output & Deliverables

- **Location:** Standalone demo in assets/ or docs/
- Link from README hero section
- Include both the script file and the generated video

### Claude's Discretion

- Specific timing and pacing of the demo
- Exact prompt text to use in the simulation
- Visual styling and presentation details
- Whether to use sound effects or keep it minimal

</decisions>

<specifics>
## Specific Ideas

The meta loop structure:

1. Show OpenCode interface (simulated)
2. User types prompt: "create a tuireel demo video"
3. Show thinking/processing phase
4. Show result generation
5. The result IS this demo video

This creates a self-referential loop where the viewer is watching the creation of what they're watching.

</specifics>
