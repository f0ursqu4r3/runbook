import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { renderTypstSource } from "../src/build/typst.js";
import { RunbookError } from "../src/shared/errors.js";
import type { CaptureManifest, Chapter, RunbookConfig } from "../src/shared/types.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function makeConfigFixture(): Promise<{ root: string; config: RunbookConfig }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "runbook-typst-"));
  tempRoots.push(root);
  await mkdir(path.join(root, "template"));
  await mkdir(path.join(root, "assets"));
  await mkdir(path.join(root, "dist"));
  await writeFile(path.join(root, "template", "manual.typ"), "// template head\n", "utf8");
  await writeFile(path.join(root, "assets", "logo.svg"), "<svg/>", "utf8");

  const config: RunbookConfig = {
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

  return { root, config };
}

function manifest(entries: CaptureManifest["entries"]): CaptureManifest {
  return { generatedAt: "2026-01-01T00:00:00Z", entries };
}

test("renders headings, paragraphs, and lists from markdown", async () => {
  const { config } = await makeConfigFixture();
  const chapters: Chapter[] = [
    {
      path: "x.md",
      title: "Intro",
      body: "# Intro\n\nFirst paragraph.\n\n## Sub\n\n- one\n- two\n",
      screenshotRefs: []
    }
  ];

  const source = await renderTypstSource(config, chapters, manifest([]));

  expect(source).toContain("= Intro");
  expect(source).toContain("== Sub");
  expect(source).toContain("First paragraph.");
  expect(source).toContain("- one");
  expect(source).toContain("- two");
  expect(source).toContain("#runbook_cover(\"T\"");
});

test("renders screenshot blocks via runbook_figure with relative path", async () => {
  const { config } = await makeConfigFixture();
  const chapters: Chapter[] = [
    {
      path: "x.md",
      title: "X",
      body: "# X\n\n![[screenshot:hero caption=\"Hero shot\"]]\n",
      screenshotRefs: [{ id: "hero", caption: "Hero shot" }]
    }
  ];
  const m = manifest([
    { id: "hero", flowId: "f", path: path.join(config.paths.screenshotsDir, "hero.png") }
  ]);

  const source = await renderTypstSource(config, chapters, m);

  expect(source).toContain("#runbook_figure(\"shots/hero.png\"");
  expect(source).toContain("[Hero shot]");
});

test("escapes typst-special characters in text", async () => {
  const { config } = await makeConfigFixture();
  const chapters: Chapter[] = [
    {
      path: "x.md",
      title: "Y",
      body: "# Y\n\nUse the # button and the [bracket].\n",
      screenshotRefs: []
    }
  ];

  const source = await renderTypstSource(config, chapters, manifest([]));

  expect(source).toContain("\\#");
  expect(source).toContain("\\[");
  expect(source).toContain("\\]");
});

test("throws when a screenshot reference is missing from manifest", async () => {
  const { config } = await makeConfigFixture();
  const chapters: Chapter[] = [
    {
      path: "x.md",
      title: "Z",
      body: "# Z\n\n![[screenshot:missing]]\n",
      screenshotRefs: [{ id: "missing" }]
    }
  ];

  await expect(renderTypstSource(config, chapters, manifest([]))).rejects.toThrow(RunbookError);
});
