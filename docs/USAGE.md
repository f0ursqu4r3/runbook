# Runbook Usage Guide

Runbook turns a manual into build output. You write chapters in Markdown, define screenshots in executable Playwright flows, and compile a PDF that fails when the documented product no longer matches reality.

This guide is the end-to-end reference for using the tool as it exists in this repository today.

## What You Need

- `bun` 1.3+
- `typst` on your `PATH`
- Playwright Chromium installed with `bunx playwright install chromium`
- A local app or fixture environment that can be captured deterministically

Install repository dependencies first:

```bash
bun install
```

## Fast Start

Build the bundled sample manual:

```bash
bun run runbook:check
bun run runbook:capture
bun run runbook:build
```

That will produce:

- `dist/screenshots/*.png`
- `dist/screenshots/manifest.json`
- `dist/reports/capture-report.json`
- `dist/manual.typ`
- `dist/manual.pdf`

## How Runbook Works

The pipeline is simple:

1. Chapters in `manual/chapters` define the written manual.
2. Flows in `manual/flows` define how screenshots are captured.
3. The config file defines paths, branding, viewport, and app base URL.
4. `check` validates structure and screenshot references.
5. `capture` runs the flows and emits screenshots plus a manifest.
6. `build` runs capture, generates Typst, and compiles the final PDF.

If a screenshot reference, selector, or flow breaks, the manual build breaks.

## Expected Project Shape

Use a structure like this:

```text
manual/
  chapters/
    01-introduction.md
    02-core-workflows.md
  flows/
    _flow-helpers.mjs
    login.flow.mjs
    create-project.flow.mjs
  assets/
    logo.svg
  template/
    manual.typ
  manual.config.mjs
```

Important behavior:

- Chapters are loaded from `chaptersDir` in filename order. Use numbered filenames.
- Flows are loaded from `flowsDir` in filename order.
- Flow files must currently be `.mjs`.
- Files in the flows directory that start with `_` are ignored by discovery.

## Configuration

Runbook loads `manual/manual.config.mjs` by default. You can also point to another profile with `--config`.

Example:

```js
const config = {
  productName: "Runbook",
  title: "Runbook Sample Manual",
  version: "0.1.0-dev",
  baseUrl: "http://localhost:3000",
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  timezone: "UTC",
  captureConcurrency: 4,
  deviceScaleFactor: 2,
  theme: {
    primary: "#0f172a",
    accent: "#d97706",
    muted: "#475569"
  },
  paths: {
    chaptersDir: "manual/chapters",
    flowsDir: "manual/flows",
    assetsDir: "manual/assets",
    logoFile: "manual/assets/logo.svg",
    templateFile: "manual/template/manual.typ",
    outputDir: "dist",
    typstSourceFile: "dist/manual.typ",
    screenshotsDir: "dist/screenshots",
    reportsDir: "dist/reports",
    captureReportFile: "dist/reports/capture-report.json",
    manifestFile: "dist/screenshots/manifest.json",
    outputFile: "dist/manual.pdf"
  }
};

export default config;
```

Field notes:

- `baseUrl` becomes Playwright `baseURL`. If your flows call `page.goto("/")`, this must be valid.
- `captureConcurrency` controls how many flows run in parallel.
- `deviceScaleFactor` controls screenshot sharpness. The current default is `2`.
- `paths.logoFile` is optional. If omitted, Runbook uses `assetsDir/logo.svg`.

## Writing Chapters

Each chapter must:

- Be a `.md` file inside `chaptersDir`
- Start with a level-one heading like `# Introduction`

Current Markdown support is intentionally narrow:

- headings
- paragraphs
- flat `-` bullet lists
- screenshot directives

Do not assume tables, fenced code blocks, blockquotes, or arbitrary Markdown extensions are rendered in the PDF yet.

### Screenshot Directive Syntax

Use this exact format:

```md
![[screenshot:login-screen caption="Users start from a stable sign-in screen."]]
```

Rules:

