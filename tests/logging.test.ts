import { afterEach, expect, test } from "bun:test";

import { setLogMode, setProgressEnabled, startProgress } from "../src/shared/logging.js";

const originalIsTTY = process.stderr.isTTY;
const originalWrite = process.stderr.write.bind(process.stderr);

afterEach(() => {
  Object.defineProperty(process.stderr, "isTTY", {
    value: originalIsTTY,
    configurable: true
  });
  process.stderr.write = originalWrite;
  setLogMode("text");
  setProgressEnabled(true);
});

test("progress updates pad shorter lines to clear stale content", () => {
  const writes: string[] = [];

  Object.defineProperty(process.stderr, "isTTY", {
    value: true,
    configurable: true
  });
  process.stderr.write = ((chunk: string | Uint8Array) => {
    writes.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;

  setLogMode("text");
  setProgressEnabled(true);

  const progress = startProgress("Build", 10, "Rendering very long detail");
  progress.set(5, "Done");

  const lastRender = writes[writes.length - 1];
  expect(lastRender).toContain("\rBuild [############------------] 5/10 Done");
  expect(lastRender.endsWith(" ")).toBe(true);
});
