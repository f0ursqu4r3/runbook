# Project Brief: Runbook

## One-Line Thesis

Runbook turns product documentation into an executable publishing system: teams write manuals in Markdown, capture trusted UI evidence with browser automation, and ship a polished PDF artifact that fails to build when the documented product no longer matches reality.

## Why This Exists

Most product docs decay for the same reason test suites do not: nobody is forced to prove they still work. A help center article can survive for months with dead screenshots, renamed buttons, broken paths, and lies hidden behind polished prose. The result is support drag, onboarding friction, and institutional distrust of documentation.

Runbook treats the user manual like build output, not editorial wallpaper. If a documented flow breaks, the manual should break too.

## Product Vision

Build a documentation pipeline that feels as reliable as CI and as approachable as a writing tool:

- Engineers trust it because it is deterministic, versioned, and testable.
- Writers trust it because the source of truth is readable Markdown, not a maze of JSON or a visual builder.
- Product teams trust it because every release can produce a distributable, branded manual with current screenshots.
- Leadership trusts it because a release artifact exists that proves the team can still perform the workflows it claims to support.

## What We Are Building

Runbook is a CLI-first system that:

1. Reads Markdown chapters authored by humans.
2. Executes Playwright flows against a controlled application environment.
3. Captures screenshots with annotations and redactions.
4. Resolves screenshot references embedded in the Markdown.
5. Assembles a polished PDF manual.
6. Fails loudly when screenshots, selectors, flows, or references drift.

The core design principle is simple: the manual is compiled from verified product behavior.

## Primary Users

### 1. Product Engineer

Needs documentation that is versioned with code, catches regressions, and can run in CI without handholding.

### 2. Technical Writer or Product Manager

Needs a straightforward authoring surface, stable screenshot IDs, and a low-friction way to update copy without understanding the internals of browser automation.

### 3. Release Owner

Needs a clean PDF artifact for release packets, customer handoff, audits, onboarding, or internal enablement.

## Core Promise

If a user flow is in the manual, that flow must be executable by the system that generates the manual.

Everything else is subordinate to that promise.

## Non-Negotiable Product Principles

### 1. Determinism Over Cleverness

Captures must be reproducible. No flaky waits, no hidden time dependence, no random screenshot state.

### 2. Source-Friendly Authoring

Markdown remains the default authoring language. Writers should not need to touch TypeScript unless they are defining or updating a product flow.

### 3. Failure Must Be Actionable

When the pipeline breaks, the error must name the exact flow, step, screenshot id, or chapter reference that caused the failure.

### 4. Output Must Be Worth Sharing

This cannot stop at “technically a PDF.” The result should look intentional, branded, paginated, and professionally distributable.

### 5. Local and CI Parity

The same command structure should work on a laptop and in CI. Hidden environment-specific behavior is a bug.

## Scope for v1

### In Scope

- Markdown-authored manual chapters
- Playwright-based screenshot flows
- Basic annotation primitives
- Screenshot manifest generation
- Markdown reference validation
- Typst-based PDF assembly
- CLI for capture, build, lint/check, and watch/dev workflows
- CI workflow that produces a PDF artifact
- Branded template with TOC, headers, footers, and metadata

### Out of Scope

- Multi-language manuals
- Video, GIF, or interactive embeds
- CMS integration
- Browser matrix testing
- Parallelized capture execution
- Visual regression diffing
- Web-published docs site
- AI-generated documentation content

## Product Shape

### Authoring Model

Writers produce chapters in Markdown. They reference screenshots by stable IDs rather than manually dropping image files into prose. Example:

```md
![[screenshot:dashboard-save caption="Save your changes before leaving the page."]]
```

This keeps the prose clean and ensures screenshot assets are validated at build time.

### Flow Model

Each documented workflow is encoded as a Playwright flow file. A flow can:

- navigate
- perform actions
- define named steps
- annotate the UI
- capture screenshots
- redact dynamic content

