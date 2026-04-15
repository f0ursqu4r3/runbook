import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadChapters } from "../src/build/parse.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function makeChaptersDir(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "runbook-parse-"));
  tempRoots.push(root);
  for (const [name, body] of Object.entries(files)) {
    await writeFile(path.join(root, name), body, "utf8");
  }
  return root;
}

test("extracts heading title and falls back to filename", async () => {
  const dir = await makeChaptersDir({
    "01-intro.md": "# Welcome\n\nText.",
    "02-no-title.md": "Some prose without a heading.\n"
  });

  const chapters = await loadChapters(dir);

  expect(chapters).toHaveLength(2);
  expect(chapters[0].title).toBe("Welcome");
  expect(chapters[1].title).toBe("02-no-title");
});

test("collects screenshot references with optional captions and width", async () => {
  const dir = await makeChaptersDir({
    "ch.md": [
      "# Chapter",
      "",
      "![[screenshot:dashboard-empty]]",
      "",
      "Inline ![[screenshot:settings-page width=\"68%\" caption=\"The settings page\"]] mid-paragraph."
    ].join("\n")
  });

  const [chapter] = await loadChapters(dir);

  expect(chapter.screenshotRefs).toEqual([
    { id: "dashboard-empty", caption: undefined, widthPercent: undefined },
    { id: "settings-page", caption: "The settings page", widthPercent: 68 }
  ]);
});

test("ignores non-markdown files", async () => {
  const dir = await makeChaptersDir({
    "ch.md": "# A",
    "notes.txt": "ignore me"
  });

  const chapters = await loadChapters(dir);
  expect(chapters).toHaveLength(1);
});
