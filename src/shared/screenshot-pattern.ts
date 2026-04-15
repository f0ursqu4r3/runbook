export const SCREENSHOT_PATTERN_SOURCE =
  "!\\[\\[screenshot:([a-z0-9-]+)((?:\\s+[a-z]+=\"[^\"]+\")*)\\]\\]";

type ScreenshotAttributes = {
  caption?: string;
  widthPercent?: number;
};

export function createScreenshotPattern(flags = "gi"): RegExp {
  return new RegExp(SCREENSHOT_PATTERN_SOURCE, flags);
}

export type ScreenshotMatch = {
  id: string;
  caption?: string;
  widthPercent?: number;
};

function parseScreenshotAttributes(source = ""): ScreenshotAttributes {
  const attrs: ScreenshotAttributes = {};

  for (const match of source.matchAll(/([a-z]+)="([^"]+)"/g)) {
    const [, key, value] = match;

    if (key === "caption") {
      attrs.caption = value;
      continue;
    }

    if (key === "width" && /^\d{1,3}%$/.test(value)) {
      const widthPercent = Number.parseInt(value.slice(0, -1), 10);
      if (widthPercent >= 10 && widthPercent <= 100) {
        attrs.widthPercent = widthPercent;
      }
    }
  }

  return attrs;
}

export function matchScreenshot(line: string): ScreenshotMatch | null {
  const match = createScreenshotPattern("i").exec(line);
  if (!match) return null;
  return {
    id: match[1],
    ...parseScreenshotAttributes(match[2])
  };
}
