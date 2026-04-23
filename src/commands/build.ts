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
import { log, startProgress } from "../shared/logging.js";

export type BuildResult = {
  configPath: string;
  chapters: number;
  flows: number;
  screenshots: number;
  outputFile: string;
  typstSourceFile: string;
  manifestFile: string;
  reportFile: string;
};

export async function runBuild(configPath?: string): Promise<BuildResult> {
  const progress = startProgress("Build", 1, "Loading config");
  try {
    const config = await loadConfig(configPath);
    await validateProjectScaffold(config);
    progress.advance("Discovering manual");

    const chapters = await loadChapters(config.paths.chaptersDir);
    const flows = await discoverFlows(config.paths.flowsDir);
    const totalScreenshots = flows.reduce((count, flow) => count + flow.screenshots.length, 0);
    const totalSteps = 5 + totalScreenshots + chapters.length * 2;
    progress.setTotal(totalSteps, `Validating ${chapters.length} chapters`);

    for (let index = 0; index < chapters.length; index += 1) {
      validateChapters([chapters[index]]);
      progress.advance(`Validated chapter ${index + 1}/${chapters.length}: ${chapters[index].title}`);
    }

    validateFlows(flows);
    validateScreenshotReferences(chapters, flows);
    progress.advance(`Validated ${flows.length} flows`);
    progress.advance(`Resolved screenshot references`);

    const manifest = await runCapture(config, flows, {
      onFlowStart: (flow, started, total) => {
        progress.set(3 + chapters.length, `Starting flow ${started}/${total}: ${flow.id}`);
      },
      onScreenshotCaptured: (flow, screenshotId, completed, total) => {
        progress.set(
          3 + chapters.length + completed,
          `Captured ${completed}/${total}: ${flow.id}/${screenshotId}`
        );
      },
      onFlowComplete: (flow, completed, total) => {
        progress.set(
          3 + chapters.length + totalScreenshots,
          `Completed flow ${completed}/${total}: ${flow.id}`
        );
      }
    });
    resolveScreenshotUsage(chapters, manifest);

    const summary = await emitPdfArtifact(config, chapters, manifest, {
      onChapterRendered: (chapter, completed, total) => {
        progress.set(
          3 + chapters.length + totalScreenshots + completed,
          `Rendered chapter ${completed}/${total}: ${chapter.title}`
        );
      },
      onStage: (stage) => {
        if (stage === "template") {
          progress.set(
            3 + chapters.length + totalScreenshots,
            "Loading Typst template"
          );
        }
        if (stage === "write-source") {
          progress.set(4 + totalScreenshots + chapters.length * 2, "Writing Typst source");
        }
        if (stage === "compile-pdf") {
          progress.set(5 + totalScreenshots + chapters.length * 2, "Compiling PDF");
        }
      }
    });
    progress.finish("Complete");
    log.info(
      `Build complete: ${summary.chapters} chapters, ${summary.flows} flows, ${summary.screenshots} screenshots -> ${summary.outputFile}`
    );

    return {
      configPath: configPath ?? "manual/manual.config.mjs",
      chapters: summary.chapters,
      flows: summary.flows,
      screenshots: summary.screenshots,
      outputFile: summary.outputFile,
      typstSourceFile: config.paths.typstSourceFile,
      manifestFile: config.paths.manifestFile,
      reportFile: config.paths.captureReportFile
    };
  } catch (error) {
    progress.fail("Failed");
    throw error;
  }
}
