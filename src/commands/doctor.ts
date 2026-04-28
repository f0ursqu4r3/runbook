import { access } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { chromium } from "playwright";

import { discoverAssetScreenshots, validateAssetScreenshotIds } from "../build/asset-screenshots.js";
import { loadChapters } from "../build/parse.js";
import {
  validateChapters,
  validateFlows,
  validateScreenshotInventory,
  validateScreenshotReferences
} from "../build/validate.js";
import { loadConfig } from "../config.js";
import { discoverFlows } from "../capture/runner.js";
import { CommandResultError } from "../shared/errors.js";
import { log, startProgress } from "../shared/logging.js";
import type { AssetScreenshot, Chapter, FlowFile, RunbookConfig } from "../shared/types.js";

const execFileAsync = promisify(execFile);

export type DoctorCheck = {
  label: string;
  ok: boolean;
  detail: string;
  fix?: string;
};

export type DoctorResult = {
  configPath: string;
  ok: boolean;
  checks: DoctorCheck[];
};

async function checkExecutable(
  label: string,
  command: string,
  args: string[],
  fix: string
): Promise<DoctorCheck> {
  try {
    const result = await execFileAsync(command, args);
    const detail = result.stdout.trim() || result.stderr.trim() || "available";
    return { label, ok: true, detail };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, detail: message, fix };
  }
}

async function checkPath(label: string, targetPath: string, fix?: string): Promise<DoctorCheck> {
  try {
    await access(targetPath);
    return { label, ok: true, detail: path.resolve(targetPath) };
  } catch {
    return {
      label,
      ok: false,
      detail: path.resolve(targetPath),
      fix
    };
  }
}

async function checkPlaywrightBrowser(): Promise<DoctorCheck> {
  try {
    const executablePath = chromium.executablePath();
    await access(executablePath);
    return {
      label: "Playwright Chromium",
      ok: true,
      detail: executablePath
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      label: "Playwright Chromium",
      ok: false,
      detail: message,
      fix: "Run `bunx playwright install chromium`."
    };
  }
}

function logCheck(check: DoctorCheck): void {
  if (check.ok) {
    log.info(`${check.label}: ${check.detail}`);
    return;
  }

  log.warn(`${check.label}: ${check.detail}`);
  if (check.fix) {
    log.warn(`  fix: ${check.fix}`);
  }
}

