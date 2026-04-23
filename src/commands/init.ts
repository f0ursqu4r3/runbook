import path from "node:path";
import { readdir } from "node:fs/promises";

import { ensureDir, writeText } from "../shared/fs.js";
import { RunbookError } from "../shared/errors.js";
import { log, startProgress } from "../shared/logging.js";

type InitOptions = {
  targetDir?: string;
  force?: boolean;
};

export type InitResult = {
  targetDir: string;
  configPath: string;
  outputDir: string;
  createdPaths: string[];
};

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function toTitleCase(input: string): string {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const entries = await readdir(dirPath);
    return entries.length === 0;
  } catch {
    return true;
  }
}

function buildConfigSource(targetDir: string, productName: string, title: string, outputDir: string): string {
  const prefix = toPosix(targetDir);
  return `const config = {
  productName: "${productName}",
  title: "${title}",
  version: "0.1.0",
  baseUrl: "http://localhost:3000",
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  timezone: "UTC",
  theme: {
    primary: "#0f172a",
    accent: "#d97706",
    muted: "#475569"
  },
  paths: {
    chaptersDir: "${prefix}/chapters",
    flowsDir: "${prefix}/flows",
    assetsDir: "${prefix}/assets",
    templateFile: "${prefix}/template/manual.typ",
    outputDir: "${outputDir}",
    typstSourceFile: "${outputDir}/manual.typ",
    screenshotsDir: "${outputDir}/screenshots",
    reportsDir: "${outputDir}/reports",
    captureReportFile: "${outputDir}/reports/capture-report.json",
    manifestFile: "${outputDir}/screenshots/manifest.json",
    outputFile: "${outputDir}/manual.pdf"
  }
};

export default config;
`;
}

function buildChapterSource(productName: string): string {
  return `# Introduction

${productName} manuals in Runbook are built from real captured behavior.

## First Screen

![[screenshot:welcome-screen caption="Replace this starter screen with your first real workflow."]]
`;
}

function buildFlowHelperSource(): string {
  return `export function defineFlow(meta, run) {
  const normalizeTarget = (targetOrTargets) =>
    Array.isArray(targetOrTargets)
      ? { target: targetOrTargets[0], targets: targetOrTargets }
      : { target: targetOrTargets };

  const ui = {
    focus(targetOrTargets, options = {}) {
      return { type: "focus", ...normalizeTarget(targetOrTargets), ...options };
    },
    box(targetOrTargets, options = {}) {
      return { type: "box", ...normalizeTarget(targetOrTargets), ...options };
    },
    step(target, number, options = {}) {
      return { type: "step", target, number, ...options };
    },
    callout(targetOrTargets, options = {}) {
      return { type: "label", ...normalizeTarget(targetOrTargets), ...options };
    },
    arrow(targetOrTargets, options = {}) {
      return { type: "arrow", ...normalizeTarget(targetOrTargets), ...options };
    },
    redact(target, options = {}) {
      return { type: "redact", target, ...options };
    }
  };

  return {
    meta,
    default: async (ctx) => {
      const authoringContext = {
        ...ctx,
        ui,
        async render(html, stepName = "Render fixture") {
          await ctx.step(stepName, async () => {
            await ctx.page.setContent(html, { waitUntil: "load" });
          });
        },
        async capture(id, annotations = [], options = {}) {
          const resolved =
            typeof annotations === "function" ? annotations(ui) : annotations;

          const { dim, dimOpacity, ...shotOptions } = options;

          if (resolved.length > 0) {
            await ctx.annotate(resolved, { dim, dimOpacity });
          } else {
            await ctx.clearAnnotations();
          }
          await ctx.shot(id, shotOptions);
        }
      };

      await run(authoringContext);
    }
  };
}
`;
}

function buildStarterFlowSource(): string {
  return `import { defineFlow } from "./_flow-helpers.mjs";

function welcomeHtml() {
  return \`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Starter Manual</title>
      <style>
        :root {
          color-scheme: light;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at top left, #fde68a 0%, rgba(253, 230, 138, 0) 32%),
            linear-gradient(135deg, #f8fafc 0%, #fff7ed 100%);
        }
        .card {
          width: 720px;
          border-radius: 28px;
          padding: 48px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 32px 80px rgba(15, 23, 42, 0.14);
          border: 1px solid rgba(148, 163, 184, 0.22);
        }
        .eyebrow {
          margin: 0 0 12px;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b45309;
        }
        h1 {
          margin: 0 0 12px;
          font-size: 44px;
          line-height: 1.05;
          color: #0f172a;
        }
        p {
          margin: 0;
          max-width: 44ch;
          font-size: 18px;
          line-height: 1.6;
          color: #475569;
        }
      </style>
    </head>
    <body>
      <main class="card" data-testid="welcome-card">
        <p class="eyebrow">Runbook Starter</p>
        <h1 data-testid="welcome-title">Document real product behavior</h1>
        <p data-testid="welcome-copy">
          Replace this fixture with your app, then start capturing the first workflow your operators actually use.
        </p>
      </main>
    </body>
  </html>\`;
}

export default defineFlow(
  {
    id: "welcome",
    screenshots: ["welcome-screen"]
  },
  async (flow) => {
    await flow.render(welcomeHtml(), "Render starter screen");
    await flow.capture("welcome-screen", (ui) => [
      ui.focus("[data-testid='welcome-card']", { tone: "accent" }),
      ui.arrow("[data-testid='welcome-title']", {
        title: "Start Here",
        text: "Replace this example with the first stable screen from your real app.",
        side: "bottom",
        tone: "accent"
      })
    ]);
  }
);
`;
}

