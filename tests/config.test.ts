import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadConfig } from "../src/config.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "runbook-config-"));
  tempRoots.push(root);
  return root;
}

test("loadConfig expands {version} tokens in path fields", async () => {
  const root = await makeTempRoot();
  const configPath = path.join(root, "manual.config.mjs");

  await writeFile(
    configPath,
    `export default {
      productName: "Sample App",
      title: "Product Demo",
      version: "2.4.1-beta",
      baseUrl: "http://localhost:3000",
      viewport: { width: 1440, height: 900 },
      locale: "en-US",
      timezone: "UTC",
      theme: {
        primary: "#0f172a",
        accent: "#d97706",
        muted: "#475569"
      },
      paths: {
        chaptersDir: "manual/chapters",
        flowsDir: "manual/flows",
        assetsDir: "manual/assets",
        templateFile: "manual/template/manual.typ",
        outputDir: "manual/dist",
        typstSourceFile: "manual/dist/manual.typ",
        screenshotsDir: "manual/dist/screenshots",
        reportsDir: "manual/dist/reports",
        captureReportFile: "manual/dist/reports/capture-report.json",
        manifestFile: "manual/dist/screenshots/manifest.json",
        outputFile: "manual/dist/sample-ui-manual-demo-{version}.pdf"
      }
    };`,
    "utf8"
  );

  const config = await loadConfig(configPath);

  expect(config.paths.outputFile).toBe("manual/dist/sample-ui-manual-demo-2.4.1-beta.pdf");
});