export async function runDoctor(configPath?: string): Promise<DoctorResult> {
  const checks: DoctorCheck[] = [];
  const progress = startProgress("Doctor", 2, "Checking config path");

  const resolvedConfigPath = configPath ?? "manual/manual.config.mjs";
  checks.push(await checkPath("Config file", resolvedConfigPath, "Pass `--config <path>` or add the default config file."));
  progress.advance("Validating config");

  let config: RunbookConfig;
  try {
    config = await loadConfig(configPath);
    checks.push({
      label: "Config schema",
      ok: true,
      detail: `${config.productName} ${config.version} at ${config.baseUrl}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push({
      label: "Config schema",
      ok: false,
      detail: message,
      fix: "Fix the config file so it matches the documented schema."
    });

    log.info(`Runbook doctor for ${path.resolve(resolvedConfigPath)}`);
    for (const check of checks) {
      logCheck(check);
    }
    progress.fail("Failed");
    throw new CommandResultError("Doctor found configuration issues", {
      configPath: resolvedConfigPath,
      ok: false,
      checks
    } satisfies DoctorResult);
  }
  progress.advance("Validated config");
  const totalChecks = 12 + (config.paths.logoFile ? 1 : 0);
  progress.setTotal(totalChecks, "Checking dependencies");

  checks.push(await checkExecutable("Typst", "typst", ["--version"], "Install Typst and ensure `typst --version` works."));
  progress.advance("Checked Typst");
  checks.push(await checkPlaywrightBrowser());
  progress.advance("Checked Playwright");

  const projectPaths = [
    ["Chapters directory", config.paths.chaptersDir],
    ["Flows directory", config.paths.flowsDir],
    ["Assets directory", config.paths.assetsDir],
    ["Template file", config.paths.templateFile]
  ] as const;

  if (config.paths.logoFile) {
    checks.push(await checkPath("Logo file", config.paths.logoFile, "Update `paths.logoFile` or add the logo asset."));
    progress.advance("Checked logo path");
  }

  for (const [label, targetPath] of projectPaths) {
    checks.push(await checkPath(label, targetPath));
    progress.advance(`Checked ${label.toLowerCase()}`);
  }

  const pathStatus = new Map(checks.map((check) => [check.label, check.ok]));
  let chapters: Chapter[] | null = null;
  let flows: FlowFile[] | null = null;
  let assetScreenshots: AssetScreenshot[] = [];

  if (pathStatus.get("Chapters directory")) {
    try {
      chapters = await loadChapters(config.paths.chaptersDir);
      validateChapters(chapters);
      checks.push({
        label: "Chapters",
        ok: true,
        detail: `${chapters.length} chapter${chapters.length === 1 ? "" : "s"} discovered`
      });
      progress.advance(`Loaded ${chapters.length} chapters`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        label: "Chapters",
        ok: false,
        detail: message,
        fix: "Add at least one markdown chapter with a level-one heading."
      });
      progress.advance("Chapter discovery failed");
    }
  }

  if (pathStatus.get("Flows directory")) {
    try {
      flows = await discoverFlows(config.paths.flowsDir);
      validateFlows(flows);
      checks.push({
        label: "Flows",
        ok: true,
        detail: `${flows.length} flow${flows.length === 1 ? "" : "s"} discovered`
      });
      progress.advance(`Loaded ${flows.length} flows`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        label: "Flows",
        ok: false,
        detail: message,
        fix: "Add at least one valid `.flow.mjs` file with unique screenshot IDs."
      });
      progress.advance("Flow discovery failed");
    }
  }

  if (pathStatus.get("Assets directory")) {
    try {
      assetScreenshots = await discoverAssetScreenshots(config);
      validateAssetScreenshotIds(assetScreenshots);
      checks.push({
        label: "Asset screenshots",
        ok: true,
        detail: `${assetScreenshots.length} asset screenshot${assetScreenshots.length === 1 ? "" : "s"} discovered`
      });
      progress.advance(`Loaded ${assetScreenshots.length} asset screenshots`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        label: "Asset screenshots",
        ok: false,
        detail: message,
        fix: "Store generated screenshots as `assets/screenshots/<id>.png` with lowercase dash-separated IDs."
      });
      progress.advance("Asset screenshot discovery failed");
    }
  }

  if (chapters && flows) {
    try {
      validateScreenshotInventory(flows, assetScreenshots);
      validateScreenshotReferences(chapters, flows, assetScreenshots);
      checks.push({
        label: "Screenshot references",
        ok: true,
        detail: `${chapters.reduce((count, chapter) => count + chapter.screenshotRefs.length, 0)} references resolved`
      });
      progress.advance("Resolved screenshot references");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        label: "Screenshot references",
        ok: false,
        detail: message,
        fix: "Make sure every `![[screenshot:...]]` reference is declared by a flow or stored in `assets/screenshots`."
      });
      progress.advance("Screenshot reference check failed");
    }
  } else {
    progress.advance("Skipped screenshot reference check");
  }

  log.info(`Runbook doctor for ${path.resolve(resolvedConfigPath)}`);
  for (const check of checks) {
    logCheck(check);
  }

  const failures = checks.filter((check) => !check.ok);
  if (failures.length > 0) {
    progress.fail("Failed");
    throw new CommandResultError(
      `Doctor found ${failures.length} issue${failures.length === 1 ? "" : "s"}`,
      {
        configPath: resolvedConfigPath,
        ok: false,
        checks
      } satisfies DoctorResult
    );
  }

  log.info("Doctor complete: environment and manual profile look ready");
  progress.finish("Complete");

  return {
    configPath: resolvedConfigPath,
    ok: true,
    checks
  };
}
