#!/usr/bin/env node

import { parseArgs } from "./cli-args.js";
import { log } from "./shared/logging.js";
import { runBuild } from "./commands/build.js";
import { runCaptureCommand } from "./commands/capture.js";
import { runCheck } from "./commands/check.js";
import { runDev } from "./commands/dev.js";
import { runDoctor } from "./commands/doctor.js";
import { runInit } from "./commands/init.js";
import { CommandResultError, ValidationError } from "./shared/errors.js";
import { setLogMode, setProgressEnabled } from "./shared/logging.js";

type JsonSuccess = {
  ok: true;
  command: string;
  result: unknown;
};

type JsonFailure = {
  ok: false;
  command?: string;
  error: {
    name: string;
    message: string;
    details?: unknown;
  };
};

function printJson(payload: JsonSuccess | JsonFailure): void {
  console.log(JSON.stringify(payload, null, 2));
}

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
  --json    Emit machine-readable JSON and suppress log chatter
  --no-progress  Disable progress bars
  -h, --help  Show usage

Suggested flow:
  1. bun run runbook doctor
  2. bun run runbook check
  3. bun run runbook build
`);
}

async function main(): Promise<void> {
  const { command, configPath, targetPath, force, json, noProgress } = parseArgs(process.argv);

  if (json) {
    setLogMode("silent");
  }
  setProgressEnabled(!json && !noProgress);

  let result: unknown;

  switch (command) {
    case "help":
      if (json) {
        printJson({
          ok: true,
          command,
          result: {
            commands: ["build", "capture", "check", "doctor", "init", "dev", "help"],
            defaultConfigPath: "manual/manual.config.mjs"
          }
        });
        return;
      }
      printUsage();
      return;
    case "build":
      result = await runBuild(configPath);
      break;
    case "capture":
      result = await runCaptureCommand(configPath);
      break;
    case "check":
      result = await runCheck(configPath);
      break;
    case "dev":
      result = await runDev(configPath);
      break;
    case "doctor":
      result = await runDoctor(configPath);
      break;
    case "init":
      result = await runInit({ targetDir: targetPath, force });
      break;
    default:
      printUsage();
      return;
  }

  if (json) {
    printJson({ ok: true, command, result });
  }
}

main().catch((error: unknown) => {
  const wantsJson = process.argv.includes("--json");
  const parsedCommand = process.argv[2];

  if (wantsJson) {
    setLogMode("silent");
    if (error instanceof Error) {
      printJson({
        ok: false,
        command: parsedCommand,
        error: {
          name: error.name,
          message: error.message,
          details: error instanceof CommandResultError ? error.details : undefined
        }
      });
    } else {
      printJson({
        ok: false,
        command: parsedCommand,
        error: {
          name: "Error",
          message: "Unknown failure"
        }
      });
    }
    process.exitCode = 1;
    return;
  }

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
