# Runbook For AI Agents

This document is the agent-facing operating guide for Runbook. Use it when an LLM agent needs to create, validate, capture, build, debug, or localize a manual with minimal human back-and-forth.

Runbook builds product manuals from:

- Markdown chapters
- Playwright-backed screenshot flows
- optional static asset screenshots under `assets/screenshots`
- a Typst template
- one `manual.config.mjs` profile tying those inputs together

The important product rule is: a manual is only valid when the documented screenshots can be resolved from executable flows or checked-in asset screenshots. Broken references, duplicate screenshot IDs, or failed flows should stop the build.

## Command Style For Agents

Prefer `--json` for all automation. It suppresses progress output and emits one JSON object on stdout.

Examples:

```bash
runbook init manuals/acme --json
runbook doctor --config manuals/acme/manual.config.mjs --json
runbook check --config manuals/acme/manual.config.mjs --json
runbook capture --config manuals/acme/manual.config.mjs --json
runbook build --config manuals/acme/manual.config.mjs --json
```

Inside this repo, the equivalent scripts are:

```bash
bun run src/cli.ts init manuals/acme --json
bun run src/cli.ts doctor --config manuals/acme/manual.config.mjs --json
bun run src/cli.ts check --config manuals/acme/manual.config.mjs --json
bun run src/cli.ts capture --config manuals/acme/manual.config.mjs --json
bun run src/cli.ts build --config manuals/acme/manual.config.mjs --json
```

Supported commands:

- `init [target]`: scaffold a starter profile
- `doctor`: preflight local dependencies and manual structure
- `check`: validate config, chapters, flows, asset screenshots, and screenshot references
- `capture`: run flows and write screenshots plus manifest/report artifacts
- `build`: run validation, capture, Typst source generation, and PDF compilation
- `dev`: alias for build with a lightweight dev log message
- `help`: show command metadata

Supported flags:

- `--config <path>`: manual profile config path, default `manual/manual.config.mjs`
- `--force`: allow `init` to write into a non-empty target directory
- `--json`: emit machine-readable JSON
- `--no-progress`: disable progress bars in human-readable mode
- `-h`, `--help`: show usage

## JSON Contract

Success shape:

```json
{
  "ok": true,
  "command": "check",
  "result": {
    "configPath": "manual/manual.config.mjs",
    "chapters": 3,
    "flows": 3,
    "assetScreenshots": 1,
    "screenshotReferences": 4
  }
}
```

Failure shape:

```json
{
  "ok": false,
  "command": "doctor",
  "error": {
    "name": "CommandResultError",
    "message": "Doctor found 1 issue",
    "details": {
      "configPath": "manual/manual.config.mjs",
      "ok": false,
      "checks": [
        {
          "label": "Typst",
          "ok": false,
          "detail": "spawn typst ENOENT",
          "fix": "Install Typst and ensure `typst --version` works."
        }
      ]
    }
  }
}
```

Rules for agents:

- A non-zero process exit code is failure even when JSON is printed.
- On `doctor` failure, `error.details.checks` is the canonical structured diagnostic payload.
- `capture` and `build` write artifacts to disk in JSON mode exactly as they do in human mode.
- Preserve and report important returned paths, especially `configPath`, `manifestFile`, `reportFile`, `typstSourceFile`, and `outputFile`.

## Recommended Agent Workflow

For a new manual profile:

1. Run `init <target> --json`.
2. Inspect the created profile and edit `manual.config.mjs`, chapters, flows, and template as needed.
3. Run `doctor --config <config> --json`.
4. Run `check --config <config> --json`.
5. Run `capture --config <config> --json` if screenshot debugging is needed.
6. Run `build --config <config> --json` for the final PDF.
7. Report the `outputFile`, `typstSourceFile`, `manifestFile`, and `reportFile`.

For an existing manual profile:

1. Locate the profile config. Default is `manual/manual.config.mjs`.
2. Read the config before editing files; it defines the actual source and artifact paths.
3. Make focused edits to chapters, flows, assets, or template.
4. Run `check --json` after structural edits.
5. Run `build --json` after flow, screenshot, template, or release-output edits.

