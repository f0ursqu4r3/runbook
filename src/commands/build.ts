import { loadConfig } from "../config.js";
import { loadChapters } from "../build/parse.js";
import { resolveScreenshotUsage } from "../build/resolve.js";
import { emitPdfArtifact } from "../build/typst.js";
import {
  validateChapters,
  validateFlows,
  validateProjectScaffold,
  validateScreenshotReferences
} from "../build/validate.js";
import { discoverFlows, runCapture } from "../capture/runner.js";
import { log } from "../shared/logging.js";

export async function runBuild(): Promise<void> {
  const config = await loadConfig();
  await validateProjectScaffold(config);

  const chapters = await loadChapters(config.paths.chaptersDir);
  validateChapters(chapters);

  const flows = await discoverFlows(config.paths.flowsDir);
  validateFlows(flows);
  validateScreenshotReferences(chapters, flows);

  const manifest = await runCapture(config, flows);
  resolveScreenshotUsage(chapters, manifest);

  const summary = await emitPdfArtifact(config, chapters, manifest);
  log.info(
    `Build complete: ${summary.chapters} chapters, ${summary.flows} flows, ${summary.screenshots} screenshots -> ${summary.outputFile}`
  );
}
