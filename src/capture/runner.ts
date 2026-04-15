import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { applyAnnotations, clearAnnotations } from "./annotate.js";
import { resetDir, writeText, listFiles } from "../shared/fs.js";
import { RunbookError } from "../shared/errors.js";
import type { CaptureManifest, FlowContext, FlowFile, RunbookConfig } from "../shared/types.js";

type FlowModule = {
  meta?: {
    id: string;
    screenshots: string[];
  };
  default:
    | ((ctx: FlowContext) => Promise<void>)
    | {
        meta: {
          id: string;
          screenshots: string[];
        };
        default: (ctx: FlowContext) => Promise<void>;
      };
};

async function loadFlow(flowPath: string): Promise<FlowFile> {
  const module = (await import(pathToFileURL(path.resolve(flowPath)).href)) as FlowModule;
  const exportedFlow =
    typeof module.default === "function"
      ? { meta: module.meta, run: module.default }
      : { meta: module.default?.meta, run: module.default?.default };

  if (
    !exportedFlow.meta?.id ||
    !Array.isArray(exportedFlow.meta?.screenshots) ||
    typeof exportedFlow.run !== "function"
  ) {
    throw new RunbookError(`Flow module is invalid: ${flowPath}`);
  }

  return {
    path: flowPath,
    id: exportedFlow.meta.id,
    screenshots: exportedFlow.meta.screenshots,
    run: exportedFlow.run
  };
}

export async function discoverFlows(flowsDir: string): Promise<FlowFile[]> {
  const files = await listFiles(flowsDir, ".mjs");
  const flows: FlowFile[] = [];

  for (const filePath of files) {
    if (path.basename(filePath).startsWith("_")) {
      continue;
    }
    flows.push(await loadFlow(filePath));
  }

  return flows;
}

export async function runCapture(config: RunbookConfig, flows: FlowFile[]): Promise<CaptureManifest> {
  await resetDir(config.paths.screenshotsDir);
  await resetDir(config.paths.reportsDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: config.viewport,
    locale: config.locale,
    timezoneId: config.timezone,
    colorScheme: "light"
  });
  const entries: CaptureManifest["entries"] = [];

  await context.addInitScript(() => {
    const fixedNow = 1767225600000;
    Date.now = () => fixedNow;
    Math.random = () => 0.123456789;
  });

  try {
    for (const flow of flows) {
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
      let currentStep = "initializing";

      const flowContext: FlowContext = {
        page,
        annotate: async (annotations) => {
          await applyAnnotations(page, annotations);
        },
        clearAnnotations: async () => {
          await clearAnnotations(page);
        },
        shot: async (id, options = {}) => {
          if (!flow.screenshots.includes(id)) {
            throw new RunbookError(`Flow ${flow.id} attempted undeclared screenshot id "${id}"`);
          }

          const screenshotPath = path.join(config.paths.screenshotsDir, `${id}.png`);
          await page.screenshot({
            path: screenshotPath,
            fullPage: options.fullPage ?? true,
            animations: "disabled"
          });

          entries.push({
            id,
            flowId: flow.id,
            path: screenshotPath,
            step: currentStep
          });
        },
        step: async (name, fn) => {
          currentStep = name;
          return fn();
        }
      };

      try {
        await flow.run(flowContext);
        const declared = [...flow.screenshots].sort().join("|");
        const captured = entries
          .filter((entry) => entry.flowId === flow.id)
          .map((entry) => entry.id)
          .sort()
          .join("|");
        if (declared !== captured) {
          throw new RunbookError(
            `Flow ${flow.id} declared screenshots [${flow.screenshots.join(", ")}] but captured [${entries
              .filter((entry) => entry.flowId === flow.id)
              .map((entry) => entry.id)
              .join(", ")}]`
          );
        }
      } catch (error) {
        const failurePath = path.join(config.paths.reportsDir, `${flow.id}-failure.png`);
        await page.screenshot({
          path: failurePath,
          fullPage: true,
          animations: "disabled"
        });
        await writeText(
          config.paths.captureReportFile,
          JSON.stringify(
            {
              ok: false,
              flowId: flow.id,
              step: currentStep,
              failurePath,
              message: error instanceof Error ? error.message : "Unknown flow failure"
            },
            null,
            2
          )
        );
        throw error;
      } finally {
        await page.close();
      }
    }

    const manifest: CaptureManifest = {
      generatedAt: new Date().toISOString(),
      entries
    };

    await writeText(config.paths.manifestFile, JSON.stringify(manifest, null, 2));
    await writeText(
      config.paths.captureReportFile,
      JSON.stringify(
        {
          ok: true,
          flows: flows.length,
          screenshots: entries.length
        },
        null,
        2
      )
    );

    return manifest;
  } finally {
    await context.close();
    await browser.close();
  }
}
