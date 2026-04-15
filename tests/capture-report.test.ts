import { afterEach, expect, test } from "bun:test";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { runCapture } from "../src/capture/runner.js";
import type { FlowFile, RunbookConfig } from "../src/shared/types.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "runbook-test-"));
  tempRoots.push(root);
  return root;
}

function makeConfig(root: string): RunbookConfig {
  return {
    productName: "Runbook",
    title: "Runbook Test Manual",
    version: "test",
    baseUrl: "http://localhost:3000",
    viewport: { width: 1280, height: 800 },
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
      outputDir: path.join(root, "dist"),
      typstSourceFile: path.join(root, "dist", "manual.typ"),
      screenshotsDir: path.join(root, "dist", "screenshots"),
      reportsDir: path.join(root, "dist", "reports"),
      captureReportFile: path.join(root, "dist", "reports", "capture-report.json"),
      manifestFile: path.join(root, "dist", "screenshots", "manifest.json"),
      outputFile: path.join(root, "dist", "manual.pdf")
    }
  };
}

test("capture writes a failure report with flow and step context", async () => {
  const root = await makeTempRoot();
  const config = makeConfig(root);

  const brokenFlow: FlowFile = {
    path: "inline-test-flow",
    id: "broken-flow",
    screenshots: [],
    async run(ctx) {
      await ctx.step("Render broken fixture", async () => {
        await ctx.page.setContent("<main data-testid='root'>fixture</main>");
      });

      await ctx.annotate([
        { type: "box", target: "[data-testid='missing-target']" }
      ]);
    }
  };

  await expect(runCapture(config, [brokenFlow])).rejects.toThrow(
    "Annotation target not found"
  );

  const report = JSON.parse(await readFile(config.paths.captureReportFile, "utf8")) as {
    ok: boolean;
    flowId: string;
    step: string;
    failurePath: string;
    message: string;
  };

  expect(report.ok).toBe(false);
  expect(report.flowId).toBe("broken-flow");
  expect(report.step).toBe("Render broken fixture");
  expect(report.message).toContain("Annotation target not found");
  await access(report.failurePath);
});
