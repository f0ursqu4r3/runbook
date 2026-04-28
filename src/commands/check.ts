import { loadConfig } from "../config.js";
import { discoverAssetScreenshots, validateAssetScreenshotIds } from "../build/asset-screenshots.js";
import { loadChapters } from "../build/parse.js";
import { discoverFlows } from "../capture/runner.js";
import {
  validateChapters,
  validateFlows,
  validateProjectScaffold,
  validateScreenshotInventory,
  validateScreenshotReferences
} from "../build/validate.js";
import { log, startProgress } from "../shared/logging.js";

export type CheckResult = {
  configPath: string;
  chapters: number;
  flows: number;
  assetScreenshots: number;
  screenshotReferences: number;
};

export async function runCheck(configPath?: string): Promise<CheckResult> {
  const progress = startProgress("Check", 4, "Loading config");
  try {
    const config = await loadConfig(configPath);
    await validateProjectScaffold(config);
    progress.advance("Loading chapters and flows");

    const chapters = await loadChapters(config.paths.chaptersDir);
    const flows = await discoverFlows(config.paths.flowsDir);
    const assetScreenshots = await discoverAssetScreenshots(config);
    progress.advance("Validating manual");

    validateChapters(chapters);
    validateFlows(flows);
    validateAssetScreenshotIds(assetScreenshots);
    validateScreenshotInventory(flows, assetScreenshots);
    validateScreenshotReferences(chapters, flows, assetScreenshots);
    progress.finish("Complete");

    log.info(
      `Check complete: ${chapters.length} chapters, ${flows.length} flows, and ${assetScreenshots.length} asset screenshots validated`
    );

    return {
      configPath: configPath ?? "manual/manual.config.mjs",
      chapters: chapters.length,
      flows: flows.length,
      assetScreenshots: assetScreenshots.length,
      screenshotReferences: chapters.reduce(
        (count, chapter) => count + chapter.screenshotRefs.length,
        0
      )
    };
  } catch (error) {
    progress.fail("Failed");
    throw error;
  }
}
