import path from "node:path";

import { listFiles, readText } from "../shared/fs.js";
import type { Chapter, ScreenshotReference } from "../shared/types.js";

const SCREENSHOT_PATTERN =
  /!\[\[screenshot:([a-z0-9-]+)(?:\s+caption="([^"]+)")?\]\]/gi;

function extractTitle(body: string, filePath: string): string {
  const firstHeading = body.match(/^#\s+(.+)$/m);
  return firstHeading?.[1]?.trim() ?? path.basename(filePath, path.extname(filePath));
}

function extractScreenshotRefs(body: string): ScreenshotReference[] {
  const refs: ScreenshotReference[] = [];
  for (const match of body.matchAll(SCREENSHOT_PATTERN)) {
    refs.push({
      id: match[1],
      caption: match[2]
    });
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