This makes the flow both documentation evidence and a thin behavioral test.

### Build Model

The build pipeline compiles validated content into a PDF artifact with:

- cover page
- table of contents
- chapter structure
- figure captions
- running headers/footers
- build metadata

## Proposed Stack

- Runtime: Node.js 20+
- Language: TypeScript
- Package manager: pnpm
- Browser automation: Playwright
- Markdown pipeline: `remark` ecosystem preferred
- PDF engine: Typst
- Template system: Typst template with project theme tokens
- CI target: GitHub Actions

## Repository Shape

```text
docs/
  BRIEF.md
manual/
  chapters/
    01-introduction.md
    02-core-workflows.md
    03-admin-settings.md
  flows/
    login.flow.ts
    create-project.flow.ts
    manage-users.flow.ts
  assets/
    logo.svg
    cover-art.png
  theme/
    tokens.ts
  template/
    manual.typ
  manual.config.ts
src/
  capture/
    annotate.ts
    redact.ts
    runner.ts
    manifest.ts
  build/
    parse.ts
    resolve.ts
    typst.ts
    validate.ts
  cli/
    build.ts
    capture.ts
    check.ts
    dev.ts
  shared/
    errors.ts
    logging.ts
    types.ts
dist/
  screenshots/
  reports/
  manual.pdf
```

## Key System Components

### 1. Flow Runner

Responsibilities:

- discover flow files
- create deterministic browser context
- run flows sequentially
- track named steps
- emit a screenshot manifest
- capture structured failure reports

Minimum flow contract:

```ts
export default async function flow(ctx: FlowContext) {
  await ctx.step("Open settings", async () => {
    await ctx.page.goto("/settings");
  });

  await ctx.annotate([
    { type: "step", target: "[data-testid='org-name']", number: 1 },
    { type: "arrow", target: "[data-testid='save']", label: "Save changes" },
  ]);

  await ctx.shot("settings-save");
}
```

### 2. Annotation Layer

Responsibilities:

- draw arrows, boxes, steps, labels, and redactions
- position overlays from DOM geometry
- remain visually crisp in exported screenshots
- fully clear overlays between captures

Minimum annotation primitives:

- `arrow`
- `box`
- `step`
- `label`
- `redact`

### 3. Markdown Resolver

Responsibilities:

- parse chapters
- resolve screenshot directives
- validate cross-links and image references
- produce an intermediate document model for PDF assembly

### 4. PDF Builder

Responsibilities:

- transform validated document model into Typst source
- apply consistent layout and theme tokens
- compile final PDF
- surface compile failures with usable context

### 5. CLI

Commands:

- `runbook capture`
- `runbook build`
- `runbook check`
- `runbook dev`

Behavior expectations:

- predictable exit codes
- readable console output
- machine-friendly logs for CI

## Deterministic Capture Rules

To keep screenshots trustworthy, v1 should enforce:

- fixed viewport size
- fixed timezone
- fixed locale
- `prefers-reduced-motion`
- disabled CSS transitions and animations
- seeded backend or fixtures
- mocked clock where needed
- stable authentication path
- no arbitrary sleep-based waits
- masking of dynamic values such as timestamps, user names, generated IDs, counters, or notifications

If a screenshot cannot be made stable without hacks, the flow or product surface needs redesign.

## Failure Model

The system should fail on:

- missing screenshot references in Markdown
- duplicate screenshot IDs
- unresolved selectors in a flow
- failed navigation or action steps
- Typst compile errors
- malformed chapter structure
- broken internal links
- missing output assets declared by the template

Failure output should include:

- flow file path
- step name
- screenshot id if applicable
- chapter path if applicable
- a concise reason
- artifact path for failure screenshot or report JSON

## Quality Bar for the PDF

The manual should feel like a real publication, not a debug dump. v1 quality expectations:

- strong cover page
- consistent typography
- generous figure spacing
- page numbers
- branded headers/footers
- automatic table of contents
- code-free presentation for reader-facing pages
- graceful handling of long captions and large screenshots

