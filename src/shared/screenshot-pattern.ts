export const SCREENSHOT_PATTERN_SOURCE =
  "!\\[\\[screenshot:([a-z0-9-]+)(?:\\s+caption=\"([^\"]+)\")?\\]\\]";

export function createScreenshotPattern(flags = "gi"): RegExp {
  return new RegExp(SCREENSHOT_PATTERN_SOURCE, flags);
}

export type ScreenshotMatch = {
  id: string;
  caption?: string;
};

export function matchScreenshot(line: string): ScreenshotMatch | null {
  const match = createScreenshotPattern("i").exec(line);
  if (!match) return null;
  return { id: match[1], caption: match[2] };
}
