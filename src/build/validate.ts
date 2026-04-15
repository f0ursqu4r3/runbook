import { access } from "node:fs/promises";

import { ValidationError } from "../shared/errors.js";
import type { Chapter, FlowFile, RunbookConfig } from "../shared/types.js";

export async function validateProjectScaffold(config: RunbookConfig): Promise<void> {
  const requiredPaths = [
    config.paths.chaptersDir,
    config.paths.flowsDir,
    config.paths.assetsDir,
    config.paths.templateFile
  ];

  for (const requiredPath of requiredPaths) {
    try {
      await access(requiredPath);
    } catch {
      throw new ValidationError(`Required path is missing: ${requiredPath}`);
    }
  }
}

export function validateChapters(chapters: Chapter[]): void {
  if (chapters.length === 0) {
    throw new ValidationError("No chapters were found in manual/chapters");
  }

  for (const chapter of chapters) {
    if (!chapter.body.trim().startsWith("# ")) {
      throw new ValidationError(`Chapter is missing a level-one heading: ${chapter.path}`);
    }
  }
}

export function validateFlows(flows: FlowFile[]): void {
  if (flows.length === 0) {
    throw new ValidationError("No flow files were found in manual/flows");
  }

  const screenshotIds = new Set<string>();
  for (const flow of flows) {
    for (const screenshot of flow.screenshots) {
      if (screenshotIds.has(screenshot)) {
        throw new ValidationError(`Duplicate screenshot id detected: ${screenshot}`);
      }
      screenshotIds.add(screenshot);
    }
  }
}

export function validateScreenshotReferences(chapters: Chapter[], flows: FlowFile[]): void {
  const availableScreenshots = new Set(
    flows.flatMap((flow) => flow.screenshots)
  );

  for (const chapter of chapters) {
    for (const ref of chapter.screenshotRefs) {
      if (!availableScreenshots.has(ref.id)) {
        throw new ValidationError(
          `Screenshot reference "${ref.id}" in ${chapter.path} does not exist in any flow`
        );
      }
    }
  }
}