- Screenshot IDs must match the pattern `[a-z0-9-]+`.
- The `caption` is optional.
- Every referenced screenshot ID must be declared by some flow.

Example chapter:

```md
# Core Workflows

This chapter demonstrates how authored prose references executable screenshots.

## Create a Project

![[screenshot:create-project caption="Create the workspace before authors begin documenting flows."]]
```

## Writing Flows

Flows define how screenshots are produced. Each flow exports metadata plus an async function.

Use the helper in [manual/flows/_flow-helpers.mjs](/Users/la.kyle.dougan/git/eos/runbook/manual/flows/_flow-helpers.mjs) unless you have a strong reason not to.

Example:

```js
import { defineFlow } from "./_flow-helpers.mjs";
import { loginScreenHtml } from "../fixtures/sample-app.mjs";

export default defineFlow(
  {
    id: "login",
    screenshots: ["login-screen"]
  },
  async (flow) => {
    await flow.render(loginScreenHtml(), "Render login screen");

    await flow.capture(
      "login-screen",
      (ui) => [
        ui.step("[data-testid='email']", 1, { tone: "info" }),
        ui.callout("[data-testid='submit']", {
          title: "Sign In",
          text: "Use the seeded account to enter the workspace.",
          side: "bottom",
          tone: "neutral"
        })
      ],
      {
        clipTo: "[data-testid='login-card']",
        padding: { top: 28, right: 28, bottom: 120, left: 28 }
      }
    );
  }
);
```

### Flow Rules

- `meta.id` must be unique per flow.
- `meta.screenshots` must contain every screenshot ID the flow captures.
- Screenshot IDs must be unique across the whole manual.
- Wrap meaningful actions in `flow.step(...)` so failures name the right step.
- Use stable selectors. Prefer `data-testid` or dedicated `data-runbook-*` attributes.

### Available Flow Helpers

The helper-based flow context gives you:

- `flow.page`: raw Playwright page
- `flow.step(name, fn)`: names a step for failure reporting
- `flow.render(html, stepName)`: sets a fixture HTML document directly
- `flow.capture(id, annotations, options)`: applies annotations and captures a screenshot

Annotation helpers exposed through `ui`:

- `ui.step(target, number, options)`
- `ui.callout(targetOrTargets, options)`
- `ui.box(targetOrTargets, options)`
- `ui.focus(targetOrTargets, options)`
- `ui.arrow(targetOrTargets, options)`
- `ui.redact(target, options)`

### Grouped Annotations

Pass an array of selectors when several controls should be treated as one concept:

```js
ui.callout(
  ["[data-testid='org-name']", "[data-testid='save-settings']"],
  {
    title: "Branding Controls",
    text: "Review the field and then save the change.",
    side: "bottom",
    tone: "neutral"
  }
)
```

### Capture Options

`flow.capture(..., options)` supports:

- `clipTo`: a selector or selector array used to crop the screenshot
- `padding`: a number or directional padding object
- `fullPage`: capture the full page when `clipTo` is not used
- `dim`: add a subdued scrim outside the focus area
- `dimOpacity`: control scrim intensity

Example:

```js
await flow.capture("dashboard-panels", (ui) => [
  ui.callout("[data-runbook-region='dashboard-panels']", {
    title: "Workspace Panels",
    text: "The lower dashboard groups the major work areas.",
    side: "bottom",
    tone: "neutral"
  })
], {
  clipTo: "[data-runbook-region='dashboard-panels']",
  padding: { top: 24, right: 24, bottom: 120, left: 24 },
  dim: true,
  dimOpacity: 0.55
});
```

See [docs/SCREENSHOT_STYLE_GUIDE.md](/Users/la.kyle.dougan/git/eos/runbook/docs/SCREENSHOT_STYLE_GUIDE.md) for the visual rules that keep captures professional and consistent.

## Commands

Default profile commands:

- `bun run runbook:check`
- `bun run runbook:capture`
- `bun run runbook:build`
- `bun run dev`

You can also run the CLI directly:

```bash
bun run src/cli.ts check
bun run src/cli.ts capture
bun run src/cli.ts build
```