## Success Metrics

### Product Metrics

- A release can produce a manual PDF artifact with one command.
- A changed UI selector in a documented flow causes the build to fail.
- A writer can add or revise a chapter without editing code.
- A missing screenshot reference is caught before publish.

### Engineering Metrics

- Example project builds end-to-end in under 3 minutes in CI for roughly 20 flows.
- Local incremental rebuild after Markdown-only changes completes in under 10 seconds.
- Flow failure reports are specific enough that an engineer can identify the broken step without rerunning locally first.

### Experience Metrics

- New contributors can understand the authoring model in under 15 minutes.
- Generated manuals are visually strong enough to send to customers or executives without post-processing.

## Delivery Plan

### Phase 1: Skeleton

- scaffold CLI
- define config format
- implement chapter discovery
- stub flow discovery
- generate placeholder PDF from static Markdown

Exit condition: `runbook build` produces a branded PDF from sample chapters.

### Phase 2: Verified Capture

- implement Playwright runner
- implement deterministic browser setup
- add screenshot manifest generation
- add basic annotations and redactions

Exit condition: flows can capture stable screenshots referenced from Markdown.

### Phase 3: Validation and Failure UX

- add screenshot id validation
- add chapter/link validation
- add structured failure reports
- improve console output and CI summaries

Exit condition: broken references and broken flows fail clearly and early.

### Phase 4: Release-Ready Packaging

- harden Typst template
- add metadata/footer/version support
- add GitHub Actions workflow
- publish PDF artifact from CI

Exit condition: tagged releases produce a distributable manual artifact.

## First Demo Scenario

The first convincing end-to-end demo should show:

1. A sample app starts in seeded mode.
2. `runbook build` runs two or three flows.
3. Screenshots are captured with visible annotations.
4. Markdown chapters resolve those screenshots into a formatted manual.
5. The PDF is emitted successfully.
6. A selector is then intentionally changed.
7. The next build fails with an error naming the broken flow and step.

If we can show that cleanly, the product concept is proven.

## Risks

### 1. Flaky Automation

If flow execution is unstable, trust in the entire system collapses.

Mitigation: deterministic environment design is part of the core architecture, not an afterthought.

### 2. Overcomplicated Authoring

If writers need to understand internals, adoption will stall.

Mitigation: keep Markdown syntax minimal and reference-based.

### 3. Weak Output Quality

If the PDF looks homemade, the system will be treated like an internal toy.

Mitigation: invest early in template quality and layout rules.

### 4. Slow Build Times

If docs builds are painfully slow, teams will stop running them.

Mitigation: keep v1 scope narrow, enforce sequential correctness first, optimize later.

## Open Questions

- Should screenshot IDs be globally unique across the whole manual or scoped by chapter?
- Should flows be allowed to generate multiple variants of the same screenshot for different audiences or themes?
- Should the CLI support partial builds by chapter or flow in v1, or keep the surface area intentionally small?
- Should the final artifact naming incorporate semantic version, date, commit SHA, or all three when available?

## v1 Deliverables

- Working CLI with `build`, `capture`, `check`, and `dev`
- Example manual with at least three chapters
- At least three documented flows with annotations
- Typst template for branded PDF output
- Screenshot manifest and failure reporting
- CI workflow that uploads the PDF artifact
- README for contributors and writers

## Final Acceptance Criteria

v1 is complete when all of the following are true:

- a fresh contributor can run the project locally and generate a sample manual
- documented screenshots are created by executable flows, not manual copy-paste
- broken UI flows stop the manual from shipping
- missing or incorrect screenshot references stop the build
- the output PDF is good enough to distribute externally
- the architecture leaves room for future parallel capture, localization, and alternate outputs without requiring a rewrite

## Bottom Line

Runbook should make documentation honest by construction. The manual is not a side artifact written after the product is done; it is compiled proof that the documented product still exists.
