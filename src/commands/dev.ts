import { runBuild } from "./build.js";
import { log } from "../shared/logging.js";

export async function runDev(configPath?: string): Promise<void> {
  log.info("Starting lightweight dev build");
  await runBuild(configPath);
}