To use a different manual profile:

```bash
bun run src/cli.ts build --config manual/sample/manual.config.mjs
```

Command behavior:

- `check` validates required paths, chapters, flows, and screenshot references.
- `capture` runs the flows and writes screenshot artifacts plus a manifest.
- `build` validates, captures, generates Typst, and compiles the PDF.
- `dev` currently runs the same build path through a lighter entrypoint.

## Build Outputs

After a successful build, expect these artifacts:

- `screenshotsDir/*.png`: captured annotated screenshots
- `manifestFile`: screenshot metadata with `id`, `flowId`, `path`, and step name
- `captureReportFile`: success summary or structured failure report
- `typstSourceFile`: generated Typst source
- `outputFile`: final PDF

On failure, `capture-report.json` includes:

- `ok`
- `flowId`
- `step`
- `message`
- `cause`
- `failurePath`

That gives you the exact flow and step that broke plus a failure screenshot.

## Using Runbook Against a Real App

The right pattern is:

1. Start the app locally in a deterministic mode.
2. Mock authentication and unstable APIs.
3. Point `baseUrl` at the local app.
4. Build a dedicated profile with its own chapters, flows, and assets.
5. Capture clipped screenshots around the relevant UI region.

For real applications, do not capture against live auth or live production data unless you explicitly want documentation to depend on them. That makes manuals flaky and non-repeatable.

### Sample Example

This repository includes a working example profile under [manual/sample](/Users/la.kyle.dougan/git/eos/runbook/manual/sample).

Start Sample in mocked mode:

```bash
cd /Users/la.kyle.dougan/git/eos/sample-ui/fe
VITE_E2E=true bun run dev -- --port 51173
```

Then build the manual from this repo:

```bash
cd /Users/la.kyle.dougan/git/eos/runbook
bun run runbook:sample:build
```

That writes the example artifacts to:

- `dist/sample/screenshots`
- `dist/sample/reports`
- `dist/sample/manual.typ`
- `dist/sample/manual.pdf`

## Troubleshooting

`Required path is missing`

- The config points at a directory or file that does not exist.
- Check `chaptersDir`, `flowsDir`, `assetsDir`, and `templateFile`.

`No chapters were found` or `No flow files were found`

- The configured directories are empty.
- Flow helpers like `_flow-helpers.mjs` do not count as flows.

`Chapter is missing a level-one heading`

- Every chapter must begin with a `#` heading.

`Screenshot reference "..." does not exist in any flow`

- A chapter references an ID that no flow declares.
- Fix the chapter directive or add the screenshot to a flow.

`Duplicate screenshot id detected`

- Two flows declared the same screenshot ID.
- IDs must be unique across the entire manual.

`Clip target not found` or `Annotation target not found`

- A selector changed or never existed in the captured state.
- Use stable selectors and verify the flow reached the correct page state before capture.

`Typst compile failed`

- `typst` is missing from `PATH`, or the generated Typst references bad assets.
- Verify `typst compile` works on the machine and check logo/template paths.

Navigation to `"/"` fails

- Your flow used a relative URL but `baseUrl` is missing or invalid.
- Set a valid `baseUrl` in the config.

Screenshots look noisy or over-annotated

- Tighten the crop with `clipTo`.
- Move explanatory detail into chapter prose.
- Reduce to one primary note card per screenshot.
- Review [docs/SCREENSHOT_STYLE_GUIDE.md](/Users/la.kyle.dougan/git/eos/runbook/docs/SCREENSHOT_STYLE_GUIDE.md).

## Recommended Workflow

Use this sequence when authoring a new manual:

1. Create a new config profile.
2. Add numbered chapter files with stable screenshot references.
3. Write one flow per documented workflow area.
4. Run `bun run src/cli.ts check --config ...` until the structure is valid.
5. Run `capture` to tune selectors, clipping, and annotation placement.
6. Run `build` and review the PDF, not just the raw PNGs.
7. Commit the manual sources and treat the PDF as reproducible output.

That is the intended working model for Runbook.
