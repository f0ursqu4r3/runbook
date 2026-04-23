import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { runInit } from "../src/commands/init.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "runbook-init-"));
  tempRoots.push(root);
  return root;
}

test("runInit scaffolds a starter manual", async () => {
  const root = await makeTempRoot();
  const target = path.join(root, "acme-manual");

  await runInit({ targetDir: target });

  const config = await readFile(path.join(target, "manual.config.mjs"), "utf8");
  const chapter = await readFile(path.join(target, "chapters", "01-introduction.md"), "utf8");
  const flow = await readFile(path.join(target, "flows", "welcome.flow.mjs"), "utf8");

  expect(config).toContain('productName: "Acme Manual"');
  expect(config).toContain('outputDir: "dist/acme-manual"');
  expect(chapter).toContain("![[screenshot:welcome-screen");
  expect(flow).toContain('screenshots: ["welcome-screen"]');
});

test("runInit refuses non-empty directories without force", async () => {
  const root = await makeTempRoot();
  const target = path.join(root, "manual");

  await runInit({ targetDir: target });

  await expect(runInit({ targetDir: target })).rejects.toThrow(/Refusing to scaffold/);
});
