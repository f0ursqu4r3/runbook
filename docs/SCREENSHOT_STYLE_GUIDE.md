# Screenshot Style Guide

## Goal

Screenshots should feel like professional product documentation: calm, precise, and current. The interface is the subject. Annotations exist to guide attention, not to perform.

## Default Rules

- Use one primary note card per screenshot.
- Use one step badge only when there is a real ordered action.
- Prefer local connectors. If a note sits far from its target, omit the connector.
- Do not stack multiple note cards around the same control cluster.
- If prose can explain it cleanly, leave it out of the screenshot.

## Annotation Hierarchy

Use this order of priority:

1. `step`
2. `callout`
3. `box`
4. `focus`

`arrow` should be rare. It is for directional relationships that are genuinely unclear without a connector.

## Tone

- `neutral` is the default for editorial notes.
- `accent` is for the primary action in the shot.
- `info` is for sequence markers or setup context.
- `danger` is only for masking, warnings, or sensitive-state explanation.

If everything is accented, nothing is accented.

## Grouped Annotations

Use grouped multi-target annotations when a reader should treat several controls as one conceptual unit.

Good uses:

- a field and its save button
- a filter bar with two related inputs
- a row of controls that operate as one step

Avoid grouping unrelated regions just to reduce annotation count.

## Composition

- Keep note cards outside the densest interaction area when possible.
- Avoid covering buttons, field values, or table cells unless redacting.
- Prefer side placement over top placement when the screenshot already has a strong header.
- Avoid large framing boxes unless the entire region is the point.
- Prefer clipped-region captures over full-page screenshots when the lesson lives inside one panel.
- Clip to the smallest region that preserves context around the target action.
- Use directional padding when a margin note needs extra room on one side of the frame.
- Do not force tall, narrow screenshots to full page width. Render them narrower so the chapter text and figure can live on the same page.
- Keep the setup sentence for a screenshot immediately above it. Runbook will try to keep that lead-in and figure on the same page.

## Editorial Quality Bar

Before accepting a screenshot, check:

- Is the target still readable without effort?
- Is there only one obvious focal point?
- Do the annotations feel quieter than the product UI?
- Would this look credible in a customer-facing PDF?

If the answer to any of those is no, simplify the shot.