Use `doctor --json` when environment problems are possible, such as missing Typst, missing Chromium, absent directories, or confusing validation failures.

## High-Value Result Fields

- `init`: `targetDir`, `configPath`, `outputDir`, `createdPaths`
- `doctor`: `ok`, `checks`
- `check`: `chapters`, `flows`, `assetScreenshots`, `screenshotReferences`
- `capture`: `flows`, `screenshots`, `manifestFile`, `reportFile`, `generatedAt`
- `build`: `chapters`, `flows`, `screenshots`, `outputFile`, `typstSourceFile`, `manifestFile`, `reportFile`
- `help`: `commands`, `defaultConfigPath`

## Expected Manual Shape

A typical profile looks like:

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
    screenshots/
    logo.svg
  template/
    manual.typ
  manual.config.mjs
```

Important conventions:

- Chapters are loaded in filename order. Prefer numbered filenames.
- Flows are loaded in filename order.
- Flow files currently need `.mjs`.
- Flow files starting with `_` are ignored by discovery.
- Asset screenshots are discovered from `assets/screenshots`.
- Screenshot IDs are global across the whole manual and must be unique.

## Config Essentials

The config is a JavaScript module exporting one object:

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
  labels: {
    contentsTitle: "Contents",
    versionLabel: "Version",
    generatedLabel: "Generated"
  },
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

Field guidance:

- `baseUrl` becomes Playwright's `baseURL`.
- `locale` and `timezone` are applied to the Playwright browser context and exposed to flows.
- `labels` localizes generated PDF chrome, including table-of-contents and cover labels.
- `paths.logoFile` is optional; if omitted, Runbook uses `assetsDir/logo.svg`.
- Path fields support `{version}` and `{locale}` interpolation, for example `outputFile: "dist/acme-{version}-{locale}.pdf"`.

## Markdown Authoring

Chapters are Markdown files in `chaptersDir`.

Rules:

- Each chapter must be a `.md` file.
- Each chapter must start with a level-one heading such as `# Introduction`.
- Supported rendering is intentionally narrow: headings, paragraphs, flat `-` lists, and screenshot directives.
- Do not assume tables, fenced code blocks, or blockquotes render correctly.

Screenshot directive syntax:

```md
![[screenshot:login-screen caption="Users start from a stable sign-in screen."]]
```

Optional width:

```md
![[screenshot:sidebar width="68%" caption="Treat the sidebar as the operator's stable home base."]]
```

Directive rules:

- Screenshot IDs must match `[a-z0-9-]+`.
- `caption` is optional.
- `width` is optional and accepts integer percentages from `10%` to `100%`.
- Every referenced screenshot ID must be declared by a flow or provided by an asset screenshot.

## Flow Authoring

Flows define how screenshots are produced. A flow exports metadata and an async function.

Typical flow shape:

```js
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow(
  {
    id: "login",
    screenshots: ["login-screen"]
  },
  async (flow) => {
    await flow.step("Open login", async () => {
      await flow.page.goto("/");
    });

    await flow.capture("login-screen", (ui) => [
      ui.focus("[data-testid='login-card']", { tone: "accent" }),
      ui.callout("[data-testid='submit']", {
        title: "Sign In",
        text: "Use the seeded account to enter the workspace.",
        side: "bottom",
        tone: "neutral"
      })
    ]);
  }
);
```

Flow guidance:

- Every ID in `screenshots` must be captured exactly once.
- `flow.capture(id, annotations, options)` writes the screenshot and records it in the manifest.
- `flow.step(name, fn)` gives failures useful step context.
- `flow.locale` and `flow.timezone` are available when a flow needs locale-aware app setup.
- Prefer deterministic fixtures, seeded data, and stable selectors such as `data-testid`.
- Avoid live production data unless the user explicitly wants noisy, environment-dependent output.

Common annotation helpers exposed by the starter helper:

