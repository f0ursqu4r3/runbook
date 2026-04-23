import { loadConfig } from "../config.js";
import { validateFlows, validateProjectScaffold } from "../build/validate.js";
import { discoverFlows, runCapture } from "../capture/runner.js";
import { log, startProgress } from "../shared/logging.js";

export type CaptureCommandResult = {
  configPath: string;
  flows: number;
  screenshots: number;
  manifestFile: string;
  reportFile: string;
  generatedAt: string;
};

export async function runCaptureCommand(configPath?: string): Promise<CaptureCommandResult> {
  const config = await loadConfig(configPath);
  await validateProjectScaffold(config);

  const flows = await discoverFlows(config.paths.flowsDir);
  validateFlows(flows);
  const totalScreenshots = flows.reduce((count, flow) => count + flow.screenshots.length, 0);
  const progress = startProgress(
    "Capture",
    Math.max(3, totalScreenshots + 2),
    "Preparing capture"
  );

  try {
    progress.advance(`Loaded ${flows.length} flows`);
    const manifest = await runCapture(config, flows, {
      onFlowStart: (flow, started, total) => {
        progress.set(1, `Starting flow ${started}/${total}: ${flow.id}`);
      },
      onScreenshotCaptured: (flow, screenshotId, completed, total) => {
        progress.set(1 + completed, `Captured ${completed}/${total}: ${flow.id}/${screenshotId}`);
      },
      onFlowComplete: (flow, completed, total) => {
        progress.set(1 + totalScreenshots, `Completed flow ${completed}/${total}: ${flow.id}`);
      }
    });
    progress.set(2 + totalScreenshots, "Writing manifest");
    progress.finish("Complete");
    log.info(
      `Capture complete: ${manifest.entries.length} screenshots recorded in ${config.paths.manifestFile}`
    );

    return {
      configPath: configPath ?? "manual/manual.config.mjs",
      flows: flows.length,
      screenshots: manifest.entries.length,
      manifestFile: config.paths.manifestFile,
      reportFile: config.paths.captureReportFile,
      generatedAt: manifest.generatedAt
    };
  } catch (error) {
    progress.fail("Failed");
    throw error;
  }
}
