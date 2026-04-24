# Runbook Usage Guide

This guide explains how to use Runbook without assuming you already know how the project is put together.

At a high level, Runbook takes three things:

- written content in Markdown
- screenshot flows written in Playwright
- a Typst template for the final layout

It uses those inputs to build a manual. If a referenced screenshot no longer matches what the flows can capture, the build fails instead of quietly drifting out of date.

If you are calling Runbook from another tool, see [docs/AI_USAGE.md](/Users/la.kyle.dougan/git/eos/runbook/docs/AI_USAGE.md).

## What You Need

Before you do anything else, make sure you have:

- `bun` 1.3 or newer
- `typst` on your `PATH`
- Playwright Chromium installed with `bunx playwright install chromium`
- an app or fixture environment that can be captured reliably

Install dependencies first:

```bash
bun install
```

If you want `runbook` available as a shell command outside the repo:

```bash
bun run build
npm link
runbook --help
```

If you do not want progress bars, add `--no-progress` to any command.

## A Good Starting Point

If you are on a new machine or starting a fresh profile, this is the safest order:

```bash
bun run runbook:init
bun run runbook:doctor
bun run runbook:check
bun run runbook:capture
bun run runbook:build
```

That sequence does three useful things:

- `init` gives you a working starter profile
- `doctor` catches environment problems early
- `check` validates structure before you spend time on capture

## What Each Command Does

### `init`

`init` creates a starter profile with the files Runbook expects:

- a config file
- a starter chapter
- a starter flow
- a Typst template
- a logo

Example:

```bash
bun run runbook:init manuals/acme
```

That creates a new profile under `manuals/acme`.

### `doctor`

`doctor` is the preflight check. It looks for common setup problems like:

- a missing config file
- missing directories or template files
- Typst not being installed
- Playwright Chromium not being installed
- empty chapter or flow directories
- broken screenshot references

Use it before `capture` or `build` when something feels off.

Example:

```bash
bun run runbook:doctor
bun run src/cli.ts doctor --config manuals/acme/manual.config.mjs
```

### `check`

`check` validates the manual structure without opening a browser or compiling a PDF.

It makes sure:

- chapters exist
- flows exist
- chapters begin with a level-one heading
- screenshot IDs are unique
- every screenshot reference in Markdown is declared by a flow

Example:

```bash
bun run runbook:check
```

### `capture`

`capture` runs the flows and writes the screenshot artifacts plus a manifest.

Example:

```bash
bun run runbook:capture
```

After a successful run, you should see:

- `dist/screenshots/*.png`
- `dist/screenshots/manifest.json`
- `dist/reports/capture-report.json`

### `build`

`build` runs the full pipeline:

1. validate the project
2. capture screenshots
3. generate Typst source
4. compile the final PDF

Example:

```bash
bun run runbook:build
```

After a successful build, you should see:

- `dist/manual.typ`
- `dist/manual.pdf`
- the screenshot and report files from capture

## The Basic Mental Model

Runbook is easier to use once you think about it in these terms:

- chapters are the written explanation
- flows are the proof that the screenshots are still real
- the config ties everything together
- the Typst template controls how the finished document looks

If a flow or screenshot reference breaks, that is not a side issue. The manual is now out of sync, so the build should fail.

## Expected Project Shape

Runbook expects a structure like this:

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

A few details matter:

- chapters are loaded in filename order, so numbered filenames are a good idea
- flows are also loaded in filename order
- flow files currently need to use `.mjs`
- files in the flows directory that start with `_` are ignored by discovery

## Configuration

By default, Runbook loads `manual/manual.config.mjs`. You can point it at another profile with `--config`.

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

A few field notes:

- `baseUrl` becomes Playwright’s `baseURL`
- `captureConcurrency` controls how many flows run at once
- `deviceScaleFactor` controls screenshot sharpness
- `paths.logoFile` is optional; if you omit it, Runbook uses `assetsDir/logo.svg`
- path fields support `{version}` interpolation, for example `outputFile: "manual/dist/runbook-demo-{version}.pdf"`

## Writing Chapters

Chapters are just Markdown files inside `chaptersDir`.

Each chapter should:

- be a `.md` file
- start with a level-one heading like `# Introduction`

Markdown support is intentionally narrow right now. You should assume the PDF renderer supports:

- headings
- paragraphs
- flat `-` bullet lists
- screenshot directives

Do not assume tables, fenced code blocks, or blockquotes will render the way you want yet.

### Screenshot Directives

This is the syntax:

```md
![[screenshot:login-screen caption="Users start from a stable sign-in screen."]]
```

You can also control figure width:

```md
![[screenshot:sidebar width="68%" caption="Treat the sidebar as the operator's stable home base."]]
```

Rules:

- screenshot IDs must match `[a-z0-9-]+`
- `caption` is optional
- `width` is optional and accepts integer percentages from `10%` to `100%`
- every referenced screenshot must be declared by a flow

Example:

```md
# Core Workflows

This chapter demonstrates how written content can point at captured screenshots.

## Create a Project

![[screenshot:create-project caption="Create the workspace before authors begin documenting flows."]]
```

## Writing Flows

Flows define how screenshots are produced. Each flow exports metadata and an async function.

The easiest way to write them is with `manual/flows/_flow-helpers.mjs`.

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

- `meta.id` must be unique
- `meta.screenshots` must include every screenshot the flow captures
- screenshot IDs must be unique across the entire manual
- meaningful actions should be wrapped in `flow.step(...)`
- selectors should be stable, preferably `data-testid` or dedicated `data-runbook-*` attributes

### Available Helpers

The flow context gives you:

- `flow.page`
- `flow.step(name, fn)`
- `flow.render(html, stepName)`
- `flow.capture(id, annotations, options)`

The `ui` helper gives you:

- `ui.step(...)`
- `ui.callout(...)`
- `ui.box(...)`
- `ui.focus(...)`
- `ui.arrow(...)`
- `ui.redact(...)`

### Grouped Annotations

If several controls should be treated as one concept, pass an array of selectors:

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

- `clipTo`
- `padding`
- `fullPage`
- `dim`
- `dimOpacity`

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

For the visual style rules, read [docs/SCREENSHOT_STYLE_GUIDE.md](docs/SCREENSHOT_STYLE_GUIDE.md).

## Running The CLI Directly

You can use the package scripts:

- `bun run runbook:check`
- `bun run runbook:capture`
- `bun run runbook:build`
- `bun run dev`

Or call the CLI file directly:

```bash
bun run src/cli.ts check
bun run src/cli.ts capture
bun run src/cli.ts build
```

To use a different profile:

```bash
bun run src/cli.ts build --config manuals/acme/manual.config.mjs
```

## Build Outputs

After a successful build, you should expect:

- `screenshotsDir/*.png`
- `manifestFile`
- `captureReportFile`
- `typstSourceFile`
- `outputFile`

On failure, `capture-report.json` includes:

- `ok`
- `flowId`
- `step`
- `message`
- `cause`
- `failurePath`

That is usually enough to tell you exactly which flow broke and where.

## Using Runbook Against A Real App

The usual pattern is:

1. run the app locally in a deterministic mode
2. avoid live auth and unstable APIs where possible
3. point `baseUrl` at the local app
4. keep the manual profile separate from the app itself
5. capture the relevant UI region instead of the whole page whenever possible

If you build manuals against live production data, expect the results to be noisy and flaky.

## Troubleshooting

### `Required path is missing`

The config points at a file or directory that does not exist. Check:

- `chaptersDir`
- `flowsDir`
- `assetsDir`
- `templateFile`

### `No chapters were found` or `No flow files were found`

The configured directory is empty, or only contains helper files. Files like `_flow-helpers.mjs` do not count as flows.

### `Chapter is missing a level-one heading`

Every chapter needs to begin with a `#` heading.

### `Screenshot reference "..." does not exist in any flow`

A chapter references a screenshot ID that no flow declares. Either fix the chapter or add the screenshot to a flow.

### `Duplicate screenshot id detected`

Two flows declared the same screenshot ID. Screenshot IDs need to be unique across the whole manual.

### `Clip target not found` or `Annotation target not found`

A selector changed, or the flow never reached the UI state you expected. Prefer stable selectors and make sure the flow has actually reached the correct screen before capture.

### `Typst compile failed`

Usually this means either:

- `typst` is not on `PATH`
- a referenced asset path is wrong

### Navigation to `"/"` fails

Your flow used a relative URL but `baseUrl` is missing or invalid.

### Screenshots look noisy or over-annotated

Usually the fix is one of:

- crop more tightly with `clipTo`
- move extra explanation into chapter prose
- reduce the number of callouts
- review [docs/SCREENSHOT_STYLE_GUIDE.md](docs/SCREENSHOT_STYLE_GUIDE.md)

## Recommended Workflow

If you are authoring a new manual, this is a sensible order:

1. create a config profile
2. add numbered chapter files
3. write one flow per workflow area
4. run `check` until the structure is valid
5. run `capture` until the screenshots look right
6. run `build` and review the PDF, not just the PNGs
7. commit the sources and treat the PDF as reproducible build output

That is the intended way to work with Runbook.
