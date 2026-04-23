import { expect, test } from "bun:test";

import { parseArgs } from "../src/cli-args.js";

test("parseArgs defaults to build", () => {
  expect(parseArgs(["bun", "src/cli.ts"])).toEqual({
    command: "build",
    configPath: undefined,
    targetPath: undefined,
    force: false
  });
});

test("parseArgs supports doctor with config", () => {
  expect(
    parseArgs(["bun", "src/cli.ts", "doctor", "--config", "manual/alt.config.mjs"])
  ).toEqual({
    command: "doctor",
    configPath: "manual/alt.config.mjs",
    targetPath: undefined,
    force: false
  });
});

test("parseArgs supports init target and force", () => {
  expect(parseArgs(["bun", "src/cli.ts", "init", "manual/acme", "--force"])).toEqual({
    command: "init",
    configPath: undefined,
    targetPath: "manual/acme",
    force: true
  });
});

test("parseArgs maps help flags to help command", () => {
  expect(parseArgs(["bun", "src/cli.ts", "--help"])).toEqual({
    command: "help",
    configPath: undefined,
    targetPath: undefined,
    force: false
  });
});

test("parseArgs rejects missing config values", () => {
  expect(() => parseArgs(["bun", "src/cli.ts", "--config"])).toThrow(
    /Missing value for --config/
  );
});

test("parseArgs rejects unknown commands", () => {
  expect(() => parseArgs(["bun", "src/cli.ts", "ship-it"])).toThrow(/Unknown command/);
});