function buildTemplateSource(): string {
  return `#let runbook_primary = rgb("#0f172a")
#let runbook_accent = rgb("#d97706")
#let runbook_muted = rgb("#475569")

#set page(
  paper: "us-letter",
  margin: (x: 0.9in, y: 0.75in),
  footer: context {
    let page-number = counter(page).display("1")
    align(center, text(size: 9pt, fill: runbook_muted)[#page-number])
  },
)

#set text(
  font: "New Computer Modern",
  size: 11pt,
  fill: runbook_primary,
)

#show heading.where(level: 1): it => block(above: 1.8em, below: 0.8em)[
  #text(20pt, weight: "bold", fill: runbook_primary)[#it.body]
]

#show heading.where(level: 2): it => block(above: 1.2em, below: 0.6em)[
  #text(14pt, weight: "semibold", fill: runbook_primary)[#it.body]
]

#let runbook_lead_in(body) = block(sticky: true)[
  #body
]

#let runbook_cover(title, version, generated_at, logo_path) = [
  #align(center)[
    #v(2.2cm)
    #image(logo_path, width: 2.8in)
    #v(0.8cm)
    #text(26pt, weight: "bold", fill: runbook_primary)[#title]
    #v(0.35cm)
    #text(11pt, fill: runbook_muted)[Version #version]
    #line(length: 2.8in, stroke: (paint: runbook_accent, thickness: 1.4pt))
    #v(0.25cm)
    #text(10pt, fill: runbook_muted)[Generated #generated_at]
  ]
]

#let runbook_figure(image_path, caption: none, width: 100%) = {
  align(center)[
    #block(width: width, above: 0.8em, below: 1.1em, breakable: false)[
      #image(image_path, width: 100%)
      #if caption != none [
        #v(0.35em)
        #text(size: 9pt, fill: runbook_muted)[#caption]
      ]
    ]
  ]
}
`;
}

function buildLogoSource(): string {
  return `<svg width="320" height="96" viewBox="0 0 320 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="80" height="80" rx="22" fill="#0F172A"/>
  <path d="M32 49.5L46.5 64L69 34" stroke="#F59E0B" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M116 31H188" stroke="#D97706" stroke-width="8" stroke-linecap="round"/>
  <path d="M116 49H244" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
  <path d="M116 67H220" stroke="#475569" stroke-width="8" stroke-linecap="round"/>
</svg>
`;
}

export async function runInit(options: InitOptions = {}): Promise<InitResult> {
  const targetDir = options.targetDir ? path.normalize(options.targetDir) : "manual";
  const absoluteTargetDir = path.resolve(targetDir);
  const dirName = path.basename(absoluteTargetDir);
  const isDefaultTarget = toPosix(targetDir) === "manual";
  const outputDir = isDefaultTarget ? "dist" : toPosix(path.join("dist", dirName));
  const productName = dirName === "manual" ? "Runbook Manual" : toTitleCase(dirName);
  const title = `${productName} Manual`;

  if (!(await isDirectoryEmpty(absoluteTargetDir)) && !options.force) {
    throw new RunbookError(
      `Refusing to scaffold into non-empty directory: ${absoluteTargetDir}. Re-run with --force to overwrite starter files.`
    );
  }
  const progress = startProgress("Init", 6, "Creating directories");
  try {
    await ensureDir(path.join(absoluteTargetDir, "chapters"));
    await ensureDir(path.join(absoluteTargetDir, "flows"));
    await ensureDir(path.join(absoluteTargetDir, "assets"));
    await ensureDir(path.join(absoluteTargetDir, "template"));

    const configPath = path.join(absoluteTargetDir, "manual.config.mjs");
    const createdPaths = [
      configPath,
      path.join(absoluteTargetDir, "chapters", "01-introduction.md"),
      path.join(absoluteTargetDir, "flows", "_flow-helpers.mjs"),
      path.join(absoluteTargetDir, "flows", "welcome.flow.mjs"),
      path.join(absoluteTargetDir, "template", "manual.typ"),
      path.join(absoluteTargetDir, "assets", "logo.svg")
    ];

    await writeText(configPath, buildConfigSource(targetDir, productName, title, outputDir));
    progress.advance("Writing chapter");
    await writeText(createdPaths[1], buildChapterSource(productName));
    progress.advance("Writing flow helper");
    await writeText(createdPaths[2], buildFlowHelperSource());
    progress.advance("Writing starter flow");
    await writeText(createdPaths[3], buildStarterFlowSource());
    progress.advance("Writing template");
    await writeText(createdPaths[4], buildTemplateSource());
    progress.advance("Writing assets");
    await writeText(createdPaths[5], buildLogoSource());
    progress.finish("Complete");

    log.info(`Scaffolded starter manual in ${absoluteTargetDir}`);
    log.info(`Config: ${path.join(toPosix(targetDir), "manual.config.mjs")}`);
    log.info(`Next: bun run runbook doctor --config ${path.join(toPosix(targetDir), "manual.config.mjs")}`);

    return {
      targetDir: absoluteTargetDir,
      configPath,
      outputDir,
      createdPaths
    };
  } catch (error) {
    progress.fail("Failed");
    throw error;
  }
}
