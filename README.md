# Runbook

Runbook is a CLI-first system for executable product manuals. It turns authored Markdown, scripted UI flows, and branded Typst templates into a single build pipeline.

The main operator guide is [docs/USAGE.md](/Users/la.kyle.dougan/git/eos/runbook/docs/USAGE.md).
Agent-facing JSON CLI guidance lives in [docs/AI_USAGE.md](/Users/la.kyle.dougan/git/eos/runbook/docs/AI_USAGE.md).

## Current Status

This repository now includes:

- TypeScript CLI entrypoints
- config loading
- chapter and flow discovery
- deterministic Playwright capture against local sample fixtures
- annotation overlays and redaction support
- screenshot manifest and capture failure reporting
- Typst source generation and PDF compilation
- sample manual content, assets, and flows

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

For local PDF builds, `typst` must also be available on your `PATH`.

## Commands

- `bun run runbook:check` validates project structure, chapters, and screenshot references.
- `bun run runbook:doctor` runs a preflight check for config validity, required paths, Typst, and Playwright Chromium.
- `bun run runbook:init [target-dir]` scaffolds a starter manual profile with a config, chapter, flow, template, and logo.
- `bun run runbook:capture` runs the Playwright flows and emits real screenshot artifacts plus a manifest.
- `bun run runbook:build` validates the manual, captures screenshots, generates Typst, and compiles the final PDF.
- `bun run runbook:sample:check` validates the bundled sample manual profile.
- `bun run runbook:sample:doctor` runs the same preflight checks for the Sample profile.
- `bun run runbook:sample:capture` captures the sample screenshots into `dist/sample/`.
- `bun run runbook:sample:build` builds the sample PDF into `dist/sample/manual.pdf`.
- `bun run dev` runs the same build in a lightweight dev loop entrypoint.
- `bun test` runs repository tests, including the capture failure-path test that asserts report output.

You can also point the CLI at any compatible manual profile explicitly:

```bash
bun run src/cli.ts build --config manual/sample/manual.config.mjs
```

Use `bun run runbook --help` to see the full command summary and the recommended operator flow.
Agents and automation should prefer `runbook ... --json` for a stable machine-readable interface.
Pass `--no-progress` if you want plain log output without progress bars.
Path fields in the config also support `{version}` interpolation, for example `outputFile: "manual/dist/sample-ui-manual-demo-{version}.pdf"`.

To start a new profile outside the default `manual/` directory:

```bash
bun run runbook:init manuals/acme
bun run src/cli.ts doctor --config manuals/acme/manual.config.mjs
```

## Install As A CLI

The repository can also be installed as a local system CLI command.

Build and link it:

```bash
bun run build
npm link
```

Or use the convenience script:

```bash
bun run runbook:link
```

After that, `runbook --help` should work from any shell session that can see your global npm bin directory.

To remove the link later:

```bash
npm unlink -g runbook
```

Runtime-loaded project files currently use `.mjs` so the scaffold works both through Bun in development and plain Node after TypeScript compilation.

Flow authoring is centered on `manual/flows/_flow-helpers.mjs`, which provides `defineFlow(...)` plus small helpers like `render(...)` and `capture(...)` so flow files stay declarative.

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

The helper exposes `ui.focus`, `ui.box`, `ui.step`, `ui.callout`, `ui.arrow`, and `ui.redact`. Those map to a more polished visual system with glow treatments, glass panels, curved connectors, and richer callout cards intended for modern release-quality documentation.

Grouped multi-target annotations are supported by passing an array of selectors to `ui.box`, `ui.focus`, `ui.callout`, or `ui.arrow`.

See [docs/SCREENSHOT_STYLE_GUIDE.md](/Users/la.kyle.dougan/git/eos/runbook/docs/SCREENSHOT_STYLE_GUIDE.md) for the annotation tone and composition rules used by the sample manual.

## Sample Example

This repository includes an example manual profile for the Sample App app under [manual/sample](/Users/la.kyle.dougan/git/eos/runbook/manual/sample).

To build it against the real local app:

```bash
cd /Users/la.kyle.dougan/git/eos/sample-ui/fe
VITE_E2E=true bun run dev -- --port 51173
```

In a second terminal:

```bash
cd /Users/la.kyle.dougan/git/eos/runbook
bun run runbook:sample:build
```

The generated screenshots, manifest, report, Typst source, and PDF will be written to `dist/sample/`.

## Project Layout

```text
docs/
manual/
src/
dist/
```

See [docs/BRIEF.md](/Users/la.kyle.dougan/git/eos/runbook/docs/BRIEF.md) for the full product direction.

## CI

GitHub Actions runs:

- typechecking
- Bun tests
- Playwright Chromium capture
- Typst PDF compilation
- artifact upload for the generated manual
