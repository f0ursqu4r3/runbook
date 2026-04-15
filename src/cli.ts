import { RunbookError } from "./shared/errors.js";
import { log } from "./shared/logging.js";
import { runBuild } from "./commands/build.js";
import { runCaptureCommand } from "./commands/capture.js";
import { runCheck } from "./commands/check.js";
import { runDev } from "./commands/dev.js";

type Command = "build" | "capture" | "check" | "dev";

function parseArgs(argv: string[]): { command: Command; configPath?: string } {
  let command: Command = "build";
  let commandSet = false;
  let configPath: string | undefined;

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--config") {
      configPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (!arg.startsWith("--") && !commandSet) {
      command = arg as Command;
      commandSet = true;
    }
  }

  return { command, configPath };
}

async function main(): Promise<void> {
  const { command, configPath } = parseArgs(process.argv);

  switch (command) {
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
    default:
      throw new RunbookError(`Unknown command: ${command}`);
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    log.error(error.message);
  } else {
    log.error("Unknown failure");
  }
  process.exitCode = 1;
});
