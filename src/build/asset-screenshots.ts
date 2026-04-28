import { readdir } from "node:fs/promises";
import path from "node:path";

import { ValidationError } from "../shared/errors.js";
import type { AssetScreenshot, CaptureManifest, RunbookConfig } from "../shared/types.js";

const ASSET_SCREENSHOT_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const SCREENSHOT_ID_PATTERN = /^[a-z0-9-]+$/;

export function getAssetScreenshotsDir(config: RunbookConfig): string {
  return path.join(config.paths.assetsDir, "screenshots");
}

export async function discoverAssetScreenshots(config: RunbookConfig): Promise<AssetScreenshot[]> {
  const screenshotsDir = getAssetScreenshotsDir(config);

  let entries;
  try {
    entries = await readdir(screenshotsDir, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(screenshotsDir, entry.name))
    .filter((filePath) => ASSET_SCREENSHOT_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => ({
      id: path.basename(filePath, path.extname(filePath)),
      path: filePath
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function validateAssetScreenshotIds(assetScreenshots: AssetScreenshot[]): void {
  const seen = new Set<string>();

  for (const screenshot of assetScreenshots) {
    if (!SCREENSHOT_ID_PATTERN.test(screenshot.id)) {
      throw new ValidationError(
        `Asset screenshot filename must match [a-z0-9-]+: ${screenshot.path}`
      );
    }

    if (seen.has(screenshot.id)) {
      throw new ValidationError(`Duplicate asset screenshot id detected: ${screenshot.id}`);
    }
    seen.add(screenshot.id);
  }
}

export function createAssetManifestEntries(
  assetScreenshots: AssetScreenshot[]
): CaptureManifest["entries"] {
  return assetScreenshots.map((screenshot) => ({
    id: screenshot.id,
    source: "asset",
    path: screenshot.path
  }));
}
