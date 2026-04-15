import { loadConfig } from "../config.js";
import { loadChapters } from "../build/parse.js";
import { discoverFlows } from "../capture/runner.js";
import {
  validateChapters,
  validateFlows,
  validateProjectScaffold,
  validateScreenshotReferences
} from "../build/validate.js";
import { log } from "../shared/logging.js";

export async function runCheck(configPath?: string): Promise<void> {
  const config = await loadConfig(configPath);
  await validateProjectScaffold(config);

  const chapters = await loadChapters(config.paths.chaptersDir);
  const flows = await discoverFlows(config.paths.flowsDir);

  validateChapters(chapters);
  validateFlows(flows);
  validateScreenshotReferences(chapters, flows);

  log.info(
    `Check complete: ${chapters.length} chapters and ${flows.length} flows validated`
  );
}
