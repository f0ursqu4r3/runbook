import { RunbookError } from "./shared/errors.js";

export type Command = "build" | "capture" | "check" | "dev" | "doctor" | "init" | "help";

export type ParsedArgs = {
  command: Command;
  configPath?: string;
  targetPath?: string;
  force?: boolean;
  json?: boolean;
  noProgress?: boolean;
};

export function parseArgs(argv: string[]): ParsedArgs {
  let command: Command = "build";
  let commandSet = false;
  let configPath: string | undefined;
  let targetPath: string | undefined;
  let force = false;
  let json = false;
  let noProgress = false;

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      return { command: "help", configPath, targetPath, force, json, noProgress };
    }

    if (arg === "--config") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new RunbookError("Missing value for --config");
      }
      configPath = value;
      index += 1;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg === "--no-progress") {
      noProgress = true;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new RunbookError(`Unknown flag: ${arg}`);
    }

    if (!commandSet) {
      command = arg as Command;
      commandSet = true;
      continue;
    }

    if (command === "init" && targetPath === undefined) {
      targetPath = arg;
      continue;
    }

    throw new RunbookError(`Unexpected argument: ${arg}`);
  }

  if (!["build", "capture", "check", "dev", "doctor", "init", "help"].includes(command)) {
    throw new RunbookError(`Unknown command: ${command}`);
  }

  return { command, configPath, targetPath, force, json, noProgress };
}
