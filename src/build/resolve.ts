import type { CaptureManifest, Chapter } from "../shared/types.js";
import { ValidationError } from "../shared/errors.js";

export function resolveScreenshotUsage(
  chapters: Chapter[],
  manifest: CaptureManifest
): void {
  const ids = new Set(manifest.entries.map((entry) => entry.id));

  for (const chapter of chapters) {
    for (const ref of chapter.screenshotRefs) {
      if (!ids.has(ref.id)) {
        throw new ValidationError(
          `Missing screenshot "${ref.id}" referenced in ${chapter.path}`
        );
      }
    }
  }
}
