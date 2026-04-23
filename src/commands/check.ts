import { loadConfig } from "../config.js";
import { loadChapters } from "../build/parse.js";
import { discoverFlows } from "../capture/runner.js";
import {
  validateChapters,
  validateFlows,
  validateProjectScaffold,
  validateScreenshotReferences
} from "../build/validate.js";
import { log, startProgress } from "../shared/logging.js";

export type CheckResult = {
  configPath: string;
  chapters: number;
  flows: number;
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
    progress.advance("Validating manual");

    validateChapters(chapters);
    validateFlows(flows);
    validateScreenshotReferences(chapters, flows);
    progress.finish("Complete");

    log.info(
      `Check complete: ${chapters.length} chapters and ${flows.length} flows validated`
    );

    return {
      configPath: configPath ?? "manual/manual.config.mjs",
      chapters: chapters.length,
      flows: flows.length,
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
