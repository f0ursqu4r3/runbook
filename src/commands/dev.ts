import { runBuild } from "./build.js";
import { log } from "../shared/logging.js";
import type { BuildResult } from "./build.js";

export async function runDev(configPath?: string): Promise<BuildResult> {
  log.info("Starting lightweight dev build");
  return runBuild(configPath);
}
