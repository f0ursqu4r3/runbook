#!/usr/bin/env node

import { parseArgs } from "./cli-args.js";
import { log } from "./shared/logging.js";
import { runBuild } from "./commands/build.js";
import { runCaptureCommand } from "./commands/capture.js";
import { runCheck } from "./commands/check.js";
import { runDev } from "./commands/dev.js";
import { runDoctor } from "./commands/doctor.js";
import { runInit } from "./commands/init.js";
import { ValidationError } from "./shared/errors.js";

function printUsage(): void {
  console.log(`Runbook

Usage:
  bun run runbook [command] [--config <path>]
  bun run src/cli.ts [command] [--config <path>]

Commands:
  build     Validate, capture screenshots, generate Typst, and compile the PDF
  capture   Run capture flows and write screenshots plus the manifest
  check     Validate config, chapters, flows, and screenshot references
  doctor    Run preflight checks for local dependencies and manual structure
  init      Scaffold a starter manual profile
  dev       Alias for build with a lightweight dev log message
  help      Show this usage summary

Flags:
  --config  Path to a manual config file. Default: manual/manual.config.mjs
  --force   Allow init to write into a non-empty target directory
  -h, --help  Show usage

Suggested flow:
  1. bun run runbook doctor
  2. bun run runbook check
  3. bun run runbook build
`);
}

async function main(): Promise<void> {
  const { command, configPath, targetPath, force } = parseArgs(process.argv);

  switch (command) {
    case "help":
      printUsage();
      return;
    case "build":
      await runBuild(configPath);
      return;
    case "capture":
      await runCaptureCommand(configPath);
      return;
    case "check":
      await runCheck(configPath);
      return;
    case "dev":
      await runDev(configPath);
      return;
    case "doctor":
      await runDoctor(configPath);
      return;
    case "init":
      await runInit({ targetDir: targetPath, force });
      return;
    default:
      printUsage();
      return;
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    log.error(error.message);
    if (error instanceof ValidationError) {
      log.error("Tip: run `bun run runbook doctor` for a full preflight check.");
    }
  } else {
    log.error("Unknown failure");
  }
  process.exitCode = 1;
});
