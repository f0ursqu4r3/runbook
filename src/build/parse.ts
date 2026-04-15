import path from "node:path";

import { listFiles, readText } from "../shared/fs.js";
import { createScreenshotPattern, matchScreenshot } from "../shared/screenshot-pattern.js";
import type { Chapter, ScreenshotReference } from "../shared/types.js";

function extractTitle(body: string, filePath: string): string {
  const firstHeading = body.match(/^#\s+(.+)$/m);
  return firstHeading?.[1]?.trim() ?? path.basename(filePath, path.extname(filePath));
}

function extractScreenshotRefs(body: string): ScreenshotReference[] {
  const refs: ScreenshotReference[] = [];
  for (const match of body.matchAll(createScreenshotPattern("gi"))) {
    const screenshot = matchScreenshot(match[0]);
    if (screenshot) {
      refs.push(screenshot);
    }
  }
  return refs;
}

export async function loadChapters(chaptersDir: string): Promise<Chapter[]> {
  const files = await listFiles(chaptersDir, ".md");
  const chapters: Chapter[] = [];

  for (const filePath of files) {
    const body = await readText(filePath);
    chapters.push({
      path: filePath,
      title: extractTitle(body, filePath),
      body,
      screenshotRefs: extractScreenshotRefs(body)
    });
  }

  return chapters;
}
