import { expect, test } from "bun:test";

import {
  validateChapters,
  validateFlows,
  validateScreenshotInventory,
  validateScreenshotReferences
} from "../src/build/validate.js";
import { ValidationError } from "../src/shared/errors.js";
import type { AssetScreenshot, Chapter, FlowFile } from "../src/shared/types.js";

function chapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    path: "manual/chapters/ch.md",
    title: "Title",
    body: "# Title\n",
    screenshotRefs: [],
    ...overrides
  };
}

function flow(overrides: Partial<FlowFile> = {}): FlowFile {
  return {
    path: "manual/flows/f.mjs",
    id: "flow-a",
    screenshots: ["a"],
    run: async () => undefined,
    ...overrides
  };
}

function assetScreenshot(overrides: Partial<AssetScreenshot> = {}): AssetScreenshot {
  return {
    id: "asset-a",
    path: "manual/assets/screenshots/asset-a.png",
    ...overrides
  };
}

test("validateChapters rejects empty list", () => {
  expect(() => validateChapters([])).toThrow(ValidationError);
});

test("validateChapters requires level-one heading", () => {
  expect(() => validateChapters([chapter({ body: "no heading\n" })])).toThrow(/missing a level-one heading/);
});

test("validateChapters accepts well-formed chapters", () => {
  expect(() => validateChapters([chapter()])).not.toThrow();
});

test("validateFlows rejects empty list", () => {
  expect(() => validateFlows([])).toThrow(ValidationError);
});

test("validateFlows rejects duplicate screenshot ids across flows", () => {
  const flows = [
    flow({ id: "a", screenshots: ["shared"] }),
    flow({ id: "b", screenshots: ["shared"] })
  ];
  expect(() => validateFlows(flows)).toThrow(/Duplicate screenshot id/);
});

test("validateScreenshotReferences flags missing screenshots", () => {
  const chapters = [chapter({ screenshotRefs: [{ id: "missing" }] })];
  const flows = [flow({ screenshots: ["other"] })];
  expect(() => validateScreenshotReferences(chapters, flows)).toThrow(/does not exist/);
});

test("validateScreenshotReferences passes when all references resolve", () => {
  const chapters = [chapter({ screenshotRefs: [{ id: "a" }] })];
  const flows = [flow({ screenshots: ["a"] })];
  expect(() => validateScreenshotReferences(chapters, flows)).not.toThrow();
});

test("validateScreenshotReferences accepts asset screenshots", () => {
  const chapters = [chapter({ screenshotRefs: [{ id: "outside-flow" }] })];
  const flows = [flow({ screenshots: ["a"] })];
  const assets = [assetScreenshot({ id: "outside-flow" })];
  expect(() => validateScreenshotReferences(chapters, flows, assets)).not.toThrow();
});

test("validateScreenshotInventory rejects duplicate ids across flows and assets", () => {
  const flows = [flow({ screenshots: ["shared"] })];
  const assets = [assetScreenshot({ id: "shared" })];
  expect(() => validateScreenshotInventory(flows, assets)).toThrow(/Duplicate screenshot id/);
});
