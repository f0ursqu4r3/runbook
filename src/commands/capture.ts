import { loadConfig } from "../config.js";
import { validateFlows, validateProjectScaffold } from "../build/validate.js";
import { discoverFlows, runCapture } from "../capture/runner.js";
import { log } from "../shared/logging.js";

export async function runCaptureCommand(): Promise<void> {
  const config = await loadConfig();
  await validateProjectScaffold(config);

  const flows = await discoverFlows(config.paths.flowsDir);
  validateFlows(flows);

  const manifest = await runCapture(config, flows);
  log.info(
    `Capture complete: ${manifest.entries.length} screenshots recorded in ${config.paths.manifestFile}`
  );
}