- `ui.focus(targetOrTargets, options)`
- `ui.box(targetOrTargets, options)`
- `ui.step(target, number, options)`
- `ui.callout(targetOrTargets, options)`
- `ui.arrow(targetOrTargets, options)`
- `ui.redact(target, options)`

Common capture options:

- `fullPage`
- `clipTo`
- `padding`
- `dim`
- `dimOpacity`

## Asset Screenshots

Use asset screenshots for images generated outside Runbook's Playwright flows, such as external charts, product mockups, or screenshots captured by another system.

Store them as:

```text
manual/assets/screenshots/<id>.png
```

Then reference the filename stem:

```md
![[screenshot:generated-chart width="80%" caption="Externally generated release chart."]]
```

Rules:

- Supported extensions are `.png`, `.jpg`, `.jpeg`, and `.webp`.
- Filename stems must match `[a-z0-9-]+`.
- Asset screenshot IDs must not duplicate flow screenshot IDs.
- Asset screenshots are not copied into `screenshotsDir`; the manifest points Typst at the checked-in asset path.

## Localized Manuals

Runbook treats localized manuals as separate profiles. Do not put multiple languages inline in one Markdown file.

Recommended structure:

```text
manuals/
  acme-en/
    manual.config.mjs
    chapters/
  acme-es/
    manual.config.mjs
    chapters/
```

Localized profile guidance:

- Keep screenshot IDs stable across locales.
- Translate Markdown prose and screenshot captions per profile.
- Set `locale` to the app locale Playwright should capture, for example `es-MX`.
- Set `labels` to localize PDF chrome.
- Use `{locale}` in output paths when generating multiple artifacts.

Example localized fields:

```js
{
  title: "Manual de Acme",
  locale: "es-MX",
  labels: {
    contentsTitle: "Contenido",
    versionLabel: "Revision",
    generatedLabel: "Emitido"
  },
  paths: {
    outputFile: "dist/acme-{version}-{locale}.pdf"
  }
}
```

Generated Typst source defines these variables for custom templates:

- `runbook_locale`
- `runbook_label_contents`
- `runbook_label_version`
- `runbook_label_generated`

## Build Artifacts

After `capture`, expect:

- `screenshotsDir/*.png`
- `manifestFile`
- `captureReportFile`

After `build`, expect:

- captured screenshots
- `manifestFile`
- `captureReportFile`
- `typstSourceFile`
- `outputFile`

The generated PDF should be treated as build output, not the source of truth. Source of truth is the config, Markdown, flows, assets, and template.

## Troubleshooting Strategy

If setup fails:

1. Run `doctor --json`.
2. Read `error.details.checks`.
3. Apply the `fix` fields where present.
4. Re-run `doctor --json`, then `check --json`.

If references fail:

- Inspect chapter screenshot directives.
- Inspect flow `screenshots` metadata.
- Inspect files under `assets/screenshots`.
- Ensure IDs are lowercase kebab-case and globally unique.

If capture fails:

- Read `reportFile`.
- Look for the failing `flow` and `step`.
- Use the failure screenshot in `reportsDir` if present.
- Fix selectors, app setup, seeded data, or viewport assumptions.

If Typst/PDF build fails:

- Inspect `typstSourceFile`.
- Check custom template functions such as `runbook_cover`, `runbook_figure`, and `runbook_lead_in`.
- Ensure logo and asset paths resolve from the generated Typst source location.

## Agent Editing Rules

When modifying a manual:

- Read `manual.config.mjs` first; do not assume the default `manual/` paths.
- Prefer adding or editing Markdown for prose and flows for product evidence.
- Keep screenshot IDs stable unless all references and flow metadata are updated together.
- Run `check --json` after changing chapters, flows, asset screenshots, or config.
- Run `build --json` after changing flows, screenshots, templates, localization, or release metadata.
- Report exact artifact paths from the JSON result.
- Do not treat a successful `check` as proof that screenshots can be captured; only `capture` or `build` proves that.
