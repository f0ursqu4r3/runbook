import type { Page } from "playwright";

import type { Annotation, AnnotateOptions } from "../shared/types.js";
import { TONES } from "./annotate-themes.js";
import { overlayScript } from "./overlay-script.js";

export async function clearAnnotations(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.getElementById("__runbook_overlay__")?.remove();
  });
}

export async function applyAnnotations(
  page: Page,
  annotations: Annotation[],
  options: AnnotateOptions = {}
): Promise<void> {
  await clearAnnotations(page);
  await page.evaluate(overlayScript, {
    items: annotations,
    tones: TONES,
    dim: options.dim ?? false,
    dimOpacity: options.dimOpacity ?? 0.55
  });
}
