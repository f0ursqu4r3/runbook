# Runbook

Runbook is a CLI-first system for executable product manuals. It turns authored Markdown, scripted UI flows, and branded Typst templates into a single build pipeline.

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
bun run runbook:check
bun run runbook:capture
bun run runbook:build
```

For local PDF builds, `typst` must also be available on your `PATH`.

## Commands

- `bun run runbook:check` validates project structure, chapters, and screenshot references.
- `bun run runbook:capture` runs the Playwright flows and emits real screenshot artifacts plus a manifest.
- `bun run runbook:build` validates the manual, captures screenshots, generates Typst, and compiles the final PDF.
- `bun run dev` runs the same build in a lightweight dev loop entrypoint.
- `bun test` runs repository tests, including the capture failure-path test that asserts report output.

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
