import { RunbookError } from "./shared/errors.js";
import { log } from "./shared/logging.js";
import { runBuild } from "./commands/build.js";
import { runCaptureCommand } from "./commands/capture.js";
import { runCheck } from "./commands/check.js";
import { runDev } from "./commands/dev.js";

type Command = "build" | "capture" | "check" | "dev";

async function main(): Promise<void> {
  const command = (process.argv[2] ?? "build") as Command;

  switch (command) {
    case "build":
      await runBuild();
      return;
    case "capture":
      await runCaptureCommand();
      return;
    case "check":
      await runCheck();
      return;
    case "dev":
      await runDev();
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
