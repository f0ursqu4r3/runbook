import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { applyAnnotations, clearAnnotations } from "./annotate.js";
import { resetDir, writeText, listFiles } from "../shared/fs.js";
import { FlowStepError, RunbookError } from "../shared/errors.js";
import type {
  AssetScreenshot,
  CaptureManifest,
  FlowContext,
  FlowFile,
  RunbookConfig,
  ShotOptions
} from "../shared/types.js";

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

type RunCaptureOptions = {
  assetScreenshots?: AssetScreenshot[];
  onFlowStart?: (flow: FlowFile, started: number, total: number) => void;
  onScreenshotCaptured?: (
    flow: FlowFile,
    screenshotId: string,
    completed: number,
    total: number
  ) => void;
  onFlowComplete?: (flow: FlowFile, completed: number, total: number) => void;
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

async function runFlow(
  flow: FlowFile,
  config: RunbookConfig,
  browserContext: import("playwright").BrowserContext,
  entries: CaptureManifest["entries"],
  onScreenshotCaptured?: (flow: FlowFile, screenshotId: string) => void
): Promise<void> {
  const page = await browserContext.newPage();
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  let currentStep = "initializing";

  const wrap = async <T>(action: () => Promise<T>): Promise<T> => {
    try {
      return await action();
    } catch (error) {
      if (error instanceof FlowStepError) throw error;
      throw new FlowStepError(flow.id, currentStep, error);
    }
  };

  const flowContext: FlowContext = {
    page,
    locale: config.locale,
    timezone: config.timezone,
    annotate: (annotations, options) => wrap(() => applyAnnotations(page, annotations, options)),
    clearAnnotations: () => wrap(() => clearAnnotations(page)),
    shot: (id, options = {}) =>
      wrap(async () => {
        if (!flow.screenshots.includes(id)) {
          throw new RunbookError(`Flow ${flow.id} attempted undeclared screenshot id "${id}"`);
        }

        const screenshotPath = path.join(config.paths.screenshotsDir, `${id}.png`);
        const clip = await resolveClip(page, options);
        await page.screenshot({
          path: screenshotPath,
          fullPage: clip ? false : options.fullPage ?? true,
          clip: clip ?? undefined,
          animations: "disabled"
        });

        entries.push({
          id,
          source: "flow",
          flowId: flow.id,
          path: screenshotPath,
          step: currentStep
        });
        onScreenshotCaptured?.(flow, id);
      }),
    step: async (name, fn) => {
      currentStep = name;
      try {
        return await fn();
      } catch (error) {
        if (error instanceof FlowStepError) throw error;
        throw new FlowStepError(flow.id, name, error);
      }
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
    const cause =
      error instanceof FlowStepError && error.cause instanceof Error
        ? error.cause.message
        : undefined;
    await writeText(
      config.paths.captureReportFile,
      JSON.stringify(
        {
          ok: false,
          flowId: flow.id,
          step: currentStep,
          failurePath,
          message: error instanceof Error ? error.message : "Unknown flow failure",
          cause
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

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  const queue = items.slice();
  let firstError: unknown = null;

  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0 && firstError === null) {
      const next = queue.shift();
      if (next === undefined) return;
      try {
        await worker(next);
      } catch (error) {
        if (firstError === null) firstError = error;
      }
    }
  });

  await Promise.all(runners);
  if (firstError !== null) throw firstError;
}

export async function runCapture(
  config: RunbookConfig,
  flows: FlowFile[],
  options: RunCaptureOptions = {}
): Promise<CaptureManifest> {
  await resetDir(config.paths.screenshotsDir);
  await resetDir(config.paths.reportsDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: config.baseUrl,
    viewport: config.viewport,
    deviceScaleFactor: config.deviceScaleFactor ?? 2,
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

  const concurrency = Math.max(1, config.captureConcurrency ?? 4);
  let completedFlows = 0;
  let startedFlows = 0;
  let completedScreenshots = 0;
  const totalScreenshots = flows.reduce((count, flow) => count + flow.screenshots.length, 0);

  try {
    await runWithConcurrency(flows, concurrency, async (flow) => {
      startedFlows += 1;
      options.onFlowStart?.(flow, startedFlows, flows.length);
      await runFlow(flow, config, context, entries, (_flow, screenshotId) => {
        completedScreenshots += 1;
        options.onScreenshotCaptured?.(flow, screenshotId, completedScreenshots, totalScreenshots);
      });
      completedFlows += 1;
      options.onFlowComplete?.(flow, completedFlows, flows.length);
    });

    const manifest: CaptureManifest = {
      generatedAt: new Date().toISOString(),
      entries: [
        ...entries,
        ...(options.assetScreenshots ?? []).map((screenshot) => ({
          id: screenshot.id,
          source: "asset" as const,
          path: screenshot.path
        }))
      ]
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

async function resolveClip(
  page: FlowContext["page"],
  options: ShotOptions
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  if (!options.clipTo) {
    return null;
  }

  const selectors = Array.isArray(options.clipTo) ? options.clipTo : [options.clipTo];
  const padding =
    typeof options.padding === "number" || options.padding === undefined
      ? {
          top: options.padding ?? 24,
          right: options.padding ?? 24,
          bottom: options.padding ?? 24,
          left: options.padding ?? 24
        }
      : {
          top: options.padding.top ?? 24,
          right: options.padding.right ?? 24,
          bottom: options.padding.bottom ?? 24,
          left: options.padding.left ?? 24
        };

  const rect = await page.evaluate(
    ({ selectors, padding: pad }) => {
      const elements = selectors.map((selector) => document.querySelector(selector));
      if (elements.some((element) => !(element instanceof HTMLElement))) {
        const missing = selectors.find((selector, index) => !(elements[index] instanceof HTMLElement));
        throw new Error(`Clip target not found: ${missing}`);
      }

      const targetRects = elements.map((element) => (element as HTMLElement).getBoundingClientRect());
      let left = Math.min(...targetRects.map((item) => item.left)) - pad.left;
      let top = Math.min(...targetRects.map((item) => item.top)) - pad.top;
      let right = Math.max(...targetRects.map((item) => item.right)) + pad.right;
      let bottom = Math.max(...targetRects.map((item) => item.bottom)) + pad.bottom;

      const overlay = document.getElementById("__runbook_overlay__");
      if (overlay) {
        const overlayMargin = 32;
        const overlayElements: Element[] = [];
        for (const child of Array.from(overlay.children)) {
          if (child.getAttribute("data-runbook-dim") === "true") continue;
          if (child.tagName.toLowerCase() === "svg") {
            overlayElements.push(...Array.from(child.children).filter((c) => c.tagName.toLowerCase() !== "defs"));
          } else {
            overlayElements.push(child);
          }
        }
        for (const element of overlayElements) {
          const r = element.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          left = Math.min(left, r.left - overlayMargin);
          top = Math.min(top, r.top - overlayMargin);
          right = Math.max(right, r.right + overlayMargin);
          bottom = Math.max(bottom, r.bottom + overlayMargin);
        }
      }

      left = Math.max(0, left);
      top = Math.max(0, top);
      right = Math.min(window.innerWidth, right);
      bottom = Math.min(window.innerHeight, bottom);

      return {
        x: Math.floor(left),
        y: Math.floor(top),
        width: Math.ceil(right - left),
        height: Math.ceil(bottom - top)
      };
    },
    { selectors, padding }
  );

  if (rect.width <= 0 || rect.height <= 0) {
    throw new RunbookError(`Clip region for ${selectors.join(", ")} is invalid`);
  }

  return rect;
}
