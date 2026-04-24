# Runbook

Runbook is a CLI tool for building product manuals from Markdown, scripted UI flows, and Typst templates.

You write the manual in Markdown. You capture screenshots with small Playwright flows. Runbook turns that into a PDF and fails the build when the documented UI no longer matches what the flows can actually capture.

If you want the full walkthrough, start with [docs/USAGE.md](/Users/la.kyle.dougan/git/eos/runbook/docs/USAGE.md). If you are calling the CLI from another tool or agent, use [docs/AI_USAGE.md](/Users/la.kyle.dougan/git/eos/runbook/docs/AI_USAGE.md).

## What’s Here

This repo already includes:

- the TypeScript CLI
- config loading and validation
- chapter and flow discovery
- deterministic Playwright capture against local fixtures
- screenshot annotations and redaction support
- manifest and failure-report generation
- Typst source generation and PDF compilation
- starter manual content, assets, and flows

## Quick Start

```bash
bun install
bunx playwright install chromium
bun run runbook:init
bun run runbook:doctor
bun run runbook:check
bun run runbook:capture
bun run runbook:build
```

You also need `typst` on your `PATH` if you want PDF builds to work locally.

## Main Commands

- `bun run runbook:init [target-dir]`
  Creates a starter manual profile with a config file, a chapter, a flow, a template, and a logo.
- `bun run runbook:doctor`
  Checks that your config, files, Typst install, and Playwright browser setup are all in place.
- `bun run runbook:check`
  Validates the manual structure without running capture.
- `bun run runbook:capture`
  Runs the flows and writes screenshots plus a manifest.
- `bun run runbook:build`
  Runs the full pipeline and produces the final PDF.
- `bun run dev`
  Runs the same build path through a lighter entrypoint.

If you want the full CLI help:

```bash
bun run runbook --help
```

If you want plain line-by-line output with no progress bars, add `--no-progress`.

If you are driving the tool from another program, prefer `--json`.

## Using Another Profile

By default, Runbook looks for `manual/manual.config.mjs`. If you want to work on a different profile, pass `--config`.

```bash
bun run src/cli.ts build --config manuals/acme/manual.config.mjs
```

To create a new profile outside the default `manual/` directory:

```bash
bun run runbook:init manuals/acme
bun run src/cli.ts doctor --config manuals/acme/manual.config.mjs
```

## Installing It As A CLI

If you want `runbook` available as a shell command outside this repo:

```bash
bun run build
npm link
```

Or use the shortcut:

```bash
bun run runbook:link
```

After that, `runbook --help` should work anywhere your global npm bin directory is on `PATH`.

To remove the link later:

```bash
npm unlink -g runbook
```

## How It Fits Together

Runbook expects a manual profile that looks roughly like this:

```text
manual/
  chapters/
  flows/
  assets/
  template/
  manual.config.mjs
```

The basic flow is simple:

- chapters in `manual/chapters` hold the written content
- flows in `manual/flows` define how screenshots are captured
- `manual.config.mjs` tells Runbook where everything lives and how the build should behave
- the Typst template controls the final PDF layout

Runtime-loaded project files currently use `.mjs`, which keeps things working both through Bun in development and through compiled Node output.

## Flow Authoring

Flow files are meant to stay small and readable. The helper in `manual/flows/_flow-helpers.mjs` gives you a nicer authoring surface through `defineFlow(...)`, `render(...)`, and `capture(...)`.

Example:

```js
import { defineFlow } from "./_flow-helpers.mjs";
import { loginScreenHtml } from "../fixtures/sample-app.mjs";

export default defineFlow(
  { id: "login", screenshots: ["login-screen"] },
  async (flow) => {
    await flow.render(loginScreenHtml(), "Render login screen");
    await flow.capture("login-screen", (ui) => [
      ui.focus("[data-testid='login-card']", { tone: "accent" }),
      ui.box("[data-testid='login-card']", { tone: "accent" }),
      ui.arrow("[data-testid='submit']", {
        title: "Sign In",
        text: "Continue the documented flow.",
        tone: "accent"
      })
    ]);
  }
);
```

The helper exposes `ui.focus`, `ui.box`, `ui.step`, `ui.callout`, `ui.arrow`, and `ui.redact`.

If you want the screenshots to look consistent, read [docs/SCREENSHOT_STYLE_GUIDE.md](/Users/la.kyle.dougan/git/eos/runbook/docs/SCREENSHOT_STYLE_GUIDE.md).

## Notes

- Path fields in the config support `{version}` interpolation. For example: `outputFile: "manual/dist/runbook-demo-{version}.pdf"`.
- The generated PDF should be treated as build output, not the source of truth.
- If a screenshot reference, selector, or flow breaks, the build should break too.

## Project Layout

```text
docs/
manual/
src/
dist/
```

The broader product direction is in [docs/BRIEF.md](/Users/la.kyle.dougan/git/eos/runbook/docs/BRIEF.md).

## CI

GitHub Actions runs:

- typechecking
- Bun tests
- Playwright Chromium capture
- Typst PDF compilation
- artifact upload for the generated manual
