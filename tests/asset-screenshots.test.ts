import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createAssetManifestEntries,
  discoverAssetScreenshots,
  validateAssetScreenshotIds
} from "../src/build/asset-screenshots.js";
import { ValidationError } from "../src/shared/errors.js";
import type { RunbookConfig } from "../src/shared/types.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function configFor(root: string): RunbookConfig {
  return {
    productName: "P",
    title: "T",
    version: "v1",
    baseUrl: "http://localhost",
    viewport: { width: 1, height: 1 },
    locale: "en",
    timezone: "UTC",
    theme: { primary: "#000", accent: "#000", muted: "#000" },
    paths: {
      chaptersDir: path.join(root, "chapters"),
      flowsDir: path.join(root, "flows"),
      assetsDir: path.join(root, "assets"),
      templateFile: path.join(root, "template", "manual.typ"),
      outputDir: path.join(root, "dist"),
      typstSourceFile: path.join(root, "dist", "manual.typ"),
      screenshotsDir: path.join(root, "dist", "shots"),
      reportsDir: path.join(root, "dist", "reports"),
      captureReportFile: path.join(root, "dist", "capture.json"),
      manifestFile: path.join(root, "dist", "manifest.json"),
      outputFile: path.join(root, "dist", "manual.pdf")
    }
  };
}

test("discovers asset screenshots from assets/screenshots", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "runbook-assets-"));
  tempRoots.push(root);
  const screenshotsDir = path.join(root, "assets", "screenshots");
  await mkdir(screenshotsDir, { recursive: true });
  await writeFile(path.join(screenshotsDir, "hero.png"), "");
  await writeFile(path.join(screenshotsDir, "details.webp"), "");
  await writeFile(path.join(screenshotsDir, "notes.txt"), "");

  const screenshots = await discoverAssetScreenshots(configFor(root));

  expect(screenshots.map((screenshot) => screenshot.id)).toEqual(["details", "hero"]);
});

test("missing asset screenshots directory is treated as empty", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "runbook-assets-"));
  tempRoots.push(root);

  await expect(discoverAssetScreenshots(configFor(root))).resolves.toEqual([]);
});

test("asset screenshot ids must match the screenshot directive pattern", () => {
  expect(() =>
    validateAssetScreenshotIds([
      { id: "Bad_Name", path: "manual/assets/screenshots/Bad_Name.png" }
    ])
  ).toThrow(ValidationError);
});

test("asset screenshots become manifest entries", () => {
  const entries = createAssetManifestEntries([
    { id: "generated-chart", path: "manual/assets/screenshots/generated-chart.png" }
  ]);

  expect(entries).toEqual([
    {
      id: "generated-chart",
      source: "asset",
      path: "manual/assets/screenshots/generated-chart.png"
    }
  ]);
});
